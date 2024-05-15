
const express = require("express");

const authToken = require('../../helpers/jwt-module.js')
const db = require("../../config/connection.js");
const status = require('../../helpers/constants.js');
const utils = require('../../helpers/utility.js'); 
const router = express.Router();
const dayjs = require('dayjs');


// ========= Get User Top Picks List ========= //

router.get("/user-top-picks", authToken.authHandler, async (req, res) => {    
    let { id } = req.user; 
    let community_ids =          [];
    let religion_ids =           [];                                
    let height_ids =             [];
    let interest_ids =           [];                                  
    let user_dating_preference = [];
    let users =                  [];
    let reacts =                 [];
    let picks =                  [];            
    let gender_preferences =   null;   

    try {
        // Fetch list on user dating preference is remaining due to cron job                
        let myList = await db('user_top_picks').where({ user_id: id, is_view: 0 }).limit(6).orderBy('id','asc').select('*');        
        var todayDate = dayjs().format('YYYY-MM-DD');
        
        let checkLastRecord = await db('user_top_picks').where({ user_id: id }).orderBy('created_at','desc').first('*');        
        let lastPickDate = null;
        if( checkLastRecord ) {
            lastPickDate = dayjs(checkLastRecord.created_at).format('YYYY-MM-DD');;
        }

        let total_profiles = 6;              
        let profiles_to_filled = (total_profiles - myList.length);

        // Start the process and check to fill profiles in user top picks bucket (of 6 limit).
        if( (!lastPickDate || (lastPickDate && (lastPickDate < todayDate))) 
            && (profiles_to_filled>0) ) {
            // Add Top Picks Data //

            user_dating_preference = await db("user_dating_preferences").where({ user_id: id }).select('*');                        
            if(user_dating_preference&&user_dating_preference.length) { 
                if(user_dating_preference&&user_dating_preference[0].height_ids != null) {    
                    height_ids = user_dating_preference[0].height_ids.split(',')                                    
                }
                                        
                if(user_dating_preference&&user_dating_preference[0].community_ids != null) {    
                    community_ids = user_dating_preference[0].community_ids.split(',')                                    
                }
    
                if(user_dating_preference&&user_dating_preference[0].interest_ids != null) {
                    interest_ids = user_dating_preference[0].interest_ids.split(',')                                    
                } 
                if(user_dating_preference&&user_dating_preference[0].gender_preferences != null) {                            
                    gender_preferences = user_dating_preference[0].gender_preferences                                 
                }            
            }
            
            //Commented react for testing
            reacts = await db('user_reacts').where('user_id',id).pluck('profile_id');
            picks = await db('user_top_picks').where('user_id',id).pluck('profile_id');
            let usersNotIn = [id, ...reacts, ...picks];

            const query = db('users')
                .join('user_attributes', 'users.id', '=', 'user_attributes.user_id')
                // .join('educations', 'educations.id', '=', 'user_attributes.education_id')
                // .join('works', 'works.id', '=', 'user_attributes.work_id')   
                // .join('religions', 'religions.id', '=', 'user_attributes.religion_id')       
                .join('user_interests', 'users.id', '=', 'user_interests.user_id')                        
                .join('user_height_preferences', 'users.id', '=', 'user_height_preferences.user_id')                      
                .join('communities', 'communities.id', '=', 'user_attributes.community_id')                        
                .where('users.status', status.USER_PROFILE_APPROVED)
                .whereNotIn('users.id', usersNotIn)
                .limit(profiles_to_filled)
                .select('users.id','user_attributes.user_id')
                .groupBy('users.id','user_attributes.user_id');
    
                    
            if (gender_preferences) {
                if( gender_preferences == 'Man' ) {
                    query.where('user_attributes.gender', 'Man');
                } else if( gender_preferences == 'Woman' ) {
                    query.where('user_attributes.gender', 'Woman');
                } else {
                    query.where('user_attributes.gender_detail', gender_preferences);
                }
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
    
            users = await query;

            let top_picks_to_add = [];
            users.map((element,index) => {                        
                top_picks_to_add.push({
                    user_id: id, 
                    profile_id: element.user_id,                            
                });
            });

            if( top_picks_to_add.length>0 ){
                await db("user_top_picks").insert( top_picks_to_add );
            }
        
        } // end of check profile filling process

        // Now fetch records to send in api.
        // let notInn = [id, ...reacts]
        const query_1 = db('user_top_picks').where('user_top_picks.is_view', 0)
            .join('users', 'user_top_picks.profile_id', '=', 'users.id')                                                            
            .join('user_attributes', 'users.id', '=', 'user_attributes.user_id')
            .join('educations', 'educations.id', '=', 'user_attributes.education_id')
            .join('works', 'works.id', '=', 'user_attributes.work_id')
            .join('religions', 'religions.id', '=', 'user_attributes.religion_id')    
            .join('user_interests', 'users.id', '=', 'user_interests.user_id')                        
            .join('user_height_preferences', 'users.id', '=', 'user_height_preferences.user_id')                      
            .join('communities', 'communities.id', '=', 'user_attributes.community_id')                        
            // .where('users.status', status.USER_PROFILE_APPROVED)
            // .whereNotIn('users.id', notInn) 
            .orderBy('created_at','desc')
            .select(
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
        
            
        let new_users = await query_1;
        
        let userTopPicks = await Promise.all(new_users.map(async (row) => {
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
            message: 'Get user top picks successfully!',						
            data: {
                userTopPicks
            }
        });

    } catch (error) {
        res.json({
            status: status.FAILURE_STATUS,
            message: error.message,						                
            data: {}
        });      
    }    
});


// ========= User Reacts On Top Picks Profile ========= //

router.post("/reacts-top-picks-profile", authToken.authHandler, async (req, res) => {
    let { type, profile_id } = req.body;
    let { id } = req.user;
    let resMessage = '';

    if(!type || type == null){
        return res.json({
            status: status.FAILURE_STATUS,
            message: 'React type is required!',						
            data: {}
        });
    }

    try {
                  
        await db("user_top_picks").where({profile_id: profile_id }).update(
            {
                is_view: 1,
                updated_at: utils.getFormatedDate()
            }
        );

        let upsertData = await db("user_reacts").where({user_id: id, profile_id: profile_id}).select("*");
        if(upsertData&&upsertData.length==0){
            await db("user_reacts").insert(
                {
                    user_id: id,
                    profile_id: profile_id,
                    type: type
                }
            );
        }

        if( type == status.USER_REACT_TYPE_LIKE ) {
            resMessage = 'You have liked this profile';
        } else {
            resMessage = 'You have disliked this profile';
        }
                        
        res.json({
            status: status.SUCCESS_STATUS,
            message: resMessage,					
            data: {}
        });                                                           
    } catch (error) {
        res.json({
            status: status.FAILURE_STATUS,
            message: error.message,						                
            data: {}
        });      
    }    
});

module.exports = router;