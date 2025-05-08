const BASE_URL =
'https://10.14.8.10:8443'
const BASE_URL_WS = 'wss://10.14.8.10:8443'
function loadnavication() 
{
    const navHtml = `
    <div class="navication" id="navicationn">
        <span>
             <a data-route="/home"><img src="IMAGES/Logo.png" id = "Logo" alt="Ping"></a>
            <a data-route="/home"><img src="IMAGES/PING.png" alt="Ping"></a>
             <a data-route="/home"><img id="pong" src="IMAGES/PONG.png" alt="Pong"></a>
        </span>
        <ol>
            <li class="button_list"><a data-i18n="Nav_Game" data-route="/game">GAME</a></li>
            <li class="button_list"><a data-i18n="Nav_Chat" data-route="/chat">CHAT</a></li>
            <li class="button_list"><a class="button_list" data-route="/users" data-i18n="Nav_Users">USERS</a></li>
            <li class="button_list"><a class="button_list" data-route="/about" data-i18n="Nav_About" >ABOUT</a></li>
        </ol>
        <span id="profile">
            <div class="dropdown">
                <a 
                    class="button_list dropdown-toggle" 
                    id="user_name_profile" 
                    data-bs-toggle="dropdown" 
                    aria-expanded="false"
                >
                </a>
                <ul class="dropdown-menu" aria-labelledby="user_name_profile">
                    <li><a class="dropdown-item" data-route="/setting" data-i18n="SETTINGS">Settings</a></li>
                    <li><a class="dropdown-item" data-route="/profile" data-i18n="VIEW_PROFILE">View Profile</a></li>
                    <li><a class="dropdown-item text-danger" id="logout" onclick="logout()" data-route="/inscreption" data-i18n="LOG_OUT">Log_Out</a></li>
                </ul>
            </div>
            <img id="image_profile">
        </span>
    </div>
`;

    document.body.insertAdjacentHTML('afterbegin', navHtml);
    const dropdownToggle = document.querySelector('#user_name_profile');
    if (dropdownToggle) 
        new bootstrap.Dropdown(dropdownToggle);
}

const routes = 
{
    '/': 'page_inscreption.html',
    '/home': 'page_home.html',
    '/about': 'page_about.html',
    '/users': 'page_users.html',
    '/profile': 'page_profile.html',
     '/profile_user': 'page_profile.html',
    '/inscreption': 'page_inscreption.html',
    '/no_found_page': 'no_found_file.html',
    '/setting': 'page_setting.html',
    '/log_out': 'page_inscreption.html',
    "/2FA": '2FA.html',
    "/chat": 'chat.html',
    "/game": 'game.html',
    "/game_local": 'game_local.html',
    "/match_tournament": 'create_match_tournament.html',
     "/tournament": 'tournament.html',
     "/game_remote": 'game_remote.html',
     "/matchmaking_game_remote": 'matchmaking.html'
};

const currentPath = window.location.pathname;
if (routes[currentPath])
{
    navigateTo(currentPath);
}
else 
    navigateTo('/no_found_page');

function navigateTo(route) 
{
    if (route == "/" || route == "/inscreption")
        loadPage(route);
    else
        loadPage_protection(route);
}

