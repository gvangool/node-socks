var net = require('net'); 
var proxyhost="127.0.0.1";//������ķ����IP 
var proxyport=9999;//������Ķ˿� 
var listenport=8124;//����˿� 
net.createServer(function (socket) { 
socket.on("connect",function(){ 
console.log('connected'); 
try{ 
var db=net.createConnection(proxyport,proxyhost); 
db.on("connect",function(){ 
console.log("server connected"); 
socket.on("data", function (data) { 
db.write(data); 
}); 
db.on("data",function(data){ 
//console.log(data.toString('utf8',0,data.legnth)); 
//console.log(data); 
socket.write(data); 
}); 
socket.on("close",function(){ 
console.log("server closed"); 
db.end(); 
}); 
}); 
db.on("error",function(data){ 
console.log("error:\r\n"+data); 
db.end();
socket.end();
}); 
db.on("end",function(){ 
console.log("server closed"); 
socket.end(); 
}); 
}catch(err){ 
console.log(err); 
} 
}); 
}).listen(listenport, "0.0.0.0");