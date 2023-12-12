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
const googleKey = process.env.GOOGLE_KEY;
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
  socket.on("connection", (data) => {
    console.log(`Connected:`, data);
  });
  socket.on("connect", (data) => {
    console.log(`Connected:`, data);
  });
  // Cuando se reciben datos
  socket.on("data", (data) => {
    // Crear un log al recibir cualquier mensaje
    logtail, info("Message received", { message: data });

    const message = data.toString();

    // Extraer los campos de acuerdo al protocolo de comunicación del dispositivo
    const [deviceId, content, parsedContent] = parseMessage(message);

    // Crear un log con los datos parseados
    logtail.info("Received data", {
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
        obtenerCoordenadas(data, deviceId);
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
      console.log("Invalid command received: ", content[0]);
      socket.end();
      return;
    }
    console.log("Invalid message received: ", message);
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
  return [deviceId, content, parsedContent];
}

async function obtenerCoordenadas(message, deviceId) {
  let decibeles = [];
  let macsEncontradas = [];
  let campos = message.split(",");
  let id_temp = campos[0].split("*");
  let id_dispositivo = id_temp[1];
  let bateria = campos[13];

  const regex = new RegExp(
    /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})|([0-9a-fA-F]{4}.[0-9a-fA-F]{4}.[0-9a-fA-F]{4})$/
  );

  macsEncontradas = campos.filter((elemento, indice) => {
    //return elemento > 10;
    if (elemento.match(regex)) {
      decibeles.push(campos[indice + 1]);
      return elemento;
    }
  });

  //prepara el objeto data para Google
  let objetosMac = [];

  for (let i = 0; i < macsEncontradas.length; i++) {
    objetosMac.push({
      macAddress: macsEncontradas[i],
      signalStrength: decibeles[i],
      signalToNoiseRatio: 0,
    });
  }

  const datosEnviar = {
    considerIp: "false",
    wifiAccessPoints: objetosMac,
  };

  //Si existen objetosMac, enviar a google
  if (objetosMac.length > 1) {
    await fetch(
      `https://www.googleapis.com/geolocation/v1/geolocate?key=${googleKey}`,
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
        console.log(data);

        const datosPosicion = {
          latitud: data.location.lat,
          longitud: data.location.lng,
          token: id_dispositivo,
          fk_id_usuario_cliente: "NA",
          origen: "tracker",
          id_dispositivo: id_dispositivo,
          bateria: bateria,
          precision: data.accuracy,
        };

        // Formar el objeto para enviar a mongo
        const logData = {
          date: DateTime.now().setZone("America/Bogota").toISO(),
          data: message,
          deviceId: deviceId,
          parsedData: datosPosicion,
          // Si positionStatus es G fue obtenida desde el API de google
          GPSPositioningStatus: "G",
          location: datosPosicion,
        };

        console.log(data);

        // Enviar los datos a la base de datos
        const collection = client.db(dbName).collection("location");

        collection.insertOne(logData);
      })
      .catch((error) => {
        console.error("Error:", error);
      });
  }
}