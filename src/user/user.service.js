const express = require("express");
const multer = require('multer');

const authToken = require('../../helpers/jwt-module.js')
const db = require("../../config/connection.js");
const status = require('../../helpers/constants.js');
const utils = require('../../helpers/utility.js');
const {sendOTPEmail, sendWelcomeEmail, sendForgotPasswordEmail} = require('../../helpers/email-module.js');
const {sendOTPSms} = require('../../helpers/sms-module.js');
const dayjs = require('dayjs'); 
const router = express.Router();
const path = require('path');
const { ImageAnnotatorClient } = require('@google-cloud/vision');
const fs = require('fs');
const User = require('../../models/user.js');

// Google Cloud Vision client
const visionClient = new ImageAnnotatorClient({
    keyFilename: path.join(process.cwd(), './google-vision.json')
});

var storage = multer.diskStorage({
    destination: function (req, file, cb) {
       cb(null, './assets/profile/');
    },    
    filename: function (req, file, cb) {
        const fileExtension = file.originalname.split('.').pop(); // Get the file extension
        // console.log(fileExtension)
        const uniqueFileName = `${utils.uuid4()}.${fileExtension}`;
        cb(null, uniqueFileName);
    }
});
const upload = multer({
    storage: storage,
    // limits: {
    //     fileSize: 1024 * 1024 * 10
    // },      
    }).fields(
    [
        {
            name:'profile_image',
            maxCount: 1
        },			
    ]
);

//Gallery Images Funcs
var storageGalleryImages = multer.diskStorage({
    destination: function (req, file, cb) {
       cb(null, './assets/gallery_images/');
    },
    filename: function (req, file, cb) {
        const fileExtension = file.originalname.split('.').pop(); // Get the file extension
        const uniqueFileName = `${utils.uuid4()}.${fileExtension}`;
        cb(null, uniqueFileName);
    }
});
const uploadGalleryImages = multer({
    storage: storageGalleryImages,
    // limits: {
    //     fileSize: 1024 * 1024 * 10
    // },      
    }).fields(
    [
        {
            name:'gallery_images',
            maxCount: 6
        },			
    ]
);

async function checkIfUserExist(phone,email) {
    
    let search_column;
    if(phone && phone !== '') {
        search_column = { phone_number: phone }    
    } else {
        search_column = { email: email }    
    }

    const users = await db("users").where(search_column).select("*");
    if (users.length !== 0) {

        let d = users[0];
        d.isExist = true;
        return d;                    

    } else {        
        return false;
    }
}


// ========= Send Sms and Email OTP ========= //

router.post("/send-otp", async (req, res) => {

    let { otp_type, phone_number, email, user_id } = req.body;
    if (!otp_type || otp_type == '') {
        return res.json({
            status: status.FAILURE_STATUS,
            message: "OTP type is required",            
        });
    }

    if(otp_type == "sms") {
        try {
            if (!phone_number || phone_number == '') {
                return res.json({
                    status: status.FAILURE_STATUS,
                    message: "Phone number is required",
                    data: {}            
                });
            }
            
            let country_code = req.body.country_code??null;
            phone_number = utils.cleanPhoneNumber(phone_number);
            if (phone_number && phone_number.length < 11) {
                return res.json({
                    status: status.FAILURE_STATUS,
                    message: "Invalid phone number length",
                    data: {}            
                });
            }

            let checkUserExist = await checkIfUserExist(phone_number, '')            
            if(checkUserExist.isExist && checkUserExist.password != null)  {
                return res.json({
                    status: status.FAILURE_STATUS,
                    message: "User already registered with mobile number!",            
                    data: {}
                });
            }
            
            let otp_code = "1122";
            let otp_created_at = utils.getFormatedDate();
            
            if(!checkUserExist) {
                
                //Getting x-api-token from header and update fcm token to user
                let api_token = req.api_token;
                let apiTokenResult = await db("api_token").where({token:api_token}).first();

                const user = await db("users").returning('id').insert({ phone_number, country_code, fcm_token: apiTokenResult?.fcm_token });
                let id = user[0].id;

                //Send OTP SMS
                await sendOTPSms('+'+phone_number, otp_code);

                const users = await db("users").where({ id })
                        .update({ otp_code, otp_created_at, role_id: status.ROLE_USER }, ["id", "otp_code", "otp_created_at"]);
                        if (users.length !== 0) {

                            res.json({
                                status: status.SUCCESS_STATUS,
                                message: 'Otp send successfully to your registered mobile number!',						
                                data : {
                                    // otp_code: parseInt(otp_code),
                                    user_id: id
                                }
                            });
                                    
                        } else {
                            res.json({
                                status: status.FAILURE_STATUS,
                                message: 'Failed to send otp!',						
                                data: {}
                            });
                        }                
            } else {

                let id = checkUserExist.id;

                //Send OTP SMS
                await sendOTPSms('+'+phone_number, otp_code);

                const users = await db("users").where({ id })
                        .update({ otp_code, otp_created_at }, ["id", "otp_code", "otp_created_at"]);
                        if (users.length !== 0) {

                            res.json({
                                status: status.SUCCESS_STATUS,
                                message: 'Otp send successfully to your registered mobile number!',						
                                data : {
                                    // otp_code: parseInt(otp_code),
                                    user_id: id
                                }
                            });
                                    
                        } else {
                            res.json({
                                status: status.FAILURE_STATUS,
                                message: 'Failed to send otp!',						
                                data: {}
                            });
                        }                
            }
            
        } catch (error) {
            res.json({
                status: status.FAILURE_STATUS,
                message: error.message,						                
                data: {}
            });      
        }
    } else {

        try {

            if (!email || email == '') {
                return res.json({
                    status: status.FAILURE_STATUS,
                    message: "Email is required",            
                    data: {}
                });
            }
            
            let checkUserExist = await checkIfUserExist('', email)
            if(checkUserExist.isExist && checkUserExist.password != null) {
                return res.json({
                    status: status.FAILURE_STATUS,
                    message: "User already registered with this email!",            
                    data: {}
                });
            }
            const get_user = await db("users").where({ id: user_id }).select("*");
            
            if(get_user && get_user.length > 0) {

                // Temporary disable otp generation
                // let otp_code = utils.generateOTP();
                let otp_code = "1122";
                let otp_created_at = utils.getFormatedDate()
                let id = user_id;
                
                const result = await sendOTPEmail(email, otp_code);
                if(result) {
                            
                    const users = await db("users").where({ id }).update({ otp_code, otp_created_at, email }, ["id", "otp_code", "otp_created_at", "email"]);
                    if (users.length !== 0) {

                        res.json({
                            status: status.SUCCESS_STATUS,
                            message: 'Otp send successfully to your registered email!',						                                    
                            data: {
                                // otp_code: parseInt(otp_code),
                                user_id: id
                            }
                        });                                    
                    } else {
                        res.json({
                            status: status.FAILURE_STATUS,
                            message: 'Failed to send otp!',						
                            data: {}
                        });
                    }                
                } else {
                    res.json({
                        status: status.FAILURE_STATUS,
                        message: 'Something went wrong while sending email !',						
                        data: {}
                    });
                }
            } else {
                res.json({
                    status: status.SUCCESS_STATUS,
                    message: 'User not found!',						                    
                    data: {}
                });
            }                       
                  
        } catch (error) {
            res.json({
                status: status.FAILURE_STATUS,
                message: error.message,						                
                data: {}
            });      
        }
    }
});


