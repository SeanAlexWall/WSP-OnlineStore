const functions = require('firebase-functions');
const express = require('express');
const app = express();

exports.httpreq = functions.https.onRequest(app);

app.use(express.urlencoded({ extended: false }))
app.use('/public', express.static(__dirname + '/static'));

//set template engine
app.set('view engine', 'ejs');
app.set('views', './ejsviews');


//frontend +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

function frontendHandler(request, response) {
    response.sendFile(__dirname + '/prodadmin/prodadmin.html');
}

app.get('/login', frontendHandler);
app.get('/home', frontendHandler);
app.get('/add', frontendHandler);
app.get('/show', frontendHandler);
app.get('/profile', frontendHandler);



//Backend +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

const firebase = require('firebase');

// Your web app's Firebase configuration
var firebaseConfig = {
    apiKey: "AIzaSyABIJ9aQXQG5QcBlpGqjKsOpARjADHlXzo",
    authDomain: "seanw-wsp20.firebaseapp.com",
    databaseURL: "https://seanw-wsp20.firebaseio.com",
    projectId: "seanw-wsp20",
    storageBucket: "seanw-wsp20.appspot.com",
    messagingSenderId: "551396521699",
    appId: "1:551396521699:web:a23fa68b15753033f437d6"
};
// Initialize Firebase
firebase.initializeApp(firebaseConfig);


const Constants = require('./myconstants.js');

app.get('/', auth, async (req, res) => {
    const coll = firebase.firestore().collection(Constants.COLL_PRODUCTS);
    try {
        let products = [];
        const snapshot = await coll.orderBy("name").get();
        snapshot.forEach(doc => {
            products.push({ id: doc.id, data: doc.data() });
        });
        res.render("storefront.ejs", { error: false, products, user: req.user })
    } catch (e) {
        res.render("storefront.ejs", { error: e, user: req.user });
    }
});

app.get('/b/about', auth, (req, res) => {
    res.render('about.ejs', { user: req.user });
})

app.get('/b/contact', auth, (req, res) => {
    res.render('contact.ejs', { user: req.user });
})

app.get('/b/signIn', auth, (req, res) => {
    res.render('signIn.ejs', { error: false, user: req.user });
})

app.post('/b/signIn', async (req, res) => {
    const email = req.body.email;
    const password = req.body.password;
    const auth = firebase.auth();
    try {
        const user = await auth.signInWithEmailAndPassword(email, password);

        res.redirect('/b/chatroom')
    } catch (e) {
        res.render('signIn.ejs', { error: JSON.stringify(e), user: req.user })
    }
})

app.get('/b/signOut', async (req, res) => {
    try {
        await firebase.auth().signOut();
        res.redirect('/');
    } catch (e) {
        res.send("Error: sign out: " + JSON.stringify(e))
    }
})

app.get('/b/profile', auth, (req, res) => {
    if (!req.user)
        res.redirect('/b/signIn');
    else {
        res.render('profile', { user: req.user })
    }
})

app.get('/b/chatroom', auth, async (req, res) => {
    if (!req.user)
        res.redirect('/b/signIn');
    else {
        const coll = firebase.firestore().collection(Constants.COLL_MESSAGES);
        try {
            let messages = [];
            const snapshot = await coll.orderBy("time").get();
            snapshot.forEach(doc => {
                messages.push({ id: doc.id, data: doc.data() });
            });
            res.render("chatroom.ejs", { error: false, messages, user: req.user })
        } catch (e) {
            res.render("chatroom.ejs", { error: e, user: req.user });
        }
    }
})
app.post('/b/chatroom', auth, async (req, res) => {
    try {
        const email = req.user.email;
        const content = req.body.content;
        const date = new Date();
        await firebase.firestore().collection(Constants.COLL_MESSAGES).doc().set({ email, content, time: date })
    }
    catch (e) {
        res.send("Error: chatroom: " + e)
    }
    const coll = firebase.firestore().collection(Constants.COLL_MESSAGES);
    try {
        let messages = [];
        const snapshot = await coll.orderBy("time").get();
        snapshot.forEach(doc => {
            messages.push({ id: doc.id, data: doc.data() });
        });
        res.render("chatroom.ejs", { error: false, messages, user: req.user })
    } catch (e) {
        res.render("chatroom.ejs", { error: e, user: req.user });
    }
    res.render('chatroom.ejs', { user: req.user })


})

//middleware
function auth(req, res, next) {
    req.user = firebase.auth().currentUser;
    next();
}