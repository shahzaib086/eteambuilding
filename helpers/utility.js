const fs = require('fs');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto')
const dayjs = require('dayjs'); 

const cryptoSecretKey = 'vOVH6sdmpNWjRRIqCc7rdxs01lwHzfr3';


/**
 * @desc: format to for mysql
 * @param: {String || Object} date - date string or object
 * @returns: {String}
 * @modified: By Shahzaib A.
 */
exports.getFormatedDate = function (date) {
	// Your default date object
	var starttime = date || new Date();
	// Get the iso time (GMT 0 == UTC 0)
	var isotime = new Date((new Date(starttime)).toISOString());
	// getTime() is the unix time value, in milliseconds.
	// getTimezoneOffset() is UTC time and local time in minutes.
	// 60000 = 60*1000 converts getTimezoneOffset() from minutes to milliseconds.
	var fixedtime = new Date(isotime.getTime() - (starttime.getTimezoneOffset() * 60000));
	// toISOString() is always 24 characters long: YYYY-MM-DDTHH:mm:ss.sssZ.
	// .slice(0, 19) removes the last 5 chars, ".sssZ",which is (UTC offset).
	// .replace('T', ' ') removes the pad between the date and time.
	var formatedMysqlString = fixedtime.toISOString().slice(0, 19).replace('T', ' ');
	return formatedMysqlString;
};

/**
 * @desc: make str slug
 * @param: {String} str - any string value
 * @returns: {String}
 * @modified: By Shahzaib A.
 */
exports.createSlug = function (str) {
	return str
	  .toLowerCase()
	  .replace(/[^\w\s]/g, '') // Remove non-word characters
	  .replace(/\s+/g, '-')     // Replace spaces with hyphens
	  .trim();                  // Trim leading and trailing spaces
}

/**
 * @desc: validate email
 * @param: {String} email - email address
 * @returns: {Boolean}
 * @modified: By Shahzaib A.
 */
exports.validateEmail = function (email) {
	var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
	return re.test(email);
};

/**
 * @desc: validate phone number
 * @param: {String} phone - phone number
 * @returns: {Boolean}
 * @modified: By Shahzaib A.
 */
exports.validatePhone = function (phone) {
	var re = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/im;
	return re.test(phone);
};

/**
 * @desc: validate phone number
 * @param: {String} phone - phone number
 * @returns: {Boolean}
 * @modified: By Shahzaib A.
 */
exports.cleanPhoneNumber = function (phone) {
	// Remove the '+' sign
	let cleanedNumber = phone.replace(/\+/g, '');
	// Remove extra spaces
	cleanedNumber = cleanedNumber.replace(/\s+/g, '');
	// Remove alphabets
	cleanedNumber = cleanedNumber.replace(/[a-zA-Z\s+]/g, '');
	return cleanedNumber;
};


/**
 * @desc: Fuynction To ganerate otp
 */
exports.generateOTP = function () { 
    // Declare a digits variable  
    // which stores all digits 
    var digits = '0123456789'; 
    let OTP = ''; 
    for (let i = 0; i < 4; i++ ) { 
        OTP += digits[Math.floor(Math.random() * 10)]; 
    } 
    return OTP.toString(); 
} 


/**
 * @desc: get difference of days between date range
 * @param: {String} start - start date
 * @param: {String} end - end date
 * @returns: {Int}
 * @modified: By Shahzaib A.
 */
exports.getDaysDifference = function (start, end) {
	var oneDay = 24 * 60 * 60 * 1000; // hours*minutes*seconds*milliseconds
	var firstDate = new Date(start);
	var secondDate = new Date(end);

	return Math.round(Math.abs((firstDate.getTime() - secondDate.getTime()) / (oneDay)));
};

/**
 * @desc: get unique id
 * @param: none
 * @returns: {String}
 * @modified: By Shahzaib A.
 */
exports.guid = function() {
	function s4() {
		return Math.floor((1 + Math.random()) * 0x10000)
			.toString(16)
			.substring(1);
	}
	return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
		s4() + '-' + s4() + s4() + s4();
}

/**
 * @desc: get unique id
 * @param: none
 * @returns: {String}
 * @modified: By Shahzaib A.
 */
exports.uuid4 = function() {
	return uuidv4();
}

// Encryption function
exports.encrypt = function(text) {
	text = text.toString();
	let iv = crypto.randomBytes(16);
	let cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(cryptoSecretKey), iv);
	let encrypted = cipher.update(text, 'utf-8', 'hex');
	encrypted += cipher.final('hex');
	return `${iv.toString('hex')}:${encrypted}`;
}

// Decryption function
exports.decrypt = function(encryptedText) {
	let [ivHex, encrypted] = encryptedText.split(':');
	let iv = Buffer.from(ivHex, 'hex');
	let decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(cryptoSecretKey), iv);
	let decrypted = decipher.update(encrypted, 'hex', 'utf-8');
	decrypted += decipher.final('utf-8');
	return decrypted;
}

exports.intToFloat = function (num, decPlaces) { 
	return parseFloat(num).toFixed(decPlaces); 
}

// Generate Password hash
exports.cryptPassword = function(password, callback) {
	bcrypt.genSalt(10, function(err, salt) {
	 	if (err) 
	   		return callback(err);
 
	    bcrypt.hash(password, salt, function(err, hash) {	    
	    	return callback(hash);
	 	});
   });
};

// Compare Hash password with plaintext
exports.comparePassword = function(plainPass, hashPass,callback) {	
	
	bcrypt.compare(plainPass, hashPass, function (err, isPasswordMatch) {   		
		if(err) return callback(err);			
		return callback(isPasswordMatch);
	});		
};


/* Function to generate combination of password */
exports.generatePassword = function() {
	var pass = '';
	var str = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ' + 
			'abcdefghijklmnopqrstuvwxyz0123456789@#$';
	  
	for (let i = 1; i <= 8; i++) {
		var char = Math.floor(Math.random()
					* str.length + 1);
		  
		pass += str.charAt(char)
	}	  
	return pass;
}


exports.calculateAge = function (dateOfBirth) {
	const today = dayjs();
	const birthDate = dayjs(dateOfBirth);
	const years = today.diff(birthDate, 'year');
	return years;
}

exports.getEmailTemplate = function (body) {
	return `${body}`;
};