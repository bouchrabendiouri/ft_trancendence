document.addEventListener('DOMContentLoaded', async () => {
    // DOM Elements
    const leftPaddle = document.querySelector('.left-paddle');
    const rightPaddle = document.querySelector('.right-paddle');
    const ball = document.querySelector('.ball');
    const table = document.querySelector('.ping-pong-table');
    const playButton = document.getElementById('startButton');
    const gameOverText = document.getElementById('gameOver');
    const scorePlayer1Elem = document.getElementById('scorePlayer1');
    const scorePlayer2Elem = document.getElementById('scorePlayer2');
    const sideBox = document.querySelector('.side-box');

    // Game Constants
    const tableHeight = table.offsetHeight;
    const tableWidth = table.offsetWidth;
    const paddleHeight = leftPaddle.offsetHeight;
    const paddleWidth = leftPaddle.offsetWidth;
    const ballSize = ball.offsetWidth;

    // Game State
    const gameState = {
        paddle1Y: (tableHeight - paddleHeight) / 2,
        paddle2Y: (tableHeight - paddleHeight) / 2,
        ballX: tableWidth / 2,
        ballY: tableHeight / 2,
        ballSpeedX: 5,
        ballSpeedY: 3,
        keys: {},
        scorePlayer1: 0,
        scorePlayer2: 0,
        gameActive: false,
        currentPlayerId: null,
        currentMatchId: null,
        isWaiting: false
    };

    // Initialize by fetching player ID
    await fetchPlayerId();

    // Utility Functions
    function getCookie(name) {
        let cookieValue = null;
        if (document.cookie && document.cookie !== '') {
            const cookies = document.cookie.split(';');
            for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i].trim();
                if (cookie.substring(0, name.length + 1) === (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }

    async function fetchPlayerId() {
        try {
            const response = await fetch('/api/user/info/', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCookie('csrftoken')
                }
            });
    
            if (response.headers.get('content-type')?.includes('application/json')) {
                const data = await response.json();
                if (response.ok) {
                    gameState.currentPlayerId = data.id;
                    console.log('Player ID fetched:', gameState.currentPlayerId);
                } else {
                    console.error('Error fetching player ID:', data.error);
                }
            } else {
                console.error('Response is not JSON. Possible issue with API or authentication.');
            }
        } catch (error) {
            console.error('Error during fetchPlayerId:', error);
        }
    }

    // Matchmaking System
    const matchmakingSystem = {
        async createGame() {
            try {
                if (!gameState.currentPlayerId) {
                    throw new Error('Player ID is not available. Please ensure you are logged in.');
                }

                const response = await fetch('/api/games/create/', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': getCookie('csrftoken')
                    },
                    body: JSON.stringify({
                        player1_id: gameState.currentPlayerId
                    })
                });
                
                const data = await response.json();
                if (response.ok) {
                    gameState.currentMatchId = data.match_id;
                    gameState.isWaiting = true;
                    this.startMatchPolling();
                    return data;
                }
                throw new Error(data.error || 'Failed to create game');
            } catch (error) {
                console.error('Error creating game:', error);
                throw error;
            }
        },

        async joinGame(matchId) {
            try {
                if (!gameState.currentPlayerId) {
                    throw new Error('Player ID is not available. Please ensure you are logged in.');
                }

                const response = await fetch('/api/games/join/', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': getCookie('csrftoken')
                    },
                    body: JSON.stringify({
                        match_id: matchId,
                        player2_id: gameState.currentPlayerId
                    })
                });
                
                const data = await response.json();
                if (response.ok) {
                    gameState.currentMatchId = matchId;
                    startGame();
                    return data;
                }
                throw new Error(data.error || 'Failed to join game');
            } catch (error) {
                console.error('Error joining game:', error);
                throw error;
            }
        },

        async fetchAvailableGames() {
            try {
                const response = await fetch('/api/games/available/');
                if (!response.ok) {
                    throw new Error('Failed to fetch available games');
                }
                const data = await response.json();
                return data.available_games || [];
            } catch (error) {
                console.error('Error fetching available games:', error);
                throw error;
            }
        },

        startMatchPolling() {
            if (gameState.isWaiting) {
                this.pollInterval = setInterval(async () => {
                    try {
                        const response = await fetch(`/api/games/${gameState.currentMatchId}/status/`);
                        const data = await response.json();
                        
                        if (data.status === 'in_progress') {
                            clearInterval(this.pollInterval);
                            gameState.isWaiting = false;
                            startGame();
                        }
                    } catch (error) {
                        console.error('Error polling match status:', error);
                    }
                }, 2000);
            }
        },

        updateWaitingPlayersList(games) {
            sideBox.innerHTML = '';

            if (games.length === 0) {
                sideBox.innerHTML = '<p>No players waiting. Be the first to create a game!</p>';
                return;
            }

            games.forEach(game => {
                const playerBlock = document.createElement('div');
                playerBlock.classList.add('player');
                
                playerBlock.innerHTML = `
                    <img src="${game.player1.avatar || 'default-avatar.png'}" alt="Player Avatar">
                    <div class="player-info">
                        <span class="player-name">${game.player1.username}</span>
                        <span class="player-level">Level ${game.player1.level}</span>
                    </div>
                    <button class="join-button">Play</button>
                `;

                const joinButton = playerBlock.querySelector('.join-button');
                joinButton.addEventListener('click', () => this.joinGame(game.id));
                
                sideBox.appendChild(playerBlock);
            });
        }
    };

    // Game Functions
    function updatePositions() {
        // Ensure paddles stay within bounds
        gameState.paddle1Y = Math.max(0, Math.min(tableHeight - paddleHeight, gameState.paddle1Y));
        gameState.paddle2Y = Math.max(0, Math.min(tableHeight - paddleHeight, gameState.paddle2Y));

        leftPaddle.style.top = `${gameState.paddle1Y}px`;
        rightPaddle.style.top = `${gameState.paddle2Y}px`;
        ball.style.left = `${gameState.ballX}px`;
        ball.style.top = `${gameState.ballY}px`;
        scorePlayer1Elem.textContent = gameState.scorePlayer1;
        scorePlayer2Elem.textContent = gameState.scorePlayer2;
    }

    function movePaddles() {
        const paddleSpeed = 8;
        
        if (gameState.keys['w']) gameState.paddle1Y = Math.max(0, gameState.paddle1Y - paddleSpeed);
        if (gameState.keys['s']) gameState.paddle1Y = Math.min(tableHeight - paddleHeight, gameState.paddle1Y + paddleSpeed);
        
        if (gameState.keys['ArrowUp']) gameState.paddle2Y = Math.max(0, gameState.paddle2Y - paddleSpeed);
        if (gameState.keys['ArrowDown']) gameState.paddle2Y = Math.min(tableHeight - paddleHeight, gameState.paddle2Y + paddleSpeed);
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
        if (!gameState.gameActive) return;

        gameState.ballX += gameState.ballSpeedX;
        gameState.ballY += gameState.ballSpeedY;

        // Ball collision with top and bottom walls
        if (gameState.ballY <= 0 || gameState.ballY >= tableHeight - ballSize) {
            gameState.ballSpeedY *= -1;
            gameState.ballY = gameState.ballY <= 0 ? 0 : tableHeight - ballSize;
        }

        const leftPaddleX = 20;
        const rightPaddleX = tableWidth - 20 - paddleWidth;

        // Left paddle collision
        if (checkPaddleCollision(gameState.ballX, gameState.ballY, leftPaddleX, gameState.paddle1Y)) {
            gameState.ballX = leftPaddleX + paddleWidth;
            gameState.ballSpeedX = Math.abs(gameState.ballSpeedX);
            const hitPosition = (gameState.ballY - gameState.paddle1Y) / paddleHeight;
            gameState.ballSpeedY = 8 * (hitPosition - 0.5);
        }

        // Right paddle collision
        if (checkPaddleCollision(gameState.ballX, gameState.ballY, rightPaddleX, gameState.paddle2Y)) {
            gameState.ballX = rightPaddleX - ballSize;
            gameState.ballSpeedX = -Math.abs(gameState.ballSpeedX);
            const hitPosition = (gameState.ballY - gameState.paddle2Y) / paddleHeight;
            gameState.ballSpeedY = 8 * (hitPosition - 0.5);
        }

        // Ball goes out of bounds
        if (gameState.ballX < 0 || gameState.ballX > tableWidth) {
            if (gameState.ballX < 0) gameState.scorePlayer2++;
            else gameState.scorePlayer1++;
            
            checkGameOver();
            if (gameState.gameActive) resetBall();
        }
    }

    function resetBall() {
        gameState.ballX = tableWidth / 2;
        gameState.ballY = tableHeight / 2;
        gameState.ballSpeedX = 5 * (Math.random() < 0.5 ? 1 : -1);
        gameState.ballSpeedY = (Math.random() - 0.5) * 6;
    }

    function checkGameOver() {
        if (gameState.scorePlayer1 >= 3 || gameState.scorePlayer2 >= 3) {
            gameState.gameActive = false;
            gameOverText.classList.remove('hidden');
            gameOverText.textContent = `Game Over! ${
                gameState.scorePlayer1 >= 3 ? 'Player 1' : 'Player 2'
            } Wins!`;
            playButton.classList.remove('hidden');

            // Save game result
            saveGameResult();
        }
    }

    async function saveGameResult() {
        try {
            await fetch('/api/games/score/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCookie('csrftoken')
                },
                body: JSON.stringify({
                    match_id: gameState.currentMatchId,
                    player1_score: gameState.scorePlayer1,
                    player2_score: gameState.scorePlayer2,
                    player1_id: gameState.currentPlayerId,  // Ajouté
                    player2_id: gameState.currentMatchId    // Ajouté
                })
            });
        } catch (error) {
            console.error('Error saving game result:', error);
        }
    }

    function gameLoop() {
        if (gameState.gameActive) {
            movePaddles();
            moveBall();
            updatePositions();
            requestAnimationFrame(gameLoop);
        }
    }

    function startGame() {
        gameState.gameActive = true;
        playButton.classList.add('hidden');
        gameOverText.classList.add('hidden');
        gameState.scorePlayer1 = 0;
        gameState.scorePlayer2 = 0;
        resetBall();
        gameLoop();
    }

    // Event Listeners
    playButton.addEventListener('click', async () => {
        try {
            if (!gameState.currentPlayerId) {
                await fetchPlayerId();
                if (!gameState.currentPlayerId) {
                    throw new Error('Unable to get player ID. Please ensure you are logged in.');
                }
            }
            
            const games = await matchmakingSystem.fetchAvailableGames();
            if (games.length === 0) {
                await matchmakingSystem.createGame();
                alert('Waiting for opponent to join...');
            } else {
                matchmakingSystem.updateWaitingPlayersList(games);
            }
        } catch (error) {
            console.error('Error during matchmaking:', error);
            alert('Failed to start matchmaking: ' + error.message);
        }
    });

    window.addEventListener('keydown', (e) => {
        gameState.keys[e.key] = true;
        if(['ArrowUp', 'ArrowDown', 'w', 's'].includes(e.key)) {
            e.preventDefault();
        }
    });

    window.addEventListener('keyup', (e) => {
        gameState.keys[e.key] = false;
    });
});


