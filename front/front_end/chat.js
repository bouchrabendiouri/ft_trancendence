if (!window.ChatApp) {
    window.ChatApp = {
        /*state: {
            blockedUsers: [],
        },*/
        // Initialize function to set up the chat
        initialize: function() {
            if (this.initialized) return; // Prevent multiple initializations

            getCurrentUserData();
            this.initialized = true;
        }
    };
}
ChatApp.initialize();
var blockedUsers = [];
var friends = [];
var isBlocked = false;
var contact;
var messages = {}; // Use an empty object to hold messages by contact ID
var current_user = {};
var other_user = {};
var socket;
var notificationsocket;

var activeContactId = null;
async function getCurrentUserData() {
    try {
        const response = await fetch(`${BASE_URL}/user/token/`, {
            method: 'GET',
            credentials: 'include', // Include cookies (with token)
            headers: {
                'Accept': 'application/json',
            }
        });

        if (!response.ok) {
            throw new Error('Failed to get access token');
        }
        const data = await response.json();
        current_user = data; // Store the user data
    } catch (error) {
        console.error('Error fetching access token:', error);
        return null;
    }
}
fetch(`${BASE_URL}/chat_api/api/contacts/`, {
        method: 'GET',
        credentials: 'include', // Send cookies along with the request
        headers: {
            // 'Accept': 'application/json',
            // 'Content-Type': 'application/json',
        }
    })

    .then(response => response.json())
    .then(data => {
        current_user = data.current_user || [];
        friends = data.friends || [];
        // Populate the friend list
        const friendList = document.getElementById('friend-list');
        friends.forEach(friend => {
            friendList.appendChild(createFriendCard(friend)); // Assuming this function creates a card element for each friend
        });
        fetchUnseenGameWarnings();
        fetchUnseenMessages(); //Fetch unseen messages, assuming you have a function for this
    })
    .catch(error => {
        console.error("Error fetching contacts:", error);
    });

function createFriendCard(friend) {
    const friendContainer = document.createElement('div');
    friendContainer.classList.add('friend-container');
    friendContainer.onclick = () => openChat(friend.id);

    const friendImage = document.createElement('img');
    friendImage.src = friend.avatar || 'default-image.png';
    friendImage.alt = friend.username;
    friendImage.classList.add('friend-image');

    const friendInfo = document.createElement('div');
    friendInfo.classList.add('friend-info');

    const friendName = document.createElement('a');
    friendName.textContent = friend.username;

    const friendStatus = document.createElement('span');
    friendStatus.textContent = friend.is_online ? 'Online' : 'Offline';
    if (friend.is_online)
        friendStatus.id = 'friend-status_online';
    else
        friendStatus.id = 'friend-status_off';
    friendStatus.classList.add('friend-status');
    friendName.classList.add('friend-name');
    friendInfo.appendChild(friendName);
    friendInfo.appendChild(friendStatus);
    friendContainer.appendChild(friendImage);
    friendContainer.appendChild(friendInfo);
    friendContainer.setAttribute('data-user-id', friend.id);
    return friendContainer;
}

function blockUser(activeContactId) {
    const messageInput = document.getElementById('message-input');
    fetch(`${BASE_URL}/chat_api/api/block_user/`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                //'Authorization': `Bearer ${access_token}`
            },
            body: JSON.stringify({
                blocked_id: activeContactId
            })
        })

        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                // Add the user to blocked users list
                blockedUsers.push(activeContactId);
                isBlocked = true;
                if (activeContactId === contact.id) {
                    messageInput.disabled = true;
                }
                // Update UI
                const friendList = document.getElementById('friend-list');
                const friendElement = friendList.querySelector(`[data-user-id="${activeContactId}"]`);
                if (friendElement) {
                    friendElement.classList.add('blocked');
                }

                // Clear chat messages
                const chatMessages = document.getElementById('chatMessages');
                chatMessages.innerHTML = '';

                // Optionally update header
                const chatHeader = document.getElementById('chatHeader');
                chatHeader.innerHTML = '<h2 class="select-contact">Select a contact</h2>';

                // Disable the message input

                //messageInput.disabled = true;
            } else {
                console.error('Error blocking user:', data.message);
            }
        })
        .catch(error => {
            console.error('Error:', error);
        });
}

