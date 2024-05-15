const express = require("express");
const multer = require('multer');

const authToken = require('../../helpers/jwt-module.js')
const sendSms = require('../../helpers/sms-module.js')
const db = require("../../config/connection.js");
const status = require('../../helpers/constants.js');
const utils = require('../../helpers/utility.js');  
const router = express.Router();



// ========= MetaData For User ========= //

router.get("/metadata", async (req, res) => {
    try {

        const characteristics = await db.select("*").where({status: 1}).from("characteristics");        
        const get_interests = await db.select("*").where({status: 1}).from("interests");        
        const educations = await db.select("*").where({status: 1}).from("educations");        
        const communities = await db.select("*").where({status: 1}).from("communities");        
        const religions = await db.select("*").where({status: 1}).from("religions");        
        const height_preferences = await db.select("*").where({status: 1}).from("height_preferences");  
        const works = await db.select("*").where({status: 1}).from("works");
        const question_templates = await db.select("*").where({status: 1}).from("question_templates");
        const min_questions_required = 3;
        const age_slider_range = {
            start_point: 18,
            end_point: 50,
        }

        const interests = Object.values(get_interests.reduce((result, interest) => {
            const category = result[interest.category];
        
            if (category) {
                category.interests.push({...interest});
            } else {
                result[interest.category] = {
                    category: interest.category,
                    interests: [{ ...interest }],
                };
            }
        
            return result;
        }, {}));


        const relationship_type = ["Long term", "Something casual", "Marriage", "I am not sure yet"];
        const gender = [
            {
                value: "Man",
                gender_details: [
                    {
                        value: "Intersex man"
                    },
                    {
                        value: "Trans man"
                    },
                    {
                        value: "Transmasculine"
                    },
                    {
                        value: "Cis man"
                    },
                    {
                        value: "Man and Nonbinary"
                    }
                ]
            },
            {
                value: "Woman",
                gender_details: [
                    {
                        value: "Intersex female"
                    },
                    {
                        value: "Trans female"
                    },
                    {
                        value: "Cis female"
                    },
                    {
                        value: "Female and Nonbinary"
                    }
                ]
            }
        ]  

        res.json({
            status: status.SUCCESS_STATUS,
            message: 'All user prefrence',						
            data: {
                signup_data : {
                    characteristics,
                    interests,
                    educations,
                    communities,
                    height_preferences,
                    religions,
                    works,
                    gender,
                    relationship_type,
                    age_slider_range,
                    min_questions_required,
                    question_templates
                }
            }
        });      

    } catch (error) {

        res.json({
            status: status.FAILURE_STATUS,
            message: error.message,						
            data : []
        });      
    }
});


// ========= GET Page Data Using Slug ========= //

router.get("/page/:slug", async (req, res) => {
    
    let { slug } = req.params;
    if(!slug || slug == ''){
        return res.json({
            status: status.FAILURE_STATUS,
            message: "Page Slug is required",            
            data: {}
        });
    }
    
    try {
                                         
        let content = [];            
        
        content = await db("page_content").where({ slug: slug }).select('*');                        
        if(content&&content.length){ 
                                                
            res.json({
                status: status.SUCCESS_STATUS,
                message: 'Get page content successfully!',						
                data: {
                    content: content
                }
            });                                       
        } else {
            res.json({
                status: status.SUCCESS_STATUS,
                message: 'Page content not found!',						                    
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

  