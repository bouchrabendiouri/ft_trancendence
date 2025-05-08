function display_score_players_tournament(score_play1, score_play2, name_play1, name_play2, avatar_player1,  avatar_player2, nick_play1, nick_play2)
{
    const player1Score = score_play1;
    const player2Score = score_play2;

    const player1Name =  name_play1;
    const player2Name =  name_play2;
    const player1Avatar =  avatar_player1;
    const player2Avatar =  avatar_player2;
    const nick1 = nick_play1;
    const nick2 = nick_play2;

    const winner = player1Score > player2Score ? {
        name: player1Name,
        avatar: player1Avatar,
        score: player1Score,
        nick : nick1
        
    } : {
        name: player2Name,
        avatar: player2Avatar,
        score: player2Score, 
        nick : nick2
      
    };

    const loser = player1Score > player2Score ? {
        name: player2Name,
        avatar: player2Avatar,
        score: player2Score, 
        nick : nick2
    } : {
        name: player1Name,
        avatar: player1Avatar,
        score: player1Score,
        nick : nick1
    };

    // var i = 0;

    if (matches[2].player1 === "winner")
    {
        matches[2].player1_alias_name = winner.name;
        matches[2].player1 = winner.nick;
        console.log("===========", matches[2].player1);
        // i = 1;
    }
    else if ((matches[2].player2 === "winner") && (matches[2].player1 !== "winner"))
    {
        matches[2].player2_alias_name = winner.name;
        matches[2].player2 = winner.nick;
        console.log("===========", matches[2].player2);
    }
    if((matches[2].player2 !== "winner") && (matches[2].player1 !== "winner"))
    {
        console.log("=========== mach 3", matches[2].player1);
        console.log("=========== match 3", matches[2].player2);
        warning_chat(matches[2].player1, matches[2].player2 );
    }
    if (matchid != 3)
    {
    document.getElementById("winner-avatar").src = winner.avatar;
    document.getElementById("winner-name").textContent = winner.name;
    document.getElementById("winner-score").textContent = winner.score;
    }
    else
    {
        document.getElementById("winner-avatar_final").src = winner.avatar;
        document.getElementById("winner-name_final").textContent = winner.name;
        document.getElementById("winner-score_final").textContent = winner.score;
    }
    
    const loserAvatar = document.getElementById("loser-avatar");
if (loserAvatar) 
{
    loserAvatar.src = loser.avatar;
}

const loserName = document.getElementById("loser-name");
if (loserName) {
    loserName.textContent = loser.name;
}

const loserScore = document.getElementById("loser-score");
if (loserScore) {
    loserScore.textContent = loser.score;
}
    const reply = document.getElementById("replayButton");
    if (reply)
    {
        document.getElementById("replayButton").addEventListener("click", () => {
        document.getElementsByClassName('player-boxes')[0].style.display = 'flex';
        document.getElementsByClassName('ping-pong-table')[0].style.display = 'flex';
        document.getElementsByClassName('game-box')[0].style.display = 'none';
        document.getElementsByClassName('character')[0].style.display = 'none';
        game_play();
    });
}
}

function display_score_players(score_play1, score_play2, name_play1, name_play2, avatar_player1,  avatar_player2)
{
    const player1Score = score_play1;
    const player2Score = score_play2;

    const player1Name =  name_play1;
    const player2Name =  name_play2;
    const player1Avatar =  avatar_player1;
    const player2Avatar =  avatar_player2;

    const winner = player1Score > player2Score ? {
        name: player1Name,
        avatar: player1Avatar,
        score: player1Score,
        
    } : {
        name: player2Name,
        avatar: player2Avatar,
        score: player2Score, 
      
    };

    const loser = player1Score > player2Score ? {
        name: player2Name,
        avatar: player2Avatar,
        score: player2Score
    } : {
        name: player1Name,
        avatar: player1Avatar,
        score: player1Score
    };

    document.getElementById("winner-avatar").src = winner.avatar;
    document.getElementById("winner-name").textContent = winner.name;
    document.getElementById("winner-score").textContent = winner.score;
    const loserAvatar = document.getElementById("loser-avatar");

    loserAvatar.src = loser.avatar;
const loserName = document.getElementById("loser-name");
    loserName.textContent = loser.name;

const loserScore = document.getElementById("loser-score");
    loserScore.textContent = loser.score;
}