// ========= Re-Send Sms and Email OTP ========= //

router.post("/resend-otp", async (req, res) => {

    let { otp_type, phone_number, email, user_id } = req.body;
    if (!otp_type || otp_type == '') {
        return res.json({
            status: status.FAILURE_STATUS,
            message: "OTP type is required",            
        });
    }    
    
    if(otp_type == "sms") {
        try {

            if (!phone_number || phone_number == '') {
                return res.json({
                    status: status.FAILURE_STATUS,
                    message: "Phone number is required",
                    data: {}            
                });
            }

            if (phone_number && phone_number.length < 11) {
                return res.json({
                    status: status.FAILURE_STATUS,
                    message: "Invalid phone number length",
                    data: {}            
                });
            }

            let checkUserExist = await checkIfUserExist(phone_number, '')                                                
                    
            if(checkUserExist){    

                let otp_code = "1122";
                let otp_created_at = utils.getFormatedDate();
                let id = checkUserExist.id;

                //Send OTP SMS
                await sendOTPSms('+'+phone_number, otp_code);
                
                const users = await db("users").where({ id }).update({ otp_code, otp_created_at }, ["id", "otp_code", "otp_created_at"]);
                if (users.length !== 0) {

                    res.json({
                        status: status.SUCCESS_STATUS,
                        message: 'Otp resend successfully to your registered mobile number!',						
                        data : {
                            // otp_code: parseInt(otp_code),
                            user_id: id
                        }
                    });
                            
                } else {
                    res.json({
                        status: status.FAILURE_STATUS,
                        message: 'Failed to send otp!',						
                        data: {}
                    });
                }                
            }

        } catch (error) {

            res.json({
                status: status.FAILURE_STATUS,
                message: error.message,						                
                data: {}
            });      
        }
    } else {

        try {

            if (!email || email == '') {
                return res.json({
                    status: status.FAILURE_STATUS,
                    message: "Email is required",            
                    data: {}
                });
            }
                        
            const get_user = await db("users").where({ id: user_id }).select("*");            
            if(get_user && get_user.length > 0) {

                // Temporary disable otp generation
                // let otp_code = utils.generateOTP();
                let otp_code = "1122";
                let otp_created_at = utils.getFormatedDate()
                let id = user_id;
                
                const users = await db("users").where({ id }).update({ otp_code, otp_created_at, email }, ["id", "otp_code", "otp_created_at", "email"]);
                if (users.length !== 0) {

                    res.json({
                        status: status.SUCCESS_STATUS,
                        message: 'Otp resend successfully to your registered email!',						                                    
                        data: {
                            // otp_code: parseInt(otp_code),
                            user_id: id
                        }
                    });
                            
                } else {
                    res.json({
                        status: status.FAILURE_STATUS,
                        message: 'Failed to send otp!',						
                        data: {}
                    });
                }                
            } else {

                res.json({
                    status: status.SUCCESS_STATUS,
                    message: 'User not found!',						                    
                    data: {}
                });
            }                       
                  
        } catch (error) {

            res.json({
                status: status.FAILURE_STATUS,
                message: error.message,						                
                data: {}
            });      
        }
    }
});


// ========= Verify Sms and Email OTP ========= //

router.post("/verify-otp", async (req, res) => {

    let { otp_type, phone_number, email, otp_code, user_id } = req.body;
    if (!otp_type || otp_type == '') {
        return res.json({
            status: status.FAILURE_STATUS,
            message: "OTP type is required",            
            data: {}
        });
    }    
    
    if(otp_type == "sms") {
        try {

            if (!user_id || user_id == '') {
                return res.json({
                    status: status.FAILURE_STATUS,
                    message: "User id is required",            
                    data: {}
                });
            }                                    
                        
            const user = await db("users").where({ id: user_id }).select("*");            
            
            if(user && user[0].otp_code == otp_code) {

                let is_phone_verified = 1;
                let phone_verified_at = utils.getFormatedDate()
                let signup_steps = status.SIGNUP_STEP_PHONE_VERIFY;
                let otp_code = null;
                let id = user[0].id;
                
                const users = await db("users").where({ id })
                        .update({ is_phone_verified, phone_verified_at, otp_code, signup_steps }, ["id", "is_phone_verified", "phone_verified_at"]);
                            if (users.length !== 0) {

                                res.json({
                                    status: status.SUCCESS_STATUS,
                                    message: 'Your Phone Number Verified Successfully!',						                                    
                                    data: {
                                        user_id: id
                                    }
                                });
                                        
                            } else {
                                res.json({
                                    status: status.FAILURE_STATUS,
                                    message: 'Failed to send otp!',						
                                    data: {}
                                });
                            }                
            } else {

                res.json({
                    status: status.FAILURE_STATUS,
                    message: 'Invalid OTP',						                    
                    data: {}
                });
            }                                         

        } catch (error) {

            res.json({
                status: status.FAILURE_STATUS,
                message: error.message,						                
                data: {}
            });      
        }
    } else {

        try {

            if (!user_id || user_id == '') {
                return res.json({
                    status: status.FAILURE_STATUS,
                    message: "Email is required",            
                    data: {}
                });
            }
                                                                        
            const get_user = await db("users").where({ id: user_id }).select("*");
            
            if(get_user && get_user[0].otp_code == otp_code) {
                
                let is_email_verified = 1;
                let email_verified_at = utils.getFormatedDate()
                let signup_steps = status.SIGNUP_STEP_EMAIL_VERIFY;
                let otp_code = null;
                let id = get_user[0].id;
                
                const users = await db("users")
                        .where({ id })
                            .update({ is_email_verified, email_verified_at, otp_code, signup_steps }, ["id", "is_email_verified", "email_verified_at"]);
                            if (users.length !== 0) {
                                
                                //Send welcome email on verification
                                let result = await sendWelcomeEmail(get_user[0].email);

                                res.json({
                                    status: status.SUCCESS_STATUS,
                                    message: 'Your Email Verified Successfully!',						
                                    data: {
                                        user_id: id
                                    }
                                });
                                        
                            } else {
                                res.json({
                                    status: status.FAILURE_STATUS,
                                    message: 'Failed to send otp!',						
                                    data: {}
                                });
                            }                
            } else {
                res.json({
                    status: status.FAILURE_STATUS,
                    message: 'Invalid OTP',						                    
                    data: {}
                });
            }                       
                  
        } catch (error) {
            res.json({
                status: status.FAILURE_STATUS,
                message: error.message,						                
                data: {}
            });      
        }
    }
});


// ========= SET User Password ========= //

