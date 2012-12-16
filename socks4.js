var net = require('net'),
    util = require('util'),
    log = function(args) {
        //console.log(args);
    },
    info = console.info,
    errorLog = console.error,
    clients = [],
    SOCKS_VERSION = 4;

function createSocksServer() {
    var socksServer = net.createServer();
    socksServer.on('listening', function() {
        var address = socksServer.address();
        info('LISTENING %s:%s', address.address, address.port);
    });
    socksServer.on('connection', function(socket) {
        info('CONNECTED %s:%s', socket.remoteAddress, socket.remotePort);
        initSocksConnection.bind(socket)();
    });
    return socksServer;
}
//
// socket is available as this
function initSocksConnection() {
    // keep log of connected clients
    clients.push(this);

    // remove from clients on disconnect
    this.on('end', function() {
        var idx = clients.indexOf(this);
        if (idx != -1) {
            clients.splice(idx, 1);
        }
    });
    this.on('error', function(e) {
        errorLog('%j', e);
        var idx = clients.indexOf(this);
        if (idx != -1) {
            clients.splice(idx, 1);
        }
    });

    // do a handshake
    this.handshake = handshake.bind(this);
    this.on('data', this.handshake);
}

function handshake(chunk) {
    this.removeListener('data', this.handshake);

    // SOCKS Version 5 is the only support version
    if (chunk[0] != SOCKS_VERSION) {
        errorLog('handshake: wrong socks version: %d', chunk[0]);
        this.end();
    }
  
      var cmd=chunk[1],
        address,
        port,
        offset=3;
 
    address = util.format('%s.%s.%s.%s', chunk[offset+1], chunk[offset+2], chunk[offset+3], chunk[offset+4]);
    port = chunk.readUInt16BE(2);

    log('Request: type: %d -- to: %s:%s', chunk[1], address, port);

    
        this.request = chunk;
        this.proxy = net.createConnection(port, address, initProxy.bind(this));
this.proxy.on('error', function(had_error) {
this.end();
console.error('The proxy error');	
}.bind(this));
       
}

function initProxy() {
    log('Proxy connected');
    // creating response
    var resp = new Buffer(8);
    this.request.copy(resp,0,0,7);
    // rewrite response header
    resp[0] = 0x00;
    resp[1] = 90;   
    this.write(resp);
    
    var from_proxy = function(data) {
        try {
            this.write(data);
        } catch (err) {
        }
    }.bind(this);
    var to_proxy = function(data) {
        try {
            this.proxy.write(data);
        } catch (err) {
        }
    }.bind(this);

    this.proxy.on('data', from_proxy);
    this.on('data', to_proxy);

    this.proxy.on('close', function(had_error) {
        this.removeListener('data', to_proxy);
        this.proxy = undefined;
        this.end();
        errorLog('Proxy closed');
    }.bind(this));
    this.on('close', function(had_error) {
        if (this.proxy !== undefined) {
            this.proxy.removeListener('data', from_proxy);
            this.proxy.end();
        }
        errorLog('Socket closed');
    }.bind(this));
this.on('error', function(had_error) {
if (this.proxy !== undefined) {
this.proxy.removeAllListeners('data');
this.proxy.end();
}
console.error('The application error');

}.bind(this));

this.proxy.on('error', function(had_error) {
this.end();
console.error('The proxy error');	
}.bind(this));



}

module.exports = {
    createServer: createSocksServer
};