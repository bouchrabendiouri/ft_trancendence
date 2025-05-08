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

async function remote() {
  const pendingGamesContainer = document.getElementById("pendingGamesContainer");
  if (pendingGamesContainer) {
    fetchPendingGames();
  }

  const currentUser = await getCurrentUser();
  const socket = new WebSocket(
    `${BASE_URL_WS}/ws/game/?token=${currentUser.access_token}`,
  );

  socket.onopen = () => {
    console.log("WebSocket connection established for pending games");
  };

  socket.onmessage = (event) => {
    const data = JSON.parse(event.data);
    const event_type = data.type;

    if (pendingGamesContainer && (event_type === "new_game_added" || event_type === "game_joined")) {
      fetchPendingGames(); // Refresh the games list
    }
  };

  socket.onerror = () => {
    console.error("WebSocket connection error in pending games");
  };

  const scoreModal = document.getElementById("scoreModal");
  const confirmScoreButton = document.getElementById("confirmScore");
  const cancelScoreButton = document.getElementById("cancelScore");
  const matchScoreInput = document.getElementById("matchScore");
  const errorMessage = document.getElementById("errorMessage");

  // Ouverture de la modale
  document
    .getElementById("createGameButton")
    .addEventListener("click", function () {
      scoreModal.style.display = "flex";
      errorMessage.style.display = "none";
      matchScoreInput.value = ""; // Réinitialise l'entrée
    });

  // Annulation et fermeture de la modale
  cancelScoreButton.addEventListener("click", function () {
    scoreModal.style.display = "none";
  });

  confirmScoreButton.addEventListener("click", async function () {
    const score = matchScoreInput.value.trim();

    const numericScore = Number(score);

    if (
      !Number.isInteger(numericScore) ||
      numericScore < 1 ||
      numericScore > 13 ||
      score.includes(".")
    ) {
      errorMessage.style.display = "block";
      errorMessage.textContent =
        "Please enter a valid score (an integer between 1 and 13).";
    } else {
      errorMessage.style.display = "none";
      scoreModal.style.display = "none";

      await createGame(numericScore);
    }
  });

  // Fermeture de la modale en cliquant en dehors
  window.addEventListener("click", function (event) {
    if (event.target === scoreModal) {
      scoreModal.style.display = "none";
    }
  });
}

remote();

async function fetchPendingGames() {
  try {
    const response = await fetch(
      `${BASE_URL}/api/game/pending-matches/`,
      {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    if (!response.ok) {
      throw new Error("Failed to fetch pending games");
    }

    const games = await response.json();
    displayPendingGames(games);
    updateContent();
  } catch (error) {
    console.error("Error fetching pending games:", error);
  }
}

function displayPendingGames(games) {
  const container = document.getElementById("pendingGamesContainer");
  if (container) {
  container.innerHTML = "";

  games.forEach((game) => {
    const gameElement = document.createElement("div");
    gameElement.className = "player";
    gameElement.innerHTML = `
            <img src="${game.user.avatar || "avatar1.png"}" alt="Avatar">
            <div class="player-info">
                <span class="player-name">${game.user.username}</span>
                <span class="player-fullname">${game.user.first_name} ${game.user.last_name}</span>
            </div>
             <button class="play-button" data-i18n="join">"JOIN"</button>
        `;

    const joinButton = gameElement.querySelector(".play-button");
    joinButton.addEventListener("click", () => joinGame(game));

    container.appendChild(gameElement);
  });

  if (games.length === 0) {
    container.innerHTML =
    container.innerHTML = '<div class="no-games" data-i18n="no_games" >No pending games available</div>';
  }
}
}

async function joinGame(game) {
  try {
    const response = await fetch(
      `${BASE_URL}/api/game/${game.match_id}/join/`,
      {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    if (!response.ok) {
      throw new Error("Failed to join game");
    }

    const gameData = await response.json();

    sessionStorage.setItem("game", JSON.stringify(gameData));
    loadPage("/game_local");
  } catch (error) {
    console.error("Error joining game:", error);
  }
}

async function createGame(targetScore) {
  try {
    const response = await fetch(`${BASE_URL}/api/game/create/`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ target_score: targetScore }),
    });

    if (!response.ok) {
      throw new Error("Failed to create game");
    }

    const data = await response.json();

    if (data.match_id) {
      localStorage.setItem("match_id", data.match_id);
      history.pushState({}, "", "/matchmaking_game_remote");
      setTimeout(() => deleteMatchIfUnjoined(data.match_id), 1000 * 60 * 5);
    }

    loadPage("/matchmaking_game_remote");
  } catch (error) {
    console.error("Error creating game:", error);
    throw error;
  }
}

async function deleteMatchIfUnjoined(matchId) {
    const response = await fetch(
      `${BASE_URL}/api/game/match/${matchId}/delete_unjoined/`,
      {
        method: "DELETE",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      },
    );

    const data = await response.json();

    if (response.ok) {
      localStorage.removeItem("match_id");
  }
}

function checkURLChange() {
  if (window.location.pathname !== "/matchmaking_game_remote") {
    const matchId = localStorage.getItem("match_id");
    if (matchId) {
      deleteMatchIfUnjoined(matchId);
      localStorage.removeItem("match_id");
    }
  }
}

window.addEventListener("popstate", function () {
  checkURLChange();
});

setInterval(checkURLChange, 1000);