router.post("/set-password", async (req, res) => {

    let { email, password, user_id } = req.body;
    if (!password || password == '') {
        return res.json({
            status: status.FAILURE_STATUS,
            message: "Password is required",            
            data: {}
        });
    }    
        
    try {

        if (!user_id || user_id == '') {
            return res.json({
                status: status.FAILURE_STATUS,
                message: "User id is required",            
                data: {}
            });
        }
        
                                                                    
        const get_user = await db("users").where({ id: user_id }).select("*");

        if(get_user && get_user.length > 0) {

            if ( (get_user[0].is_phone_verified == 0) || (get_user[0].is_email_verified == 0) ) {
                return res.json({
                    status: status.FAILURE_STATUS,
                    message: (get_user[0].is_phone_verified==0?'Phone Number':'Email Address')+' is not verified',         
                    data: {}
                });
            }
            
            let id = get_user[0].id;

            utils.cryptPassword(password, async(hashPassword) => {                        
                if(hashPassword) {

                    let signup_steps = status.SIGNUP_STEP_PASSWORD;
                    const users = await db("users").where({ id })
                    .update({ password: hashPassword, signup_steps }, ["id", "password"]);
                    if (users.length !== 0) {

                        res.json({
                            status: status.SUCCESS_STATUS,
                            message: 'Password Set Successfully!',						
                            data: {
                                user_id: id
                            }
                        });
                                
                    } else {
                        res.json({
                            status: status.FAILURE_STATUS,
                            message: 'Failed to set password!',						
                            data: {}
                        });
                    }                        
                } 
            });
                        
        } else {
            res.json({
                status: status.SUCCESS_STATUS,
                message: 'User not found!',						                    
                data: {}
            });
        }                       
                
    } catch (error) {
        res.json({
            status: status.FAILURE_STATUS,
            message: error.message,						                
            data: {}
        });      
    }    
});


// ========= SET Basic Profile Info ========= //

router.post("/set-profile-info", upload, async (req, res) => {

    let { first_name, last_name, dob, user_id } = req.body;
    let { profile_image } = req.files;
    if (!first_name || first_name == '' || 
        !last_name || last_name == '') {
        return res.json({
            status: status.FAILURE_STATUS,
            message: "First and Last Name is required",            
            data: {}
        });
    }

    if (!dob || dob == '') {
        return res.json({
            status: status.FAILURE_STATUS,
            message: "DOB is required",            
            data: {}
        });
    }

    if( !(dayjs(dob).isBefore( dayjs().startOf('day') )) ) {
        return res.json({
            status: status.FAILURE_STATUS,
            message: "DOB must be less than today.",            
            data: {}
        });
    }

    let age = utils.calculateAge(dob);
    if( age < 18 ) {
        return res.json({
            status: status.FAILURE_STATUS,
            message: "Sorry, you age must be at least 18 years old.",            
            data: {}
        });
    }

    //Detect face here using google api.
    let face_image_path = './assets/profile/' + profile_image[0].filename;
    const content = fs.readFileSync(face_image_path);
    const request = { image: { content } };
    const [result] = await visionClient.faceDetection(request);
    const faces = result.faceAnnotations;
    let faceDetected = faces.length > 0 ? true : false;

    // Optionally, you can remove the uploaded file after processing
    // fs.unlinkSync(filePath);
    let hasSunglasses = false;
    if( faceDetected ){
        hasSunglasses = faces.some((face) => {
            // Check relevant attributes, landmarks, or conditions indicating sunglasses
            // Example: Checking if the eyes are covered or darkened
            return (
              face.underExposedLikelihood === 'VERY_LIKELY' ||
              face.underExposedLikelihood === 'LIKELY'
            );
        });
    }
    
    if( !faceDetected || hasSunglasses ) {
        return res.json({
            status: status.FAILURE_STATUS,
            message: 'Please upload selfie image according to guidelines mentioned.',						                
            data: {}
        });   
    }
        
    try {

        if (!user_id || user_id == '') {
            return res.json({
                status: status.FAILURE_STATUS,
                message: "User id is required",            
                data: {}
            });
        }
                                                                    
        const get_user = await db("users").where({ id: user_id }).select("*");

        if(get_user && get_user.length > 0) {
                                 
            let image = '/assets/profile/' + profile_image[0].filename;
            let id = get_user[0].id;
            let signup_steps = status.SIGNUP_STEP_BASIC_INFO;
            // let age = utils.calculateAge(dob);

            const users = await db("users").where({ id })
                    .update({ first_name, last_name, dob, profile_image: image, signup_steps, age }, ["id", "first_name", "last_name", "dob",  "profile_image"]);
                    if (users.length !== 0) {

                        res.json({
                            status: status.SUCCESS_STATUS,
                            message: 'Basic info added successfully!',						
                            data: {
                                user_id: id
                            }
                        });
                                
                    } else {
                        res.json({
                            status: status.FAILURE_STATUS,
                            message: 'Failed to add basic info!',						
                            data: {}
                        });
                    }                
                        
        } else {

            res.json({
                status: status.SUCCESS_STATUS,
                message: 'User not found!',						                    
                data: {}
            });
        }                       
                
    } catch (error) {

        res.json({
            status: status.FAILURE_STATUS,
            message: error.message,						                
            data: {}
        });      
    }    
});


// ========= Upload picture gallery ========= //

router.post("/upload-gallery-pictures", uploadGalleryImages, async (req, res) => {
    let { user_id } = req.body;
    let { gallery_images } = req.files;
    if ( !gallery_images || (gallery_images&&gallery_images.length == 0) ) {
        res.json({
            status: status.FAILURE_STATUS,
            message: "Please upload atleast one image.",            
            data: {}
        });
    }    
        
    try {

        if (!user_id || user_id == '') {
            return res.json({
                status: status.FAILURE_STATUS,
                message: "User id is required",            
                data: {}
            });
        }
                                                                    
        const get_user = await db("users").where({ id: user_id }).select("*");

        if(get_user && get_user.length > 0) {
            let arranged_images = [];
            gallery_images.map((element,index) => {
                let image_path = '/assets/gallery_images/' + element.filename;
                arranged_images.push({
                    user_id: user_id, 
                    image_path,
                    sequence: (index+1)
                });
            });

            if( arranged_images.length>0 ){
                await db("user_images").insert( arranged_images );
            }

            let id = get_user[0].id;
            let signup_steps = status.SIGNUP_STEP_PICTURE_GALLERY;

            const users = await db("users").where({ id })
                    .update({ signup_steps }, ["id","signup_steps"]);
                    if (users.length !== 0) {

                        res.json({
                            status: status.SUCCESS_STATUS,
                            message: 'Gallery images uploaded successfully!',						
                            data: {
                                user_id: id
                            }
                        });
                                
                    } else {
                        res.json({
                            status: status.FAILURE_STATUS,
                            message: 'Failed to upload gallery images!',						
                            data: {}
                        });
                    }                
                        
        } else {
            res.json({
                status: status.SUCCESS_STATUS,
                message: 'User not found!',						                    
                data: {}
            });
        }                       
                
    } catch (error) {
        res.json({
            status: status.FAILURE_STATUS,
            message: error.message,						                
            data: {}
        });      
    } 
});

