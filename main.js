
var express = require('express'),
	app = express(),
	path = require('path');
	request = require("request"),
	ejs = require('ejs'),
	bodyparser = require("body-parser"),
	passport = require("passport"),
	LocalStrategy = require("passport-local"),
	passportLocalMongoose = require("passport-local-mongoose"),
	User =require("./models/user.js"),
	mongoose = require("mongoose");

app.set('view engine', 'ejs')
app.set('views', path.join(__dirname + '/views'))
app.use(bodyparser.urlencoded({extended : true}));


mongoose.connect("mongodb+srv://admin:9TW9THA7xq7BJS5m@liang-yu-mcstm.mongodb.net/walls", {
	useNewUrlParser: true,
	useUnifiedTopology: true}  
	);


// SESSION CONFIGURATION
app.use(require("express-session")({
	secret: "secret HMAC key",
	resave: false,
	saveUninitialized: false
}));

// PASSPORT AUTHENTICATION CONFIGURATION
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(function(req, res, next){
	if(isLoggedIn){
		res.locals.currentUser = req.user;
		next();
	}
});

//SCHEMA SETUP
var wallsschema = new mongoose.Schema({
	name: String,
	image: String
});
var Wall = mongoose.model("Walls", wallsschema);

function addwall(newwall) {
	Wall.create(newwall, function(err, walls){
		if (err){
			console.log(err);
			return false;
		} else {
			console.log("Newly added wallpaper:");
			console.log(walls);
			return true;
		}
	});
}


function validURL(str) {
  var pattern = new RegExp('^(https?:\\/\\/)?'+ // protocol
    '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|'+ // domain name
    '((\\d{1,3}\\.){3}\\d{1,3}))'+ // OR ip (v4) address
    '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*'+ // port and path
    '(\\?[;&a-z\\d%_.~+=-]*)?'+ // query string
    '(\\#[-a-z\\d_]*)?$','i'); // fragment locator
  return !!pattern.test(str);
}



app.get("/", function(req, res){
	res.render("landing.ejs");
});

app.get("/walls", function(req, res){
	console.log(req.user);
	Wall.find({}, function(err, walls){
		if (err){
			console.log(err);
		} else {
			res.render("walls", {walls:walls});
		}
 	});
});

app.post("/walls", isLoggedIn, function(req,res){
	var name = req.body.name;
	var img = req.body.image;
	var isURL = validURL(img);
	if (name !== "" && isURL) {
		var newwall = {name:name, image: img};
		addwall(newwall);
		res.redirect("/walls");
	} else {
		res.redirect("/walls/new");
	}
});

app.get("/walls/new", isLoggedIn, function(req, res){
	res.render("new.ejs");
});

app.get("/walls/:id", function(req, res){
	res.redirect("/");
});


// SIGN UP ROUTE
// register form
app.get("/register", function(req, res){
	res.render("register");
});
// sign up logic
app.post("/register", function(req, res){
	var newUser = new User({username: req.body.username});
	User.register(newUser, req.body.password, function(err, user){
		if(err){
			console.log(err);
			return res.render("register");
		}
		passport.authenticate("local")(req, res, function(){
			res.redirect("walls");
		});
	});
});

//LOGIN ROUTE
//Login Form
app.get("/login", function(req, res){
	res.render("login");
});
//Login Logic
app.post("/login", passport.authenticate("local", {successRedirect: "/",
	failureRedirect: "/login"
 }), function(req, res){
});

//LOGOUT ROUTE
app.get("/logout", isLoggedIn, function(req, res){
	req.logout();
	res.redirect("/");
});

function isLoggedIn(req, res, next){
	if(req.isAuthenticated()){
		return next();
	}
	res.redirect("/login");
}

let port = process.env.PORT;
if (port==null || port == ""){
	port = 88;
}
var listener = app.listen(port, function(){
    console.log('Wallpaper Server running on port ' + listener.address().port);
});
