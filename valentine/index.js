var butsize = 20;
var maxSize = document.querySelector("body").offsetHeight * 0.8;
console.log(maxSize);
function yes(){
    document.querySelector("h1").innerHTML = "I knew you would say yes <br> ❤️❤️❤️❤️";
    document.querySelector(".ans").innerHTML = "";
    document.getElementById("image").src = "hug.gif";
    document.querySelector("body").innerHTML+= `<div class="cracker"><img src="cracker.gif" alt=""></div>`;
}

function no(){
    var e = document.getElementById("yes") ;
    if(e.offsetHeight < maxSize)
    {
        e.style.width = (e.offsetWidth*2) + "px";
        e.style.height = (e.offsetHeight*2) + "px";
        butsize = butsize *2;
        e.style.fontSize = butsize + "px";
    }
    else
    {
        e.style.width = (e.offsetWidth*2) + "px";
    }   
}