'use strict'
var length = 8;
// =1 -> player 1 |=2 -> player 2 |=3 -> end game signal from AI
var player = 1;
// 1= player1 -> black
var pcolor = 1;
//score 4each player
var piecesp1 = 2;
var piecesp2 = 2;

// 0=1VS1;1=Easy;2=Medium;3=Hard
var difficulty = 0;

// 1vs1=1 ; 1vsAI=2
var mode = 0;

//number of pieces for each direction(direction scores)
var NW,N,NE,CW,CE,SW,S,SE;
NW = N = NE = CW = CE = SW = S = SE = 0;

//Games Scores
var bscore,wscore;
//bscore = wscore = 0;

//1 -> white, 2 -> black
var state = [
  [0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0],
  [0,0,0,2,1,0,0,0],
  [0,0,0,1,2,0,0,0],
  [0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0]
];

//weights board. AI chooses position with highest (number_switched_pieces+weight)
var weight_board = [
  [120,-20,20, 5, 5,20,-20,120],
  [-20,-40,-5,-5,-5,-5,-40,-20],
  [20 ,-5 ,15, 3, 3,15,-5 , 20],
  [5  ,-5 , 3, 3, 3, 3, -5,  5],
  [5  ,-5 , 3, 3, 3, 3, -5,  5],
  [20 ,-5 ,15, 3, 3,15, -5, 20],
  [-20,-40,-5,-5,-5,-5,-40,-20],
  [120,-20,20, 5, 5,20,-20,120]
];

//*********************************website*************************************************************************//
//create board
function create_board(){
  console.log("herecb");
  const grid = document.getElementById("grid");

  for(var i = 0; i < length ; i++){
    const row = document.createElement("div");
    row.className = "row";

    for(var j = 0; j < length; j++){
      const cell = document.createElement("div");
      const disc = document.createElement("div");
      disc.className = "disc";
      cell.className = "cell";
      cell.setAttribute("id","c"+i+j);
      cell.setAttribute("onclick","update_cell("+i+","+j+");");
      row.appendChild(cell);
      cell.appendChild(disc);
    }
    grid.appendChild(row);
  }
  document.getElementById("c33").childNodes[0].style.backgroundColor = "white";
  document.getElementById("c34").childNodes[0].style.backgroundColor = "black";
  document.getElementById("c43").childNodes[0].style.backgroundColor = "black";
  document.getElementById("c44").childNodes[0].style.backgroundColor = "white";
}

//load board
window.onload = function() {create_board();}

//play history vs AI
function play_history(){
  if(!(localStorage.BScore) && !(localStorage.WScore)){
    localStorage.BScore = 0;
    localStorage.WScore = 0;
    bscore = 0;
    wscore = 0;
  }
  else{
    bscore = Number(localStorage.BScore);
    wscore = Number(localStorage.WScore);
  }
  document.getElementById("BScore").innerHTML = localStorage.BScore;
  document.getElementById("WScore").innerHTML = localStorage.WScore;
}

//restart game
function reset_board(){
  state = [
    [0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0],
    [0,0,0,2,1,0,0,0],
    [0,0,0,1,2,0,0,0],
    [0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0]
  ];
  for(var i = 0; i < length ; i++){
    for(var j = 0; j < length; j++){
      document.getElementById("c"+i+j).childNodes[0].style.backgroundColor = "transparent";
    }
  }
  reset_coords();
  document.getElementById("c33").childNodes[0].style.backgroundColor = "white";
  document.getElementById("c34").childNodes[0].style.backgroundColor = "black";
  document.getElementById("c43").childNodes[0].style.backgroundColor = "black";
  document.getElementById("c44").childNodes[0].style.backgroundColor = "white";
  piecesp1 = piecesp2 = 2;

  document.getElementById("blackscr").innerHTML = "Black: "+piecesp1;
  document.getElementById("whitescr").innerHTML = "White: "+piecesp2;
  document.getElementById("Turn").innerHTML = "Black Turn";
  player = 1;
  //when restarted check who plays first
  if(pcolor == 2 && difficulty > 0) update_cellAIGAME();
}

