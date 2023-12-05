import * as net from "net";
import admin from 'firebase-admin';
import {COMMANDS} from './src/constants/commands.constants.js';

// Obtener el key del service account de firebase
import serviceAccount from "./config/key.json" assert { type: "json" };

// URL de la base de datos de firebase
const DATABASE_URL =
  "https://csi2-a53ef-default-rtdb.asia-southeast1.firebasedatabase.app/";


//inicializar la conexión usando el key y la url de la base datos
const firebaseApp = admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: DATABASE_URL,
});

// Obtener una referencia a la base de datos
const db = admin.database();
// Esta referencia es el sub-nivel en el que se va a agregar información de logs
const ref = db.ref("/logs");

// Inicializar el servidor
const server = net.createServer((socket) => {
  // Cuando se reciben datos
  socket.on("data", (data) => {
    const message = data.toString();
    console.log(`Received data: ${message}`);

    // Parse the received message
    const [manufacturer, deviceId, contentLength, content] =
      parseMessage(message);

    // Si el mensaje recibido contiene la propiedad content y un deviceId
    if (content && deviceId) {
      const command = COMMANDS[content[0]];
    

      // Si el command que se recibió requiere logging
      if (command && command.log) {
        console.log(`Command ${content[0]}, requires logging`);
        const logRef = ref.child("test");
        logRef.push({
          data: content,
          deviceId: deviceId,
        });
      }

      // Si el command que se recibió requiere enviar una respuesta devuelta al cliente
      if (command && command.responseRequired) {
        const response = `[3G*${deviceId}*0002*LK]`;
        socket.write(response);
        console.log(`Command ${content[0]}, requires response: ${response}`);
        return;
      }

      socket.end();

    }  
    socket.end(); 
  });

  // Si la conexión se cierra
  socket.on("end", () => {
    console.log("Client disconnected");
  });
});

const PORT = 4000;
const ADDRESS = "0.0.0.0";
server.listen(PORT, ADDRESS, () => {
  console.log(`Server listening on ${ADDRESS}:${PORT}`);
});

function parseMessage(message) {
  let [manufacturer, deviceId, contentLength, content] = message
    .slice(1, -1) // Remove brackets
    .split("*");
  content = content.split(",");
  return [manufacturer, deviceId, contentLength, content];
}
