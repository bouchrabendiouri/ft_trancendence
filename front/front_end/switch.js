
function Display_Error(error_mssg) 
{
    let errorBox = document.getElementById("BoxError");
    if (!errorBox) {
        errorBox = document.createElement('div');
        errorBox.id = "BoxError";
        document.getElementById('divv').appendChild(errorBox);
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

function handlle_error_backend(response) 
{ 
    response.json().then((data) => {
        let errorMessage = data.detail || "An error occurred"; 
        Display_Error(errorMessage);

    }).catch(() => {
        Display_Error("happens error");
    });
}

function Clear_Error() 
{
    const errorBox = document.getElementById("BoxError");
    if (errorBox) {
        errorBox.remove();
    }
}

document.getElementById('switch-to-sign-up').addEventListener('click', function(event) 
{
    event.preventDefault();
    document.querySelector('.sign_in').style.display = 'none';
    document.querySelector('.sign_up').style.display = 'block';
});

document.getElementById('switch-to-sign-in').addEventListener('click', function(event) 
{
    event.preventDefault();
    document.querySelector('.sign_up').style.display = 'none';
    document.querySelector('.sign_in').style.display = 'block';
});

document.getElementById('next').addEventListener('click', function()
{
    const inputs = document.getElementsByClassName('input');
    var state = 0;
    Clear_Error();
    for (var i = 0; i < inputs.length; i++)
    {

        if (inputs[i].value === '')
        {
            state = 1;
            switch(i)
            { 
                case 0:
                    Display_Error('please fill out this field email');
                    break;
                case 1:
                    Display_Error('please fill out this field password');
                    break;
                case 2:
                    Display_Error('please fill out this field comfirmation password');
                    break;
            }
            break;
        }
    }
    if (!isPasswordValid(inputs[1].value))
    {
        state = 1;
        Display_Error('Invalid password. Please ensure your password includes one uppercase letter (A-Z) and lowercase letter (a-z) and one number (0-9)');
    }
    if (inputs[1].value != inputs[2].value)
    {
        Display_Error('please check password confirmation not correct');
        return ;
    }

if (state != 1)
{
    document.getElementById('step2').style.display = 'flex';
    document.getElementById('step1').style.display = 'none';
}
});

document.getElementById('sign_upp2').addEventListener('click', function(event)
{
    event.preventDefault();
    const inputs = document.getElementsByClassName('input_step2');
       Clear_Error();
    for (var i = 0; i < inputs.length; i++)
    {

        if (inputs[i].value === '')
        {
            state = 1;
            switch(i)
            { 
                case 0:
                    Display_Error('please fill out this field first_name');
                    break;
                case 1:
                    Display_Error('please fill out this field last_name');
                    break;
                case 2:
                    Display_Error('please fill out this field nickname');
                    break;
            }
            break;
        }
    }
});

function isPasswordValid(password) 
{
    const regex = /^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[\W_]).{8,}$/;
    return regex.test(password);
}
