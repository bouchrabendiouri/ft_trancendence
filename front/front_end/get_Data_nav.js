
function get_Data_Nav()
{
fetch(`${BASE_URL}/api/game/scores/player/`, {
        method: 'GET',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
        },
    })
    .then(response => response.json())
    .then(data => {
        document.getElementById('image_profile').src =   data.player.user.avatar;
        document.getElementById('user_name_profile').textContent =  data.player.user.username;
       
    })
    .catch(error => console.error("Error:", error));
}

get_Data_Nav();