
function send_data()
{
const email = document.getElementById('email_sign_in').value;
    const password = document.getElementById('password_login').value;
    const formData = new FormData();
    formData.append("email", email);
    formData.append("password", password);
    fetch(`${BASE_URL}/user/login/`, {
        method: 'POST',
        
        credentials: 'include',
         headers: {
                     'Accept': 'application/json',
                },
        body: formData
    })
    .then(response => {
        if (response.ok) {
               response.json().then(data => {
                const route = "/2FA"; 
                navigateTo(route);
               })
        } 
        else 
            handlle_error_backend(response);
    })
    .catch(error => console.log("Error", error));
};
document.getElementById('sign_upp2').addEventListener('click', function (event) 
{
    event.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirm_password = document.getElementById('confirm_password').value;
    const first_name = document.getElementById('first_name').value;
    const last_name = document.getElementById('last_name').value;
    const nickname = document.getElementById('nickname').value;
    const avatar = document.getElementById('Uploadimage').files[0];
   
    const formData = new FormData();
    formData.append("email", email);
    formData.append("password", password);
    formData.append("confirm_password", confirm_password);
    formData.append("first_name", first_name);
    formData.append("last_name", last_name);
    formData.append("username", nickname);
    if (avatar)
        formData.append("avatar", avatar);
    fetch(`${BASE_URL}/user/register/`, {
        method: 'POST',
        // credentials: 'include', 
        body: formData
    })
    .then(response => {
        if (response.ok) {
               response.json().then(data => {
                const route = "/inscreption"; 
                navigateTo(route);
            });
        } 
        else 
        {
            handlle_error_backend(response);
            document.getElementById('step2').style.display = 'none';
            document.getElementById('step1').style.display = 'flex';
        }
    })
    .catch(error => console.log("Error", error));
});

document.getElementById('signin').addEventListener('click', function (event) {
    
    event.preventDefault();
    send_data();
});

async function loginWith42() 
{
    try {
        const response = await fetch(`${BASE_URL}/auth/login42/`, {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
            },
        });
        if (!response.ok) {
            throw new Error('Failed to fetch auth URL');
        }
        const data = await response.json();
        const authUrl = data.auth_url;
        window.location.href = authUrl;

    } catch (error) {
        console.error('Error during login:', error);
    }
}

