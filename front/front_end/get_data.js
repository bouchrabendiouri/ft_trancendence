function get_data_users() {
    fetch(`${BASE_URL}/user/list-users/`, {
        method: 'GET',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        },
    })
    .then(response => {
        if (response.ok)
          
        return response.json();
    })
    .then(response => {
        const box = document.getElementById('data-USERS');
        const existingUsers = box.querySelectorAll('.data_user');
        existingUsers.forEach(user => box.removeChild(user));
        if (document.getElementById('not_users'))
            document.getElementById('not_users').style.display = 'none';
        var boxx = document.getElementById('data-USERS');
        if (response.length == 0 ) {
            document.getElementById('not_users').style.display = 'block';
        } else if (response.length > 0) {
         
            for (var i = 0; i < response.length; i++) {
                if (response[i].id != localStorage.getItem("id_current_user")) {
                    const new_user = document.createElement('div');
                    const avatar_user = document.createElement('img');
                    const name_user = document.createElement('p');
                    const senMsg_user = document.createElement('button');
                    const profile_name = document.createElement('div');
                    profile_name.id = "avatar_name";
                    senMsg_user.classList.add('button_invite');
                    avatar_user.classList.add('avatar');
                    avatar_user.src = response[i].avatar;
                    name_user.textContent = response[i].first_name + " " + response[i].last_name;
                    var status;
                    if (response[i].invit == "receive_invit")
                    {
                        status = "invitation!";
                    }
                    else if (response[i].invit == "added")
                        status = "Invited";
                   else
                        status = "Add";
                    senMsg_user.textContent = status;
                    new_user.classList.add('data_user');
                    profile_name.appendChild(avatar_user);
                    profile_name.appendChild(name_user);
                    new_user.appendChild(profile_name);
                    new_user.appendChild(senMsg_user);
                    boxx.append(new_user);
                    const userId = response[i].id;
                    var j = i;
                    if (status == "Add")
                    {
                        senMsg_user.addEventListener('click', () => {
                        sendAddFriendRequest(userId, j);
                    });
                }
                }
            }
        }
    })
    .catch(response => {
        console.log("this error", response);
    });
}

document.getElementById('invitationDropdown').addEventListener('click', function (event) 
{
    event.preventDefault();
    const dropdownMenu = document.getElementById('dropdown_menu_invitations');
    if (dropdownMenu) {
        const isVisible = dropdownMenu.style.display === 'block';
        dropdownMenu.style.display = isVisible ? 'none' : 'block';
    } else {
        console.error("Dropdown menu not found.");
    }
    if (!dropdownMenu || dropdownMenu.style.display === 'block') {
        fetchInvitations();
    }
});

function fetchInvitations() 
{
    const dropdownMenu = document.getElementById('dropdown_menu_invitations');
    dropdownMenu.innerHTML = '';
    dropdownMenu.classList.add('dropdown-menu');
    dropdownMenu.setAttribute('aria-labelledby', 'invitationDropdown');
    dropdownMenu.style.backgroundColor = 'rgb(244, 250, 253)';
    fetch(`${BASE_URL}/user/add-freind/`, {
        method: 'GET',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        },
    })
    .then (response => { return response.json()})
    .then(invitations => {
        if (invitations.length == 0) {
            const noInvitationsItem = document.createElement('li');
            noInvitationsItem.classList.add('dropdown-item');
            noInvitationsItem.textContent = "No invitations";
            if (!dropdownMenu.contains(noInvitationsItem)) {
                dropdownMenu.appendChild(noInvitationsItem);
            }
        } else {
            invitations.forEach(invitation => {   
                const senderName = invitation.sender.first_name + " " + invitation.sender.last_name;
                const invitationId = invitation.id;
                const avatar = invitation.sender.avatar;
                addInvitationToDropdown(senderName, invitationId, avatar);
            });
        }
    })
    .catch(error => {
        console.log("Error fetching invitations:", error);
    });
}

function addInvitationToDropdown(userName, invitationId,  profileImage) {
    const invitationBox = document.getElementById('dropdown_menu_invitations');
    if (!invitationBox) {
        console.error("Dropdown menu not found.");
        return;
    }
    const invitationItem = document.createElement('li');
    invitationItem.classList.add('dropdown-item');
    invitationItem.style.gap = '20px';
    invitationItem.style.display = 'flex';
    invitationItem.style.alignItems = 'center';
    invitationItem.style.height = 'fit-content'; 

    const nameSpan = document.createElement('span');
    nameSpan.classList.add('flex-grow-1');
    nameSpan.textContent = userName;

    const buttonContainer = document.createElement('span');
    buttonContainer.style.display = 'flex';
    buttonContainer.style.gap = '5px';
    buttonContainer.id = 'buttonContainer';
    const acceptButton = document.createElement('button');
    acceptButton.classList.add('btn', 'btn-success', 'btn-sm');
    acceptButton.style.margin = '0';
    acceptButton.textContent = 'Accept';
    acceptButton.id = 'Accept';
    const profileImg = document.createElement('img');
    profileImg.classList.add('profile-img');
    profileImg.src = profileImage;
    const rejectButton = document.createElement('button');
    rejectButton.classList.add('btn', 'btn-danger', 'btn-sm');
    rejectButton.textContent = 'Reject';
    rejectButton.id = 'Reject';
    rejectButton.style.margin = '0';
    buttonContainer.appendChild(acceptButton);
    buttonContainer.appendChild(rejectButton);
    invitationItem.appendChild(profileImg);
    invitationItem.appendChild(nameSpan);
    invitationItem.appendChild(buttonContainer);
    invitationBox.appendChild(invitationItem);
    acceptButton.addEventListener('click', () => {
        handleInvitation(invitationId, true);
    });

    rejectButton.addEventListener('click', () => {
        handleInvitation(invitationId, false);
    });
}


