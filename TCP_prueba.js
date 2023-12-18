import * as net from 'net';

const client = new net.Socket();

// client.connect(40393, 'viaduct.proxy.rlwy.net', 
client.connect(4000, 'localhost', 
function() {
    console.log('Connected to server');
    client.write('[3G*4305000423*0032*UD_LTE,860043050004232,1701757617,0814c926009128a6,30:42:40:eb:0a:f0,-67,48:88:99:a3:3a:d0,-90,68:5e:6b:0b:0e:f3,-86,345654]');
});

client.on('data', function(data) {
    console.log('Received: ' + data);
     client.destroy(); // Close the connection after receiving data
});

client.on('close', function() {
    console.log('Connection closed');
});