//if play

async function forfeit(){
  if(difficulty == 0){ //if online 1vs1
    await leave();
    reset_board();
    document.getElementById("Restartbtn").style.display = "none";
    document.getElementById("Forfeitbtn").style.display = "none";
    document.getElementById("PlayAgainbtn").style.display = "block";
  }
  else{
    if(player === 1){ //player 1 forfeited
      wscore+=1;
      localStorage.WScore = Number(localStorage.WScore)+1;
    }
    else{ //player 2 forfeited
      bscore += 1;
      localStorage.BScore = Number(localStorage.BScore)+1;
    }
    document.getElementById("BScore").innerHTML = localStorage.BScore;
    document.getElementById("WScore").innerHTML = localStorage.WScore
  }
}

//reset game
function reset(){
  reset_board();
  if(difficulty == 0){
    leave();
    join();
    display_message(7);
  }
}

//logout reseter
function logout(){
  reset_board();
  difficulty = mode = 0; pcolor = 1;
  document.getElementById("BScore").innerHTML = localStorage.BScore;
  document.getElementById("WScore").innerHTML = localStorage.WScore;
  document.getElementById("Restartbtn").style.display = "inline";
  document.getElementById("Forfeitbtn").style.display = "inline";
  document.getElementById("PlayAgainbtn").style.display = "none";
}

//move between menus
function display_menu(c){
  console.log("here");
  switch(c){
    case 1: //login
      document.getElementById("Login").style.display = "block";
      document.getElementById("Mode").style.display = "none";
      document.getElementById("Board").style.display = "none";
      document.getElementById("logotipo").style.height = 197+"px";
      document.getElementById("logo").style.height = 201+"px";
      document.getElementById("Difficulty").style.display = "none";
      document.getElementById("DisColor").style.display = "none";
      document.getElementById("Rules").style.display = "none";
      //console.log("pp");
      break;
    case 2: //select 1vs1 or 1vsPC
      document.getElementById("Login").style.display = "none";
      document.getElementById("Mode").style.display = "block";
      document.getElementById("Board").style.display = "none";
      document.getElementById("logotipo").style.height = 197+"px";
      document.getElementById("logo").style.height = 201+"px";
      document.getElementById("Difficulty").style.display = "none";
      document.getElementById("DisColor").style.display = "none";
      document.getElementById("Rules").style.display = "none";
      //console.log("pp1");
      break;
    case 3: //game with board
      document.getElementById("Login").style.display = "none";
      document.getElementById("Mode").style.display = "none";
      document.getElementById("Board").style.display = "block";
      document.getElementById("logo").style.height = 100+"px";
      document.getElementById("logotipo").style.height = 100+"px";
      document.getElementById("Difficulty").style.display = "none";
      document.getElementById("DisColor").style.display = "none";
      document.getElementById("Rules").style.display = "none";
      //console.log("pp2");
      break;
    case 4: //choose difficulty if 1vsAI
      document.getElementById("Login").style.display = "none";
      document.getElementById("Mode").style.display = "none";
      document.getElementById("Board").style.display = "none";
      document.getElementById("logotipo").style.height = 197+"px";
      document.getElementById("logo").style.height = 201+"px";
      document.getElementById("Difficulty").style.display = "block";
      document.getElementById("DisColor").style.display = "none";
      document.getElementById("Rules").style.display = "none";
      break;
    case 5: //choose disc color for player 1
      document.getElementById("Login").style.display = "none";
      document.getElementById("Mode").style.display = "none";
      document.getElementById("Board").style.display = "none";
      document.getElementById("logotipo").style.height = 197+"px";
      document.getElementById("logo").style.height = 201+"px";
      document.getElementById("Difficulty").style.display = "none";
      document.getElementById("DisColor").style.display = "block";
      document.getElementById("Rules").style.display = "none";
      break;
    case 6: //logout
      document.getElementById("Login").style.display = "block";
      document.getElementById("Mode").style.display = "none";
      document.getElementById("Board").style.display = "none";
      document.getElementById("logotipo").style.height = 197+"px";
      document.getElementById("logo").style.height = 201+"px";
      document.getElementById("Difficulty").style.display = "none";
      document.getElementById("DisColor").style.display = "none";
      document.getElementById("Rules").style.display = "none";
      logout();
      break;
    default: console.log("Error state");break;
  }
}

