import * as net from "net";
import * as dotenv from "dotenv";
import { MongoClient, ServerApiVersion } from "mongodb";
import { COMMANDS } from "./src/constants/commands.constants.js";
import {
  LOCATION,
  LOCATION_COMMANDS,
} from "./src/constants/location.constants.js";
dotenv.config();
const uri = process.env.MONGO_URI;
const dbName = process.env.DB_NAME;
console.log("dbname:", dbName);
console.log("uri:", uri);
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

await client.connect();


// Inicializar el servidor
const server = net.createServer((socket) => {
  socket.on("connect", (data) => {
    console.log(`Connected:`, data)
  })


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

        const logData = {
          data: content,
          deviceId: deviceId,
          parsedData: parsedContent,
        };

        const collection = client.db(dbName).collection('logTest');

        collection.insertOne(logData);


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

const PORT = process.env.PORT;
const ADDRESS = process.env.ADDRESS;
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
