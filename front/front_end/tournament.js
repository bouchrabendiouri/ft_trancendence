
var matches = [
    { player1: "", player2: "",player1_alias_name: "",player2_alias_name: "",  avatar_player1: "", avatar_player2: "", matchId: 1},
    { player1: "", player2: "",player1_alias_name: "",player2_alias_name: "",  avatar_player1: "", avatar_player2: "", matchId: 2},
    { player1: "winner", player2: "winner",player1_alias_name: "",player2_alias_name: "", avatar_player1: "", avatar_player2: "", matchId: 3},
];
var matchid = 1;

function post_nicknames(players)
{ 
    const formData = new FormData();
    players.forEach(player => {
        formData.append("nickname", player.nickname);

    });
    fetch(`${BASE_URL}/api/game/check_nickname/`, {
        method: 'POST',
        // credentials: 'include', 
        body: formData
    })
    .then(response => {
        if (response.ok) {
            response.json().then(data => {
                if (data.ok) {
                    matches[0].player1 = players[0].nickname;
                    matches[0].player1_alias_name = players[0].alias;
                    matches[0].player2 = players[1].nickname;
                    matches[0].player2_alias_name = players[1].alias;
                
                    matches[1].player1 = players[2].nickname;
                    matches[1].player1_alias_name = players[2].alias;
                    matches[1].player2 = players[3].nickname;
                    matches[1].player2_alias_name = players[3].alias;
                    displayMatches(matches);

                }
                    else
                        Display_Error(data.message);
            });
           
        }
       
    })
    .catch(error => console.log("Error", error));
}

function create_match() {
    navigateTo('/match_tournament');
    let matchProcessed = false;

    setTimeout(() => {
       
        matches.forEach(match => {
    
            if (match.matchId === matchid && !matchProcessed) {

                fetch_avatars(match.player1, match.player2);
                if (matchid == 1)
                {
                    warning_chat(matches[matchid].player1, matches[matchid].player2);
                }
                game_play(); 
                matchProcessed = true; 
                return;
            }
        });
    }, 1000);
}

function startTournament() 
{
    const players = [
        {
            nickname: document.getElementById('player1_nickname').value,
            alias: document.getElementById('player1_alias_name').value
        },
        {
            nickname: document.getElementById('player2_nickname').value,
            alias: document.getElementById('player2_alias_name').value
        },
        {
            nickname: document.getElementById('player3_nickname').value,
            alias: document.getElementById('player3_alias_name').value
        },
        {
            nickname: document.getElementById('player4_nickname').value,
            alias: document.getElementById('player4_alias_name').value
        }
    ];
    if (players.some(player => player === '')) {
        Display_Error('Please enter all player aliases.');
        return;
    }
   
    post_nicknames(players);
  
        }
 function displayMatches(matches) 
 {
    const matchesDiv = document.getElementById('matches');
    const matches_DIV  = document.getElementById('matches_DIV');
    matches_DIV.style.display = 'block';
    matchesDiv.innerHTML = '';
    matchesDiv.style.display = 'block';
        
    matches.forEach(match => {
    const matchDiv = document.createElement('div');
    matchDiv.className = 'match';
    matchDiv.style.marginTop = '10px';
    matchDiv.innerHTML = `
                    <p id = "match_id" >Match ${match.matchId}:</p> 
                    <span id = "players_match" ><p>${match.player1} </p><img src = "IMAGES/vs.png" id = "vs_img"> <p>${match.player2}</p></span>
                   
                `;
    matchesDiv.appendChild(matchDiv);
    });
    const play = document.createElement('button');
    play.id = 'start_match';
    play.onclick = create_match;
            // play.onclick = "playMatch(${match.matchId})";
    play.textContent = 'Play';
    play.setAttribute('data-i18n', 'play_button');
    matchesDiv.appendChild(play);
}

function Display_Error(error_mssg) 
{
    let errorBox = document.getElementById("BoxError");
    if (!errorBox) {
        errorBox = document.createElement('div');
        errorBox.id = "BoxError";
        errorBox.style.backgroundColor = 'green';
        errorBox.style.boxShadow = '0px 0px 20px green';
        document.getElementById('div_tournament').appendChild(errorBox);
    }
    else
        errorBox.style.display = 'block';
        if (!document.querySelector('#BoxError .hiddin')) {
            const closeButton = document.createElement('span');
            closeButton.classList = "hiddin";
            closeButton.id = "hiddinn";
            closeButton.innerHTML = "&times;";
            closeButton.addEventListener('click', () => {
                errorBox.style.display = 'none';
            });
            errorBox.appendChild(closeButton);
        } 
    if (!document.getElementById('message_error'))
    {
        const mssg = document.createElement('p');
        mssg.id = "message_error";
        mssg.textContent = error_mssg;
        errorBox.appendChild(mssg);
    }
}
