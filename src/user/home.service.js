const express = require("express");

const authToken = require('../../helpers/jwt-module.js')
const db = require("../../config/connection.js");
const status = require('../../helpers/constants.js');
const utils = require('../../helpers/utility.js');  
const router = express.Router();
const User = require('../../models/user.js');
const dayjs = require('dayjs');


// ========= GET User Dating Preferences ========= //

router.get("/get-dating-preferences", authToken.authHandler, async (req, res) => {
    
    let { id } = req.user;    

    // try {
                                                     
        let user_heights =         [];            
        let height_ids =           [];
        let user_interests =       [];
        let user_community =       [];            
        let religion_ids =         [];
        let interest_ids =         [];
        let community_ids =        [];            
        let user_religion =        [];
        let user_dating_data =     [];            

        
        user_dating_data = await db("user_dating_preferences").where({ user_id: id }).select('*');                        
        if(user_dating_data&&user_dating_data.length){ 
            if(user_dating_data&&user_dating_data[0].height_ids != null&&user_dating_data[0].height_ids != ''){

                height_ids = user_dating_data[0].height_ids.split(',')                
                user_heights = await db.select('*').from('height_preferences').whereIn('id', height_ids)                                    
            }

            if(user_dating_data&&user_dating_data[0].religion_ids != null&&user_dating_data[0].religion_ids != ''){

                religion_ids = user_dating_data[0].religion_ids.split(',')                
                user_religion = await db.select('*').from('religions').whereIn('id', religion_ids)                                
            }

            if(user_dating_data&&user_dating_data[0].community_ids != null&&user_dating_data[0].community_ids != ''){

                community_ids = user_dating_data[0].community_ids.split(',')                
                user_community = await db.select('*').from('communities').whereIn('id', community_ids)                                
            }

            if(user_dating_data&&user_dating_data[0].interest_ids != null&&user_dating_data[0].interest_ids != ''){

                interest_ids = user_dating_data[0].interest_ids.split(',')                
                user_interests = await db.select('*').from('interests').whereIn('id', interest_ids)                                
            }             

            let dating_preference =
            {
                dating_preference_id: id,                    
                gender_preferences: user_dating_data[0].gender_preferences,                        
                age_preference_start: user_dating_data[0].age_preference_start,                                                                
                age_preference_end: user_dating_data[0].age_preference_end,                                                
            }                        
            
            res.json({
                status: status.SUCCESS_STATUS,
                message: 'Users dating preferences!',						
                data: {
                    dating_preference,
                    user_heights,
                    user_religion,
                    user_community,
                    user_interests
                }
            });                                       
        } else {
            res.json({
                status: status.SUCCESS_STATUS,
                message: 'User dating preference not found!',						                    
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


// ========= Update User Dating Preferences ========= //

router.post("/update-dating-preferences", authToken.authHandler, async (req, res) => {
    
    let { id } = req.user;
    let { height_ids, interest_ids, religion_ids, community_ids } = req.body;            

    try {

        const get_user = await db("users").where({ id: id }).select("*");
        if(get_user && get_user.length > 0) {

            let checkDatingPref = await db("user_dating_preferences").where({ user_id: id }).select("*");
            if(checkDatingPref && checkDatingPref.length > 0) {
                await db("user_dating_preferences").where({user_id: id }).update(
                    {                    
                        gender_preferences: req.body.gender_preferences,                        
                        height_ids: height_ids?.join(),
                        religion_ids: religion_ids?.join(),
                        interest_ids: interest_ids?.join(),
                        community_ids: community_ids?.join(),
                        age_preference_start: req.body.age_preference_start,
                        age_preference_end: req.body.age_preference_end,    
                        updated_at: utils.getFormatedDate()                                        
                    }, 
                    ["id"]
                );
            } else {
                await db("user_dating_preferences").insert(
                    {
                        user_id: id,                    
                        gender_preferences: req.body.gender_preferences,                        
                        height_ids: height_ids?.join(),
                        religion_ids: religion_ids?.join(),
                        interest_ids: interest_ids?.join(),
                        community_ids: community_ids?.join(),
                        age_preference_start: req.body.age_preference_start,
                        age_preference_end: req.body.age_preference_end                                           
                    }
                );
            }
                                                
            res.json({
                status: status.SUCCESS_STATUS,
                message: 'Users dating preferences updated successfully!',						
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


// ========= Get Users Profile On Home ========= //

router.get("/get-home-users", authToken.authHandler, async (req, res) => {
    
    let { id } = req.user;
    try {

        const get_user = await db("users").where({ id: id, status: status.USER_PROFILE_APPROVED }).select("*");
        if(get_user && get_user.length > 0) {

            //checking today remaining count
            let perDayReactLimit = 20;
            let remainingReacts = 100;
            const userModel = new User();

            let activeSubscription = await userModel.getActiveSubscription(id);
            if( activeSubscription ){
                perDayReactLimit = 0;
            }

            if( perDayReactLimit > 0 ) {
                let today = dayjs().format(status.EDIT_DATE_FORMAT);
                let checkReactCount = await db("user_reacts").where({user_id: id})
                .whereRaw('DATE(created_at) = ?', [today])
                .count('id');
                remainingReacts = perDayReactLimit - checkReactCount[0].count;
            }
                     
            let height_ids =             [];
            let characteristic_ids =     [];
            let interest_ids =           [];
            let community_ids =          [];
            let religion_ids =           [];
            let gender_preferences =     [];
            let user_dating_preference = [];
            let users =                  [];
            let reacts =                 []; 


            user_dating_preference = await db("user_dating_preferences").where({ user_id: id }).select('*');                        
            if(user_dating_preference&&user_dating_preference.length) { 
                if(user_dating_preference&&user_dating_preference[0].height_ids != null) {    
                    height_ids = user_dating_preference[0].height_ids.split(',')                                    
                }
    
                if(user_dating_preference&&user_dating_preference[0].religion_ids != null) {    
                    religion_ids = user_dating_preference[0].religion_ids.split(',')                                    
                }
    
                if(user_dating_preference&&user_dating_preference[0].community_ids != null) {    
                    community_ids = user_dating_preference[0].community_ids.split(',')                                    
                }
    
                if(user_dating_preference&&user_dating_preference[0].interest_ids != null) {
                    interest_ids = user_dating_preference[0].interest_ids.split(',')                                    
                }

                if(user_dating_preference&&user_dating_preference[0].gender_preferences != null) {
                    // gender_preferences = user_dating_preference[0].gender_preferences.split(',')                                    
                    gender_preferences = user_dating_preference[0].gender_preferences                                 
                }
            }

            //Commented react for testing
            reacts = await db('user_reacts').where('user_id',id).pluck('profile_id');
            let usersNotIn = [id, ...reacts];
                        
            const query = db('users').where('users.status' , status.USER_PROFILE_APPROVED ).whereNotIn('users.id', usersNotIn)
            .join('user_attributes', 'users.id', '=', 'user_attributes.user_id')
            .leftJoin('educations', 'educations.id', '=', 'user_attributes.education_id')
            .leftJoin('works', 'works.id', '=', 'user_attributes.work_id')
            .leftJoin('religions', 'religions.id', '=', 'user_attributes.religion_id')
            .leftJoin('communities', 'communities.id', '=', 'user_attributes.community_id')
            .leftJoin('user_interests', 'users.id', '=', 'user_interests.user_id')                        
            .leftJoin('user_height_preferences', 'users.id', '=', 'user_height_preferences.user_id')  
            
            // if (gender_preferences && gender_preferences.length > 0) {
            //     if( gender_preferences == 'men' ) {
            //         query.where('user_attributes.gender', 'men');
            //     } else if( gender_preferences == 'women' ) {
            //         query.where('user_attributes.gender', 'women');
            //     } else {
            //         query.where('user_attributes.gender_detail', gender_preferences);
            //     }
            // }

            // if (religion_ids && religion_ids.length > 0) {
            //     query.whereIn('user_attributes.religion_id', religion_ids);
            // }
                
            // if (community_ids && community_ids.length > 0) {
            //     query.whereIn('user_attributes.community_id', community_ids);
            // }  
            
            // if (interest_ids && interest_ids.length > 0) {
            //     query.whereIn('user_interests.interest_id', interest_ids);
            // }

            // if (height_ids && height_ids.length > 0) {
            //     query.whereIn('user_height_preferences.height_id', height_ids);
            // }
            query.limit(remainingReacts)
            query.select(
                        'users.first_name',
                        'users.last_name', 
                        'users.dob', 
                        'users.profile_image', 
                        'user_attributes.*',
                        'users.age', 
                        db.raw('MAX(educations.name) as education'),
                        db.raw('MAX(works.name) as work'),
                        db.raw('MAX(religions.name) as religion'),
                        db.raw('MAX(communities.name) as community')
                        // 'educations.name as education',
                        // 'works.name as work',
                        // 'religions.name as religion',
                        // 'communities.name as community'
                    )
            .groupBy('users.id', 'users.first_name', 'users.last_name', 'users.dob', 'users.profile_image', 'user_attributes.id');
                    
            users = await query;

            let modifiedData = await Promise.all(users.map(async (row) => {
                let characters = await db("user_characteristics").where({ user_id: row.user_id })
                    .join('characteristics', 'characteristics.id', '=', 'user_characteristics.characteristic_id')
                    .select('characteristics.*');
                
                let height = await db("user_height_preferences").where({ user_id: row.user_id })
                    .join('height_preferences', 'height_preferences.id', '=', 'user_height_preferences.height_id')
                    .select('height_preferences.*');
                
                let questions = await db("user_questions").where({ user_id: row.user_id })
                    .orderBy('user_questions.sequence','asc')
                    .select('user_questions.*');
                
                let interests = await db("user_interests").where({ user_id: row.user_id })
                    .join('interests', 'interests.id', '=', 'user_interests.interest_id')
                    .select('interests.*');
                
                let gallery = await db("user_images").where({ user_id: row.user_id })
                    .orderBy('user_images.sequence','asc')
                    .select('user_images.*');

                let newRow = {
                    ...row,
                    characteristics: characters,
                    height_preferences: height,
                    question_answer: questions,
                    interests: interests,
                    gallery: gallery
                };
        
                return newRow;
                
            }));

            return res.json({
                status: status.SUCCESS_STATUS,
                message: "Get home users profile",            
                data: {
                    users: modifiedData,
                    remaining_reacts:remainingReacts
                }
            });                                                            
                        
        } else {

            return res.json({
                status: status.SUCCESS_STATUS,
                message: 'User not found or user profile not approved yet!',						                    
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


// ========= Get Users Profile Detail ========= //

router.get("/get-user-profile-detail/:user_id", authToken.authHandler, async (req, res) => {
        
    let { user_id } = req.params;
    // let { id } = req.user;
    try {

        let users = [];            

        const query = db('users').where({ 'users.id': user_id, 'users.status': status.USER_PROFILE_APPROVED })
        .join('user_attributes', 'users.id', '=', 'user_attributes.user_id')
        .leftJoin('educations', 'educations.id', '=', 'user_attributes.education_id')
        .leftJoin('works', 'works.id', '=', 'user_attributes.work_id')          
        .leftJoin('religions', 'religions.id', '=', 'user_attributes.religion_id')
        .leftJoin('communities', 'communities.id', '=', 'user_attributes.community_id')                        
        .select('users.first_name', 'users.last_name', 'users.dob', 'users.profile_image', 'user_attributes.*', 'users.age','educations.name as education', 'works.name as work', 'religions.name as religion', 'communities.name as community')

        users = await query;

        if(users && users.length > 0) {

            let user_profile = users[0];
            
            // let characters = await db("user_characteristics").where({ user_id: user_profile.user_id })
            //         .join('characteristics', 'characteristics.id', '=', 'user_characteristics.characteristic_id')
            //         .select('characteristics.*');
                
            // let height = await db("user_height_preferences").where({ user_id: user_profile.user_id })
            //     .join('height_preferences', 'height_preferences.id', '=', 'user_height_preferences.height_id')
            //     .select('height_preferences.*');
            
            let questions = await db("user_questions").where({ user_id: user_profile.user_id })
                .orderBy('user_questions.sequence','asc')
                .select('user_questions.*');
            
            let interests = await db("user_interests").where({ user_id: user_profile.user_id })
                .join('interests', 'interests.id', '=', 'user_interests.interest_id')
                .select('interests.*');
            
            let gallery = await db("user_images").where({ user_id: user_profile.user_id })
                .orderBy('user_images.sequence','asc')
                .select('user_images.*');
                        
            res.json({
                status: status.SUCCESS_STATUS,
                message: "Get user profile detail",            
                data: {
                    user_profile: user_profile,
                    questions: questions,
                    interests: interests,
                    gallery: gallery
                }
            });                                                            

        } else {

            res.json({
                status: status.SUCCESS_STATUS,
                message: 'User profile detail not found or user profile not approved yet!',						                    
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


// ========= Search Users Profile On Home ========= //

router.get("/search-home-users", authToken.authHandler, async (req, res) => {

    let { q } = req.query;
    let { id } = req.user;

    // try {

        const get_user = await db("users").where({ id: id, status: status.USER_PROFILE_APPROVED }).select("*");
        if(get_user && get_user.length > 0) {
                        
            let height_ids =             [];            
            let interest_ids =           [];
            let community_ids =          [];
            let religion_ids =           [];                        
            let user_dating_preference = [];
            let users =                  [];
            let gender_preferences = null;
            let reacts =                 [];    

            if( !q || (q=='') || (q==null) ) {
                user_dating_preference = await db("user_dating_preferences").where({ user_id: id }).select('*');                        
                if(user_dating_preference&&user_dating_preference.length) { 
                    if(user_dating_preference&&user_dating_preference[0].height_ids != null) {    
                        height_ids = user_dating_preference[0].height_ids.split(',')                                    
                    }
        
                    if(user_dating_preference&&user_dating_preference[0].religion_ids != null) {    
                        religion_ids = user_dating_preference[0].religion_ids.split(',')                                    
                    }
        
                    if(user_dating_preference&&user_dating_preference[0].community_ids != null) {    
                        community_ids = user_dating_preference[0].community_ids.split(',')                                    
                    }
        
                    if(user_dating_preference&&user_dating_preference[0].interest_ids != null) {
                        interest_ids = user_dating_preference[0].interest_ids.split(',')                                    
                    }
    
                    if(user_dating_preference&&user_dating_preference[0].gender_preferences != null) {
                        // gender_preferences = user_dating_preference[0].gender_preferences.split(',')                                    
                        gender_preferences = user_dating_preference[0].gender_preferences                                 
                    }
                }
            } else {
                q = q.trim();
            }

            //Commented react for testing
            // reacts = await db('user_reacts').where('user_id',id).pluck('profile_id');
            let usersNotIn = [id, ...reacts];
                        
            const query = db('users').where('users.status' , status.USER_PROFILE_APPROVED ).whereNotIn('users.id', usersNotIn)

            query.join('user_attributes', 'users.id', '=', 'user_attributes.user_id')
            .leftJoin('educations', 'educations.id', '=', 'user_attributes.education_id')
            .leftJoin('works', 'works.id', '=', 'user_attributes.work_id')          
            .leftJoin('religions', 'religions.id', '=', 'user_attributes.religion_id')
            .leftJoin('communities', 'communities.id', '=', 'user_attributes.community_id')
            .leftJoin('user_interests', 'users.id', '=', 'user_interests.user_id')                        
            .leftJoin('user_height_preferences', 'users.id', '=', 'user_height_preferences.user_id')   
            // .limit(20)
            // .groupBy('users.id','user_attributes.id','educations.name', 'works.name', 'religions.name', 'communities.name')
            
            if( !q || (q=='') || (q==null) ) {

                if (gender_preferences) {
                    if( gender_preferences == 'Man' ) {
                        query.where('user_attributes.gender', 'Man');
                    } else if( gender_preferences == 'Woman' ) {
                        query.where('user_attributes.gender', 'Woman');
                    } else {
                        query.where('user_attributes.gender_detail', gender_preferences);
                    }
                }

                if (religion_ids && religion_ids.length > 0) {
                    query.whereIn('user_attributes.religion_id', religion_ids);
                }
                    
                if (community_ids && community_ids.length > 0) {
                    query.whereIn('user_attributes.community_id', community_ids);
                }  
                
                if (interest_ids && interest_ids.length > 0) {
                    query.whereIn('user_interests.interest_id', interest_ids);
                }
    
                if (height_ids && height_ids.length > 0) {
                    query.whereIn('user_height_preferences.height_id', height_ids);
                }

            } else {
                query.where((builder) => {
                    builder.where('users.first_name', 'ILIKE', `%${q}%`)
                            .orWhere('users.last_name', 'ILIKE', `%${q}%`);
                });
            }
            
            query.select('users.first_name', 'users.last_name', 'users.dob', 'users.profile_image', 'user_attributes.*', 'users.age', 'educations.name as education', 'works.name as work', 'religions.name as religion', 'communities.name as community')
            .groupBy('users.id','user_attributes.id','educations.name', 'works.name', 'religions.name', 'communities.name')

            users = await query;        

            let modifiedData = await Promise.all(users.map(async (row) => {
                let characters = await db("user_characteristics").where({ user_id: row.user_id })
                    .join('characteristics', 'characteristics.id', '=', 'user_characteristics.characteristic_id')
                    .select('characteristics.*');
                
                let height = await db("user_height_preferences").where({ user_id: row.user_id })
                    .join('height_preferences', 'height_preferences.id', '=', 'user_height_preferences.height_id')
                    .select('height_preferences.*');
                
                let questions = await db("user_questions").where({ user_id: row.user_id })
                    .orderBy('user_questions.sequence','asc')
                    .select('user_questions.*');
                
                let interests = await db("user_interests").where({ user_id: row.user_id })
                    .join('interests', 'interests.id', '=', 'user_interests.interest_id')
                    .select('interests.*');
                
                let gallery = await db("user_images").where({ user_id: row.user_id })
                    .orderBy('user_images.sequence','asc')
                    .select('user_images.*');

                let newRow = {
                    ...row,
                    characteristics: characters,
                    height_preferences: height,
                    question_answer: questions,
                    interests: interests,
                    gallery: gallery
                };
        
                return newRow;
                
            }));

            res.json({
                status: status.SUCCESS_STATUS,
                message: "Get home users profile",            
                data: {
                    // users: users
                    users: modifiedData
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

module.exports = router;