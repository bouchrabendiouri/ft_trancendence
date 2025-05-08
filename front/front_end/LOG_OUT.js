 function logout() 
 {
    const formData = new FormData();
    formData.append("status", false);
    
    fetch(`${BASE_URL}/user/lougout/`, {  
        method: 'POST',
        credentials: 'include',
        body: formData
    })
    .then(response => {
        if (response.ok) {
            response.json().then(data => {
                console.warn("Successfully log out", data);
            });
        } else {
            console.log("Logout failed ", response.status);
        }
    })
    .catch(error => {
        console.error("Error during logout:", error);
    });
};