router.post("/update-gallery-sequence", async (req, res) => {
    let { images_ids } = req.body;
    if ( !images_ids || (images_ids&&images_ids.length == 0) ) {
        res.json({
            status: status.FAILURE_STATUS,
            message: "Empty gallery list not allowed.",            
            data: {}
        });
    }    
        
    try {

        for (let i = 0; i < images_ids.length; i++) {
            await db("users_images").where('id', images_ids[i]).update('sequence', i + 1);
        }

        res.json({
            status: status.SUCCESS_STATUS,
            message: 'Gallery updated successfully!',						
            data: { }
        });                      
                
    } catch (error) {
        res.json({
            status: status.FAILURE_STATUS,
            message: error.message,						                
            data: {}
        });      
    } 
});


// ========= Add Attributes ========= //

router.post("/add-attributes", async (req, res) => {
    let { user_id, characteristic_ids, height_ids, interest_ids } = req.body;
    if (!user_id || user_id == '') {
        res.json({
            status: status.FAILURE_STATUS,
            message: "User id is required",            
            data: {}
        });
    }    

    try {

        const get_user = await db("users").where({ id: user_id }).select("*");
        if(get_user && get_user.length > 0) {

            let id = get_user[0].id;
            let age = get_user[0].age;
            let signup_steps = status.SIGNUP_STEP_ATTRIBUTES;

            characteristic_ids.map(async (element) => {
                if( element ){
                    let data = {
                        user_id: id, characteristic_id: element,                        
                    };
                    let check = await db("user_characteristics").where(data).select("*");
                    if( check && check.length == 0 ){
                        await db("user_characteristics").insert( data );
                    }
                }
            });

            height_ids.map(async (element) => {
                if( element ){
                    let data = {
                        user_id: id, height_id: element,                        
                    };
                    let check = await db("user_height_preferences").where(data).select("*");
                    if( check && check.length == 0 ){
                        await db("user_height_preferences").insert( data );
                    }
                }
            });

            interest_ids.map(async (element) => {
                if( element ){
                    let data = {
                        user_id: id, interest_id: element,                        
                    };
                    let check = await db("user_interests").where(data).select("*");
                    if( check && check.length == 0 ){
                        await db("user_interests").insert( data );
                    }
                }
            });

            let attributeData = {
                user_id: id,
                gender: req.body.gender,
                gender_detail: req.body.gender_detail,                        
                education_id: req.body.education_id,
                show_education: req.body.show_education,
                work_id: req.body.work_id,
                show_work: req.body.show_work,
                religion_id: req.body.religion_id,
                show_religion: req.body.show_religion,
                community_id: req.body.community_id,
                show_community: req.body.show_community,
                like_to_date: req.body.like_to_date,
                relationship_type: req.body.relationship_type,
                age_preference_start: req.body.age_preference_start,
                age_preference_end: req.body.age_preference_end,
                age: age,                               
                my_height_id: req.body.my_height_id,
                other_work: req.body.other_work,
                other_religion: req.body.other_religion,
                other_community: req.body.other_community,
            };

            const get_user_attribute = await db("user_attributes").where({ user_id: id }).select("*");
            if(get_user_attribute && (get_user_attribute.length == 0) ){
                await db("user_attributes").insert( attributeData );
            } else {
                await db("user_attributes").where({ user_id: id }).update( attributeData );
            }

            const users = await db("users").where({ id }).update({ signup_steps }, ["id", "signup_steps" ]);
            if (users.length !== 0) {
                res.json({
                    status: status.SUCCESS_STATUS,
                    message: 'Users attributes added successfully!',						
                    data: {
                        user_id: id
                    }
                });

            } else {
                res.json({
                    status: status.FAILURE_STATUS,
                    message: 'Failed to add attributes!',						
                    data: {}
                });

            }
        } else {
            res.json({
                status: status.SUCCESS_STATUS,
                message: 'User not found!',						                    
                data: {}
            });
        }                       
                
    } catch (error) {
        res.json({
            status: status.FAILURE_STATUS,
            message: error.message,						                
            data: {}
        });      
    }    
});


// ========= Add Questions ========= //

router.post("/add-questions", async (req, res) => {
    let { questions, user_id } = req.body;
    if ( !questions || (questions && (questions.length < 1)) ) {
        res.json({
            status: status.FAILURE_STATUS,
            message: "Min 1 question is required",            
            data: {}
        });
    }

    try {

        if (!user_id || user_id == '') {
            res.json({
                status: status.FAILURE_STATUS,
                message: "User id is required",            
                data: {}
            });
        }
                                                                    
        const get_user = await db("users").where({ id: user_id }).select("*");
        if(get_user && get_user.length > 0) {
         
            let id = get_user[0].id;
            let profile_status = status.USER_PROFILE_PENDING;
            let signup_steps = status.SIGNUP_STEP_QUESTIONS;
            let arrange_questions = [];

            questions.map(element => {
                if( (element.question != null) && (element.question != '') 
                    && (element.answer != null) && (element.answer != '') ){
                    arrange_questions.push({
                        user_id: id, 
                        question: element.question,
                        answer: element.answer,
                        sequence: element.sequence                        
                    });
                }
            });

            if( arrange_questions.length>0 ){
                await db("user_questions").where( {user_id: id} ).del();
                await db("user_questions").insert( arrange_questions );
            }

            const users = await db("users").where({ id }).update({ status: profile_status, signup_steps }, ["id", "signup_steps" ]);
            if (users.length !== 0) {
                res.json({
                    status: status.SUCCESS_STATUS,
                    message: 'Questions added successfully!',						
                    data: {
                        user_id: id
                    }
                });
            } else {
                res.json({
                    status: status.FAILURE_STATUS,
                    message: 'Failed to add questions!',						
                    data: {}
                });
            }             
                
        } else {
            res.json({
                status: status.SUCCESS_STATUS,
                message: 'User not found!',						                    
                data: {}
            });
        }                       
                
    } catch (error) {
        res.json({
            status: status.FAILURE_STATUS,
            message: error.message,						                
            data: {}
        });      
    }    
});


// ========= USER LOGIN ========= //

