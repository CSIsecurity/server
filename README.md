$env:GOOGLE_APPLICATION_CREDENTIALS="C:\Users\manue\OneDrive\Pictures\CSI\firebase_node\csi2-a53ef-firebase-adminsdk-eng95-53e7e2eb94.json"

Documentación dispositivo

[3G*8800000015*000A*UPLOAD,600]
[manufacturer*device ID*contentlength*content]

Formato de los datos: Los datos en este protocolo se estructuran de la siguiente manera: [ID del fabricante*ID del dispositivo*longitud del contenido*contenido].

ID del fabricante y del dispositivo: El ID del fabricante y del dispositivo están separados por un asterisco (*). El ID del fabricante se compone de dos bytes (dos caracteres) y el ID del dispositivo se encuentra entre el ID del fabricante y la longitud del contenido.

Longitud del contenido: La longitud del contenido viene después del ID del dispositivo y está fijada en cuatro bytes de código ASCII. Esto significa que la longitud del contenido estará representada por cuatro caracteres.

Formato de la longitud del contenido: La longitud del contenido se representa con cuatro caracteres, donde los dos primeros caracteres indican el valor de orden superior y los dos últimos el valor de orden inferior. Por ejemplo, "FFFF" indica que la longitud es 65535.

Ubicación del contenido: El contenido viene después de la longitud y ocupa el espacio restante. Este contenido puede variar en función de su naturaleza y puede estar en diferentes formatos (texto, números, datos binarios, etc.).

Codigo para Parsear estos datos

const mensajeRecibido = 'AB*12*FFFF*Datos de ejemplo';
const partes = mensajeRecibido.split('*');

const manufacturerID = partes[0];
const deviceID = partes[1];
const contentLength = parseInt(partes[2], 16); // Convertir longitud ASCII hex a número
const content = partes.slice(3).join('*'); // El contenido es el resto de las partes unidas por asteriscos

console.log('ID del fabricante:', manufacturerID);
console.log('ID del dispositivo:', deviceID);
console.log('Longitud del contenido:', contentLength);
console.log('Contenido:', content);

Codigo para retornar un mensaje con los datos organizados

const manufacturerID = 'XY';
const deviceID = '34';
const contenido = 'Nuevos datos';

const longitudContenido = contenido.length.toString(16).toUpperCase().padStart(4, '0'); // Convertir longitud a ASCII hex de 4 caracteres
const mensajeSaliente = `${manufacturerID}*${deviceID}*${longitudContenido}*${contenido}`;

console.log('Mensaje a enviar:', mensajeSaliente);

Configuración
1. Ejecutar un servidor
2. Configurar la red y el firewall
3. Conexión desde el dispositivo

Capas de un TCP/IP
-Capa de enlace de datos
-Capa de Internet
-Capa de transporte
-Capa de aplicaciones