function handleInvitation(invitationId, isAccepted) {
    const action = isAccepted ? 'accept' : 'reject';
    fetch(`${BASE_URL}/user/invitation/${invitationId}/${action}/`, {
        method: 'POST',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            invitation_id: invitationId,
            action: action
        })
    })
    .then(response => {
        
        if (response.ok) 
        {
            const acceptButton = document.getElementById('Accept');
            const rejectButton = document.getElementById('Reject');
            if (acceptButton) acceptButton.remove();
            if (rejectButton) rejectButton.remove();
            var color_status_invitation;
            const buttonContainer = document.getElementById('buttonContainer');
            buttonContainer.id = "handlle_invitation";
            if (action == "accept")
            {
                buttonContainer.textContent = 'Accept';
                color_status_invitation = 'green';
                buttonContainer.textContent = 'you are friends now!';
                get_data_friends();
                get_data_users();

            }
            else
            {
                buttonContainer.textContent = 'Reject';
                color_status_invitation = 'red';
                buttonContainer.textContent = 'this invication rejected';
            }
           buttonContainer.style.backgroundColor = color_status_invitation;    
        } 
        else 
            console.log(`Failed to ${action} invitation`);
    })
    .catch(error => {
        console.error(`Error responding to invitation: ${error}`);
    });
}

function sendAddFriendRequest(received_id, index) 
{
    fetch(`${BASE_URL}/user/add-freind/`, 
    {
        method: 'POST',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            receiver_id: received_id
        })
    })
    .then(response => 
    {
        if (response.ok) {
            if (document.getElementsByClassName('button_invite')[index].textContent !== 'Invited')
            {
                 document.getElementsByClassName('button_invite')[index].textContent = 'Invited';
                 get_data_users();
            }
        } 
        else
            console.log("Failed to add friend", response);
    })
    .catch(error => {
        console.error("Error adding friend", error);
    });
}
function get_data_friends() {
    fetch(`${BASE_URL}/user/friends/`, 
    {
        method: 'GET',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        },
    })
    .then(response => {
        if (response.ok)
            return response.json();
    })
    .then(response => {
        const box = document.getElementById('data-friends');
        const existingUsers = box.querySelectorAll('.data_user');
        existingUsers.forEach(user => box.removeChild(user));

        if (response.length == 0) {
            document.getElementById('not_friends').style.display = 'block';
        } else {
            document.getElementById('not_friends').style.display = 'none';
            response.forEach((friend, i) => {
                const new_user = createUserElement(friend, i);
                box.append(new_user);
                initialize_websocket(friend.id, i);
            });
        }
    })
    .catch(error => {
        console.log("Error fetching friends:", error);
    });
}

function createUserElement(friend, index) {
    const new_user = document.createElement('div');
    const avatar_container = document.createElement('div');
    avatar_container.classList.add('avatar-container');
    const avatar_user = document.createElement('img');
    const img_button = document.createElement('img');
    const name_user = document.createElement('p');
    const profile_name = document.createElement('div');
    const online_status = document.createElement('span');
    online_status.classList.add('online-status');
    online_status.setAttribute('data-friend-id', friend.id); 
    online_status.style.backgroundColor = friend.is_online ? 'green' : 'gray';   
    const senMsg_user = document.createElement('a');

    img_button.classList.add("button_img");
    senMsg_user.classList.add("button_chat");
    avatar_user.classList.add('avatar');
    profile_name.id = "avatar_name";
    avatar_user.src = friend.avatar;
    img_button.src = 'IMAGES/button_chat.png';
    senMsg_user.appendChild(img_button);
    senMsg_user.onclick = function() {
        navigateTo("/chat");
    };
    name_user.textContent = `${friend.first_name} ${friend.last_name}`;
    new_user.classList.add('data_user');

    avatar_container.appendChild(avatar_user);
    avatar_container.appendChild(online_status);
    profile_name.appendChild(avatar_container);
    profile_name.appendChild(name_user);
    new_user.appendChild(profile_name);
    new_user.appendChild(senMsg_user);

    return new_user;
}
function initialize_websocket(userId, index) {
    const socket = new WebSocket(`${BASE_URL_WS}/ws/status/${userId}/`);

    socket.onopen = () => {
        sendstatusupd(true);  // Send initial status (offline)
    };

    function sendstatusupd(status) {
        const message = {
            action: "updateStatus",
            status: status, 
        };
        socket.send(JSON.stringify(message));
    }
    socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
    
        if (data.action === "status") {
            const friendId = data.id;
            const isOnline = data.status;
            const username = data.username;
            console.log("state iss ",data.status);
            const statusElement = document.querySelector(`.online-status[data-friend-id='${friendId}']`);
            console.log("statusElement",statusElement);
            if (statusElement) {
                statusElement.style.backgroundColor = isOnline ? 'green' : 'gray';
            } else {
                console.warn(`No status element found for friend ID ${friendId}`);
            }
        }
    };
    socket.onerror = (error) => {
        console.error("WebSocket error:", error);
    };

    socket.onclose = () => {
        sendstatusupd(false); 
    };
}

get_data_friends();
get_data_users();
