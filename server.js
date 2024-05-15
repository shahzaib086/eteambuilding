const fs = require('fs');
const express = require("express");
const bodyParser = require("body-parser");
const path = require('path');
const _ = require("lodash");
const jwt = require("jsonwebtoken");
const cors = require("cors");
// const csurf = require('csurf');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const flash = require('connect-flash');
const config = require('./config/app-config.js');

const PORT = process.env.PORT || 3000;

// const dotenv = require("dotenv").config();
// const nodemailer = require('nodemailer');
// const client = require('./config/connection.js');
// const auth = require('./helpers/jwt-module.js');

//Middlewares
const assetMiddleware = require('./middleware/assetMiddleware');
const {adminAuth} = require('./middleware/adminAuth.js');

// Admin Router
const adminAuthRouter = require('./routes/adminAuth.js');
const adminRouter = require('./routes/admin.js');

// Create Express Object
const app = express();
app.set('view engine', 'ejs');

app.use(cookieParser());
app.use(session({
	secret: config.session_secret_key,
	resave: false,
	saveUninitialized: false,
	// cookie: { maxAge: 3600000 } // Session expiration time in milliseconds (optional)
}));
app.use(flash());

// Middlewares 
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static('public'));
app.use(assetMiddleware);

app.use('/assets', express.static(path.join(__dirname, 'assets')))

// Admin routes
app.use("/admin", adminAuthRouter);
app.use("/admin", adminAuth, adminRouter);

app.get('/', function (req, res) {								
	return res.render("welcome");
});

app.listen(PORT, function () {
  	console.log(`E-Team Building Server listening on port ${PORT}!`);
});
