document.getElementById('cancel_2FA').addEventListener('click', function (event) {
    
    event.preventDefault();
    const route = "/inscreption"; 
    navigateTo(route);
    
});


function Display_Error2FA(error_mssg) 
{
    let errorBox = document.getElementById("BoxError");
    if (!errorBox) {
        errorBox = document.createElement('div');
        errorBox.id = "BoxError";
        document.getElementsByClassName('modal-general')[0].appendChild(errorBox);
    }
    else
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
    if (!document.getElementById('message_error'))
    {
        const mssg = document.createElement('p');
        mssg.id = "message_error";
        mssg.textContent = error_mssg;
        errorBox.appendChild(mssg);
    }
}

document.getElementById('submit-code_2Fa').addEventListener('click', function (event) {
    
    event.preventDefault();
    const Code = document.getElementById('2FA_code').value;
    const formData = new FormData();
    formData.append("otp", Code);
    fetch(`${BASE_URL}/user/2fa/verify/`, {
        method: 'POST',
        
        credentials: 'include',
         headers: {
            'Accept': 'application/json',
                },
        body: formData
    })
    .then(data => {
        if (data.ok) 
        {
            const route = "/home"; 
            navigateTo(route);
        } 
        else
        {
            Display_Error2FA('error in code 2FA');
        }
    })
    .catch(error => console.log("Error", error));
 });


fetch(`${BASE_URL}/user/2fa/scanned/`, {
    method: 'GET',
    credentials: 'include',
    headers: {
        // 'Accept': 'image/png', // Expect an image response
    //    'Content-Type': 'application/json'
    },
})
.then(response => {
    // if (!response.ok) {
    //     throw new Error(`HTTP error! Status: ${response.status}`);
    // }
     return response.json(); 
})
.then(data => {
    if (!data.scanned)
    {
         fetch(`${BASE_URL}/user/2fa/qrcode/`, {
    method: 'GET',
    credentials: 'include',
    headers: {
       'Content-Type': 'application/json'
    },
})
.then(response => {
    if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
    }
    return response.blob(); 
})
.then(blob => {
    document.getElementById('image_qr').style.display = 'inline';
    const url = URL.createObjectURL(blob);
    document.getElementById('image_qr').src = url;
}) 
 .catch(error => console.error("Error fetching QR code:", error));
    }

})
.catch(error => console.error("Error fetching QR code:", error));

