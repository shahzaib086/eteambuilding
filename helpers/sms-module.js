
require("dotenv").config();
// if (dotenv.error) {
//   console.error("Error occurred while setting dot env files : ", dotenv.error);
// }
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const phoneNumber = process.env.TWILIO_PHONE_NUMBER;
const client = require("twilio")(accountSid, authToken);


const sendSms = (recipient, message) => {
    return new Promise((resolve, reject) => {
		
		client.messages
			.create({ body: message, from: phoneNumber, to: recipient })
				.then((message) => {
					console.log(message.sid);
					resolve(message.sid);		  						  				
				})
				.catch((err) => {
			if (err) {
				console.log(err);
				reject(err.message)
			}
		});
          
  	});
}

const sendOTPSms = async (recipient, otp_code) => {
	try{
		// return true;
		let msg = `Your PEL phone verification code is ${otp_code}. Never share this code with anyone.`;
		return await sendSms(recipient, msg);
	} catch (error) {
		// Handle the error as needed
		console.error('Error sending OTP SMS:', error.message);
		return true;
	}
}

module.exports = {sendSms, sendOTPSms }