router.post("/user-login", async (req, res) => {
    let { email, password } = req.body;
    if ( !email || (email == '') || !password || password == '') {
        res.json({
            status: status.FAILURE_STATUS,
            message: (email == "") ? 'Email is required' : "Password is required",
            error_code: 0,
            data: {}
        });
    }

    try {        

        const get_user = await db("users").where({ email: email }).whereNot('status',status.USER_PROFILE_DELETED).select("*");
        if(get_user && get_user.length > 0) {
            
            let id = get_user[0].id;  

            if((get_user[0].status == 2)||(get_user[0].status == 0)) { // Approved User
                utils.comparePassword(password, get_user[0].password, async (isPasswordMatch) => {                        
                    if(isPasswordMatch) {
                        let d = get_user[0];
                        let auth_token = authToken.generate({
                            id: id, 
                            email, 
                            password
                        })            
                        d.access_token = auth_token

                        //Getting x-api-token from header and update fcm token to user
                        let api_token = req.api_token;
                        let apiTokenResult = await db("api_token").where({token:api_token}).first();
                        if( apiTokenResult ) {
                            await db("users").where({ id: id }).update({ fcm_token: apiTokenResult.fcm_token });
                        }

                        res.json({
                            status: status.SUCCESS_STATUS,
                            message: 'User LoggedIn Successfully!!!',
                            data: d
                        });                                
                        
                    } else {
                        res.json({
                            status: status.FAILURE_STATUS,
                            message: 'Incorrect Email/Password.',	
                            error_code: 0,					
                            data : {}
                        });
                    }
                });                             
            } else if( get_user[0].status == 1 ) {
                res.json({
                    status: status.FAILURE_STATUS,
                    message: 'Your profile is not approved yet our support team will contact you soon!',	
                    error_code: 1,
                    user_id: id,		                    
                    data: {}
                });    
            } else if( get_user[0].status == 3 ) {
                res.json({
                    status: status.FAILURE_STATUS,
                    message: 'Your profile is rejected. Please submit the required details again.',	
                    error_code: 2,
                    user_id: id,
                    reject_reason: get_user[0].reject_reason,				                    
                    data: {}
                }); 
            } else if( get_user[0].status == 4 ) {
                res.json({
                    status: status.FAILURE_STATUS,
                    message: 'Your account is banned by administrator.',
                    error_code: 3,
                    user_id: id,					                    
                    data: {}					                    
                }); 
            } else {
                res.json({
                    status: status.FAILURE_STATUS,
                    message: 'Incorrect Email/Password.',
                    error_code: 0,
                    data: {}
                });
            }
        } else {
            res.json({
                status: status.FAILURE_STATUS,
                message: 'Incorrect Email/Password.',		
                error_code: 0,			                    
                data: {}
            });
        }                    
                
    } catch (error) {
        res.json({
            status: status.FAILURE_STATUS,
            message: error.message,		
            error_code: 0,				                
            data: {}
        });      
    }    
});


// ========= USER LOGIN ========= //

router.post("/login-using-notification", async (req, res) => {
    let { user_id } = req.body;
    if ( !user_id || (user_id == '')) {
        res.json({
            status: status.FAILURE_STATUS,
            message: "User id is required",
            error_code: 0,
            data: {}
        });
    }

    try {        

        const get_user = await db("users").where({ id: user_id }).whereNot('status',status.USER_PROFILE_DELETED).select("*");
        if(get_user && get_user.length > 0) {
            
            let id = get_user[0].id;
            let email = get_user[0].email; 
            let password = get_user[0].password; 

            //Getting x-api-token from header and update fcm token to user
            let api_token = req.api_token;
            let apiTokenResult = await db("api_token").where({token:api_token}).first();
            console.log("SHAHZAIB FCM TOKEN",apiTokenResult, api_token)
            if( apiTokenResult ) {
                console.log("CHECK UPDATE");
                await db("users").where({ id: id }).update({ fcm_token: apiTokenResult.fcm_token });
            }

            if((get_user[0].status == 2)||(get_user[0].status == 0)) { // Approved User
                let d = get_user[0];
                let auth_token = authToken.generate({
                    id: id, 
                    email,
                    password
                })            
                d.access_token = auth_token

                res.json({
                    status: status.SUCCESS_STATUS,
                    message: 'User LoggedIn Successfully!!!',
                    data: d
                });                                
            } else if( get_user[0].status == 1 ) {
                res.json({
                    status: status.FAILURE_STATUS,
                    message: 'Your profile is not approved yet our support team will contact you soon!',	
                    error_code: 1,
                    user_id: id,		                    
                    data: {}
                });    
            } else if( get_user[0].status == 3 ) {
                res.json({
                    status: status.FAILURE_STATUS,
                    message: 'Your profile is rejected. Please submit the required details again.',	
                    error_code: 2,
                    user_id: id,
                    reject_reason: get_user[0].reject_reason,				                    
                    data: {}
                }); 
            } else if( get_user[0].status == 4 ) {
                res.json({
                    status: status.FAILURE_STATUS,
                    message: 'Your account is banned by administrator.',
                    error_code: 3,
                    user_id: id,					                    
                    data: {}					                    
                }); 
            } else {
                res.json({
                    status: status.FAILURE_STATUS,
                    message: 'Incorrect Email/Password.',
                    error_code: 0,
                    data: {}
                });
            }
        } else {
            res.json({
                status: status.FAILURE_STATUS,
                message: 'Incorrect Email/Password.',		
                error_code: 0,			                    
                data: {}
            });
        }                    
                
    } catch (error) {
        res.json({
            status: status.FAILURE_STATUS,
            message: error.message,		
            error_code: 0,				                
            data: {}
        });      
    }    
});


// ========= Forgot Password Api ========= //

router.post("/forgot-password", async (req, res) => {

    let { email} = req.body;
    if (!email || email == '') {
        return res.json({
            status: status.FAILURE_STATUS,
            message: "Email is required!",            
            data: {}
        });
    }    
        
    try {    
                
        const get_user = await db("users").where({ email: email }).select("*");        
        if(get_user && get_user.length > 0) {

            // Temporary disable otp generation
            // let otp_code = utils.generateOTP();
            let otp_code = "1122";
            let otp_created_at = utils.getFormatedDate()
            let id = get_user[0].id;

            // Send otp email 
            await sendForgotPasswordEmail(email, otp_code);
            
            const users = await db("users").where({ id })
                .update({ otp_code, otp_created_at }, ["id", "otp_code", "otp_created_at"]);
                if (users.length !== 0) {

                    res.json({
                        status: status.SUCCESS_STATUS,
                        message: 'Otp send successfully to your registered email!',						                                    
                        data: {}
                    });
                            
                } else {
                    res.json({
                        status: status.FAILURE_STATUS,
                        message: 'Failed to send otp!',						
                        data: {}
                    });
                }                
        } else {

            res.json({
                status: status.SUCCESS_STATUS,
                message: 'User not found!',						                    
                data: {}
            });
        }                       
                
    } catch (error) {

        res.json({
            status: status.FAILURE_STATUS,
            message: error.message,						                
            data: {}
        });      
    }   
});


// ========= Forgot Password Token Api ========= //

