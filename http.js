var  net=require('net');
var local_port=8080;

//�ڱ��ش���һ��server��������local_port�˿�
var sockserver=net.createServer(function (client)
{

//���ȼ��������������ݷ����¼���ֱ���յ������ݰ���������http����ͷ
var buffer=new Buffer(0);
client.on('data',function (data)
{
buffer=buffer_add(buffer,data);
if(buffer_find_body(buffer)==-1)return ;
var req=parse_request(buffer);
if(req===false)return ;
client.removeAllListeners('data');
relay_connection(req);
});

//��http����ͷ��ȡ��������Ϣ�󣬼��������������������ݣ�ͬʱ����Ŀ��������������Ŀ�������������ݴ���������
function  relay_connection(req)
{
console.log(req.method+' '+req.host+':'+req.port);

//������������CONNECT������GET, POST������ô�滻��ͷ����һЩ����
if(req.method!='CONNECT')
{
//�ȴ�buffer��ȡ��ͷ��
var _body_pos=buffer_find_body(buffer);
if(_body_pos<0)_body_pos=buffer.length;
var header=buffer.slice(0,_body_pos).toString('utf8');
//�滻connectionͷ
header=header.replace(/(proxy\-)connection\:.+\r\n/ig,'')
.replace(/Keep\-Alive\:.+\r\n/i,'')
.replace("\r\n",'\r\nConnection: close\r\n');
//�滻��ַ��ʽ(ȥ����������)
if(req.httpVersion=='1.1')
{
var url=req.path.replace(/http\:\/\/[^\/]+/,'');
if(url.path!=url)header=header.replace(req.path,url);
}
buffer=buffer_add(new Buffer(header,'utf8'),buffer.slice(_body_pos));
}

//������Ŀ��������������
var server=net.createConnection(req.port,req.host);
//������������������������
client.on("data",function (data){
try 
{server.write(data);}
catch (e)
{ }
});
server.on("data",function (data){
try
{client.write(data);}
catch (e)
{ }
});
server.on("end",function (e){
console.log("server close");
console.log(e);
try 
{client.end();}
catch (e)
{ }
});
server.on("error",function (e){
console.log("server close");
console.log(e);
try 
{client.destroy();}
catch (e)
{ }
});

client.on("end",function (e){
try 
{server.end();}
catch (e)
{ }
});
client.on("error",function (e){
try 
{server.destroy();}
catch (e)
{ }
});
if(req.method=='CONNECT')
client.write(new Buffer("HTTP/1.1 200 Connection established\r\nConnection: close\r\n\r\n"));
else
server.write(buffer);
}
});

//�������ִ���
process.on('uncaughtException',function (err)
{
console.log("\nError!!!!");
console.log(err);
});

sockserver.on('listening', function() {
        var address = sockserver.address();
        console.log('LISTENING %s:%s', address.address, address.port);
    });


/**
* ������ͷ��ȡ��������ϸ��Ϣ
* ������ CONNECT ��������ô�᷵�� { method,host,port,httpVersion}
* ������ GET/POST ��������ô���� { metod,host,port,path,httpVersion}
*/
function  parse_request(buffer)
{
var s=buffer.toString('utf8');
var method=s.split('\n')[0].match(/^([A-Z]+)\s/)[1];
if(method=='CONNECT')
{
var arr=s.match(/^([A-Z]+)\s([^\:\s]+)\:(\d+)\sHTTP\/(\d\.\d)/);
if(arr&&arr[1]&&arr[2]&&arr[3]&&arr[4])
return {method:arr[1],host:arr[2],port:arr[3],httpVersion:arr[4]};
}
else
{
var arr=s.match(/^([A-Z]+)\s([^\s]+)\sHTTP\/(\d\.\d)/);
if(arr&&arr[1]&&arr[2]&&arr[3])
{
var host=s.match(/Host\:\s+([^\n\s\r]+)/)[1];
if(host)
{
var _p=host.split(':',2);
return {method:arr[1],host:_p[0],port:_p[1] ? _p[1]:80,path:arr[2],httpVersion:arr[3]};
}
}
}
return  false;
}




/**
* ����buffer����������
*/
function  buffer_add(buf1,buf2)
{
var re=new Buffer(buf1.length+buf2.length);
buf1.copy(re);
buf2.copy(re,buf1.length);
return  re;
}

/**
* �ӻ������ҵ�ͷ����������("\r\n\r\n")��λ��
*/
function  buffer_find_body(b)
{
for(var i=0,len=b.length-3;i<len;i++)
{
if(b[i]==0x0d&&b[i+1]==0x0a&&b[i+2]==0x0d&&b[i+3]==0x0a)
{
return  i+4;
}
}
return  -1;
}
//////////////////////////////////////////////////////////////////////////
var exec = require('child_process').exec;
var cluster = require('cluster');

var numCPUs = require('os').cpus().length;


if (cluster.isMaster) {

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
sockserver.listen(8080);

}


