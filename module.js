'use strict'
const stream = require('stream');
const fs = require('fs');
const crypto = require('crypto');
const http = require('http');
const url = require('url');
const index = require('./index.js');
const update = require('./updater.js');
var users = [];
var gamehash;
var lobbies = [];
var turn;
let responses = [];
var mediaTypes = {
    'txt':      'text/plain',
    'html':     'text/html',
    'css':      'text/css',
    'js':       'application/javascript',
    'json':     'application/json',
    'png':      'image/png',
}

function addAccount(users,nick,pass){ // add account to json file with all registers
  let newacc;
  newacc = {"nick": nick, "pass": pass, "victories": 0, "games": 0};
  users.accounts.push(newacc);
  fs.writeFile('./accounts.json',JSON.stringify(users),(err) => {
    if(err) console.error(err);
  })
}

function getRoom(gameId){
  let room;
  lobbies.forEach(game => {
    if(game.hash == gameId){ room = game; return; }
  })
  return room;
}

function createLobby(){
  let d = new Date();
  let time = d.getTime();
  let value = JSON.stringify(time);
  gamehash = crypto.createHash('md5').update(value).digest('hex');
  var game = new Game(gamehash);
  return game;
}

class Game{
  constructor(hash){
    this.game = hash;
    this.board = [
      [0,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0],
      [0,0,0,2,1,0,0,0],
      [0,0,0,1,2,0,0,0],
      [0,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0]
    ];
    this.p1 = "";
    this.p2 = "";
    this.status = 0; //if game already started or not (0 => didn't start,1 => started)
    this.dark = 2;
    this.light = 2;
    this.empty = 60;
  }

  get hash(){ //return game hash
    return this.game;
  }

  get player1(){ //return player1's name
    return this.p1;
  }

  get player2(){ //return player1's name
    return this.p2;
  }

  get Board(){
    return this.board;
  }
  get Status(){
    return this.status;
  }

  get Count(){
    this.dark = 0;
    this.empty = 64;
    this.light = 0;
    for(let i = 0; i<8;i++){
      for(let j = 0; j<8;j++){
        if(this.board[i][j] == 1) this.dark +=1;
        else if(this.board[i][j] == 2) this.light += 1;
      }
    }
    this.empty -= (this.dark+this.light);
    let json = {
      dark: this.dark,
      empty: this.empty,
      light: this.light
    }
    return json;
  }

  get winner(){
    if(this.dark > this.light) return this.p1;
    else if(this.light > this.dark) return this.p2;
    return null;
  }

  changeStatus(n){
    this.status = n;
  }

  addPlayer(name){
    if(this.p1 == ""){
      this.p1 = name;
      turn = name;
    }
    else this.p2 = name;
  }

  removePlayer(name){
    if(this.p1 == name) this.p1 = "";
    else this.p2 = "";
  }
}


module.exports.GetRequest = (pathname,request,response) => {
  switch(pathname){
    case '/update':
      console.log("SSE established:")
      response.writeHead(200,index.headers.sse);
      request.on('close', () => update.forget(response));
      update.remember(response);
      Update();
      break;
    default:
      if(pathname === '/'){
        pathname = 'index.html';
      }
      response.setHeader('Content-Type', getTypes(pathname));
      fs.readFile('./' + pathname, function(err, data){
        if(err){
          response.writeHead(404);
          response.end('404 - File Not Found');
        }
        else{
          response.writeHead(200);
          response.end(data);
        }
      });
      break;
  }
}

function getTypes(pathname){
    let typeContent= 'application/octet-stream';//check for error

    let type = mediaTypes; //get types
    for(let key in type){
        if(type.hasOwnProperty(key)){
            if(pathname.indexOf(key) > -1)
                typeContent= type[key];
        }
    }
    return typeContent;
}

module.exports.PostRequest = (pathname,request,response,query) => {
  switch(pathname){
    case '/register':
      register(query.nick,query.pass,response);
      break;
    case '/ranking':
      ranking(response);
      break;
    case '/join':
      join(query.group,query.nick,query.pass,response);
      break;
    case '/leave':
      leave(query.nick,query.pass,query.game,response);
      break;
    case '/notify':
      notify(query.nick,query.pass,query.game,query.move,response);
      break;
    default:
     response.writeHead(404, index.headers.plain);
     response.write('Command not found');
     response.end();
     break;
  }
}


