var usr;
var pw;
//var url = 'http://twserver.alunos.dcc.fc.up.pt:8008/';
//var url = 'http://localhost:8106/'
var url = 'http://twserver.alunos.dcc.fc.up.pt:8106/';
var gameId;
var eventSource;
var time;

async function register(){
  const regist = {
    nick: document.getElementById('user').value,
    pass: document.getElementById('pass').value
  }
  usr = regist.nick;
  pw = regist.pass;
  await fetch(url + "register",{
    method: "POST",
    body: JSON.stringify(regist)
  })
  .then(response => {
    if(!response.ok) window.alert("wrong password");
    else display_menu(2);
  })
  .catch(err => console.error(err))
}

async function join(){
  const join = {
    group: 06,
    nick: usr,
    pass: pw
  }
  await fetch(url + "join", {
    method: 'POST',
    body: JSON.stringify(join)
  })
  .then(async response =>{return response.json()})
  .then(json =>{
    console.log(json);
    if(json.color === "dark"){
      display_message(8);
      player = 1;
    }
    else if(json.color === "light"){
      display_message(9);
      player = 2;
    }
    else console.error("error color");
    gameId = json.game;
    display_menu(3);
    eventSource = new EventSource(url+"update?nick="+usr+"&game="+gameId);
    update();
  })
  .catch(err => console.error(err))
}

async function ranking(){
  await fetch(url+ "ranking", {
    method: "POST",
    body: JSON.stringify({})
  })
 .then(response => {return response.json();})
 .then(json => update_table(json))
 .catch(err => console.error(err))
}

//notify play (notify(-1,-1)=> skip play)
async function notify(cx,cy){
  if(cx !== -1){
    var ntfy = { //play
      nick: usr,
      pass: pw,
      game: gameId,
      move: {row: cx, column:cy }
    }
  }
  else{
    var ntfy = { //pass
      nick: usr,
      pass: pw,
      game: gameId,
      move: null
    }
  }
  await fetch(url + "notify",{
    method: 'POST',
    body: JSON.stringify(ntfy)
  })
  .then(async response => {
    const data = await response.json();
    if(!response.ok){
      switch(data.error){
        case "Not your turn to play": display_message(5); break;
        case "Nenhuma peça alterada": display_message(1); break;
        case "Posição já preenchida": break;
        default: console.log("Error with server. Restart connection");break;
      }
    }
    else update();
  })
  .catch(err => console.error(err));
}

async function leave(){
  const leave = {
    nick: usr,
    pass: pw,
    game: gameId
  }
  await fetch(url + "leave",{
    method: "POST",
    body: JSON.stringify(leave)
  })
  .then(response =>{ return response.json()})
  .then(json =>{
    eventSource.close();
    logout();
  })
  .catch(err =>{
    if(difficulty != 0) Promise.reject(response);        // else(offline) reject
  });
}

function update(){
  eventSource.onstart = () => console.log("Connection with server established");
  eventSource.onmessage = async (event) => {
    var data = await JSON.parse(event.data);

    if(data.skip == true){ //skip(no possible play)
      //console.log("skip");
      if(data.turn == usr)display_message(2);
      else display_message(10);
      notify(-1,-1);
      return;
    }

    //turn changer
    if(data.turn != usr){
      clearTimeout(time);
      if( player == 1 ) document.getElementById("Turn").innerHTML = "White Turn";
      else document.getElementById("Turn").innerHTML = "Black Turn";
    } else { //is player turn
      time = setTimeout( async () => { //timeout function
        display_message(11);
        await leave();
        document.getElementById("Restartbtn").style.display = "none";
        document.getElementById("Forfeitbtn").style.display = "none";
        document.getElementById("PlayAgainbtn").style.display = "block";
      },120000);

      if( player == 1) document.getElementById("Turn").innerHTML = "Black Turn";
      else document.getElementById("Turn").innerHTML = "White Turn";
    }

    var data1 = JSON.stringify(data.winner); //string with winner text;

    if(data1 != "null" && !data.board){ //game started and user disconnected
      //console.log("user disconnected");
      if(data.winner == usr){ //update score for user
        document.getElementById("Restartbtn").style.display = "none";
        document.getElementById("Forfeitbtn").style.display = "none";
        document.getElementById("PlayAgainbtn").style.display = "block";
        display_message(6);
      }
      eventSource.close();
      console.log("winner:"+data1);
      return;
    }

    else if(data.winner && data.board){ //game ended
      //console.log("ended");
      update_board(data);
      console.log(data);
      winner_select();
      eventSource.close();
      return;
    }

    //if play is possible
    if(data != void(0)){ // if not undifined
      update_board(data);
      console.log(data);
    }
    else Promise.reject(data);
  }
  eventSource.onerror = err =>{
    console.error(err);
    eventSource.close();
  }
}

//update board for each player after GET request(update)
function update_board(data){
  if(data == void(0)){ Promise.reject(data);return;}// not difined => ignore
  var save_player = player;
  for(var i = 0;i<=length-1;i++){
    for(var j = 0;j<=length-1;j++){
      if(data.board[i][j] === 'dark'){ state[i][j] = 1; player = 1;change_color(i,j);}
      else if(data.board[i][j] === 'light'){ state[i][j] = 2; player = 2;change_color(i,j);}
    }
  }
  piecesp1 = data.count.dark;
  piecesp2 = data.count.light;
  update_scores();
  player = save_player;
}

//update scores online table
function update_table(json){
  if(!(json == void(0))){ //is ranking during game
    var table = document.getElementById("table");

    while(table.firstChild) table.removeChild(table.firstChild);

    var header = document.createElement("tr");
    var usr = document.createElement("th");
    var win = document.createElement("th");
    var scr = document.createElement("th");

    usr.innerHTML = "User";
    win.innerHTML = "Wins";
    scr.innerHTML = "Games";

    header.appendChild(usr);
    header.appendChild(win);
    header.appendChild(scr);
    table.appendChild(header);

    for(var i = 0;i<json.ranking.length;i++){
      var row = document.createElement("tr");
      var cell1 = document.createElement("td");
      var cell2 = document.createElement("td");
      var cell3 = document.createElement("td");

      let text1 = document.createTextNode(json.ranking[i].nick);
      let text2 = document.createTextNode(json.ranking[i].victories);
      let text3 = document.createTextNode(json.ranking[i].games);

      cell1.appendChild(text1);
      cell2.appendChild(text2);
      cell3.appendChild(text3);

      row.appendChild(cell1);
      row.appendChild(cell2);
      row.appendChild(cell3);

      table.appendChild(row);
    }
  }
}