function fetch_content_page(route) 
{
    if (route != '/profile_user')
        window.history.pushState({ page: route }, '', route);
    if ((route === "/inscreption" || route === "/no_found_page" ||  route === "/") && document.body.querySelector(".navication"))
        document.body.querySelector('.navication').remove();
    else if ((!document.body.querySelector(".navication")) && (route !== "/inscreption" && route !== "/no_found_page"  &&  route !== "/2FA" && route !== "/")) 
    {
        loadnavication();
        setup_listners();
    }
        var file = routes[route];
        if (file)
        {
                fetch(file)
                .then(response => 
                {
                    if (!response.ok) 
                    {
                        throw new Error(`Failed to load ${file}`);
                    }
                    return response.text();
                })
                .then(content => 
                {
                    document.getElementById('content22').innerHTML = content;
                    addScript("translate.js"); 
                    if (route !== "/chat") {
                        // Get socket from window object since it's defined in chat.js
                        const socket = window.socket;
                        // Check if socket exists and is in OPEN state (WebSocket.OPEN = 1)
                        if (socket && socket.readyState === 1) {
                            socket.close();
                            window.socket = null;
                        }
                    }

                    if (route == "/inscreption" || route == "/") 
                        addScripts(["post_request_login.js", "switch.js"]);
                    if (route == "/2FA") 
                        addScript("2FA.js");
                    if (route == "/about")
                        addScripts([ "get_Data_nav.js",  "LOG_OUT.js"]);
                    if (route === "/profile_user") 
                        addScripts(["get_data-profile_user.js", "get_Data_nav.js",  "LOG_OUT.js"]);
                    if (route === "/profile") 
                        addScripts(["get_data_history_matches.js", "get_data-profile.js", "get_Data_nav.js",  "LOG_OUT.js"]);
                    if (route === "/home") 
                        addScripts([ "get_data-profile_user.js","get_ranks.js", "get_data-profile.js", "get_Data_nav.js",  "LOG_OUT.js"]);
                    if (route === "/setting") 
                        addScripts(["choose_language.js","Edit_profile.js", "get_Data_nav.js",  "LOG_OUT.js"]);
                    if (route === "/home")
                        addScripts(["how_to_play.js", "get_Data_nav.js",  "LOG_OUT.js"]);
                    if (route === "/users") 
                        addScripts(["get_data.js", "get_Data_nav.js",  "LOG_OUT.js"]);
                    if (route === "/game") 
                        addScripts(["get_Data_nav.js",  "LOG_OUT.js"]);
                    if (route === "/chat") 
                        addScripts(["get_data-profile_user.js","chat.js", "get_Data_nav.js", "LOG_OUT.js"]);
                    if (route === "/game_local") 
                    {
                        const link = document.createElement("link");
                        document.querySelector('[href =  "game_remote.css"]')?.remove();
                        link.rel = "stylesheet";
                        link.href = "game_local.css";
                        document.head.appendChild(link);
                            addScripts(["score.js", "game_local.js", "get_Data_nav.js",  "LOG_OUT.js"]);
                    }
                    if (route === "/match_tournament") 
                    {
                        const link = document.createElement("link");
                        document.querySelector('[href =  "game_remote.css"]')?.remove();
                        link.rel = "stylesheet";
                        link.href = "game_local.css";
                        document.head.appendChild(link); 
                
                            addScripts(["score.js", "get_Data_nav.js",  "LOG_OUT.js"]);
            
                    }
                    if (route === "/tournament") 
                        addScripts(["tournament.js","create_match_tournament.js", "get_Data_nav.js",  "LOG_OUT.js"]);
                    if (route === "/matchmaking_game_remote") 
                        addScripts(["matchmaking.js", "get_Data_nav.js",  "LOG_OUT.js"]);
                    if (route === "/game_remote") 
                    {
                        document.querySelector('[href =  "game_local.css"]')?.remove();
                        const link = document.createElement("link");
                        link.rel = "stylesheet";
                        link.href = "game_remote.css";
                        document.head.appendChild(link);
                        addScripts(["game_remote.js", "get_Data_nav.js",  "LOG_OUT.js"]);
                    }
                })
                .catch(err => 
                {
                    document.getElementById('content22').innerHTML = '<h1>404 - Page Not Ffound</h1>';
                    document.body.querySelector(".navication").remove();
                });
        }
}

function loadPage_protection(route)
{
    fetch(`${BASE_URL}/user/token/`, 
    {
        method: 'GET',
        
        credentials: 'include',
         headers: {
                     'Accept': 'application/json',
                },
    })
    .then(response => {
        if (!response.ok) 
            route = "/inscreption";  
        fetch_content_page(route);
    })
    .catch(error => console.log("Error", error));  
}

function loadPage(route)
{
    fetch_content_page(route);
}

function setup_listners()
{
    document.querySelectorAll('a[data-route]').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const route = link.getAttribute('data-route');
        navigateTo(route);
    });
    });
};

setup_listners();

function addScript(scriptSrc) 
{
    const script = document.createElement('script');
    script.src = scriptSrc;
    script.defer = true;
    document.body.appendChild(script);
}

function addScripts(scripts) 
{
    scripts.forEach(src => addScript(src));

}

window.addEventListener('popstate', (event) => 
{
    const route = event.state?.page || '/inscreption';
    navigateTo(route);
});
