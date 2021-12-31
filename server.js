const express = require("express");
const session = require("express-session");
const app = express();
const pug = require("pug");
const fs = require("fs");
const path = require("path");
const mongo = require("mongodb");
const mongoose = require("mongoose");
const User = require("./UserModel");
const Orders = require("./OrderModel");
const port = 3000;
const MongoClient = mongo.MongoClient;
const MongoDBStore = require("connect-mongodb-session")(session);
const USER_COLLECTION = "USER_COLLECTION";
let db;

// Creating a new MongoDBStore to save all the users information to the database
// These where inspired by Professor McKenney's video on MongoDB & Sessions
let userOrder = new MongoDBStore({
    uri: "mongodb://localhost:27017/ordering-system",
    collection: "UserSession"
});

function auth(request, response, next) { // Authorization of user at login
    // User will be redirected to the login page in they're not logged in
    if (request.session.loggedin === false) {
        response.status(401).redirect("/");
    } else {
        console.log("Handling request from: " + request.session.username);
        console.log(request.session.loggedin);
        response.status(200).send( // Otherwise they will be redirected to their logged in home page
            pug.renderFile("./private/home.pug", { user : request.session.username }
        )); 
    } next();
}

function login(request, response, next) {
    // Preventing a user from logging in twice
	if(request.session.loggedin === true) {
		response.status(200).redirect("/home");
		return;
	} const { username, password } = request.body;
    console.log("Logging in with credentials:");
    console.log("Username: " + username);

    db.collection(USER_COLLECTION).find().toArray((err, results) => {
        // Connecting to the USER_COLLECTION database collection to validate that
        // the user is stored in our database at login
        const users = {};
        for(let i = 0; i < results.length; i++) {
            users[results[i].username] = results[i];
        }
        if (!users.hasOwnProperty(username)) {
            response.status(400).send("User does not exist");
            return;
        }
        if (users[username].password === password) {
            request.session.loggedin = true;
            request.session.username = username;
            response.status(200).redirect("/home");
        } else {
            response.status(401).send("Invalid credentials");
        }
    });
}

function logout(request, response, next) {
	if(request.session.loggedin) {
		request.session.loggedin = false;
        request.session.username = undefined;
        response.status(200).redirect("/");
        console.log("Logged Out");
	} else {
		response.status(200).send("You cannot log out because you aren't logged in.");
	}
}

// Setting up the middleware
app.use(express.static(path.join(__dirname, "public")));
app.set(path.join(__dirname, "views"));
app.set("view engine", "pug");
app.use(express.static("public"));
app.use(express.urlencoded({ extended : true }));
// Only serve the contents of private to those that are logged in
app.use("/private", auth, express.static(path.join(__dirname, "private")));
app.use(express.json());
app.use(
    session({
        secret: "some secret key",
        resave: true,
        saveUninitialized: false,
        store: userOrder
    })
);

app.get(["/", "/home", "/login"], auth);
app.post("/login", login);

// The "/home" and "/order" will both check that the user is logged in if 
// they try to access these links when they're not they won't be granted permission to view either page
app.get("/order", (request, response) => { 
    if(request.session.loggedin) {
        response.status(200).end(pug.compileFile("private/order.pug")()) 
    } else {
        response.status(401).redirect("/");
    }
});

app.get("/register", function(request, response) {
    response.sendFile(path.join(__dirname, "/public/register.html"));
});

app.get("/logout", logout);
app.get("/add.png", (request, response) => {
    let data = fs.readFileSync("public/add.png");
    response.setHeader("Content-type", "image/png");
    response.end(data);
});

app.get("/remove.png", (request, response) => {
    let data = fs.readFileSync("public/remove.png");
    response.setHeader("Content-type", "image/png");
    response.end(data);
});

app.get("/public/orderform.js", (request, response) => {
    fs.readFile("public/orderform.js", function(err, data) {
        response.end(data);
    });
});

// POST request when a user places a new order to be added to their Order History
app.post("/order", (request, response) => {
    console.log("POST /order");
    // Displaying order summary by session
    let order = request.body;
    order["username"] = request.session.username;
    response.json(order);
    console.log("POST /order");
    console.log(`Order request by ${request.session.username} received!`);
    console.log(order);
    // Saving the new order as a new schema provided by OrderModel.js to be stored in mongo
    const newOrder = new Orders({ type: "Order", ...order });
    let orders = [];
    newOrder.save((err, result) => {
        if (err) {
            throw err;
        } orders.push(result);
    }); 
    response.status(200);
});

// Instead of using the 3 JSON files for the restaurants, I used a text file to store all three
app.get("/restaurant.txt", (request, response) => {
    fs.readFile("restaurant.txt", function(err, data) {
        response.end(data);
    })
});

// Handling the user request
app.get("/users", (request, response) => {
    console.log("GET /users");
    db.collection(USER_COLLECTION).find().toArray((err, results) => {
        const responseUsers = results;
        response.status(200).send( pug.renderFile("./views/users/users.pug", { 
            users : responseUsers, loggedin : request.session.loggedin 
        }));
    });
});

// Handling the /user/:id request
app.get("/users/:id", (request, response) => {
    console.log(`GET /users/${request.params.id}`);
    const paramID = request.params.id;
    let oid;
    try {
        oid = new mongo.ObjectID(paramID);
    } catch {
        response.status(404).send("Unknown ID");
        return;
    } db.collection(USER_COLLECTION).findOne({ _id: oid }, (err, data) => {
        if (err) {
            response.status(404).send(`User with ID ${paramID} does not exist.`);
        } response.send(pug.renderFile("./views/users/user.pug", { 
            user: data, loggedin : request.session.loggedin 
        }));
        response.status(200);
    });
});

// Registration process
app.post("/register", (request, response) => {
    let users = [];
    console.log(request.body);
    const newUser = new User({
        type: "User",
        ...request.body,
    })
    newUser.save((err, result) => {
        if (err) {
            throw err;
        } users.push(result);
        db.collection(USER_COLLECTION).find().toArray((err, results) => {
            const newUsers = {};
            for(let i = 0; i < results.length; i++) {
                newUsers[results[i].username] = results[i];
            }
            if (!newUsers.hasOwnProperty(request.body.username)) {
                console.log("New user added!");
                db.collection(USER_COLLECTION).insertMany(users);
                request.session.username = request.body.username;
                request.session.loggedin = true;
                response.status(201).redirect("/home");
                return;
            } response.status(401).send("This username is taken, please choose another one");
        })
    })
});

// Connecting to mongoose to update both the new users and requested orders
mongoose.connect("mongodb://localhost:27017/ordering-system", { useUnifiedTopology : true });
// Server listens on port 3000
// "mongodb://localhost:27017/ordering-system"
MongoClient.connect("mongodb://localhost:27017/ordering-system", (err, client) => {
    if (err) {
        throw err;
    } db = client.db("ordering-system");
    app.listen(process.env.PORT || port);
    console.log("Server running at http://127.0.0.1:3000/");
});