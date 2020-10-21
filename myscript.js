

//1 -> white, 2 -> black
var state = [
  [0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0],
  [0,0,0,1,2,0,0,0],
  [0,0,0,2,1,0,0,0],
  [0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0]
];


function display_menu(state){
  document.getElementById("c27").childNodes[0].style.backgroundColor = "black";
  document.getElementById("c28").childNodes[0].style.backgroundColor = "white";
  document.getElementById("c35").childNodes[0].style.backgroundColor = "white";
  document.getElementById("c36").childNodes[0].style.backgroundColor = "black";
  var user = document.getElementById("user").value;
  var pw = document.getElementById("pass").value;
    switch(state){
      case 1:
        document.getElementById("Login").style.display = "block";
        document.getElementById("Board").style.display = "none";
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
      default:  throw "State Error";break;
    }
  //else{
    document.getElementById("Login").style.display = "none";
    document.getElementById("Board").style.display = "block";
    document.getElementById("Rules").style.display = "none";
  //}
  return
}

function update_cell(){

}
