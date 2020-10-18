function display_menu(state){
  switch(state){
    case 1:
            document.getElementById("Login").style.display = "block";
            document.getElementById("buttons").style.display = "none";
            document.getElementById("Rules").style.display = "none";
            console.log("pp");
            break;
    case 2:
            document.getElementById("Login").style.display = "none";
            document.getElementById("Board").style.display = "block";
            document.getElementById("Rules").style.display = "none";
            console.log("pp1");
            break;
    case 3:
            document.getElementById("Login").style.display = "none";
            document.getElementById("Board").style.display = "none";
            document.getElementById("Rules").style.display = "block";
            console.log("pp2");
            break;
    default: throw "State Error";break;
  }
  return
}
