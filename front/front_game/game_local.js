async function getCurrentUser() {
  try {
      const response = await fetch(`${BASE_URL}/user/`, {
          method: "GET",
          credentials: "include",
          headers: {
              "Content-Type": "application/json",
          },
      });

      if (!response.ok) {
          throw new Error("Failed to get current user");
      }

      const data = await response.json();
      return data;
  } catch (error) {
      console.error("Error getting current user:", error);
      return null;
  }
}

function display_score(scorePlayer1, scorePlayer2,player1name, player2name, player1_avatar, player2_avatar ) {
  document.getElementsByClassName("player-boxes")[0].style.display = "none";
  document.getElementsByClassName("ping-pong-table")[0].style.display = "none";
  document.getElementsByClassName("game-box")[0].style.display = "flex";
  document.getElementsByClassName("character")[0].style.display = "block";
  display_score_players(scorePlayer1, scorePlayer2, player1name, player2name, player1_avatar,  player2_avatar);
}

async function game_play() {
  const leftPaddle = document.querySelector(".left-paddle");
  const rightPaddle = document.querySelector(".right-paddle");
  const ball = document.querySelector(".ball");
  const table = document.querySelector(".ping-pong-table");
  const playButton = document.getElementById("startButton");
  const gameOverText = document.getElementById("gameOver");
  const scorePlayer1Elem = document.getElementById("scorePlayer1");
  const scorePlayer2Elem = document.getElementById("scorePlayer2");

  const tableHeight = table.offsetHeight;
  const tableWidth = table.offsetWidth;
  const paddleHeight = leftPaddle.offsetHeight;
  const paddleWidth = leftPaddle.offsetWidth;
  const ballSize = ball.offsetWidth;

  let paddle1Y = (tableHeight - paddleHeight) / 2;
  let paddle2Y = (tableHeight - paddleHeight) / 2;
  let ballX = tableWidth / 2;
  let ballY = tableHeight / 2;
  let ballSpeedX = 10;
  let ballSpeedY = 10;
  let keys = {};
  let scorePlayer1 = 0;
  let scorePlayer2 = 0;
  let gameActive = false;

  const currentUser = await getCurrentUser();
  const socket = new WebSocket(
    `${BASE_URL_WS}/ws/game/?token=${currentUser.access_token}`,
  );
  let game = JSON.parse(sessionStorage.getItem("game"));
  const isRemoteGame = !!game;
  let gameHost = undefined;

  socket.onopen = () => {
    console.warn("WebSocket connection established");
  };

  socket.onerror = () => {
    const errorMessage = document.getElementById("errorMessage");
    if (errorMessage) {
      errorMessage.textContent = "Can't open websocket";

      setTimeout(() => {
        errorMessage.style.display = "none";
      }, 1000);
    }
  };

  sessionStorage.removeItem("game");

  if (isRemoteGame) {
    const player1 = document.getElementById("player1");
    const player2 = document.getElementById("player2");
    const startButton = document.getElementById("startButton");

    gameHost = currentUser.id == game.player2.id;
    startButton.style.display = "none";
    player1.innerHTML = `
      <img src="${game.player1.avatar || "avatar1.png"}" alt="Player 1 Avatar" class="player-avatar">
      <span class="player-username">${game.player1.username}</span>
    `;

    player2.innerHTML = `
      <img src="${game.player2.avatar || "avatar1.png"}" alt="Player 2 Avatar" class="player-avatar">
      <span class="player-username">${game.player2.username}</span>
    `;

    if (gameHost) {
      await startCountdown();
      gameActive = true;
      gameLoop();
    }

    socket.onopen = () => {
      if (gameHost) {
        sendGameData();
      }
    };
  }

  function updateWithGameData() {
    paddle1Y = game.paddle1_y;
    paddle2Y = game.paddle2_y;
    ballX = game.ball_position.x;
    ballY = game.ball_position.y;
    scorePlayer1 = game.score.player1;
    scorePlayer2 = game.score.player2;
    updatePositions();
  }

  socket.onmessage = (event) => {
    const data = JSON.parse(event.data);
    const event_type = data.type;

    if (event_type === "game_state_update") {
      game = data;
      updateWithGameData();
    } else if (event_type === "opponent_paddle_direction") {
      if (data.direction === "UP") {
        keys["opponentArrowUp"] = true;
        keys["opponentArrowDown"] = false;
      } else if (data.direction === "DOWN") {
        keys["opponentArrowUp"] = false;
        keys["opponentArrowDown"] = true;
      } else if (data.direction === "FIX") {
        keys["opponentArrowUp"] = false;
        keys["opponentArrowDown"] = false;
      }
    } else if (event_type == "game_final_score") {
      scorePlayer1 = data.score_player1;
      scorePlayer2 = data.score_player2;
      scorePlayer1Elem.textContent = scorePlayer1;
      scorePlayer2Elem.textContent = scorePlayer2;
      checkGameOver();
    }
  };

  function updatePositions() {

    if (gameHost) {
      paddle1Y = Math.max(0, Math.min(tableHeight - paddleHeight, paddle1Y));
      paddle2Y = Math.max(0, Math.min(tableHeight - paddleHeight, paddle2Y));
    }

    leftPaddle.style.top = `${paddle1Y}px`;
    rightPaddle.style.top = `${paddle2Y}px`;
    ball.style.left = `${ballX}px`;
    ball.style.top = `${ballY}px`;
    scorePlayer1Elem.textContent = scorePlayer1;
    scorePlayer2Elem.textContent = scorePlayer2;

  
    if (gameHost && socket.readyState === WebSocket.OPEN) {
      sendGameData();
    }
  }

  function sendGameData() {
    const isPlayer1 = currentUser.id == game.player1.id;

    socket.send(
      JSON.stringify({
        type: "game_state",
        match_id: game.match_id,
        target_score: game.target_score,
        opponent_id: isPlayer1 ? game.player2.id : game.player1.id,
        player1: game.player1,
        player2: game.player2,
        ball_position: { x: ballX, y: ballY },
        paddle1_y: paddle1Y,
        paddle2_y: paddle2Y,
        score: {
          player1: scorePlayer1,
          player2: scorePlayer2,
        },
      }),
    );
  }

  function movePaddles() {
    const paddleSpeed = 15;

    if (isRemoteGame) {
      const isPlayer1 = currentUser.id == game.player1.id;

      if (isPlayer1) {
        if (keys["ArrowUp"]) {
          paddle1Y = Math.max(0, paddle1Y - paddleSpeed);
        }
        if (keys["ArrowDown"]) {
          paddle1Y = Math.min(
            tableHeight - paddleHeight,
            paddle1Y + paddleSpeed,
          );
        }

        if (keys["opponentArrowUp"]) {
          paddle2Y = Math.max(0, paddle2Y - paddleSpeed);
        }
        if (keys["opponentArrowDown"]) {
          paddle2Y = Math.min(
            tableHeight - paddleHeight,
            paddle2Y + paddleSpeed,
          );
        }
      } else {
        if (keys["ArrowUp"]) {
          paddle2Y = Math.max(0, paddle2Y - paddleSpeed);
        }
        if (keys["ArrowDown"]) {
          paddle2Y = Math.min(
            tableHeight - paddleHeight,
            paddle2Y + paddleSpeed,
          );
        }

        if (keys["opponentArrowUp"]) {
          paddle1Y = Math.max(0, paddle1Y - paddleSpeed);
        }
        if (keys["opponentArrowDown"]) {
          paddle1Y = Math.min(
            tableHeight - paddleHeight,
            paddle1Y + paddleSpeed,
          );
        }
      }
    } else {
      if (keys["w"]) paddle1Y = Math.max(0, paddle1Y - paddleSpeed);
      if (keys["s"])
        paddle1Y = Math.min(tableHeight - paddleHeight, paddle1Y + paddleSpeed);
      if (keys["ArrowUp"]) paddle2Y = Math.max(0, paddle2Y - paddleSpeed);
      if (keys["ArrowDown"])
        paddle2Y = Math.min(tableHeight - paddleHeight, paddle2Y + paddleSpeed);
    }
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
    ballSpeedX = 1 * (Math.random() < 0.5 ? 1 : -1) * 6;
    ballSpeedY = (Math.random() - 0.5) * 6;
  }

  async function saveMatchResult(matchId, scorePlayer1, scorePlayer2) {
    try {
        const response = await fetch(`${BASE_URL}/api/game/match/${matchId}/finish/`, {
            method: "POST",
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                player1_score: scorePlayer1,
                player2_score: scorePlayer2,
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'An error occurred');
        }
        return data;
    } catch (error) {
        console.error("Error saving match:", error);
        throw error;
    }
}



  function checkGameOver() {

    let targetScore = 3;

    if (isRemoteGame) {
      targetScore = game.target_score;
    }

    if (scorePlayer1 >= targetScore || scorePlayer2 >= targetScore) {
      console.log("Game Over! Winner:", scorePlayer1 >= targetScore ? "Player 1" : "Player 2");
      gameActive = false;
      gameOverText.classList.remove("hidden");
      gameOverText.textContent = `Game Over! ${
        scorePlayer1 >= targetScore ? "Player 1" : "Player 2"
      } Wins!`;
      playButton.classList.remove("hidden");

      if (isRemoteGame && gameHost && socket.readyState === socket.OPEN) {
      
        const isPlayer1 = currentUser.id == game.player1.id;

        socket.send(
          JSON.stringify({
            type: "game_final_score",
            opponent_id: isPlayer1 ? game.player2.id : game.player1.id,
            score_player1: scorePlayer1,
            score_player2: scorePlayer2,
          }),
        );
      }
      if (isRemoteGame) {
        setTimeout(() => {
            display_score(
            scorePlayer1, 
            scorePlayer2, 
            game.player1.username, 
            game.player2.username, 
            game.player1.avatar, 
            game.player2.avatar
          )
            saveMatchResult(game.match_id, scorePlayer1, scorePlayer2);
        }, 1000);
        if (socket) {
          socket.onmessage = null;
          socket.onerror = null;
          socket.onclose = null;
          socket.close();
      }

      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    } else {
        setTimeout(() => {
            display_score(scorePlayer1, scorePlayer2, "player1", "player2", "player1.png", "player2.png");
        }, 1000);
    }
  }
}
  // Complete game reset
  function resetGame() {
    scorePlayer1 = 0;
    scorePlayer2 = 0;
    paddle1Y = (tableHeight - paddleHeight) / 2;
    paddle2Y = (tableHeight - paddleHeight) / 2;
    resetBall();
    gameActive = true;
    playButton.classList.add("hidden");
    gameOverText.classList.add("hidden");
  }

  function gameLoop() {
    if (gameActive) {
      movePaddles();
      moveBall();
      updatePositions();
      requestAnimationFrame(gameLoop);
    }
  }

  function startCountdown() {
    return new Promise((resolve) => {
      const countdownElement = document.getElementById("countdown");
      let count = 5;

      countdownElement.classList.remove("hidden");

      const interval = setInterval(() => {
        count--;
        if (count > 0) {
          countdownElement.textContent = count;
        } else {
          clearInterval(interval);
          countdownElement.classList.add("hidden");
          resolve();
        }
      }, 1000);
    });
  }


  playButton.addEventListener("click", async () => {
    resetGame();
    gameActive = true;
    gameLoop();
  });

  function handleKeyDown(e) {
    keys[e.key] = true;
    if (["ArrowDown", "ArrowUp"].includes(e.key) && isRemoteGame && !gameHost && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({
            type: "opponent_paddle_direction",
            direction: e.key === "ArrowUp" ? "UP" : "DOWN",
            game_host_id: game.player2.id,
        }));
    }
    if (["ArrowUp", "ArrowDown", "w", "s"].includes(e.key)) {
        e.preventDefault();
    }
}

function handleKeyUp(e) {
    keys[e.key] = false;
    if (["ArrowDown", "ArrowUp"].includes(e.key) && isRemoteGame && !gameHost && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({
            type: "opponent_paddle_direction",
            direction: "FIX",
            game_host_id: game.player2.id,
        }));
    }
}
window.addEventListener("keydown", handleKeyDown);
window.addEventListener("keyup", handleKeyUp);


  updatePositions();
}

game_play();

