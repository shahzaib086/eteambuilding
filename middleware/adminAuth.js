const db = require("../config/connection.js");
const status = require('../helpers/constants.js');
const utils = require('../helpers/utility.js'); 
const fs = require('fs');
const jwt = require("jsonwebtoken"); 
const privateKEY 	= fs.readFileSync('./keys/private.key','utf-8'); // to sign JWT
const publicKEY 	= fs.readFileSync('./keys/public.key', 'utf8'); 	// to verify JWT

const User = require('../models/user.js'); 

var signOptions = {
	issuer: 	"PEL-Community Authorizaxtion Bearer",	
	expiresIn: 	"12h",
	algorithm: 	"RS256" // RSASSA options[ "RS256", "RS384", "RS512" ]
};

/**
 * This middleware will verify admin auth.
 */
const adminAuth = async (req, res, next) => {

    if (req.session && req.session.user) {
        // The "user" key exists in the session, and it has a value.
        const token = req.session.user.access_token;
        // const user = req.session.user;
        const user = jwt.verify(token, publicKEY, signOptions);
        // try {    
            const userModel = new User();	
            const get_user = await userModel.getById(user.id);  
            if(get_user) {
                
                const permissions = await userModel.getPermissions(user);

                //Setting auth for authenticate sessions
                req.session.auth = get_user;
                req.session.permissions = permissions;

                // Setting auth var for views global
                res.locals.auth = get_user;
                res.locals.permissions = permissions;

                //Check flash var for toasts
                res.locals.toast_type = req.flash('type');
                res.locals.toast_message = req.flash('message');
                res.locals.errors = req.flash('errors');
                res.locals.errors = (res.locals.errors.length>0)?res.locals.errors[0]:null;

                return next();
            }
        // } catch (error) {
        //     return res.redirect('/admin/login');
        // }

    } else {
        return res.redirect('/admin/login');
    }

}

module.exports = {
	adminAuth
};