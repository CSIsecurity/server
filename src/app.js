const express = require('express');
const morgan = require('morgan');
const hbs = require('hbs');
const firebs = require('firebase-admin');

const path = require('path');

const app = express();


//motor de plantillas 
hbs.registerPartials(__dirname + '/views/partials', function (err) {});
app.set('view engine', 'hbs');
app.set("views", __dirname + "/views");


// middlewares
app.use(morgan('dev'));
app.use(express.urlencoded({extended: false}));

// routes
app.use(require('./routes/index'))


// static files 
app.use(express.static(path.join(__dirname, 'public')));


module.exports = app;