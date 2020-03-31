const functions = require('firebase-functions');
const express = require('express');
const app = express();

exports.httpreq = functions.https.onRequest(app);

app.use(express.urlencoded({extended: false}))
app.use('/public', express.static(__dirname + '/static'));

//set template engine
app.set('view engine', 'ejs');
app.set('views', './ejsviews');


//frontend +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

function frontendHandler( request, response){
    response.sendFile( __dirname + '/prodadmin/prodadmin.html');
}

app.get('/login', frontendHandler);
app.get('/home', frontendHandler);
app.get('/add', frontendHandler);
app.get('/show', frontendHandler);
app.get('/profile', frontendHandler);



//Backend +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

const firebase = require('firebase');

const session = require('express-session');
app.use(session({
    secret: 'string.lajhfdlskj',
    saveUninitialized: false,
    resave: false
}))

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
    const cartCount = req.session.cart ? req.session.cart.length : 0;
    const coll = firebase.firestore().collection(Constants.COLL_PRODUCTS);
    try{
        let products = [];
        const snapshot = await coll.orderBy("name").get();
        snapshot.forEach(doc =>{
            products.push({id: doc.id, data: doc.data()});
        });
        res.render("storefront.ejs", {error: false, products, user: req.user, cartCount})
    }catch(e){
        res.render("storefront.ejs", {error: e, user: req.user, cartCount});
    }
});

app.get('/b/about', auth, (req, res) => {
    const cartCount = req.session.cart ? req.session.cart.length : 0;
    res.render('about.ejs', {user: req.user, cartCount});
})

app.get('/b/contact', auth, (req, res) => {
    const cartCount = req.session.cart ? req.session.cart.length : 0;
    res.render('contact.ejs', {user: req.user, cartCount});
})

app.get('/b/signIn', auth, (req, res) => {
    res.render('signIn.ejs', {error: false, user: req.user, cartCount : 0});
})

app.post ('/b/signIn', async (req, res) => {
    const email = req.body.email;
    const password = req.body.password;
    const auth = firebase.auth();
    try{
        const userRecord = await auth.signInWithEmailAndPassword(email, password);
        if (userRecord.user.email===Constants.SYSADMIN_EMAIL){
            res.redirect('/admin/sysadmin')
        }
        else{
            if(!req.session.cart){
                res.redirect('/');
            }else{
                res.redirect('/b/shoppingcart');
            }
        }
    }catch(e){
        res.render('signIn.ejs', {error: JSON.stringify(e), user: req.user, cartCount: 0})
    }
})

app.get('/b/signOut', async (req, res) =>{
    try{
        req.session.cart = null
        await firebase.auth().signOut();
        res.redirect('/');
    }catch(e){
        res.send("Error: sign out: " + JSON.stringify(e))
    }
})

app.get('/b/profile', authAndRedirectSignIn, (req, res)=>{
    if(!req.user)
        res.redirect('/b/signIn');
    else{
        const cartCount = req.session.cart ? req.session.cart.length : 0;
        res.render('profile', {user: req.user, cartCount, orders: false})
    }
})

app.get('/b/signup', (req,res)=>{
    res.render('signup.ejs', {user: null, error: false, cartCount: 0})
})

const ShoppingCart = require('./Model/ShoppingCart.js');

app.post("/b/add2cart", async (req, res)=>{
    const id = req.body.docid;
    const collection = firebase.firestore().collection(Constants.COLL_PRODUCTS);
    try{
        const doc = await collection.doc(id).get();
        let cart;
        if (!req.session.cart){
            //first add to cart
            cart = new ShoppingCart;
        }
        else{
            cart = ShoppingCart.deserialize(req.session.cart);
        }
        const {name, price, summary, image, image_url} = doc.data();
        cart.add({id, name, price, summary, image, image_url})
        req.session.cart = cart.serialize();
        res.redirect('/b/shoppingcart');
    }catch (e) {
        
        res.send('A2C ERROR')
        console.log(e)
    }
})

app.get("/b/shoppingcart", authAndRedirectSignIn, (req, res)=>{
    let cart;
    if (!req.session.cart){
        //first add to cart
        cart = new ShoppingCart;
    }
    else{
        cart = ShoppingCart.deserialize(req.session.cart);
    }
    res.render('shoppingcart.ejs', {message: false, cart, user: req.user, cartCount: cart.contents.length});
})

app.post('/b/checkout', authAndRedirectSignIn, async (req, res)=>{
    if(!req.session.cart) return res.send("Shopping Cart is Empty");

    //collection: orders
    //{uid, timestamp, cart}
    //cart = [{product, qty} ...]

    const data = {
        uid: req.user.uid,
        timestamp: firebase.firestore.Timestamp.fromDate(new Date()),
        cart: req.session.cart
    }

    try{
        const collection = firebase.firestore().collection(Constants.COLL_ORDERS);
        await collection.doc().set(data);
        req.session.car = null;
        return res.render('shoppingcart.ejs', {message: 'Checked out successfully!', cart: new ShoppingCart, user: req.user, cartCount: 0});
    }catch(e){

        const cart = ShoppingCart.deserialize(req.session.cart)
        return res.render('shoppingcart.ejs', {message: 'Check out failed. Try again later.', cart, user: req.user, cartCount: cart.contents.length});

    }
})

app.get("/b/orderhistory", authAndRedirectSignIn, async (req, res)=>{
    try{
        const collection = firebase.firestore().collection(Constants.COLL_ORDERS);
        let orders = [];
        const snapshot = await collection.where("uid", "==", req.user.uid).get()
        snapshot.forEach(doc =>{
            orders.push(doc.data());
        });
        res.render('profile.ejs', {user: req.user, cartCount: 0, orders})
    }
    catch(e){
        console.log(e)
        res.send(e)
    }
});

//middleware
function authAndRedirectSignIn(req, res, next){
    const user = firebase.auth().currentUser;
    if(!user){
        return res.redirect('signin');
    }
    else{
        req.user = user;
        return next();
    }
}
function auth(req, res, next){
    req.user = firebase.auth().currentUser;
    next();
}

const adminUtil = require('./adminUtil.js')

//Admin api
app.post('/admin/signup', (req, res)=>{
    return adminUtil.createUser(req, res);
})

app.get('/admin/sysadmin', authSysAdmin, (req, res)=>{
    res.render('admin/sysadmin.ejs');
})


app.get('/admin/listusers', authSysAdmin, (req, res)=>{
    return adminUtil.listUsers(req, res);
})


function authSysAdmin(req, res, next){
    const user = firebase.auth().currentUser;
    if(!user|| !user.email || user.email !== Constants.SYSADMIN_EMAIL){
       return  res.send(`<h1> System Admin Page: Access Denied </h1>`);
    }
    else{
       return next();
    }
}

