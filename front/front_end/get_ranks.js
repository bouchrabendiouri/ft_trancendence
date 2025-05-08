function listen_on_players() {
    const buttons = document.querySelectorAll('#view_profile');
    buttons.forEach((button) => {
        button.addEventListener('click', () => {
            const id = button.getAttribute('data-player-id');
            navigateTo('/profile_user');
            setTimeout(() => {
                search(id);
            }, 500);
        });
    });
}

fetch(`${BASE_URL}/api/game/players_of_the_week/`, {
    method: 'GET',
    credentials: 'include',
    headers: {
        'Content-Type': 'application/json',
    },
})

.then(response => response.json())
.then(data => {
    const boxRankContainer = document.querySelector('.BOX_rank');
    const noRankingsDiv = document.querySelector('[data-i18n="no_rankings"]');
    
    if (!data || data.len === 0 || data.len !== 3) {
        document.querySelector('[data-i18n="no_rankings"]').style.display = 'block';  
        return;
    }
    noRankingsDiv.style.display = 'none';  
    
  
    boxRankContainer.innerHTML = '';
  
    data.players.forEach((player, index) => {
        const boxRank = document.createElement('div');
        boxRank.className = 'box_rank';
        
    
        const playerAvatar = document.createElement('img');
        playerAvatar.className = 'imojji';
        playerAvatar.src = player.avatar ;
        playerAvatar.alt = 'Player Avatar';
    
        const playerName = document.createElement('p');
        playerName.className = 'names';
        playerName.appendChild(document.createElement('em')).textContent = `${player.first_name} ${player.last_name}`;
    
    
        const playerInfo1 = document.createElement('div');
        playerInfo1.className = 'INFO';
        const playerInfo2 = document.createElement('div');
        playerInfo2.className = 'INFO';
        
        const levelInfo = document.createElement('p');
        levelInfo.className = 'Level_skill_points';
        const levelText = document.createElement('span');
        levelText.className = 'score';
        levelText.textContent = player.level;
        levelInfo.textContent = 'LEVEL : ';
        levelInfo.appendChild(levelText);
    
        const skillPointsInfo = document.createElement('p');
        skillPointsInfo.className = 'Level_skill_points';
        const skillPointsText = document.createElement('span');
        skillPointsText.className = 'score';
        skillPointsText.textContent = player.total_score;
        skillPointsInfo.textContent = 'SCORE : ';
        skillPointsInfo.appendChild(skillPointsText);
    
        const viewProfileButton = document.createElement('button');
        viewProfileButton.id = 'view_profile';
        viewProfileButton.className = 'btn btn-primary';
        viewProfileButton.type = 'button';
        viewProfileButton.textContent = 'View Profile';
        viewProfileButton.setAttribute('data-player-id', player.player_id);
        playerInfo1.appendChild(levelInfo);
        playerInfo2.appendChild(skillPointsInfo);
        boxRank.appendChild(playerAvatar);
        boxRank.appendChild(playerName);
        boxRank.appendChild(playerInfo1);
        boxRank.appendChild(playerInfo2);
        boxRank.appendChild(viewProfileButton);
    
        if (index === 0) { 
            boxRank.id = 'box_first_rank';
            const iconImg = document.createElement('img');
            iconImg.id = 'icone';
            iconImg.src = 'IMAGES/icon.png';
            boxRank.appendChild(iconImg);
            boxRank.style.order = 1; 
        } else {
            boxRank.style.order = index === 1 ? 0 : 2; 
        }
        boxRankContainer.appendChild(boxRank);
    });
    listen_on_players();
})
.catch(error => {
    console.error('Error fetching rankings:', error);
});
