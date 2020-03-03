const functions = require('firebase-functions');
const express = require('express');
const app = express();

exports.httpreq = functions.https.onRequest(app);

app.use(express.urlencoded({extended: false}))
app.use('/public', express.static(__dirname + '/static'));

//set template engine
app.set('view engine', 'ejs');
app.set('views', './ejsviews');




function frontendHandler( request, response){
    response.sendFile( __dirname + '/prodadmin/prodadmin.html');
}

app.get('/login', frontendHandler);
app.get('/home', frontendHandler);
app.get('/add', frontendHandler);
app.get('/show', frontendHandler);
app.get('/profile', frontendHandler);

app.get('/testLogin', (req, res) => {
    res.sendFile(__dirname + '/static/html/login.html')
})

app.post('/testSignIn', (req, res)=>{
    const email = req.body.email;
    const password = req.body.pass;

    const obj = {email, password};
    res.render('home', obj)
})

app.get('/', (req, res) => {
    res.send('<h1>My Store (bnd) </h1>');
});