'use strict'

const fs = require('fs');
const jwt = require("jsonwebtoken");
const privateKEY 	= fs.readFileSync('./keys/private.key','utf-8'); // to sign JWT
const publicKEY 	= fs.readFileSync('./keys/public.key', 'utf8'); 	// to verify JWT

// ======= Status Helpers ====== //
let status = require('./constants')

var signOptions = {
	issuer: 	"PEL-Community Authorizaxtion Bearer",	
	expiresIn: 	"365d",
	algorithm: 	"RS256" // RSASSA options[ "RS256", "RS384", "RS512" ]
};

module.exports = {
	generate: ( payload ) => {
		
		// Token signing options				
		return jwt.sign(payload, privateKEY, signOptions);
	},
	authHandler: (req, res, next) => {
		const authHeader = req.headers.authorization;
		if (!authHeader) {
			res.status(401).json({
				status: status.FAILURE_STATUS,
				message: 'You are not authorized to access this resource!',
			});
		}
		const token = authHeader.split(" ")[1];
		try {    	
				const user = jwt.verify(token, publicKEY, signOptions);
				req.user = user;
				next();
		} catch (error) {
			res.status(401).json({
				status: status.FAILURE_STATUS,
				message: 'Unauthorized! '+ error,
			});
		}
	}
};