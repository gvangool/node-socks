
var net = require('net'),
    socks = require('./socks.js'),
    info = console.log.bind(console);

// Create server
// The server accepts SOCKS connections. This particular server acts as a proxy.
var HOST = process.argv[3] || '127.0.0.1',
    PORT = process.argv[2] || '6868',
    server = socks.createServer(function(socket, port, address, proxy_ready) {

      // Implement your own proxy here! Do encryption, tunnelling, whatever! Go flippin' mental!
      // I plan to tunnel everything including SSH over an HTTP tunnel. For now, though, here is the plain proxy:

      var proxy = net.createConnection({port:port, host:address}, proxy_ready);
      var localAddress,localPort;
      proxy.on('connect', function(){
        info('%s:%d <== %s:%d ==> %s:%d',socket.remoteAddress,socket.remotePort,
              proxy.localAddress,proxy.localPort,proxy.remoteAddress,proxy.remotePort);
        localAddress=proxy.localAddress;
        localPort=proxy.localPort;

        // send ready res
        proxy_ready();

        proxy.pipe(socket).pipe(proxy);
      }.bind(this));

      proxy.on('error', function(err){
          //console.log('Ignore proxy error');
      });
      proxy.on('close', function(had_error) {
        try {
          if(localAddress && localPort)
            console.log('The proxy %s:%d closed', localAddress, localPort);
          else 
            console.error('Connect to %s:%d failed', address, port);
          socket.end();
        } catch (err) {
        }
      }.bind(this));
      
      socket.on('error', function(err){
          //console.log('Ignore socket error');
      });
      socket.on('close', function(had_error) {
        try {
          if (this.proxy !== undefined) {
            proxy.removeAllListeners('data');
            proxy.end();
          }
          //console.error('The socket %s:%d closed',socket.remoteAddress,socket.remotePort);
        } catch (err) {
        }
      }.bind(this));

    });

server.on('error', function (e) {
    console.error('SERVER ERROR: %j', e);
    if (e.code == 'EADDRINUSE') {
        console.log('Address in use, retrying in 10 seconds...');
        setTimeout(function () {
            console.log('Reconnecting to %s:%s', HOST, PORT);
            server.close();
            server.listen(PORT, HOST);
        }, 10000);
    }
});
server.listen(PORT, HOST);

// vim: set filetype=javascript syntax=javascript :
