const { Router } = require('express');
const router = Router();
const admin = require('firebase-admin');

var serviceAccount = require("../../node-firebase-7b1aa-firebase-adminsdk-jxnpn-91bb2744af.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    //credential: admin.credential.applicationDefault(),
    databaseURL: 'https://node-firebase-7b1aa-default-rtdb.firebaseio.com/'
});

const db = admin.database();


router.get('/', (req, res) =>{
// db.ref('/contacts').once('value', (snapshot) => {
//     const data = snapshot.val();
// })
        res.render('index');
//     res.render('index', {contacts: data});

});

router.post('/new-contact', (req, res) => {
    console.log(req.body);
     const newContact = {
         firstname: req.body.firsname,
         lastname: req.body.lastname,
         email: req.body.email,
         phone: req.body.phone
     }
    db.ref('contacts').push(newContact);
    res.send('received');
});

module.exports = router;