router.post("/reset-password-otp", async (req, res) => {

    let { email , otp_code } = req.body;
    if (!otp_code || otp_code == '') {
        return res.json({
            status: status.FAILURE_STATUS,
            message: "Otp code is required!",            
            data: {}
        });
    }    
        
    try {    

        if (!email || email == '') {
            return res.json({
                status: status.FAILURE_STATUS,
                message: "Email is required!",            
                data: {}
            });
        }
                
        const get_user = await db("users").where({ email: email }).select("*");        
        if(get_user && get_user.length > 0) {

            if(get_user && get_user[0].otp_code == otp_code) {
                                                
                let otp_code = null;
                let id = get_user[0].id;
                
                const users = await db("users").where({ id }).update({ otp_code }, ["id"]);
                    if (users.length !== 0) {

                        res.json({
                            status: status.SUCCESS_STATUS,
                            message: 'Otp verified successfully you may reset your password now!',						                                    
                            data: {
                                user_id: id
                            }
                        });
                                
                    } else {
                        res.json({
                            status: status.FAILURE_STATUS,
                            message: 'Failed to send otp!',						
                            data: {}
                        });
                    }                
            } else {
                res.json({
                    status: status.FAILURE_STATUS,
                    message: 'OTP does not match',						                    
                    data: {}
                });
            }
        } else {

            res.json({
                status: status.FAILURE_STATUS,
                message: 'User not found!',						                    
                data: {}
            });
        }                              
                
    } catch (error) {

        res.json({
            status: status.FAILURE_STATUS,
            message: error.message,						                
            data: {}
        });      
    }   
});


// ========= Reset Password Api ========= //

router.post("/reset-password", async (req, res) => {

    let { password, user_id } = req.body;
    if (!password || password == '') {
        return res.json({
            status: status.FAILURE_STATUS,
            message: "Password is required",            
            data: {}
        });
    }    
        
    try {

        if (!user_id || user_id == '') {
            return res.json({
                status: status.FAILURE_STATUS,
                message: "User id is required",            
                data: {}
            });
        }
                                                                            
        const get_user = await db("users").where({ id: user_id }).select("*");
        if(get_user && get_user.length > 0) {            
            
            let id = get_user[0].id;
            utils.cryptPassword(password, async(hashPassword) => {                        
                if(hashPassword) {
                    
                    const users = await db("users").where({ id }).update({ password: hashPassword }, ["id", "password"]);
                    if (users.length !== 0) {

                        res.json({
                            status: status.SUCCESS_STATUS,
                            message: 'Password Reset Successfully!',						
                            data: {}
                        });                                
                    } else {
                        res.json({
                            status: status.FAILURE_STATUS,
                            message: 'Failed to reset password!',						
                            data: {}
                        });
                    }                        
                } 
            });
                        
        } else {

            res.json({
                status: status.SUCCESS_STATUS,
                message: 'User not found!',						                    
                data: {}
            });
        }                                       
    } catch (error) {

        res.json({
            status: status.FAILURE_STATUS,
            message: error.message,						                
            data: {}
        });      
    }    
});


// ========= Update Password Api ========= //

router.post("/change-password", authToken.authHandler, async (req, res) => {

    let { old_password, new_password } = req.body;
    let { id } = req.user;
    if (!new_password || new_password == '') {
        return res.json({
            status: status.FAILURE_STATUS,
            message: "New Password is required",            
            data: {}
        });
    }    
        
    try {        

        if (old_password == new_password) {
            return res.json({
                status: status.FAILURE_STATUS,
                message: "You can not update the same password!",            
                data: {}
            });
        }
                                                                            
        const get_user = await db("users").where({ id: id }).select("*");
        if(get_user && get_user.length > 0) {            
                        
            utils.comparePassword(old_password, get_user[0].password, async(isPasswordMatch) => {                        
                if(isPasswordMatch) {
                    
                    utils.cryptPassword(new_password, async(hashPassword) => {                        
                        if(hashPassword) {
                            
                            const users = await db("users").where({ id }).update({ password: hashPassword }, ["id", "password"]);
                            if (users.length !== 0) {

                                res.json({
                                    status: status.SUCCESS_STATUS,
                                    message: 'Password Changed Successfully!',						
                                    data: {}
                                });                                
                            } else {
                                res.json({
                                    status: status.FAILURE_STATUS,
                                    message: 'Failed to change password!',						
                                    data: {}
                                });
                            }                        
                        } 
                    });                                            
                } else {
                    res.json({
                        status: status.FAILURE_STATUS,
                        message: 'Please enter correct old password!',						
                        data: {}
                    });
                }
            });
                        
        } else {

            res.json({
                status: status.SUCCESS_STATUS,
                message: 'User not found!',						                    
                data: {}
            });
        }                                       
    } catch (error) {

        res.json({
            status: status.FAILURE_STATUS,
            message: error.message,						                
            data: {}
        });      
    }    
});


// ========= Get Profile Info of approved user  ========= //

router.get("/get-profile-info", authToken.authHandler, async (req, res) => {
    let { id } = req.user;   
    // try {

        const get_user = await db("users").where({ id: id, status: status.USER_PROFILE_APPROVED }).select("*");
        if(get_user && get_user.length > 0) {
            
            let user = get_user[0];
            let user_charactiristics = [];
            let user_heights =         [];
            let height_ids =           [];
            let user_interests =       [];
            let characteristic_ids =   [];
            let interest_ids =         [];
            let user_questions =       [];
            let user_images =          [];
            let user_attributes =      [];
            let user_education  =      [];
            let user_work  =           [];
            let user_religion =        [];
            let user_community =       [];
            let ch_ids = [];
            let in_ids = [];
            let h_ids =  [];

            
            characteristic_ids = await db("user_characteristics").where({ user_id: id }).select('characteristic_id', 'user_id');                        
            characteristic_ids.map(async(element) => {
                if( (element != null) && (element) ) {                    
                    ch_ids.push(element.user_id);
                }
            });             
            
            if(ch_ids&&ch_ids.length){
                user_charactiristics = await db.select('*').from('characteristics')
                    .join('user_characteristics', 'characteristics.id', '=', 'user_characteristics.characteristic_id')                    
                    .whereIn('user_characteristics.user_id', ch_ids);
                    
            }

            interest_ids = await db("user_interests").where({ user_id: id }).select('user_id');                        
            interest_ids.map(async(element) => {
                if( (element != null) && (element) ) {                    
                    in_ids.push(element.user_id);
                }
            });
                
            if(in_ids&&in_ids.length){
                user_interests = await db.select('*').from('interests')
                    .join('user_interests', 'interests.id', '=', 'user_interests.interest_id')                    
                    .whereIn('user_interests.user_id', in_ids);
                    
            }
                
            height_ids = await db("user_height_preferences").where({ user_id: id }).select('user_id');                        
            height_ids.map(async(element) => {
                if( (element != null) && (element) ) {                    
                    h_ids.push(element.user_id);
                }
            });
                
            if(h_ids&&h_ids.length){
                user_heights = await db.select('*').from('height_preferences')
                    .join('user_height_preferences', 'height_preferences.id', '=', 'user_height_preferences.height_id')                    
                    .whereIn('user_height_preferences.user_id', h_ids);
                            
            }

            user_questions = await db("user_questions").where({ user_id: id }).select('*');                            
            user_images = await db("user_images").where({ user_id: id }).select('*');                            

            user_attributes = await db("user_attributes").where({ user_id: id }).select('*');                            
            
            if( user_attributes && user_attributes.length>0 ){
                user_attributes = user_attributes[0];
                if( user_attributes.education_id ){
                    user_education = await db("educations").where({ id: user_attributes.education_id }).select('name');                            
                    user_attributes.education_name = user_education[0]?user_education[0].name:null;
                } else {
                    user_attributes.education_name = null;
                }
    
                if( user_attributes.work_id ) {
                    user_work = await db("works").where({ id: user_attributes.work_id }).select('name');                            
                    user_attributes.work_name = user_work[0]?user_work[0].name:null;
                } else {
                    user_attributes.work_name = null;
                }
    
                if( user_attributes.religion_id ){
                    user_religion = await db("religions").where({ id: user_attributes.religion_id }).select('name');                            
                    user_attributes.religion_name = user_religion[0]?user_religion[0].name:null;
                } else {
                    user_attributes.religion_name = null;
                }
    
                if( user_attributes.community_id ){
                    user_community = await db("communities").where({ id: user_attributes.community_id }).select('name');                            
                    user_attributes.community_name = user_community[0]?user_community[0].name:null;
                } else {
                    user_attributes.community_name = null;
                }
    
                user_attributes.first_name = user.first_name;
                user_attributes.last_name = user.last_name;
                user_attributes.profile_image = user.profile_image;
                user_attributes.age = user.age;
            } else {
                user_attributes = null
            }

            //checking today remaining count
            // let perDayReactLimit = 20;
            // let remainingReacts = 1000;
            // let is_active_subscription = 0;
            // const userModel = new User();

            // let activeSubscription = await userModel.getActiveSubscription(id);
            // if( activeSubscription ){
            //     perDayReactLimit = 0;
            //     is_active_subscription = 1;
            // }

            // if( perDayReactLimit > 0 ) {
            //     let today = dayjs().format(status.EDIT_DATE_FORMAT);
            //     let checkReactCount = await db("user_reacts").where({user_id: id})
            //     .whereRaw('DATE(created_at) = ?', [today])
            //     .count('id');
            //     remainingReacts = perDayReactLimit - checkReactCount[0].count;
            // }

            res.json({
                status: status.SUCCESS_STATUS,
                message: "User Profile info",            
                data: {
                    user,
                    user_charactiristics,
                    user_interests,
                    user_questions,
                    user_images,
                    user_heights,
                    user_attributes: user_attributes,
                }
            });                                                            
                        
        } else {

            res.json({
                status: status.SUCCESS_STATUS,
                message: 'User not found or user profile not approved yet!',						                    
                data: {}
            });
        }                                       
    // } catch (error) {

    //     res.json({
    //         status: status.FAILURE_STATUS,
    //         message: error.message,						                
    //         data: {}
    //     });      
    // }    
});