//select player's color
function player_color(i){
  switch (i) {
    case 1:
      pcolor = 1;
      break;
    case 2:
      pcolor = 2;
      if(difficulty > 0) update_cellAIGAME();
      break;
    default: console.log("Color ERROR");
  }
}

//select difficulty if against AI
function difficulty_select(number){
  switch(number){
    case 1: difficulty = 1; break;
    case 2: difficulty = 2; break;
    case 3: difficulty = 3; break;
    default: console.log("difficulty not found");
  }
  display_menu(3);
}

//close message box || pop up menu
function close_message(id){
  switch (id) {
    case 1:
      document.getElementById("gameMessages").style.display = "none";
      document.getElementById("bg-modal").style.display = "none";
      break;
    case 2:
      document.getElementById("bg-modal").style.display = "none";
      document.getElementById("Rules").style.display = "none";
      break;
    case 3:
      document.getElementById("bg-modal").style.display = "none";
      document.getElementById("Scores").style.display = "none";
      break;
    default: window.alert("Message error");
  }
}

//open message box || pop up menu
function display_message(id){
  switch (id) {
    case 1:
      document.getElementById("say").innerHTML = "Placement not possible";
      document.getElementById("bg-modal").style.display = "flex";
      document.getElementById("gameMessages").style.display = "block";
      break;
    case 2:
      document.getElementById("say").innerHTML = "Pass";
      document.getElementById("bg-modal").style.display = "flex";
      document.getElementById("gameMessages").style.display = "block";
      break;
    case 3:
      document.getElementById("bg-modal").style.display = "flex";
      document.getElementById("Rules").style.display = "block";
      break;
    case 4:
      document.getElementById("bg-modal").style.display = "flex";
      document.getElementById("Scores").style.display = "block";
      if(difficulty == 0){
        document.getElementById("ScoreAI").style.display = 'none';
        document.getElementById("Scores").style.height = 450+"px";
        document.getElementById("table").style.display = 'block';
      }
      else{
        document.getElementById("ScoreAI").style.display = 'block';
        document.getElementById("Scores").style.height = 150 +"px";
        document.getElementById("table").style.display = 'none';
      }
      break;
    case 5:
      document.getElementById("say").innerHTML = "Wait for your turn";
      document.getElementById("bg-modal").style.display = "flex";
      document.getElementById("gameMessages").style.display = "block";
      break;
    case 6:
      document.getElementById("say").innerHTML = "Opponent disconnected.You won!\n";
      document.getElementById("bg-modal").style.display = "flex";
      document.getElementById("gameMessages").style.display = "block";
      break;
    case 7:
      document.getElementById("say").innerHTML = "Game restarted.Waiting for player\n";
      document.getElementById("bg-modal").style.display = "flex";
      document.getElementById("gameMessages").style.display = "block";
      break;
    case 8:
      document.getElementById("say").innerHTML = "Connected. Your turn is Black";
      document.getElementById("bg-modal").style.display = "flex";
      document.getElementById("gameMessages").style.display = "block";
      break;
    case 9:
      document.getElementById("say").innerHTML = "Connected. Your turn is White";
      document.getElementById("bg-modal").style.display = "flex";
      document.getElementById("gameMessages").style.display = "block";
      break;
    case 10:
      document.getElementById("say").innerHTML = "Opponent Passed";
      document.getElementById("bg-modal").style.display = "flex";
      document.getElementById("gameMessages").style.display = "block";
      break;
    case 11:
      document.getElementById("say").innerHTML = "Timed out";
      document.getElementById("bg-modal").style.display = "flex";
      document.getElementById("gameMessages").style.display = "block";
      break;
    default: window.alert("Message error");
  }
}