function register(nick,pass,response){
  if(nick === null || pass === null){
    response.writeHead(400, index.headers.plain);
    response.write('{}');
    response.end();
  }
  const hashpass = crypto.createHash('md5').update(pass).digest('hex');
  if(fs.existsSync('./accounts.json') == false){ //if file doesnt exist
    fs.writeFileSync('./accounts.json',JSON.stringify({"accounts":[]}));
  }
  fs.readFile('accounts.json','utf8',(err,data) =>{
    if(!err){
      users = JSON.parse(data.toString());
      //console.log(users);
      for(var i = 0;i<users.accounts.length;i++){
        if(nick === users.accounts[i].nick){
          if(hashpass === users.accounts[i].pass){ //user found and correct password
            response.writeHead(200,index.headers.plain);
            response.write('{}');
            response.end();
            return;
          }
          else { // wrong password
            response.writeHead(401,index.headers.plain);
            response.write('{ "error": "User registered with a different password" }');
            response.end();
            return;
          }
        }
      }
      addAccount(users,nick,hashpass);
      //console.log(users);
      response.writeHead(200,index.headers.plain);
      response.write('{}');
      response.end();
    }
  });
}

function join(group,nick,pass,response){
  if(group === null || nick === null || pass === null){
    response.writeHead(400, index.headers.plain);
    response.write('{}');
    response.end();
    return;
  }
  let json;
  if(lobbies.length == 0){ //no games? => create game
    var lobby = createLobby();
    lobby.addPlayer(nick);
    lobbies.push(lobby);
    json = {
      game: gamehash,
      color: "dark"
    }
  }
  else{ // already player in queue
    lobbies.forEach( lobby => {
      if(lobby.player1 != "" && lobby.player2 == ""){ //someone is in queue waiting for other player
        lobby.addPlayer(nick);
        gamehash = lobby.hash;
        return;
      }
    })
    json = {
      game: gamehash,
      color: "light"
    }
  }
  response.writeHead(200,index.headers.plain);
  response.write(JSON.stringify(json));
  response.end();
}

function notify(nick,pass,game,move,response){
  if(nick === null || pass === null || game === null ||
    nick === void(0) || pass === void(0) || game === void(0)){
    response.writeHead(400, index.headers.plain);
    response.write('{}');
    response.end();
    return;
  }
  let room = getRoom(game);
  if(room.Status == 0 || lobbies.length == 0) return; //if game ended don't process clicks on board
  if(nick != turn){ // missclick by player
    response.writeHead(401, index.headers.plain);
    let json = { error: "Not your turn to play" };
    response.write(JSON.stringify(json));
    response.end();
    return;
  }
  else if(move != null){ //analise move
    let player = (turn == room.player1 ? 1 : 2);
    console.log(player);
    let board = room.Board;
    let count = discstoFlip(move.row,move.column,board,player);
    if(count >=1 && board[move.row][move.column] == 0){//process move
      board[move.row][move.column] = player;
      flip_discs(move.row,move.column,board,player);
      response.writeHead(200,index.headers.plain);
      response.write('{}');
      response.end();
      Update();
      changeTurn(room);
      return;
    }
    else if(move == null){ //user doesnt have move possible
      response.writeHead(200,index.headers.plain);
      response.write('{}');
      response.end();
      return;
    }
    else{ //move not possible => deny move
      response.writeHead(401, index.headers.plain);
      let json = { error: "Nenhuma peça alterada" };
      response.write(JSON.stringify(json));
      response.end();
      return;
    }
  }
}

function Update(){
  var room = getRoom(gamehash);
  if(room.Status === 0 ){
    if(room.player1 != "" && room.player2 != ""){ // all players connect => start game
    room.changeStatus(1);
    let json = {
      board: processboard(room.Board),
      count: room.Count,
      turn: turn
    }
    update.sendResponse(JSON.stringify(json));
    }
  }
  else if(room.Status === 1){ // game started
    if((room.player1 == "" && room.player2 != "") || (room.player2 == "" && room.player1 != "")){ //user disconnected and game ended
      if(room.player1 == "") processWin(room.player2,room.player1);
      else processWin(room.player1,room.player2);
      let answer = checkDisconnect(room);
      update.sendResponse(JSON.stringify(answer));
      lobbies.splice(0,1);
      return;
    }
    let json = processJson(room);
    update.sendResponse(JSON.stringify(json));

    if(json.winner){ //if game ended close all connections and remove lobby
      if(room.player1 == json.winner) processWin(room.player1,room.player2);
      else processWin(room.player2,room.player1);
      lobbies.splice(0,1);
    }
  }
}

