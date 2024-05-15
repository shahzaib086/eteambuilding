//js
const status = require('../../helpers/constants.js');
const db = require("../../config/connection.js");
const utils = require('../../helpers/utility.js');  
const authToken = require('../../helpers/jwt-module.js');

// For View 
const loginView = (req, res) => {

    res.render("auth/login", {
        error: { }
    } );
}

//Logging in Function
const loginUser = async (req, res) => {

    let { email, password } = req.body;
    if ( !email || (email == '') || !password || password == '') {
        return res.render("auth/login", {
            error: { msg: "Email/Password is required" }
        } );
    }

    try {        

        const get_user = await db("users").where({ email: email  }).whereIn('role_id', [ status.ROLE_SUPER_ADMIN, status.ROLE_ADMIN ]).select("*");
        if(get_user && get_user.length > 0) {

            if( get_user[0].status != 1 ) {
                return res.render("auth/login", {
                    error: { msg: "User is not active" }
                } );
            }

            let id = get_user[0].id;       
            utils.comparePassword(password, get_user[0].password, (isPasswordMatch) => {                        
                if(isPasswordMatch) {
                    
                    let d = get_user[0];
                    let auth_token = authToken.generate({
                        ...d
                    })            
                    d.access_token = auth_token
                    req.session.user = {
                        id,
                        access_token:d.access_token
                    }

                    // return res.send("LOGGED IN SUCESSFULL");
                    return res.redirect('/admin/dashboard');

                } else {
                    return res.render("auth/login", {
                        error: { msg: "Incorrect Email/Password" }
                    } );
                }
            });                 

        } else {
            return res.render("auth/login", {
                error: { msg: "User does not exist." }
            } );
        }                       
                
    } catch (error) {
        console.log(error);
        return res.render("auth/login", {
            error: { msg: "Something went wrong." }
        } );    
    }  

};

const logout = async (req, res) => {
    // Clear the session
    req.session.destroy((err) => {
        if (err) {
        console.error('Error destroying session:', err);
            return res.status(500).send('Internal Server Error');
        }
    
        // Redirect to the login page after successful logout
        res.redirect('/admin/login');
    });
};

module.exports =  {
    loginView,
    loginUser,
    logout,
};