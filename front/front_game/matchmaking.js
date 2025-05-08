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

async function initMatchmaking() {
  const currentUser = await getCurrentUser();
  const socket = new WebSocket(
    `${BASE_URL_WS}/ws/game/?token=${currentUser.access_token}`,
  );

  socket.onopen = () => {
    console.log("socket opened successfully");
  };

  socket.onerror = () => {
    const errorMessage = document.getElementById("errorMessage");

    console.error(
      "Error happened while opening websocket connection in initMatchmaking",
    );

    if (errorMessage) {
      errorMessage.textContent = "Can't open websocket";

      setTimeout(() => {
        errorMessage.style.display = "none";
      }, 1000);
    }
  };

  const timeoutId = setTimeout(
    function () {
      document.getElementById("scoreModal").style.display = "flex";
    },
    1000 * 60 * 5,
  );

  socket.onmessage = function (event) {
    const data = JSON.parse(event.data);

    if (
      data.type === "game_state_update" &&
      window.location.pathname === "/matchmaking_game_remote"
    ) {
      clearTimeout(timeoutId);
      sessionStorage.setItem("game", JSON.stringify(data));
      socket.onmessage = null;
      socket.close();
      loadPage("/game_local");
    }
  };

  document
    .getElementById("back_to_home")
    .addEventListener("click", function () {
      loadPage("/game");
    });
}

initMatchmaking();
