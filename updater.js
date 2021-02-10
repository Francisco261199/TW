let connections = [];
//SSE
module.exports.remember = (connection) => {
  connections.push(connection);
  //console.log(responses);
}

module.exports.forget = (connection) => {
  let pos = connections.findIndex((conn) => conn === connection);
  connection.end();
  if(pos > -1) connections.splice(pos,1);
  console.log("User disconnected");
}

module.exports.sendResponse = (message) => {
  connections.forEach( connection => {
    if(connections.length == 2){
      connection.write('data: '+message+'\n\n');
    }
  });
}

module.exports.Count = () => {
 return connections.length;
}
