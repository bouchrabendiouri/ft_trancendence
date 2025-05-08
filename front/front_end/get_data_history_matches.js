fetch(`${BASE_URL}/api/game/scores/player/`, {
    method: 'GET',
    credentials: 'include',
    headers: {
        'Content-Type': 'application/json',
    },
})
.then(response => response.json())
.then(data => {
    const matchContainer = document.getElementById('history_match'); 
    if (!matchContainer) {
        return;
    }

    matchContainer.innerHTML = ""; 

    if (!data.match_history || data.match_history.length === 0) {
        matchContainer.innerHTML = '<p class="no-history" style="text-align: center;,  margin-left: 10vw;"  >No match history available.</p>';

        return;
    }
        data.match_history.forEach(match => {
        const historyBox = document.createElement('div');
        historyBox.innerHTML = "";
        historyBox.className = 'history-box';
        const dateSpan = document.createElement('span');
        dateSpan.className = 'date';
        dateSpan.textContent = match.date ;
        const contentDiv = document.createElement('div');
        contentDiv.id = 'content_';
        const winnerDiv = document.createElement('div');
        winnerDiv.className = 'nick_img';

        const winnerImg = document.createElement('img');
        winnerImg.src = match.winner?.user?.avatar ; 
        winnerImg.alt = "Winner";
        winnerImg.className = "winner-img";

        const winnerNick = document.createElement('p');
        winnerNick.className = 'nickname';
        winnerNick.textContent = match.winner?.user?.username;

        winnerDiv.appendChild(winnerImg);
        winnerDiv.appendChild(winnerNick);

        const matchScoreContainer = document.createElement('div');
        matchScoreContainer.className = 'match-container';

        const winnerScoreDiv = document.createElement('div');
        winnerScoreDiv.id = 'winner';
        const winnerScore = document.createElement('p');
        winnerScore.id = 'score_winner';
        winnerScore.textContent = match.winner?.player_score;

        const winnerEmoji = document.createElement('span');
        winnerEmoji.className = 'emoji';
        winnerEmoji.textContent = "🏆";

        winnerScoreDiv.appendChild(winnerScore);
        winnerScoreDiv.appendChild(winnerEmoji);

        const loserScoreDiv = document.createElement('div');
        loserScoreDiv.id = 'loser';
        const loserScore = document.createElement('p');
        loserScore.id = 'score_loser';
        loserScore.textContent = match.loser?.player_score ;

        const loserEmoji = document.createElement('span');
        loserEmoji.className = 'emoji';
        loserEmoji.textContent = "💔";

        loserScoreDiv.appendChild(loserScore);
        loserScoreDiv.appendChild(loserEmoji);

        matchScoreContainer.appendChild(winnerScoreDiv);
        matchScoreContainer.appendChild(loserScoreDiv);

        const loserDiv = document.createElement('div');
        loserDiv.className = 'nick_img';

        const loserNick = document.createElement('p');
        loserNick.className = 'nickname';
        loserNick.textContent = match.loser?.user?.username || "Unknown";

        const loserImg = document.createElement('img');
        loserImg.src = match.loser?.user?.avatar || "default_players.png";
        loserImg.alt = "Loser";
        loserImg.className = "losser-img";

        loserDiv.appendChild(loserNick);
        loserDiv.appendChild(loserImg);
        contentDiv.appendChild(winnerDiv);
        contentDiv.appendChild(matchScoreContainer);
        contentDiv.appendChild(loserDiv);

        historyBox.appendChild(dateSpan);
        historyBox.appendChild(contentDiv);

        matchContainer.appendChild(historyBox);
    });
})
.catch(error => console.error("Error fetching match history:", error));
