const functions = require('firebase-functions');
const express = require('express');
const app = express();


exports.httpreq = functions.https.onRequest(app);


app.get('/', (req, res) => {
    res.send('<h1>My Store (bnd) </h1>');
});

function frontendHandler( request, response){
    response.sendFile( __dirname + '/prodadmin/prodadmin.html');
}

app.get('/login', frontendHandler);
app.get('/home', frontendHandler);
app.get('/add', frontendHandler);
app.get('/show', frontendHandler);
app.get('/profile', frontendHandler);