var isCurrentContactBlocked = false;

async function openChat(contactId) {
    activeContactId = contactId;
    const chatHeader = document.getElementById('chatHeader');
    const chatMessages = document.getElementById('chatMessages');
    const profileSection = document.getElementById('profileSection');
    const messageInput = document.getElementById('message-input');

    messageInput.value = '';
    if (isBlocked) {
        if (socket) {
            socket.close();
            socket = null; // Reset the socket to prevent accidental reconnections
        }
        isCurrentContactBlocked = blockedUsers.includes(contactId);
        messageInput.disabled = isCurrentContactBlocked;
        // Disable message input and other relevant UI elements
        //messageInput.disabled = true;
        // Clear the chat messages
        chatMessages.innerHTML = '';
    } // Clear existing messages
    // Check if friends array is populated
    contact = friends.find(f => f.id === contactId);
    if (contact) {
        chatHeader.innerHTML = `
          <img src="${contact.avatar || 'default-image.png'}" alt="${contact.username}'s Profile Picture" class="profile-pic">
          <a id = "userName_chat">${contact.username}</a>`;
        document.getElementById("userName_chat").addEventListener('click', (event) => {
            event.stopPropagation();
            navigateTo('/profile_user');
            setTimeout(() => {
                search(contactId);
            }, 500);
            
            
        });
        profileSection.innerHTML = `
          <img src="${contact.avatar || 'default-image.png'}" alt="${contact.username}'s Profile Picture" class="profile-pic-large">
          <h3 class="user-name">${contact.username}</h3>
          <button onclick="navigateTo('/game_remote')" class="play-btn" id="playButton">Let's Play</button>
          <button class="block-btn" id="blockButton">Block</button>
          `;

        document.getElementById("blockButton").addEventListener("click", () => blockUser(contactId));

        // Create a chat room with the selected friend
        try {
            const roomData = {
                name: `${contact.username}_room`,
                user2_id: contact.id
            };
            const response = await fetch(`${BASE_URL}/chat_api/api/create_room/`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    user2_id: contactId // Use contactId instead of selectedUserId
                })
            });

            const data = await response.json();
            if (data.room) {
                openRoom(data.room.id);
            }
        } catch (error) {
            console.error('Error creating room:', error);
        }
    }

    //messageInput.disabled = isBlocked;
    chatMessages.scrollTop = chatMessages.scrollHeight;
}


