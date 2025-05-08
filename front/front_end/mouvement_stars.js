
var stars = document.getElementById("stars");
var count = 500;
function create_new_star() 
{
    var star = document.createElement('div');
    var stars = document.getElementById('stars');
    star.style.position = "absolute";
    star.style.pointerEvents = "none";
    stars.style.zIndex = "-2";
    star.style.zIndex = "-1";
    star.style.width = "1.5px"; 
    star.style.height = "1.5px";
    star.style.boxShadow = "0px  0px 3px 1px white"; 
    star.style.backgroundColor = "white"; 
    star.style.borderRadius = '50%'; 
    star.style.animationDuration = "10s";
    star.style.animationName = "movement_stars";
    star.style.animationTimingFunction = "ease-in";
    star.style.animationDelay = "1s";
    star.style.animationIterationCount = "infinite"; 
    star.style.animationDirection = "normal"; 
    star.style.left = `${Math.random() * 100}%`; 
    star.style.top = `${Math.random() * 100}%`; 
    stars.appendChild(star);
}

for (var i = 0; i < count; i++) 
{
    create_new_star();
}