// ========= User Edit Profile ========= //

router.post("/user-edit-profile", authToken.authHandler, async (req, res) => {
    let { characteristic_ids, height_ids, interest_ids, questions } = req.body;
    let { id } = req.user;

    try {

        const get_user = await db("users").where({ id: id }).select("*");
        if(get_user && get_user.length > 0) {
                  
            let user_charactiristics = [];
            let user_height_ids = [];
            let user_interests = [];

            if(characteristic_ids && characteristic_ids.length) {
                characteristic_ids.map(element => {
                    if( (element != null) && (element) ){
                        user_charactiristics.push({                            
                            user_id: id, 
                            characteristic_id: element,                        
                        });
                    }
                });
            }

            if(height_ids && height_ids.length) {
                height_ids.map(element => {
                    if( (element != null) && (element) ){
                        user_height_ids.push({
                            user_id: id, 
                            height_id: element,                        
                        });
                    }
                });
            }

            if(interest_ids && interest_ids.length){
                interest_ids.map(element => {
                    if( (element != null) && (element) ){
                        user_interests.push({
                            user_id: id, 
                            interest_id: element,                        
                        });
                    }
                });
            }

            if( user_charactiristics.length>0 ) {                
                await db("user_characteristics").where({user_id: id}).del();                
                await db("user_characteristics").insert(user_charactiristics);
            }

            if( user_height_ids.length>0 ){
                await db("user_height_preferences").where({user_id: id}).del();
                await db("user_height_preferences").insert( user_height_ids );
            }

            if( user_interests.length>0 ){
                await db("user_interests").where({user_id: id}).del();
                await db("user_interests").insert( user_interests );
            }

            if ( questions && (questions.length >= 3) ) {
                if( questions.length>0 ){

                    let questionsWithUserId = questions.map(question => ({
                        user_id: id,
                        ...question,
                    }));

                    await db("user_questions").where( {user_id: id} ).del();
                    await db("user_questions").insert( questionsWithUserId );
                }
            } else {
                if( questions ){
                    return res.json({
                        status: status.FAILURE_STATUS,
                        message: "Min 3 questions are required",            
                        data: {}
                    });
                }
            }
            
            // edit user attributes //
            if( req.body.gender 
                || req.body.gender_detail
                || req.body.gender
                || req.body.gender_detail                      
                || req.body.education_id
                || req.body.show_education
                || req.body.work_id
                || req.body.show_work
                || req.body.religion_id
                || req.body.show_religion
                || req.body.community_id
                || req.body.show_community
                || req.body.like_to_date
                || req.body.relationship_type
                || req.body.age_preference_start
                || req.body.age_preference_end
                || req.body.my_height_id
                || req.body.other_community
                || req.body.other_religion
                || req.body.other_work
                ) {
                await db("user_attributes").where({user_id: id}).update(
                    {                    
                        gender: req.body.gender,
                        gender_detail: req.body.gender_detail,                        
                        education_id: req.body.education_id,
                        show_education: req.body.show_education,
                        work_id: req.body.work_id,
                        show_work: req.body.show_work,
                        religion_id: req.body.religion_id,
                        show_religion: req.body.show_religion,
                        community_id: req.body.community_id,
                        show_community: req.body.show_community,
                        like_to_date: req.body.like_to_date,
                        relationship_type: req.body.relationship_type,
                        age_preference_start: req.body.age_preference_start,
                        age_preference_end: req.body.age_preference_end,                                                
                        my_height_id: req.body.my_height_id,                                                
                        other_work: req.body.other_work,                                                
                        other_religion: req.body.other_religion,                                                
                        other_community: req.body.other_community,                                                
                        updated_at: utils.getFormatedDate()
                    }
                );
            }

            return res.json({
                status: status.SUCCESS_STATUS,
                message: 'Users profile attributes updated successfully!',						
                data: {}
            });                        
        } else {

            res.json({
                status: status.SUCCESS_STATUS,
                message: 'User not found!',						                    
                data: {}
            });
        }                                       
    } catch (error) {

        res.json({
            status: status.FAILURE_STATUS,
            message: error.message,						                
            data: {}
        });      
    }    
});


// ========= Edit profile image for logged in user ========= //

