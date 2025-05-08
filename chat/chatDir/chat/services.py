import requests
from django.conf import settings

def get_user_from_key(key):
    
    try:
        # Setup the request headers with the cookie
        cookies = {
            'access_token': key
        }
        # Make request to the authentication endpoint
        response = requests.get(
            'http://django:8000/user/token/',
            cookies=cookies
        )
        # Check if request was successful
        response.raise_for_status()
        
        # Return the user data
        return response.json()
        
    except requests.RequestException as e:
        # Handle any request errors
        print(f"Error fetching user data: {str(e)}")
        return None

    
    
def get_friends(token):
    try:
        # Setup the request headers with the cookie
        cookies = {
            'access_token': token
        }
        # Make request to the authentication endpoint
        response = requests.get(
            'http://django:8000/user/friends/',
            cookies=cookies
        )
        # Check if request was successful
        response.raise_for_status()
        
        # Return the user data
        return response.json()
        
    except requests.RequestException as e:
        # Handle any request errors
        print(f"Error fetching friends: {str(e)}")
        return None
