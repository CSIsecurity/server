const { Router } = require('express');
const router = Router();
const admin = require('firebase-admin');

var serviceAccount = require("../../csi2-a53ef-firebase-adminsdk-eng95-53e7e2eb94.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    //credential: admin.credential.applicationDefault(),
    databaseURL: 'https://csi2-a53ef-firebase-adminsdk-eng95-53e7e2eb94.json/'
});

const db = admin.database();


router.get('/', (req, res) =>{
// db.ref('/contacts').once('value', (snapshot) => {
//     const data = snapshot.val();
// })
        res.render('index');
//     res.render('index', {contacts: data});

});

// router.post('/new-contact', (req, res) => {
//     console.log(req.body);
//      const newContact = {
//          firstname: req.body.firsname,
//          lastname: req.body.lastname,
//          email: req.body.email,
//          phone: req.body.phone
//      }
//     db.ref('contacts').push(newContact);
//     res.send('received');
// });
// router.post('/new-contact', (req, res) => {
//     const manufacturer = req.body.Manufacturer;
//     const content = req.body.Content;
//     // Si los datos tienen un formato de array
//     // const manufacturer = req.body[0].Manufacturer;
//     // const content = req.body[0].Content;
  
//     // Procesar los datos según lo necesario para tu base de datos
//     const parsedData = parseData(manufacturer, content); 
  
//     // Aquí puedes crear un objeto newContact con los datos procesados
//     const newContact = {
//       firstname: parsedData.firstname,
//       lastname: parsedData.lastname,
//       email: parsedData.email,
//       phone: parsedData.phone
//     };
  
//     // Guardar los datos en tu base de datos
//     db.ref('contacts').push(newContact);
    
//     // Enviar una respuesta al cliente
//     res.send('received');
//   });
  const receivedData = "Manufacturer: 3G\nDevice ID: 4305000425\nContent Length: 00FB\nContent: AL_LTE,221123,043839,V,00.000000,,00.0000000,,0.00,0.0,0.0,0,100,50,0,0,00010000,2,0,732,103,3125,145929062,23,3125,145976677,18,5,,78:c5:f8:c3:c6:a4,-59,,cc:75:e2:31:c5:9e,-76,,b0:2a:43:d4:7f:5f,-91,,d0:79:80:80:be:31,-103,,cc:35:40:a7:41:df,-105,0.0\nReceived data: [3G*4305000425*0009*LK,0,0,50]";

  const lines = receivedData.split('\n'); // Dividir la cadena por saltos de línea
  
  // Iterar sobre cada línea y extraer los datos
  let manufacturer = '';
  let deviceId = '';
  let contentLength = '';
  let content = '';
  
  lines.forEach(line => {
    if (line.startsWith('Manufacturer:')) {
      manufacturer = line.split(': ')[1]; // Obtener el valor después de los dos puntos
    } else if (line.startsWith('Device ID:')) {
      deviceId = line.split(': ')[1];
    } else if (line.startsWith('Content Length:')) {
      contentLength = line.split(': ')[1];
    } else if (line.startsWith('Content:')) {
      content = line.split(': ')[1];
    }
  });
  
  // Imprimir los valores extraídos
  console.log('Manufacturer:', manufacturer);
  console.log('Device ID:', deviceId);
  console.log('Content Length:', contentLength);
  console.log('Content:', content);
  
module.exports = router;