router.post("/edit-profile-image", authToken.authHandler, upload, async (req, res) => {

    let { id } = req.user;
    let { profile_image } = req.files;        
        
    try {
        const get_user = await db("users").where({ id: id }).select("*");
        if(get_user && get_user.length > 0) {
                                 
            let image = '/assets/profile/' + profile_image[0].filename;
            const users = await db("users").where({ id }).update({ profile_image: image }, ["id","profile_image"]);
                if (users.length !== 0) {
                    return res.json({
                        status: status.SUCCESS_STATUS,
                        message: 'Profile picture updated successfully!',						
                        data: {
                            user_id: id,
                            profile_image: image
                        }
                    });
                } else {
                    return res.json({
                        status: status.FAILURE_STATUS,
                        message: 'Failed to upload picture!',						
                        data: {}
                    });
                }                                        
        } else {
            return res.json({
                status: status.SUCCESS_STATUS,
                message: 'User not found!',						                    
                data: {}
            });
        }                                       
    } catch (error) {
        return res.json({
            status: status.FAILURE_STATUS,
            message: error.message,						                
            data: {}
        });      
    }    
});


// ========= Update profile picture in case of rejection ========= //

router.post("/update-profile-picture", upload, async (req, res) => {

    let { user_id } = req.body;
    let { profile_image } = req.files;        
        
    try {

        if (!user_id || user_id == '') {
            return res.json({
                status: status.FAILURE_STATUS,
                message: "User id is required",            
                data: {}
            });
        }
                                                                    
        const get_user = await db("users").where({ id: user_id, status: status.USER_PROFILE_REJECTED }).select("*");

        if(get_user && get_user.length > 0) {
                                 
            let image = '/assets/profile/' + profile_image[0].filename;
            let id = get_user[0].id;            

            const users = await db("users").where({ id }).update({ profile_image: image, status: status.USER_PROFILE_PENDING }, ["id","profile_image"]);
                if (users.length !== 0) {

                    res.json({
                        status: status.SUCCESS_STATUS,
                        message: 'Profile picture uploaded successfully!',						
                        data: {
                            user_id: id
                        }
                    });
                            
                } else {
                    res.json({
                        status: status.FAILURE_STATUS,
                        message: 'Failed to upload picture!',						
                        data: {}
                    });
                }                                        
        } else {

            res.json({
                status: status.SUCCESS_STATUS,
                message: 'User not found!',						                    
                data: {}
            });
        }                                       
    } catch (error) {

        res.json({
            status: status.FAILURE_STATUS,
            message: error.message,						                
            data: {}
        });      
    }    
});


// ========= Update picture gallery ========= //
router.post("/update-gallery-picture", authToken.authHandler, uploadGalleryImages, async (req, res) => {
    let { id } = req.user;
    let { gallery_images } = req.files;
    if ( !gallery_images || (gallery_images&&gallery_images.length == 0) ) {
        return res.json({
            status: status.FAILURE_STATUS,
            message: "Please upload atleast one image.",            
            data: {}
        });
    }    
        
    try {                                                                            
        const get_user = await db("users").where({ id: id }).select("*");
        
        if(get_user && get_user.length > 0) {            

            const get_user_image = await db("user_images").where({ user_id: id, sequence: req.body.sequence }).select("*");
            let image = '/assets/gallery_images/' + gallery_images[0].filename;
            if( get_user_image&&get_user_image.length>0 ){

                const result = await db("user_images").where({ id: get_user_image[0].id }).update({ image_path: image, sequence: req.body.sequence }, ["id"]);                
                if (result.length !== 0) {

                    res.json({
                        status: status.SUCCESS_STATUS,
                        message: 'Gallery picture updated successfully!',						
                        data: {}
                    });
                            
                } else {
                    res.json({
                        status: status.FAILURE_STATUS,
                        message: 'Failed to upload picture!',						
                        data: {}
                    });
                }                
            }else {
                let data = {
                    user_id: id,
                    image_path: image,
                    sequence: req.body.sequence
                }
                await db("user_images").insert( data );

                res.json({
                    status: status.SUCCESS_STATUS,
                    message: 'Gallery picture updated successfully!',						
                    data: {}
                });
            }                                                
        } else {
            res.json({
                status: status.SUCCESS_STATUS,
                message: 'User not found!',						                    
                data: {}
            });
        }                                       
    } catch (error) {
        res.json({
            status: status.FAILURE_STATUS,
            message: error.message,						                
            data: {}
        });      
    } 
});


// ========= User Account Delete ========= //
router.delete("/user-account-delete", authToken.authHandler, async (req, res) => {    
    let { id } = req.user;    

    try {              
        const userDetail = await db("users").where({ id: id }).first();
        let updatedEmail = userDetail?.email + '-deleted';                                
        let updatedPhone = userDetail?.phone_number + '-deleted';                                
        let updatedFirst = userDetail?.first_name + '-deleted';                                
        let updatedLast = userDetail?.last_name + '-deleted';                                
        
        const users = await db("users").where({ id }).update({ email: updatedEmail, phone_number: updatedPhone, first_name: updatedFirst, last_name: updatedLast ,status: status.USER_PROFILE_DELETED, updated_at: utils.getFormatedDate() });
        if (users.length !== 0) {
            res.json({
                status: status.SUCCESS_STATUS,
                message: 'User account deleted successfully!',						                                    
                data: {}
            });                                    
        } else {
            res.json({
                status: status.FAILURE_STATUS,
                message: error.message,						                
                data: {}
            });
        }                                          
    } catch (error) {
        res.json({
            status: status.FAILURE_STATUS,
            message: error.message,						                
            data: {}
        });      
    }    
});

// ========= User Account Delete ========= //
router.post("/user-logout", authToken.authHandler, async (req, res) => {    
    let { id } = req.user;    
    try {              
        // const userDetail = await db("users").where({ id: id }).first();                                
        const users = await db("users").where({ id }).update({ fcm_token: null, updated_at: utils.getFormatedDate() });
        if (users.length !== 0) {
            res.json({
                status: status.SUCCESS_STATUS,
                message: 'User logout successfully!',						                                    
                data: {}
            });                                    
        } else {
            res.json({
                status: status.FAILURE_STATUS,
                message: error.message,						                
                data: {}
            });
        }                                          
    } catch (error) {
        res.json({
            status: status.FAILURE_STATUS,
            message: error.message,						                
            data: {}
        });      
    }    
});

// ========= User Gallery Image Delete ========= //
router.post("/user-gallery-image-delete", authToken.authHandler, async (req, res) => {    
    let { id } = req.user;    
    let { image_id } = req.body;    
    if (!image_id || image_id == '') {
        return res.json({
            status: status.FAILURE_STATUS,
            message: "Image id is required",            
            data: {}
        });
    }
    try {                               
        const result = await db("user_images").where({ id: image_id, user_id:id }).delete();
        if (result) {
            res.json({
                status: status.SUCCESS_STATUS,
                message: 'User gallery image deleted successfully!',						                                    
                data: {}
            });                                    
        } else {
            res.json({
                status: status.FAILURE_STATUS,
                message: error.message,						                
                data: {}
            });
        }                                             
    } catch (error) {
        res.json({
            status: status.FAILURE_STATUS,
            message: error.message,						                
            data: {}
        });      
    }    
});


module.exports = router;