//update scores for games played
function update_SCORES(){
  if(piecesp1 > piecesp2){
    localStorage.BScore = Number(localStorage.BScore) + 1;
    bscore += 1;
  }
  else if(piecesp1 < piecesp2){
    localStorage.WScore = Number(localStorage.WScore) + 1;
    document.get
    wscore += 1;
  }
}

//when game ends play again
function play_again(){
  reset_board();
  document.getElementById("Restartbtn").style.display = "inline";
  document.getElementById("Forfeitbtn").style.display = "inline";
  document.getElementById("PlayAgainbtn").style.display = "none";
  if(difficulty === 0) join();
}


//********************************************************************************************************************//

//************************************************************GAME****************************************************//

//get discs that change if disc is placed at cell (cx,cy)
function discstoFlip(cx,cy){
  var count = 0;
  var posx;
  var posy;
  for(var x = -1; x <= 1; x++){
    for(var y = -1; y <= 1; y++){
      for(var npieces = 1 ;; npieces++){
        posx = cx + (npieces*x);
        posy = cy + (npieces*y);
        if(posx < 0 || posx > 7 || posy < 0 || posy > 7 || npieces > 7 || (posx === cx && posy === cy))break;
        if(state[posx][posy] === 0)break;
        if(state[posx][posy] === player ){
          if(x == -1 && y == -1) NW = npieces-1;
          if(x == -1 && y ==  0) N  = npieces-1;
          if(x == -1 && y ==  1) NE = npieces-1;
          if(x ==  0 && y == -1) CW = npieces-1;
          if(x ==  0 && y ==  1) CE = npieces-1;
          if(x ==  1 && y == -1) SW = npieces-1;
          if(x ==  1 && y ==  0) S  = npieces-1;
          if(x ==  1 && y ==  1) SE = npieces-1;
          count += npieces - 1;
          break;
        }
      }
    }
  }
  return count;
}

//get only number of discs that change(not switch the direction scores)
function discstoFlipAI(cx,cy){
  var count = 0;
  var posx;
  var posy;
  for(var x = -1; x <= 1; x++){
    for(var y = -1; y <= 1; y++){
      for(var npieces = 1 ;; npieces++){
        posx = cx + (npieces*x);
        posy = cy + (npieces*y);
        if(posx < 0 || posx > 7 || posy < 0 || posy > 7 || npieces > 7 || (posx === cx && posy === cy))break;
        if(state[posx][posy] === 0)break;
        if(state[posx][posy] === player ){
          count += npieces - 1;
          break;
        }
      }
    }
  }
  return count;
}

//flip rivals' discs between ones from other player
function flip_discs(cx,cy){
  for(var i = 1; i<=length-1;i++){
    if(NW >= i){
      state[cx-i][cy-i] = player;
      change_color((cx-i),(cy-i));
      //console.log("to flip->cx:"+(cx-i)+"; cy"+(cy-i));
    }
    if(N >= i){
      state[cx-i][cy] = player;
      change_color((cx-i),cy);
      //console.log("to flip->cx:"+(cx-i)+"; cy"+(cy));
    }
    if(NE >= i){
      state[cx-i][cy+i] = player;
      change_color((cx-i),(cy+i));
      //console.log("to flip->cx:"+(cx-i)+"; cy"+(cy+i));
    }
    if(CW >= i){
      state[cx][cy-i] = player;
      change_color((cx),(cy-i));
      //console.log("to flip->cx:"+(cx)+"; cy"+(cy-i));
    }
    if(CE >= i){
      state[cx][cy+i] = player;
      change_color((cx),(cy+i));
      //console.log("to flip->cx:"+(cx)+"; cy"+(cy+i));
    }
    if(SW >= i){
      state[cx+i][cy-i] = player;
      change_color((cx+i),(cy-i));
      //console.log("to flip->cx:"+(cx+i)+"; cy"+(cy-i));
    }
    if(S >= i){
      state[cx+i][cy] = player;
      change_color((cx+i),(cy));
      //console.log("to flip->cx:"+(cx+i)+"; cy"+(cy));
    }
    if(SE >= i){
      state[cx+i][cy+i] = player;
      change_color((cx+i),(cy+i));
      //console.log("to flip->cx:"+(cx+i)+"; cy"+(cy+i));
    }
  }
}

