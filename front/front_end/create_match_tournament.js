


function get_data_boxs_players()
{
    if (matchid == 1)
    {
        document.getElementById('player1_alias_name').textContent = matches[0].player1_alias_name;
        document.getElementById('avatar_player1').src = matches[0].avatar_player1;
        document.getElementById('player2_alias_name').textContent = matches[0].player2_alias_name;
        document.getElementById('avatar_player2').src = matches[0].avatar_player2;
    }
    else if (matchid == 2)
    {
        document.getElementById('player1_alias_name').textContent = matches[1].player1_alias_name;
        document.getElementById('avatar_player1').src = matches[1].avatar_player1;
        document.getElementById('player2_alias_name').textContent = matches[1].player2_alias_name;
        document.getElementById('avatar_player2').src = matches[1].avatar_player2;
    }
    else
    {
        document.getElementById('player1_alias_name').textContent = matches[2].player1_alias_name;
        document.getElementById('avatar_player1').src = matches[2].avatar_player1;
        document.getElementById('player2_alias_name').textContent = matches[2].player2_alias_name;
        document.getElementById('avatar_player2').src = matches[2].avatar_player2;
    }
}
                                                                                                                       
function post_ids_chat(user1_id, user2_id, user2_nick, user1_nick)
{
fetch(`${BASE_URL}/chat_api/api/tournament_notification/`, {
    method: 'POST',
    credentials: 'include',
    headers: {
        "Content-Type": "application/json",
    },
   
    body: JSON.stringify({"user1_id": `${user1_id}`, "user2_id": `${user2_id}`, "opponent1_username": `${user1_nick}`, "opponent2_username": `${user2_nick}` })
})
.then(response => {
    if (response.ok) {
        response.json().then(data => {
            if (data.ok) 
            {
                console.warn("done send warning ");   
            }
        });
    }
})

.catch(error => console.log("Error", error));
}

function warning_chat(nickname1, nickname2)
{
    
    if (matchid == 1 || matchid == 2)
    {
        const formData = new FormData();
    formData.append("nickname", nickname1);
    formData.append("nickname", nickname2);
   
fetch(`${BASE_URL}/api/game/get_avatar/`, {
    method: 'POST',
    // credentials: 'include', 
    body: formData
})
.then(response => {
    if (response.ok) {
        response.json().then(data => {
            if (data.ok) 
            {
                post_ids_chat(data.users[0].id, data.users[1].id, nickname1, nickname2);
            }
        });
       
    }
})
.catch(error => console.log("Error", error));
    } 
}
function fetch_avatars(nickname1,nickname2)
{
    const formData = new FormData();
        formData.append("nickname", nickname1);
        formData.append("nickname", nickname2);
       
    fetch(`${BASE_URL}/api/game/get_avatar/`, {
        method: 'POST',
        credentials: 'include', 
        body: formData
    })
    .then(response => {
        if (response.ok) {
            response.json().then(data => {
                if (data.ok) 
                {
                   
                    matches[matchid - 1].avatar_player1 = data.users[0].avatar;
                    matches[matchid - 1].avatar_player2 = data.users[1].avatar;
                    get_data_boxs_players();
                }
            });
           
        }
       
    })
    .catch(error => console.log("Error", error));
}

