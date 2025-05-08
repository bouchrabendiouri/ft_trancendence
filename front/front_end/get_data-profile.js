fetch(`${BASE_URL}/api/game/scores/player/`, {
    method: 'GET',
    credentials: 'include',
    headers: {
        'Content-Type': 'application/json',
        // 'Accept': 'application/json',
    },
})
.then(response => response.json())
.then(data => {
    id = localStorage.getItem("id_current_user");
    id = 0;
    const first_name = document.createElement('p');
    const last_name = document.createElement('p');

    const score = document.createElement('p');
    const level = document.createElement('p');

    const nameUserElement = document.createElement('span');
    const value_stats_matches = document.createElement('p');
    const value_stats_wins = document.createElement('p');
    const value_stats_losses = document.createElement('p');
    const energy = data.player.energy;
    
    value_stats_matches.id = 'value_stats_matches';
    value_stats_wins.id = 'value_stats_wins';
    value_stats_losses.id = 'value_stats_losses';
    nameUserElement.id = 'name_user';
    nameUserElement.style.display = 'inline-flex';
    first_name.textContent = data.player.user.first_name;
    last_name.textContent = data.player.user.last_name;
    score.textContent = data.player.total_score;
    level.textContent = data.player.level;

    document.getElementById('btn_score_2').appendChild(level);
    document.getElementsByClassName('stats_score_level')[1].appendChild(score);
    document.getElementById('profile_page_profile').src = data.player.user.avatar;
    nameUserElement.appendChild(first_name);
    nameUserElement.appendChild(last_name);
    value_stats_matches.textContent = data.player.total_matches;
    value_stats_wins.textContent = data.player.total_wins;
    value_stats_losses.textContent = data.player.total_losses;
    const firstLineProfile = document.getElementById('first_line_profile');
    const skillsButton = document.getElementById('btn_skills_points');
    // firstLineProfile.insertBefore(nameUserElement, skillsButton);

    document.getElementsByClassName("profile_info")[0].appendChild(nameUserElement);
    document.getElementsByClassName("stat_item")[0].appendChild(value_stats_matches);
    document.getElementsByClassName("stat_item")[1].appendChild(value_stats_wins);
    document.getElementsByClassName("stat_item")[2].appendChild(value_stats_losses);
    
})
.catch(error => console.error("Error:", error));