function leave(leaver,pass,game,response){
  if(game === null || leaver === null || pass === null ||
    game === void(0) || leaver === void(0) || pass === void(0)){
    response.writeHead(400, index.headers.plain);
    response.write('{}');
    response.end();
    return;
  }
  //disconnect both players from game and delete lobby
  let lobby = getRoom(game);
  if(lobby){
    lobby.removePlayer(leaver);
    Update();
  }
  response.writeHead(200,index.headers.plain);
  response.write('{}');
  response.end();
}

function ranking(response){
  let rank = [];
  for(let i = 0; i < users.accounts.length;i++){
    if(i === 10) break //top10
    let tempusr = {
      nick: users.accounts[i].nick,
      victories: users.accounts[i].victories,
      games: users.accounts[i].games
    }
    rank.push(tempusr);
  }
  rank.sort((a,b) => {return b.victories-a.victories}); //b>=a => return >-1 : b takes precedence
  response.writeHead(200,index.headers.plain);
  let json = { ranking: rank }
  response.write(JSON.stringify(json));
  response.end();
}
///////////////////////////////////////////////////game server////////////////////////////////////////////////////
//changeTurn
function changeTurn(room){
  if(turn == room.player1)  turn = room.player2;
  else turn = room.player1;
}

//process win
function processWin(winner,loser){
  users.accounts.forEach( user => {
    if(user.nick == winner){
      user.victories += 1;
      user.games += 1;
    }
    else if(user.nick == loser) user.games += 1;
  })
  fs.writeFileSync('accounts.json',JSON.stringify(users), err =>{
    if(err) console.log("error");
  })
}

//check if player disconnected after game started
function checkDisconnect(room){
  if(room.Status === 1){ //game already started
    if(room.player1 != "" && room.player2 == ""){
      let json = { winner: room.player1 }
      return json;
    }
    else if(room.player1 == "" && room.player2 != ""){
      let json = { winner: room.player2 }
      return json;
    }
  }
  return null;
}

function processboard(board){
  let newboard = [
    ["","","","","","","",""],
    ["","","","","","","",""],
    ["","","","","","","",""],
    ["","","","","","","",""],
    ["","","","","","","",""],
    ["","","","","","","",""],
    ["","","","","","","",""],
    ["","","","","","","",""]
  ];
  for(let i = 0; i<=7;i++){
    for(let j = 0; j<=7; j++){
      if(board[i][j] === 0) newboard[i][j] = "empty";
      else if(board[i][j] === 1) newboard[i][j] = 'dark';
      else newboard[i][j] = 'light';
    }
  }
  return newboard;
}


function adjacent_is_different(cx,cy,board,player){
  if( ((cx-1 >= 0) && (cy-1 >= 0) && board[cx-1][cy-1]                !== player) ||
      ((cx-1 >= 0) && board[cx-1][cy]                                 !== player) ||
      ((cx-1 >= 0) && (cy-1 <= 8-1) && board[cx-1][cy+1]         !== player) ||
      ((cy-1 >= 0) && board[cx][cy-1]                                 !== player) ||
      ((cy+1 <= 8-1) && board[cx][cy+1]                          !== player) ||
      ((cx+1 <= 8-1) && (cy-1 >= 0) && board[cx+1][cy-1]         !== player) ||
      ((cx+1 <= 8-1) && board[cx+1][cy]                          !== player) ||
      ((cx+1 <= 8-1) && (cy+1 <= 8-1) && board[cx+1][cy+1]  !== player)
    ) return true;
  return false;
}

//number of pieces for each direction(direction scores)
var NW,N,NE,CW,CE,SW,S,SE;
NW = N = NE = CW = CE = SW = S = SE = 0;

