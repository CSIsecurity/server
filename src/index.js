const express = require('express');
const app = express('./app');


const net = require('net');

//Crea el servidor y convierte a string los datos adquiridos del dispositivo
const server = net.createServer((socket) => {
  socket.on('data', (data) => {
    const message = data.toString();
    console.log(`Received data: ${message}`);


    // Parse the received message
    const [manufacturer, deviceId, contentLength, content] = parseMessage(message);

    console.log(`Manufacturer: ${manufacturer}`);
    console.log(`Device ID: ${deviceId}`);
    console.log(`Content Length: ${contentLength}`);
    console.log(`Content: ${content}`);

    // Process the message or send a response as needed
    // ...

    // Example: Send a response back to the client
    const response = `[3G*4305000425*0002*LK]`; // Example response
    socket.write(response);
  });

  socket.on('end', () => {
    console.log('Client disconnected');
  });
});

const PORT = 4000;
const ADDRESS = '0.0.0.0';

app.listen(PORT, ADDRESS, () => {
  console.log(`Server listening on ${ADDRESS}:${PORT}`);
});

function parseMessage(message) {
  const [manufacturer, deviceId, contentLength, content] = message
    .slice(1, -1) // Remove brackets
    .split('*');

  return [manufacturer, deviceId, contentLength, content];
}