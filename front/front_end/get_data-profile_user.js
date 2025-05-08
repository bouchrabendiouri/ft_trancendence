
function get_data_profile_user(player) {
    
    document.getElementById('Level').textContent = 'LEVEL:';
    document.getElementById('Score').textContent = 'SCORE:';
    document.getElementById("history_match").style.display = 'nane'
    const first_name = document.createElement('p');
    const last_name = document.createElement('p');
    const score = document.createElement('p');
    const level = document.createElement('p');
    const nameUserElement = document.createElement('span');
    const value_stats_matches = document.createElement('p');
    const value_stats_wins = document.createElement('p');
    const value_stats_losses = document.createElement('p');
    const energy = player.energy;
    value_stats_matches.id = 'value_stats_matches';
    value_stats_wins.id = 'value_stats_wins';
    value_stats_losses.id = 'value_stats_losses';
    nameUserElement.id = 'name_user';
    nameUserElement.style.display = 'inline-flex';

    first_name.textContent = player.user.first_name;
    last_name.textContent = player.user.last_name;
    score.textContent = player.total_score;
    level.textContent = player.level;
    const btnScore2 = document.getElementById('btn_score_2');
    if (btnScore2) btnScore2.appendChild(level);

    const statsScoreLevel = document.getElementsByClassName('stats_score_level')[1];
    if (statsScoreLevel) statsScoreLevel.appendChild(score);

    const profileImg = document.getElementById('profile_page_profile');
    if (profileImg) profileImg.src = player.user.avatar;

    nameUserElement.appendChild(first_name);
    nameUserElement.appendChild(last_name);

    value_stats_matches.textContent = player.total_matches;
    value_stats_wins.textContent = player.total_wins;
    value_stats_losses.textContent = player.total_losses;

    const profileInfo = document.getElementsByClassName("profile_info")[0];
    if (profileInfo) profileInfo.appendChild(nameUserElement);

    const statItems = document.getElementsByClassName("stat_item");
    if (statItems.length >= 3) {
        statItems[0].appendChild(value_stats_matches);
        statItems[1].appendChild(value_stats_wins);
        statItems[2].appendChild(value_stats_losses);
    }

    const energyStrip = document.getElementById('energy_strip');
    const energyValue = document.getElementById('energy_value');
    
    if (energyStrip && energyValue) {
        const value = Math.max(0, Math.min(100, energy));
        energyStrip.style.width = `${value}%`;
        document.getElementById('btn_energy').style.background = `linear-gradient(to right, #FF00F5 ${value}%, white 100%)`;
        energyValue.textContent = `${value}%`;
    }

    const levelValue = Math.max(0, Math.min(100, player.level));
    const scoreBar = document.getElementById('btn_score_2');
    if (scoreBar) scoreBar.style.width = `${levelValue}%`;
        const currentUrl = new URL(window.location.href);
        const newUrl = `${currentUrl.origin}/profile_user/${player.user.username}`;
        history.pushState({ path: newUrl }, '', newUrl);
   
}

function search(id) {
    fetch(`${BASE_URL}/api/game/scores/list/`, { 
        credentials: 'include',
        headers: {
            'Accept': 'application/json',
        },
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        if (!data.players || !Array.isArray(data.players)) {
            console.error("Invalid response: Missing 'players' array");
            return;
        }
        const player = data.players.find(player => player.user.id == parseInt(id, 10));
        if (player) {
            get_data_profile_user(player);
        } else {
            console.warn("User not found in players list.");
        }
    })
    .catch(error => {
        console.error("Error fetching player data:", error);
    });
}
