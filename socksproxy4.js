
var net = require('net'),
 socks4 = require('./socks4.js');
var exec = require('child_process').exec;
var d = require('domain').create();
var cluster = require('cluster');

var numCPUs = require('os').cpus().length;

d.run(function() { 

if (cluster.isMaster) {

   // Fork workers.
  for (var i = 0; i < numCPUs; i++) {
    cluster.fork();
  }
if(1==numCPUs) cluster.fork();//make sure it is more than 2

  cluster.on('exit', function(worker, code, signal) {
   if (worker.suicide !== true) {
    exec('taskkill /pid '+worker.process.pid +' /T /F');
  }
	var exitCode = worker.process.exitCode;
      console.log('worker ' + worker.process.pid + ' died ('+exitCode+'). restarting...');

cluster.fork();
	
  });
} else {
  // Workers can share any TCP connection
  // In this case its a proxy server

// Create server
// The server accepts SOCKS connections. This particular server acts as a proxy.
var  PORT4='9999',    
server4 = socks4.createServer();
server4.on('error', function (e) {
    console.error('SERVER ERROR: %j', e);
    if (e.code == 'EADDRINUSE') {
        console.log('Address in use, retrying in 10 seconds...');
        setTimeout(function () {
            console.log('Reconnecting to %s',PORT);
            server.close();
            server.listen(PORT4);
        }, 10000);
    }
});
server4.listen(PORT4);

}
 });

d.on('error', function(er) {  
  // an error occurred somewhere.  
  // if we throw it now, it will crash the program  
  // with the normal line number and stack message.  
 console.log('ERROR!: %s ',er);

});