//get discs that change if disc is placed at cell (cx,cy)
function discstoFlip(cx,cy,board,player){
  let count = 0;
  let posx;
  let posy;
  for(var x = -1; x <= 1; x++){
    for(var y = -1; y <= 1; y++){
      for(var npieces = 1 ;; npieces++){
        posx = cx + (npieces*x);
        posy = cy + (npieces*y);
        if(posx < 0 || posx > 7 || posy < 0 || posy > 7 || npieces > 7 || (posx === cx && posy === cy))break;
        if(board[posx][posy] === 0)break;
        if(board[posx][posy] === player ){
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

function flip_discs(cx,cy,board,player){
  for(let i = 1; i<8;i++){
    if(NW >= i){
      board[cx-i][cy-i] = player;
    }
    if(N >= i){
      board[cx-i][cy] = player;
    }
    if(NE >= i){
      board[cx-i][cy+i] = player;
    }
    if(CW >= i){
      board[cx][cy-i] = player;
    }
    if(CE >= i){
      board[cx][cy+i] = player;
    }
    if(SW >= i){
      board[cx+i][cy-i] = player;
    }
    if(S >= i){
      board[cx+i][cy] = player;
    }
    if(SE >= i){
      board[cx+i][cy+i] = player;
    }
  }
  NW = N = NE = CW = CE = SW = S = SE = 0;
}

//verify if has move for that piece
function has_moves(cx,cy,board,player){
  var flag = 0;
  if(adjacent_is_different(cx,cy,board,player)){
    for(var x = -1;x<=1;x++){
      for(var y = -1; y<=1;y++){
        for(var moves = 1;;moves++){
          var posx= cx +(moves*x);
          var posy= cy +(moves*y);
          //console.log("pos inside has moves-> posx:"+posx+",posy:"+posy);
          //out of bounds
          if(posx <0 || posx > (8-1) || posy <0 || posy > (8-1) || (cx === posx && cy === posy) || moves > 7){flag = 0; break;}
          //finds empty piece in which a piece can be placed and rivals' pieces flip
          if(board[posx][posy] === 0 && flag === 0) break;
          else if(board[posx][posy] === 0 && flag === 1){/*console.log("possible cuz x:"+posx+",y:"+posy);*/ return true;}
          //already has piece there(from player playing)
          else if(board[posx][posy] === player  && flag === 1) flag = 0;
          //has rival's piece in surrounding square
          else if(board[posx][posy] != player && board[posx][posy] !== 0) flag = 1;
        }
      }
    }
  }
  return false;
}

//check if a player has plays
function has_plays_left(board,player){
  var ndiscs = 0;
  for(var x = 0; x <= 7;x++){
    for(var y = 0;y <= 7;y++){
      if(board[x][y] === player){
        if(has_moves(x,y,board,player)){
          return true;
         }
        NW = N = NE = CW = CE = SW = S = SE = 0;
      }
    }
  }
  return false;
}

//process json for next player to play(turn is only changed after update)
function processJson(room){
  let newboard = processboard(room.Board);
  if( turn == room.player1 ){ //last player playing was player 1?
    if(has_plays_left(room.Board,2)){ //next player to play has play possible
      let json = {
        board: newboard,
        count: room.Count,
        turn: room.player2
      }
      return json;
    }
    else{
      if(!has_plays_left(room.Board,1)){ //no player has plays possible(game ended)
        let json = {
          winner: room.winner,
          board: newboard,
          count: room.Count,
        }
        return json;
      }
      else{
        let json = {
          board: newboard,
          count: room.Count,
          turn: room.player2,
          skip: true
        }
        changeTurn(room);
        return json;
      }
    }
  }
  else{ //last player plauing was player2?
    if(has_plays_left(room.Board,1)){ //next player to play has play possible
      let json = {
        board: newboard,
        count: room.Count,
        turn: room.player1
      }
      return json;
    }
    else{
      if(!has_plays_left(room.Board,2)){ // no player has play possible
        let json = {
          winner: room.winner,
          board: newboard,
          count: room.Count,
        }
        return json;
      }
      else{
        let json = {
          board: newboard,
          count: room.Count,
          turn: room.player1,
          skip: true
        }
        changeTurn(room);
        return json;
      }
    }
  }
}
