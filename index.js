const http = require('http');
const url = require('url');
const stream = require('stream');
const methods = require('./module.js');
const crypto = require('crypto');

const port = '8106';
var query;

module.exports.headers = {
	plain: {
	        'Content-Type': 'application/javascript',
	        'Cache-Control': 'no-cache',
	        'Access-Control-Allow-Origin': '*'
	    },
	sse: {
	        'Content-Type': 'text/event-stream',
	        'Cache-Control': 'no-cache',
	        'Access-Control-Allow-Origin': '*',
	        'Connection': 'keep-alive'
	    },
	txt: {
	        'Content-Type': 'text/plain',
	        'Cache-Control': 'no-cache',
	        'Access-Control-Allow-Origin': '*',
	    },
	html: {
	        'Content-Type': 'text/html',
	        'Cache-Control': 'no-cache',
	        'Access-Control-Allow-Origin': '*',
	    },
	css: {
	        'Content-Type': 'text/css',
	        'Cache-Control': 'no-cache',
	        'Access-Control-Allow-Origin': '*',
	    },
	png: {
	        'Content-Type': 'image/png',
	        'Cache-Control': 'no-cache',
	        'Access-Control-Allow-Origin': '*',
	    }
};

const server = http.createServer( (request,response) => {
  const preq = url.parse(request.url,true);
  const pathname = preq.pathname;
  let body = '';
  switch(request.method){
    case 'GET':
			methods.GetRequest(pathname,request,response);
		 	break;
    case 'POST':
      request
           .on('data', chunk => { body += chunk })
           .on('end', () => {
             try {
               query = JSON.parse(body);
               methods.PostRequest(pathname,request,response,query);
             } catch(err) { console.error(err); }
           })
           .on('error', err => console.error(err))
		    break;
    default:
      response.writeHead(404,module.exports.plain);
      response.end();
  }
})

server.listen(port,error => {
  if(error) console.log('Error ocurred:', error);
  else console.log("Server is listening on port " + port);
});
