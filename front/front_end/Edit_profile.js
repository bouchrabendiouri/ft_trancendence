function Display_Error(error_mssg, color) 
{
    let errorBox = document.getElementById("BoxError");
    if (errorBox)
        errorBox.remove();
        errorBox = document.createElement('div');
        errorBox.id = "BoxError";
        errorBox.style.backgroundColor = color;
        errorBox.style.boxShadow = '0px 0px 20px green';
        document.getElementById('content22').appendChild(errorBox)
        errorBox.style.display = 'block';
        if (!document.querySelector('#BoxError .hiddin')) {
            const closeButton = document.createElement('span');
            closeButton.classList = "hiddin";
            closeButton.id = "hiddinn";
            closeButton.innerHTML = "&times;";
            closeButton.addEventListener('click', () => {
                errorBox.style.display = 'none';
            });
            errorBox.appendChild(closeButton);
        } 
    if (document.getElementById('message_error'))
        document.getElementById('message_error').remove();
        const mssg = document.createElement('p');
        mssg.id = "message_error";
        mssg.textContent = error_mssg;
        errorBox.appendChild(mssg);
}
function isPasswordValid(password) 
{
    const regex = /^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[\W_]).{8,}$/;
    return regex.test(password);
}

document.getElementById('settings-form').addEventListener('submit', function(event) {
    event.preventDefault();

    const email = document.getElementById('email').value;
    const nickname = document.getElementById('nickname').value;
    const first_name = document.getElementById('first_name').value;
    const last_name = document.getElementById('last_name').value;
    const avatar = document.getElementById('profile-image').files[0];
    const formData = new FormData();

    if (email) formData.append("email", email);
    if (nickname) formData.append("username", nickname);
    if (first_name) formData.append("first_name", first_name);
    if (last_name) formData.append("last_name", last_name);
    if (avatar) formData.append("avatar", avatar);

    fetch(`${BASE_URL}/api/game/scores/player/`, {
        method: 'GET',
        credentials: 'include',
    })
    .then(response => response.json())
    .then(data => {
        const userId = data.player.user.id;
        fetch(`${BASE_URL}/user/profile/${userId}/`, {
            method: 'PUT',
            credentials: 'include',
            body: formData 
        })
        .then(response => {
            if (response.ok) 
            {
                   response.json().then(data => {
                    document.getElementById('user_name_profile').textContent = data.username;
                     document.getElementById('image_profile').src = data.avatar;
                     Display_Error('Profile updated successfully', 'green');
                });
            } 
            else  if (!response.ok)
            {
                Display_Error('Profile not updated failDd', 'red');
            }
        })
        .catch(error => {
            console.error('Error updating profile:', error);
        });
    })
    .catch(error => {
        console.error('Error fetching profile data:', error);
    });
});