function  display_score_tournament(score_play1, score_play2)
{
    document.getElementsByClassName('player-boxes')[0].style.display = 'none';
    document.getElementsByClassName('ping-pong-table')[0].style.display = 'none';
   
    if (matchid == 1)
    {
        document.getElementsByClassName('game-box')[0].style.display = 'flex';
        document.getElementsByClassName('character')[0].style.display = 'block';
        display_score_players_tournament(score_play1, score_play2, matches[0].player1_alias_name,   
        matches[0].player2_alias_name, matches[0].avatar_player1,  matches[0].avatar_player2, matches[0].player1,   
        matches[0].player2);
    }
    else if (matchid == 2)
    {
        document.getElementsByClassName('game-box')[0].style.display = 'flex';
        document.getElementsByClassName('character')[0].style.display = 'block';
        display_score_players_tournament(score_play1, score_play2, matches[1].player1_alias_name,   
        matches[1].player2_alias_name, matches[1].avatar_player1,  matches[1].avatar_player2,matches[1].player1,   
        matches[1].player2);
    }
    else
    {
        document.getElementsByClassName('game-box_final')[0].style.display = 'flex';
        display_score_players_tournament(score_play1, score_play2, matches[2].player1_alias_name,
            matches[2].player2_alias_name, matches[2].avatar_player1,  matches[2].avatar_player2,matches[2].player1,   
            matches[2].player2);
    }
matchid++;
}
    function game_play()
    {
       
    const leftPaddle = document.querySelector('.left-paddle');
    const rightPaddle = document.querySelector('.right-paddle');
    const ball = document.querySelector('.ball');
    const table = document.querySelector('.ping-pong-table');
    const playButton = document.getElementById('startButton');
    const gameOverText = document.getElementById('gameOver');
    const scorePlayer1Elem = document.getElementById('scorePlayer1');
    const scorePlayer2Elem = document.getElementById('scorePlayer2');
    const tableHeight = table.offsetHeight;
    const tableWidth = table.offsetWidth;
    const paddleHeight = leftPaddle.offsetHeight;
    const paddleWidth = leftPaddle.offsetWidth;
    const ballSize = ball.offsetWidth;

    let paddle1Y = (tableHeight - paddleHeight) / 2;
    let paddle2Y = (tableHeight - paddleHeight) / 2;
    let ballX = tableWidth / 2;
    let ballY = tableHeight / 2;
    let ballSpeedX = 5;
    let ballSpeedY = 3;
    let keys = {};
    let scorePlayer1 = 0;
    let scorePlayer2 = 0;
    let gameActive = false;

    function updatePositions() {
        paddle1Y = Math.max(0, Math.min(tableHeight - paddleHeight, paddle1Y));
        paddle2Y = Math.max(0, Math.min(tableHeight - paddleHeight, paddle2Y));

        leftPaddle.style.top = `${paddle1Y}px`;
        rightPaddle.style.top = `${paddle2Y}px`;
        ball.style.left = `${ballX}px`;
        ball.style.top = `${ballY}px`;
        scorePlayer1Elem.textContent = scorePlayer1;
        scorePlayer2Elem.textContent = scorePlayer2;
    }

    function movePaddles() {
        const paddleSpeed = 8;
        
        if (keys['w']) paddle1Y = Math.max(0, paddle1Y - paddleSpeed);
        if (keys['s']) paddle1Y = Math.min(tableHeight - paddleHeight, paddle1Y + paddleSpeed);
        
        if (keys['ArrowUp']) paddle2Y = Math.max(0, paddle2Y - paddleSpeed);
        if (keys['ArrowDown']) paddle2Y = Math.min(tableHeight - paddleHeight, paddle2Y + paddleSpeed);
    }

    function checkPaddleCollision(ballX, ballY, paddleX, paddleY) {
        return (
            ballX < paddleX + paddleWidth &&
            ballX + ballSize > paddleX &&
            ballY < paddleY + paddleHeight &&
            ballY + ballSize > paddleY
        );
    }
    function moveBall() {
        if (!gameActive) return;

        ballX += ballSpeedX;
        ballY += ballSpeedY;

        if (ballY <= 0 || ballY >= tableHeight - ballSize) {
            ballSpeedY *= -1;
            ballY = ballY <= 0 ? 0 : tableHeight - ballSize;
        }

        const leftPaddleX = 20;
        const rightPaddleX = tableWidth - 20 - paddleWidth;
        if (checkPaddleCollision(ballX, ballY, leftPaddleX, paddle1Y)) {
            ballX = leftPaddleX + paddleWidth;
            ballSpeedX = Math.abs(ballSpeedX); 
            const hitPosition = (ballY - paddle1Y) / paddleHeight;
            ballSpeedY = 8 * (hitPosition - 0.5); 
        }

        if (checkPaddleCollision(ballX, ballY, rightPaddleX, paddle2Y)) {
            ballX = rightPaddleX - ballSize;
            ballSpeedX = -Math.abs(ballSpeedX); 
            const hitPosition = (ballY - paddle2Y) / paddleHeight;
            ballSpeedY = 8 * (hitPosition - 0.5); 
        }
        if (ballX < 0 || ballX > tableWidth) {
            if (ballX < 0) scorePlayer2++;
            else scorePlayer1++;
            
            checkGameOver();
            if (gameActive) resetBall(); 
        }
    }

    function resetBall() {
        ballX = tableWidth / 2;
        ballY = tableHeight / 2;
        ballSpeedX = 5 * (Math.random() < 0.5 ? 1 : -1);
        ballSpeedY = (Math.random() - 0.5) * 6; 
    }
    function checkGameOver() {
        if (scorePlayer1 >= 3 || scorePlayer2 >= 3) {
            gameActive = false;
            gameOverText.classList.remove('hidden');
            gameOverText.textContent = `Game Over! ${
                scorePlayer1 >= 3 ? 'Player 1' : 'Player 2'
            } Wins!`;
            playButton.classList.remove('hidden');
            setTimeout(() => {
                display_score_tournament(scorePlayer1, scorePlayer2);
            }, 1000); 
        }
    }
    function resetGame() {
        scorePlayer1 = 0;
        scorePlayer2 = 0;
        paddle1Y = (tableHeight - paddleHeight) / 2;
        paddle2Y = (tableHeight - paddleHeight) / 2;
        resetBall();
        gameActive = true;
        playButton.classList.add('hidden');
        gameOverText.classList.add('hidden');
    }

    function gameLoop() {
        if (gameActive) {
            movePaddles();
            moveBall();
            updatePositions();
            requestAnimationFrame(gameLoop);
        }
    }

    playButton.addEventListener('click', () => {
        resetGame();
        gameLoop();
    });

    window.addEventListener('keydown', (e) => {
        keys[e.key] = true;
        if(['ArrowUp', 'ArrowDown', 'w', 's'].includes(e.key)) {
            e.preventDefault();
        }
    });

    window.addEventListener('keyup', (e) => {
        keys[e.key] = false;
    });

    updatePositions();

}