/**
 * Application and services configurations 
 */
require("dotenv").config()

module.exports = {
    session_secret_key: process.env.SESSION_SECRET_KEY || "kQs4lOp#v123@xGyd",

    app_name: process.env.APP_NAME || "E-Team Building",
    app_base_url: process.env.APP_BASE_URL || "http://localhost:3000",
    
};