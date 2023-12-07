import * as net from "net";
const { MongoClient, ServerApiVersion } = require('mongodb');
import { COMMANDS } from "./src/constants/commands.constants.js";
import {
  LOCATION,
  LOCATION_COMMANDS,
} from "./src/constants/location.constants.js";


const uri = "mongodb+srv://realtimecsiserver:NQ2KydALDO8swD22@clustercsi.5gy2biq.mongodb.net/?retryWrites=true&w=majority";
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    await client.close();
  }
}
run().catch(console.dir);


/* // Obtener el key del service account de firebase
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
const ref = db.ref("/logs"); */

// Inicializar el servidor
const server = net.createServer((socket) => {
  // Cuando se reciben datos
  socket.on("data", (data) => {
    const message = data.toString();
    console.log(`Received data: ${message}`);

    // Parse the received message
    const [manufacturer, deviceId, contentLength, content, parsedContent] =
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
          parsedData: parsedContent,
        });
      }

      // Si el command que se recibió requiere enviar una respuesta devuelta al cliente
      if (command && command.responseRequired) {
        // const response = `[3G*${deviceId}*0002*LK]`;
        const response = `[3G*${deviceId}*0002*CR]`;
        socket.write(response);
        console.log(`Command ${content[0]}, requires response: ${response}`);
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
  let parsedContent = {};
    content = content.split(",");
  // Verifica si el contenido existe y si el primer elemento está incluido en LOCATION_COMMANDS(comandos que contienen ubicación).
  if (content && content[0] && LOCATION_COMMANDS.includes(content[0])) {
    console.log(content[0]);
    // Crea un nuevo objeto parsedContent asignando a cada propiedad un nombre (location) y un valor  correspondiente extraído de content.
    parsedContent = LOCATION.reduce((object, value, index) => {
      const key = value;
      object[key] = content[index];
      return object;
    }, {});
    // Imprime parsedContent en la consola
    console.log(parsedContent);
  }
  return [manufacturer, deviceId, contentLength, content, parsedContent];
}
