import { DateTime } from "luxon";
import * as net from "net";
import * as dotenv from "dotenv";
import { MongoClient, ServerApiVersion } from "mongodb";
import {
  COMMANDS,
  CONFIG_COMMANDS,
} from "./src/constants/commands.constants.js";
import { Node as Logtail } from "@logtail/js";
import {
  LOCATION,
  LOCATION_COMMANDS,
} from "./src/constants/location.constants.js";

dotenv.config();

const googleKey = process.env.GOOGLE_API_KEY;
const logtail = new Logtail(process.env.LOGTAIL_TOKEN);
const uri = process.env.MONGO_URI;
const dbName = process.env.DB_NAME;

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
  // Cuando se reciben datos
  socket.on("data", (data) => {
    const message = data.toString();

    // Crear un log al recibir cualquier mensaje
    logtail.info("Message received", { message: message });

    // Extraer los fields de acuerdo al protocolo de comunicación del dispositivo
    const [deviceId, content, parsedContent] = parseMessage(message);

    // Crear un log con los datos parseados
    logtail.info("Data Parsed", {
      deviceId: deviceId,
      content: content,
      parsedContent: parsedContent,
    });

    // Si el mensaje recibido contiene la propiedad content y un deviceId
    if (content && deviceId) {
      // Según el primer elemento del arreglo content, busco las propiedades que tengo mapeadas del comando
      const command = COMMANDS[content[0]];

      // Si el comando no es de configuración quiero parsearlo y extraer los MACs que encuentre
      if (!CONFIG_COMMANDS.includes(command)) {
        // Envío el mensaje recibido sin brackets
        getLocationFromGoogle(message.slice(1, -1), deviceId);
      }

      // Si el command que se recibió requiere logging
      if (command && command.log) {
        const logData = {
          date: DateTime.now().setZone("America/Bogota").toISO(),
          data: content,
          deviceId: deviceId,
          parsedData: parsedContent,
          // Si position status es V, no es válida, si es A es válida
          GPSPositioningStatus: parsedContent["GPSPositioningStatus"],
          location: {
            latitude: parsedContent["latitude"],
            latitudeDirection: parsedContent["latitudeDirection"],
            longitude: parsedContent["longitude"],
            longitudeDirection: parsedContent["longitudeDirection"],
          },
        };

        const collection = client.db(dbName).collection(command.collection);

        collection.insertOne(logData);
      }

      // Si el command que se recibió requiere enviar una respuesta devuelta al cliente
      if (command && command.responseRequired) {
        const response = `[3G*${deviceId}*0002*${content[0]}]`;
        socket.write(response);
        return;
      }
      logtail.error("Invalid command received: ", message);
      socket.end();
      return;
    }
    logtail.error("Invalid message received: ", message);
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
    // Crea un nuevo objeto parsedContent asignando a cada propiedad un nombre (location) y un valor  correspondiente extraído de content.
    parsedContent = LOCATION.reduce((object, value, index) => {
      const key = value;
      object[key] = content[index];
      return object;
    }, {});
  }
  return [deviceId, content, parsedContent];
}

async function getLocationFromGoogle(message, deviceId) {
  let dbs = [];
  let foundMacs = [];
  let fields = message.split(",");
  let battery = fields[13];

  const regex = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/;

  foundMacs = fields.filter((field, index) => {
    if (field.match(regex)) {
      // Si se encontró un mac, dbs llega en el siguiente campo luego del mac encontrado (index + 1)
      dbs.push(fields[index + 1]);
      return field;
    }
  });

  console.log(foundMacs)

  //prepara el objeto data para Google
  let macObjects = [];

  for (let i = 0; i < foundMacs.length; i++) {
    macObjects.push({
      macAddress: foundMacs[i],
      signalStrength: dbs[i],
      signalToNoiseRatio: 0,
    });
  }

  // Dar formato para enviar a google
  const datosEnviar = {
    considerIp: "false",
    wifiAccessPoints: macObjects,
  };

  //Si existen macObjects, enviar a google
  if (macObjects[0]) {
    await fetch(`https://www.googleapis.com/geolocation/v1/geolocate?key=${googleKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(datosEnviar),
      }
      
    )
      .then((response) => response.json())
      .then((data) => {
        if (!data.location) {
          const logData = {
            data: data,
          }
          if (data.error && data.error.errors) {
            logData.errors = data.error.errors;
          }
          logtail.error("Sin Ubicación API GOOGLE", logData);

          return;
        }
    
        // Formar el objeto para enviar a mongo
        console.log(data)
        const logData = {
          date: DateTime.now().setZone("America/Bogota").toISO(),
          data: message,
          deviceId: deviceId,
          // Si positionStatus es G fue obtenida desde el API de google
          GPSPositioningStatus: "G",
          location: {
            latitude: data.location.lat,
            longitude: data.location.lng,
            battery: battery,
            precision: data.accuracy,
          },
        };

        // Enviar los datos a la base de datos
        const collection = client.db(dbName).collection("location");

        collection.insertOne(logData);
      })
      .catch((error) => {
        logtail.error("Error API Google", {
          error: error
        });
      });
  }
}