async function openRoom(roomId) {
    const chatMessages = document.getElementById('chatMessages');
    const chatHeader = document.getElementById('chatHeader');

    chatMessages.innerHTML = '';
    try {
        if (!roomId) {
            throw new Error('Invalid room ID');
        }

        const response = await fetch(
            `${BASE_URL}/chat_api/api/room/${roomId}/`, {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }

            }
        );
        // Debug the response
        const responseText = await response.text();

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}, body: ${responseText}`);
        }

        const data = JSON.parse(responseText);
        other_user = data.other_user_id || [];
        // Add messages to the chat interface
        if (data.messages && Array.isArray(data.messages)) {
            data.messages.forEach(msg => {
                if (msg.text && msg.text.trim() !== '') {
                    const messageDiv = document.createElement('div');
                    if (msg.sender === current_user.id && msg.type !== 'game_invite') {
                        messageDiv.classList.add('message', 'sent');
                        const seenStatus = msg.seen ? '<span class="seen-status">✓✓</span>' : '';
                        messageDiv.innerHTML = `<p><strong></strong> ${msg.text} ${seenStatus}</p>`;
                        chatMessages.appendChild(messageDiv);
                    } else {
                        messageDiv.classList.add('message', 'received');
                        if (msg.sender !== current_user.id && msg.type === 'game_invite') {
                            messageDiv.innerHTML = `<p><strong></strong> ${msg.text}</p>
                          <button class="accept-invite-btn" data-match-id="${msg.matchId}">Accept</button>
                          `;
                            chatMessages.appendChild(messageDiv);
                        } else if (msg.sender !== current_user.id && msg.type !== 'game_invite') {
                            messageDiv.innerHTML = `<p><strong></strong>${msg.text}</p>`;
                            chatMessages.appendChild(messageDiv);
                        }
                        var acceptButton = messageDiv.querySelector('.accept-invite-btn');
                        if (acceptButton) {
                            acceptButton.addEventListener('click', function() {
                                acceptGameInvite(msg.matchId);
                                //script display
                                document.getElementById('Accept_warning').style.display = 'flex';
                            });
                        }
                    }
                    messageDiv.setAttribute('data-message-id', msg.id);
                }
            });
        }

        // Scroll to the latest message
        chatMessages.scrollTop = chatMessages.scrollHeight;

        // WebSocket connection
        if (socket && socket.readyState === WebSocket.OPEN) {
            socket.close();
            console.log("Closed previous WebSocket connection");
        }

        // Create new WebSocket connection with error handling
        try {

            socket = new WebSocket(`${BASE_URL_WS}/chat_api/ws/chat/${roomId}/`);

            socket.onopen = () => {
                console.log('WebSocket connection opened for room:', roomId);

            };

            socket.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    if (data.seen_send === true) {
                        // Update seen status for sent messages
                        const messageDiv = document.querySelector(`.message.sent[data-message-id="${data.message_id}"]`);
                        if (messageDiv && !messageDiv.querySelector('.seen-status')) {
                            console.log("seen status: not found");
                            const seenStatusSpan = document.createElement('span');
                            seenStatusSpan.className = 'seen-status';
                            seenStatusSpan.textContent = '✓✓';
                            messageDiv.querySelector('p').appendChild(seenStatusSpan);
                        }

                        markMessagesAsSeen(roomId);
                    } else if (data.action === 'sendMessage' && !document.querySelector(`[data-message-id="${data.message_id}"]`)) {
                        if (data.message && data.message.trim() !== '') {
                            const messageDiv = document.createElement('div');
                            messageDiv.setAttribute('data-message-id', data.message_id);
                            if (data.username === current_user.username) {
                                messageDiv.classList.add('message', 'sent');
                            } else {
                                messageDiv.classList.add('message', 'received');
                            }
                            if (data.type === 'game_invite') {
                                if (data.username !== current_user.username) {
                                    messageDiv.innerHTML = `<p><strong>You have been invited o play agame !</strong></p>
                                     <button class="accept-invite-btn" data-match-id="${data.matchId}">Accept</button>
                                     `;
                                    chatMessages.appendChild(messageDiv);
                                }
                            } else {
                                messageDiv.innerHTML = `<p><strong></strong> ${data.message} </p>`;
                                chatMessages.appendChild(messageDiv);
                            }
                            var acceptButton = messageDiv.querySelector('.accept-invite-btn');
                            if (acceptButton) {
                                acceptButton.addEventListener('click', function() {
                                    acceptGameInvite(roomId);
                                    document.getElementById('Accept_warning').style.display = 'flex';
                                });
                            }

                        }
                    }
                    chatMessages.scrollTop = chatMessages.scrollHeight;


                } catch (error) {
                    console.error('Error processing WebSocket message:', error);
                }
            };

            document.getElementById('playButton').addEventListener('click', function() {

                // Get the last invite message
                sendGameInvite(roomId, other_user);

            });


            socket.onclose = (event) => {
                console.log('WebSocket connection closed for room:', roomId, 'Code:', event.code, 'Reason:', event.reason);
            };

        } catch (wsError) {
            console.error('Error establishing WebSocket connection:', wsError);
        }


    } catch (error) {
        console.error('Error fetching messages:', error);
        // Show error message to user
    }
}

// Function to send a game invite
function sendGameInvite(roomId, recipientId) {
    if (!socket || socket.readyState !== WebSocket.OPEN) {
        console.error('WebSocket is not open. Unable to send game invite.');
        return;
    }

    // First, create the game on the backend
    /*fetch(`${BASE_URL}/api/game/create_game_chat/`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                player1_id: current_user.id,
                player2_id: recipientId
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.match_id) {*/
    // After game is created, send the invite message with game_id
    const inviteMessage = {
        action: 'sendMessage',
        room_id: roomId,
        room_name: `user${current_user.id}_user${recipientId}`,
        username: current_user.username,
        user_id: current_user.id,
        message: `You has been invited to play a game!`,
        other_user_id: recipientId,
        type: 'game_invite', // Include the game_id in the message
    };

    socket.send(JSON.stringify(inviteMessage));
    console.log('Game invite sent:', inviteMessage);

    // Store the game_id for later use when accepting the invite
    console.log('Game ID stored in localStorage:', localStorage.getItem('pending_game_id'));


}

function acceptGameInvite(roomId) {
    if (!socket || socket.readyState !== WebSocket.OPEN) {
        console.error('WebSocket is not open. Unable to accept game invite.');
        return;
    }
    // First, call the backend API to accept the game
    /*fetch(`${BASE_URL}/api/game/accept_game_chat/${matchId}/`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
            }
        })
        .then(response => response.json())
        .then(data => {*/
    // If successful, send WebSocket message
    const acceptMessage = {
        action: 'acceptGameInvite',
        roomId: roomId,
        user_id: current_user.id,
        username: current_user.username,
    };
    socket.send(JSON.stringify(acceptMessage));
    console.log('Game invite accepted:', acceptMessage);

    // Redirect to game page or update UI as needed
    //window.location.href = `/game/${data.match_id}`;


}


function displayNotification(message, notification_type) {
    const notificationContainer = document.getElementById('notification-container');
    const notificationDiv = document.createElement('div');
    notificationDiv.classList.add('notification', notification_type); // Add classes for styling

    notificationDiv.innerHTML = `
      <p>${message}</p>
  `;

    // Append to notification container
    notificationContainer.appendChild(notificationDiv);
}


// Function to mark the messages as seen when the WebSocket is opened and user enters the room
function markMessagesAsSeen(roomId) {
    // Send a request to the backend or trigger the WebSocket to mark messages as seen
    socket.send(JSON.stringify({
        action: "mark_seen",
        room_id: roomId,
        username: current_user.username
    }));
}


// Function to send a new message
function sendMessage() {
    const input = document.getElementById('message-input');
    const text = input.value.trim();
    if (text === '' || activeContactId === null || isCurrentContactBlocked) {
        return;
    }
    // Send the message through the WebSocket if the connection is open
    if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({
            message: text,
            username: current_user.username,
            room_name: `user${current_user.id}_user${other_user}`,
            type: ''
        }));
    }
    input.value = '';
    chatMessages.scrollTop = chatMessages.scrollHeight;

}




// Keypress event for Enter key with preventDefault to stop focus-triggering button click
document.getElementById('message-input').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        e.preventDefault(); // Prevents triggering 'click' event if 'Enter' is pressed
        sendMessage();
    }
});

// Click event for the send button
document.getElementById('send-btn').addEventListener('click', function() {
    sendMessage(); // Call sendMessage when the send button is clicked
});



async function fetchUnseenMessages() {
    try {
        // Fixed WebSocket URL by removing the extra curly brace
        const notificationSocket = new WebSocket(`${BASE_URL_WS}/chat_api/ws/notifications/`);

        notificationSocket.onmessage = function(event) {
            const data = JSON.parse(event.data);

            if (data.action === "sendMessages") {
                const messages = data.messages;

                // Group messages by sender username
                const messagesByUser = {};
                messages.forEach(msg => {
                    if (!messagesByUser[msg.user_id]) {
                        messagesByUser[msg.user_id] = [];
                    }
                    messagesByUser[msg.user_id].push(msg);
                });

                // Update UI for each friend
                friends.forEach(friend => {
                    const unseenCount = (messagesByUser[friend.id] || []).length;
                    if (unseenCount > 0) {
                        const friendContainer = document.querySelector(`.friend-container[data-user-id="${friend.id}"]`);
                        if (friendContainer) {
                            let badge = friendContainer.querySelector('.unseen-badge');
                            if (!badge) {
                                badge = document.createElement('span');
                                badge.classList.add('unseen-badge');
                                friendContainer.querySelector('.friend-info').appendChild(badge);
                            }
                            badge.textContent = unseenCount;
                        }
                    } else {
                        const friendContainer = document.querySelector(`.friend-container[data-user-id="${friend.id}"]`);
                        if (friendContainer) {
                            const badge = friendContainer.querySelector('.unseen-badge');
                            if (badge) {
                                badge.remove();
                            }
                        }
                    }
                });

                // Send empty response after 1 second
                setTimeout(() => {
                    notificationSocket.send(JSON.stringify({}));
                }, 1000);
            }
        };

        notificationSocket.onerror = function(error) {
            console.error('WebSocket error:', error);
        };

    } catch (error) {
        console.error('Error setting up notification socket:', error);
    }
}

async function fetchUnseenGameWarnings() {
    try {
        const gameWarningsSocket = new WebSocket(`${BASE_URL_WS}/chat_api/ws/game_warnings/`);
        gameWarningsSocket.onmessage = function(event) {
            const data = JSON.parse(event.data);
            if (data.action === "sendWarnings") {
                const warnings = data.warnings;
                const warningsContainer = document.getElementById('game-warnings');
                // Check if container exists
                if (!warningsContainer) {
                    //console.error('Game warnings container not found');
                    return;
                }
                // Clear existing warnings
                warningsContainer.innerHTML = '';

                // Add each warning to the container
                warnings.forEach(warning => {
                    if (!document.querySelector(`[data-warning-id="${warning.id}"]`)) {
                        const warningElement = document.createElement('div');
                        warningElement.classList.add('warning-notification');
                        // Format the date
                        const date = new Date(warning.created_at);
                        const formattedDate = date.toLocaleTimeString();

                        warningElement.innerHTML = `
                        <div class="warning-header">${warning.warning} <span class="close-warning">&times;</span></div>
                        <div class="warning-time">${formattedDate}</div>
                    `;

                        // Add click event listener to close button
                        const closeButton = warningElement.querySelector('.close-warning');
                        closeButton.addEventListener('click', () => {
                            warningElement.style.animation = 'slideOut 0.3s ease-in forwards';
                            setTimeout(() => {
                                warningElement.remove();
                            }, 300);
                        });
                        warningsContainer.appendChild(warningElement);
                    }
                });

                setTimeout(() => {
                    gameWarningsSocket.send(JSON.stringify({}));
                }, 10000);
            }
        };

        gameWarningsSocket.onerror = function(error) {
            console.error('Game Warnings WebSocket error:', error);
        };

    } catch (error) {
        console.error('Error setting up game warnings socket:', error);
    }
}

// Update the ChatApp initialization
if (!window.ChatApp) {
    window.ChatApp = {
        initialize: function() {
            if (this.initialized) return;

            getCurrentUserData();
            fetchUnseenMessages();
            fetchUnseenGameWarnings();
            this.initialized = true;
        }
    };
}