//get rand coords for AI_1
function randnum(){return Math.floor(Math.random() * 8);}

//reset coordinates for each direction
function reset_coords(){ NW = N = NE = CW = CE = SW = S = SE = 0;}

//change player
function change_player(){
  if(player === 1) player = 2;
  else player = 1;
}

//print player to play
function print_turn(){
  if(player === 2) document.getElementById("Turn").innerHTML = "White Turn";
  else document.getElementById("Turn").innerHTML = "Black Turn";
}

//update html score
function update_scores(){
  document.getElementById("blackscr").innerHTML = "Black: "+piecesp1;
  document.getElementById("whitescr").innerHTML = "White: "+piecesp2;
}

//update number of pieces 4each player
function update_pieces(){
  if(player === 1){
    piecesp1 += NW+N+NE+CW+CE+SW+S+SE+1;
    piecesp2 -= NW+N+NE+CW+CE+SW+S+SE;
  }
  else{
    piecesp1 -= NW+N+NE+CW+CE+SW+S+SE;
    piecesp2 += NW+N+NE+CW+CE+SW+S+SE+1;
  }
}

//identify winner
function winner_select(){
  if(piecesp1 > piecesp2) document.getElementById("Turn").innerHTML = "Game Ended. Black Won";
  else if(piecesp1 < piecesp2) document.getElementById("Turn").innerHTML = "Game Ended. White Won";
  else document.getElementById("Turn").innerHTML = "Game Ended. Draw";
  document.getElementById("Restartbtn").style.display = "none";
  document.getElementById("Forfeitbtn").style.display = "none";
  document.getElementById("PlayAgainbtn").style.display = "block";
  update_SCORES();
}

//check if there is atleast one adjacent rival discs
function adjacent_is_different(cx,cy){
  if( ((cx-1 >= 0) && (cy-1 >= 0) && state[cx-1][cy-1]                !== player) ||
      ((cx-1 >= 0) && state[cx-1][cy]                                 !== player) ||
      ((cx-1 >= 0) && (cy-1 <= length-1) && state[cx-1][cy+1]         !== player) ||
      ((cy-1 >= 0) && state[cx][cy-1]                                 !== player) ||
      ((cy+1 <= length-1) && state[cx][cy+1]                          !== player) ||
      ((cx+1 <= length-1) && (cy-1 >= 0) && state[cx+1][cy-1]         !== player) ||
      ((cx+1 <= length-1) && state[cx+1][cy]                          !== player) ||
      ((cx+1 <= length-1) && (cy+1 <= length-1) && state[cx+1][cy+1]  !== player)
    ) return true;
  return false;
}

//verify if has move for that piece
function has_moves(cx,cy){
  var flag = 0;
  if(adjacent_is_different(cx,cy)){
    for(var x = -1;x<=1;x++){
      for(var y = -1; y<=1;y++){
        for(var moves = 1;;moves++){
          var posx= cx +(moves*x);
          var posy= cy +(moves*y);
          //console.log("pos inside has moves-> posx:"+posx+",posy:"+posy);
          //out of bounds
          if(posx <0 || posx > (length-1) || posy <0 || posy > (length-1) || (cx === posx && cy === posy) || moves > 7){flag = 0; break;}
          //finds empty piece in which a piece can be placed and rivals' pieces flip
          if(state[posx][posy] === 0 && flag === 0) break;
          else if(state[posx][posy] === 0 && flag === 1){/*console.log("possible cuz x:"+posx+",y:"+posy);*/ return true;}
          //already has piece there(from player playing)
          else if(state[posx][posy] === player  && flag === 1) flag = 0;
          //has rival's piece in surrounding square
          else if(state[posx][posy] != player && state[posx][posy] !== 0) flag = 1;
        }
      }
    }
  }
  return false;
}

