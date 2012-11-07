
var net = require('net'),
    socks = require('./socks.js');
var d = require('domain').create();
var cluster = require('cluster');

var numCPUs = require('os').cpus().length;

if (cluster.isMaster) {

   // Fork workers.
  for (var i = 0; i < numCPUs; i++) {
    cluster.fork();
  }
if(1==numCPUs) cluster.fork();//make sure it is more than 2

  cluster.on('exit', function(worker, code, signal) {
	var exitCode = worker.process.exitCode;
      console.log('worker ' + worker.process.pid + ' died ('+exitCode+'). restarting...');

// exec('taskkill /pid '+worker.process.pid +' /T /F');
cluster.fork();
	
  });
} else {
  // Workers can share any TCP connection
  // In this case its a proxy server

// Create server
// The server accepts SOCKS connections. This particular server acts as a proxy.
var  PORT='8888',
    server = socks.createServer(function(socket, port, address, proxy_ready) {

      // Implement your own proxy here! Do encryption, tunnelling, whatever! Go flippin' mental!
      // I plan to tunnel everything including SSH over an HTTP tunnel. For now, though, here is the plain proxy:

      console.log('Got through the first part of the SOCKS protocol.')
      var proxy = net.createConnection(port, address, proxy_ready);
//	 d.add(proxy);
      proxy.on('data', function(d) {
        try {
    //      console.log('receiving ' + d.length + ' bytes from proxy');
          socket.write(d);
        } catch(err) {
        }
      });
      socket.on('data', function(d) {
        // If the application tries to send data before the proxy is ready, then that is it's own problem.
        try {
    //      console.log('sending ' + d.length + ' bytes to proxy');
          proxy.write(d);
        } catch(err) {
        }
      });

      proxy.on('close', function(had_error) {
        socket.end();
        console.error('The proxy closed');
      }.bind(this));
      socket.on('close', function(had_error) {
        if (this.proxy !== undefined) {
          proxy.removeAllListeners('data');
          proxy.end();
        }
        console.error('The application closed');
	
      }.bind(this));
      socket.on('error', function(had_error) {
        if (this.proxy !== undefined) {
          proxy.removeAllListeners('data');
          proxy.end();
        }
        console.error('The application error');
	
      }.bind(this));

  proxy.on('error', function(had_error) {
        socket.end();
        console.error('The proxy error');	
      }.bind(this));

    });

server.on('error', function (e) {
    console.error('SERVER ERROR: %j', e);
    if (e.code == 'EADDRINUSE') {
        console.log('Address in use, retrying in 10 seconds...');
        setTimeout(function () {
            console.log('Reconnecting to %s',PORT);
            server.close();
            server.listen(PORT);
        }, 10000);
    }
});
server.listen(PORT);


}

d.on('error', function(er) {  
  // an error occurred somewhere.  
  // if we throw it now, it will crash the program  
  // with the normal line number and stack message.  
 console.log('ERROR!: %s ',er);

});