//check if a player has plays
function has_plays_left(){
  var ndiscs = 0;
  for(var x = 0; x < length;x++){
    for(var y = 0;y < length;y++){
      if(state[x][y] === player){
        if(has_moves(x,y)){
          return true;
         }
        reset_coords();
      }
    }
  }
  return false;
}

//change color
function change_color(cx,cy){
  if(player === 1) document.getElementById('c'+cx+cy).childNodes[0].style.backgroundColor = "black";
  else if(player === 2) document.getElementById('c'+cx+cy).childNodes[0].style.backgroundColor = "white";
  else console.log("Player Not found.");
}

//register if click is acceptable and update it
function update_cell(cx,cy){
  if(difficulty > 0){
    var next = 1;
    var count = discstoFlip(cx,cy);
    if(count>=1 && state[cx][cy] === 0){
      change_color(cx,cy);
      state[cx][cy] = player;
      flip_discs(cx,cy);
      update_pieces();
      change_player();
      update_scores();
      reset_coords();

      if(!has_plays_left()){    //bot has no plays
        change_player();
        if(!has_plays_left()){  //game ended
          winner_select();
          return
        }
        display_message(2);
        next=0;
      }
      else next = 1; //AI plays

      //is AI playing
      if(difficulty !== 0 && next !== 0){
        update_cellAIGAME();
        if(player === 3){ //flag meaning ai checked there was no plays left for both
          player = 1;
          winner_select();
          return;
        }
      }
    }
    else{ //placement not possible
      display_message(1);
      return;
    }
    print_turn();
    reset_coords();
  }
  else notify(cx,cy);
}

/*****************************************************************************************/
/***********************************AI*****************************************************/
//make AI play
function update_cellAIGAME(){
  select_AI();
  reset_coords();
  if(!has_plays_left()){
    change_player();
    //if both cant play return
    if(!has_plays_left()){player=3; return;}
    display_message(2);
    print_turn();
    update_cellAIGAME();
    return;
  }
}

function select_AI(){
  switch (difficulty) {
    case 1:
      var values = AI_1();
      break;
    case 2:
      var values = AI_2();
      break;
    case 3:
      var values = AI_3();
      break;
    default: console.log("Difficulty not found");
  }
  change_color(values[0],values[1]);
  state[values[0]][values[1]] = player;
  flip_discs(values[0],values[1]);
  update_pieces();
  update_scores();
  change_player();
}

//choose random
function AI_1(){
  var cx = randnum();
  var cy = randnum();
  var count = discstoFlip(cx,cy);
  while(!(count>=1 && state[cx][cy] === 0)){
    reset_coords();
    cx = randnum();
    cy = randnum();
    count = discstoFlip(cx,cy);
  }
  return [cx,cy];
}

//get piece that flips most number of pieces
function AI_2(){
  var max,posx,posy;
  max = posx = posy = 0;
  var count = 0;
  for(var x = 0; x<length;x++){
    for(var y = 0; y<length;y++){
      if(state[x][y] === 0){
        count = discstoFlipAI(x,y);
        if(count >=1 && count > max){
          reset_coords();
          count = discstoFlip(x,y);
          posx = x;
          posy = y;
          max = count;
        }
      }
    }
  }
  return [posx,posy];
}

//select piece with biggest weight(weight_board[x][y] + npieces_that_flip)
function AI_3(){
  var max,posx,posy;
  posx = posy = 0;
  max = -40;
  var count = -40;
  for(var x = 0; x<length;x++){
    for(var y = 0; y<length;y++){
      if(state[x][y] === 0){
        count = discstoFlipAI(x,y);
        if(count >= 1){
          count += weight_board[x][y];
          if(count > max){
          reset_coords();
          discstoFlip(x,y);
          posx = x;
          posy = y,
          max = count;
          }
        }
      }
    }
  }
  return [posx,posy];
}
