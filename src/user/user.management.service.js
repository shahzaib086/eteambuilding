const express = require("express");

const authToken = require('../../helpers/jwt-module.js')
const db = require("../../config/connection.js");
const status = require('../../helpers/constants.js');
const utils = require('../../helpers/utility.js'); 
const { firebase } = require('../firebase/index.js');
const { stat } = require("fs");
const router = express.Router();


const markUserMatchActionTaken = async (id,profile_id) => {
    let result = false; 
    let check_user_one = await db('user_matches')
    .where('user_matches.user_id_one',profile_id).where('user_matches.user_id_two',id)
    .first();

    if( check_user_one ) {
        await db("user_matches").where('id',check_user_one.id).update({ user_two_action: status.USER_MATCH_ACTION_COMPLETED }); 
        result = true;
    } else {
        let check_user_two = await db('user_matches')
        .where('user_matches.user_id_one',id).where('user_matches.user_id_two',profile_id)
        .first();
        
        if( check_user_two ) {
            await db("user_matches").where('id',check_user_two.id).update({ user_one_action: status.USER_MATCH_ACTION_COMPLETED }); 
            result = true;
        }
    }
    return result;
}

// ========= User Reacts On Profile ========= //

router.post("/user-profile-react", authToken.authHandler, async (req, res) => {
    let { type, profile_id } = req.body;
    let { id } = req.user;

    if(!type || type == null){
        return res.json({
            status: status.FAILURE_STATUS,
            message: 'React type is required!',						
            data: {}
        });
    }

    try {

        let matched_user = null;
        let perDayReactLimit = 20;
        let remaining_reacts = 1000;

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
            remaining_reacts = perDayReactLimit - checkReactCount[0].count;
            if( checkReactCount[0].count >= perDayReactLimit ) {
                return res.json({
                    status: status.FAILURE_STATUS,
                    message: 'React limit reached for today, Upgrade account to react more.',					
                    data: {
                        matched_user,
                        show_subscription_dialog: 1,
                        remaining_reacts
                    }
                }); 
            }
        }

        let resMessage = '';
        let upsertData = await db("user_reacts").where({user_id: id, profile_id: profile_id}).select("*");
        if(upsertData&&upsertData.length==0){
            await db("user_reacts").insert(
                {
                    user_id: id,
                    profile_id: profile_id,
                    type: type
                }
            );
            
            if( type == status.USER_REACT_TYPE_LIKE ) {
                resMessage = 'You have liked this profile';
                let checkReact = await db("user_reacts").where({user_id: profile_id, profile_id: id, type: status.USER_REACT_TYPE_LIKE}).first();
                if( checkReact && (checkReact!=undefined) ){
                    await db("user_matches").insert(
                        {
                            user_id_one: id,
                            user_id_two: profile_id,
                            type: 'react'
                        }
                    );

                    //Send matched notification
                    let user_one = db('users').where('id',id).first();
                    let user_two = db('users').where('id',profile_id).first();
                    payload_one = {
                        notification: {
                            title: 'Mutual Connection! ❤️',
                            body: "🎉 Congratulations! You and "+user_two.first_name+" both reacted positively to each other. It's a mutual connection! Start chatting and get to know each other better." 
                        },
                        data: { },
                        token: user_one.fcm_token
                    }
                    if( user_one.fcm_token && user_one.fcm_token != '' ){
                        try {
                            await firebase.messaging().send(payload_one);
                        } catch (error) {
                            console.error('Error sending FCM message:', error);
                        }
                    }
                    payload_two = {
                        notification: {
                            title: 'Mutual Connection! ❤️',
                            body: "🎉 Congratulations! You and "+user_one.first_name+" both reacted positively to each other. It's a mutual connection! Start chatting and get to know each other better." 
                        },
                        data: { },
                        token: user_two.fcm_token
                    }
                    if( user_two.fcm_token && user_two.fcm_token != '' ){
                        try {
                            await firebase.messaging().send(payload_two);
                        } catch (error) {
                            console.error('Error sending FCM message:', error);
                        }
                    }

                }
            }

        }

        if( type == status.USER_REACT_TYPE_LIKE ) {
            resMessage = 'You have liked this profile';
        } else {
            resMessage = 'You have disliked this profile';
        }
                        
        res.json({
            status: status.SUCCESS_STATUS,
            message: resMessage,					
            data: {
                matched_user,
                show_subscription_dialog: 0,
                remaining_reacts
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


// ========= User Report On Profile ========= //

router.post("/user-profile-report", authToken.authHandler, async (req, res) => {
    let { profile_id, reason } = req.body;
    let { id } = req.user;

    if(!reason || reason == null){
        return res.json({
            status: status.FAILURE_STATUS,
            message: 'Reason is required!',						
            data: {}
        });
    }

    if(reason.length > 150){
        return res.json({
            status: status.FAILURE_STATUS,
            message: 'Reason max length exceeded!',						
            data: {}
        });
    }

    try {
          
        let upsertData = await db("user_reports").where({user_id: id, profile_id: profile_id}).select("*"); 
        if(upsertData&&upsertData.length==0){
            await db("user_reports").insert(
                {
                    user_id: id,
                    profile_id: profile_id,
                    reason: reason,
                    status: 1
                }
            );
            await markUserMatchActionTaken(id,profile_id);         
        }

        res.json({
            status: status.SUCCESS_STATUS,
            message: 'Users reported successfully!',						
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


// ========= User Send Friend / Date Request ========= //

router.post("/send-friend-request", authToken.authHandler, async (req, res) => {
    let { receiver_id, request_type } = req.body;
    let { id } = req.user;

    if(!request_type || request_type == null) { 
        return res.json({
            status: status.FAILURE_STATUS,
            message: 'Request type is required!',						
            data: {}
        });
    }

    try {
        let resMsg = '';
        let reqType = 'friend';
        let upsertData = await db("user_friend_requests").where({sender_id: id, receiver_id: receiver_id}).select("*");  
        let request_data = {
            sender_id: id,
            receiver_id: receiver_id,
            type: ((request_type && request_type == 'friend') ? status.USER_FRIEND_REQUEST : status.USER_DATE_REQUEST),
            status: status.USER_FRIEND_REQUEST_PENDING
        }
                        
        if(upsertData&&upsertData.length==0){
            await db("user_friend_requests").insert(request_data);
            if( request_type == status.USER_FRIEND_REQUEST ) {
                resMsg = 'Friend request sent successfully!';
                reqType = 'friend';
            } else {
                resMsg = 'Date request sent successfully!';
                reqType = 'date';
            }
        } else {
            if( upsertData[0].type == status.USER_FRIEND_REQUEST ) {
                resMsg = 'Friend request already sent!';
                reqType = 'friend';
            } else {
                resMsg = 'Date request already sent!';
                reqType = 'date';
            }
        }

        //Send friend/date Request notification
        let sender = await db('users').where('id',id).first();
        let receiver = await db('users').where('id',receiver_id).first();
        // let reqType = ((request_type && request_type == 'friend') ? 'friend' : 'date');
        payload = {
            notification: {
                title: 'New Friend Request 🤝',
                body: "👋 You've received a "+reqType+" request from "+sender.first_name+"." 
            },
            data: { },
            token: receiver.fcm_token
        }
        if( receiver.fcm_token && receiver.fcm_token != '' ){
            try {
                await firebase.messaging().send(payload);
            } catch (error) {
                console.error('Error sending FCM message:', error);
            }
        }

        res.json({
            status: status.SUCCESS_STATUS,
            message: resMsg,						
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


// ========= User Get Pending Friend / Date Request ========= //

router.get("/get-user-friend-request", authToken.authHandler, async (req, res) => {    
    let { id } = req.user;    

    try {

        const get_user = await db("users").where({ id: id }).select("*");
        if(get_user && get_user.length > 0) {

            let friend_requests = await db('user_friend_requests').where("user_friend_requests.receiver_id", id).where("user_friend_requests.status", status.USER_FRIEND_REQUEST_PENDING )
            .join('users', 'user_friend_requests.sender_id', '=', 'users.id')
            .select('user_friend_requests.id as id','users.first_name', 'users.last_name', 'users.profile_image', 'user_friend_requests.type','user_friend_requests.sender_id')
                    
            res.json({
                status: status.SUCCESS_STATUS,
                message: 'Get pending request list successfully!',						
                data: {
                    friend_requests
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


// ========= User Send Friend / Date Request ========= //

router.post("/accept-friend-request", authToken.authHandler, async (req, res) => {
    let { request_id, sender_id, request_type, is_accepted } = req.body;
    let { id } = req.user;

    if(!request_id || request_id == null) {
        return res.json({
            status: status.FAILURE_STATUS,
            message: 'Request id is required!',						
            data: {}
        });
    }

    try {
                                      
        await db("user_friend_requests").where({id: request_id}).update({ status: status.USER_FRIEND_REQUEST_ACCEPTED, updated_at: utils.getFormatedDate() });            
        
        let upsertData = await db('user_personal_lists').where({user_id: id, profile_id: sender_id}).select('*');             
        if(upsertData&&upsertData.length==0){
            await db("user_personal_lists").insert({
                user_id: id,
                profile_id: sender_id,
                type: request_type == 2 ? status.USER_FRIEND_REQUEST : status.USER_DATE_REQUEST,                
            });
        } else {
            await db("user_personal_lists").where({user_id: id, profile_id: sender_id}).update({
                type: request_type == 2 ? status.USER_FRIEND_REQUEST : status.USER_DATE_REQUEST,                
            });
        }

        let upsertSenderData = await db('user_personal_lists').where({user_id: sender_id, profile_id: id}).select('*');             
        if(upsertSenderData&&upsertSenderData.length==0){
            await db("user_personal_lists").insert({
                user_id: sender_id,
                profile_id: id,
                type: request_type == 2 ? status.USER_FRIEND_REQUEST : status.USER_DATE_REQUEST,                
            });
        } else {
            await db("user_personal_lists").where({user_id: sender_id, profile_id: id}).update({
                type: request_type == 2 ? status.USER_FRIEND_REQUEST : status.USER_DATE_REQUEST,                
            });
        }

        markUserMatchActionTaken( id, sender_id );
        markUserMatchActionTaken( sender_id, id );

        //Send friend/date Request notification
        let receiver = await db('users').where('id',id).first();
        let sender = await db('users').where('id',sender_id).first();
        let reqType = ((request_type && request_type == 'friend') ? 'friend' : 'date')
        payload = {
            notification: {
                title: 'Friend Request Accepted! 🎉',
                body: "🎊 Great news! "+receiver.first_name+" has accepted your "+reqType+" request." 
            },
            data: { },
            token: sender.fcm_token
        }
        if( sender.fcm_token && sender.fcm_token != '' ){
            try {
                await firebase.messaging().send(payload);
            } catch (error) {
                console.error('Error sending FCM message:', error);
            }
        }

        res.json({
            status: status.SUCCESS_STATUS,
            message: 'Friend request accepted successfully!',						
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


// ========= Move User To My List ========= //

router.post("/move-user-to-list", authToken.authHandler, async (req, res) => {
    let { profile_id } = req.body;
    let { id } = req.user;

    // if(!request_type || request_type == null) { 
    //     return res.json({
    //         status: status.FAILURE_STATUS,
    //         message: 'Request type is required!',						
    //         data: {}
    //     });
    // }

    try {
                        
        let upsertData = await db('user_personal_lists').where({user_id: id, profile_id: profile_id}).select('*');            
        let request_data = {
            user_id: id,
            profile_id: profile_id,
            type: status.USER_MATCH_REQUEST,                
        }

        if(upsertData&&upsertData.length == 0){
            await db("user_personal_lists").insert(request_data);
            await markUserMatchActionTaken(id,profile_id);         
        }

        res.json({
            status: status.SUCCESS_STATUS,
            message: 'User moved to list successfully!',						
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


// ========= Show User Personal List ========= //

router.get("/user-personal-list", authToken.authHandler, async (req, res) => {    
    let { id } = req.user;    

    try {
        let myUserList = await db('user_personal_lists')
        // .join('users', 'user_personal_lists.user_id', '=', 'users.id')
        .join('users as profiles', 'user_personal_lists.profile_id', '=', 'profiles.id')
        .where('user_personal_lists.user_id',id)
        .select('profiles.id as id','profiles.first_name', 'profiles.last_name', 'profiles.profile_image', 'profiles.age', 'user_personal_lists.type')

        if(myUserList&&myUserList.length>0) {
            return res.json({
                status: status.SUCCESS_STATUS,
                message: 'Get user personal list successfully!',						
                data: {
                    myUserList
                }
            }); 
        } else {
            return res.json({
                status: status.FAILURE_STATUS,
                message: 'No users on your personal list right now!',						
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


// ========= Show User Personal List ========= //

router.get("/user-matches", authToken.authHandler, async (req, res) => {    
    let { id } = req.user;    

    try {

        let matchesLimit = 0;
        const userModel = new User();
        let activeSubscription = await userModel.getActiveSubscription(id);
        if( activeSubscription ) {
            matchesLimit = 4;
        }
                        
        let matches = await db('user_matches')
        // where((builder) => {
        //     builder.where('user_matches.user_id_one',id)
        //             .orWhere('user_matches.user_id_two',id)
        // })
        .where('user_matches.user_id_one',id).orWhere('user_matches.user_id_two',id)
        .limit(10)
        .orderBy('id','desc')
        .select('user_matches.*')
        // .select('user_matches.id','user_matches.user_id_one','user_matches.user_id_two')

        if(matches&&matches.length>0) {
            const matchedUserList = (await Promise.all(matches.map(async (row) => {
                const targetUserId = (row.user_id_one === id) ? row.user_id_two : row.user_id_one;
                const user = await db('users').where('id', targetUserId).first();
                const checkUser = (row.user_id_one === id) ? 'one' : 'two';
            
                if (
                    (checkUser === 'one' && row.user_one_action === status.USER_MATCH_ACTION_PENDING) ||
                    (checkUser === 'two' && row.user_two_action === status.USER_MATCH_ACTION_PENDING)
                ) {
                    return {
                        ...row,
                        user_id: user.id,
                        first_name: user.first_name ?? '',
                        last_name: user.last_name ?? '',
                        age: user.age,
                        profile_image: user.profile_image
                    };
                }
            
                return null; // Don't include non-matching rows in the result
            }))).filter((matchedUser) => matchedUser !== null);
            
            return res.json({
                status: status.SUCCESS_STATUS,
                message: 'Get user match list successfully!',						
                data: {
                    matches: matchedUserList
                }
            }); 
        } else {
            return res.json({
                status: status.FAILURE_STATUS,
                message: 'No user match found!',						
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

// ========= User Match Not For me ========= //

router.post("/user-match-not-for-me", authToken.authHandler, async (req, res) => {    
    let { id } = req.user; 
    let { profile_id } = req.body;  
    
    if(!profile_id || profile_id == null){
        return res.json({
            status: status.FAILURE_STATUS,
            message: 'Profile Id is required!',						
            data: {}
        });
    }

    try {
        let result = await markUserMatchActionTaken(id,profile_id);
        if( result ) {
            return res.json({
                status: status.SUCCESS_STATUS,
                message: 'User marked not for me successfully!',						
                data: {}
            }); 
        } else {
            return res.json({
                status: status.SUCCESS_STATUS,
                message: 'Failed: Profile not found against this user.',						
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

router.post("/remove-from-list", authToken.authHandler, async (req, res) => {    
    let { id } = req.user; 
    let { type, profile_id } = req.body;
    
    if(!type || type == null){
        return res.json({
            status: status.FAILURE_STATUS,
            message: 'Type is required!',						
            data: {}
        });
    }
    
    if(!profile_id || profile_id == null){
        return res.json({
            status: status.FAILURE_STATUS,
            message: 'Profile Id is required!',						
            data: {}
        });
    }

    try {
        await db('user_personal_lists').where({ user_id:id, profile_id: profile_id }).del()
        return res.json({
            status: status.SUCCESS_STATUS,
            message: 'User has been removed from '+ type +' list successfully!',						
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


// ========= User Create A Chat Thread ========= //

router.post("/create-chat", authToken.authHandler, async (req, res) => {
    let { user_two, chat_id } = req.body;
    let { id } = req.user;

    if(!chat_id || chat_id == null) { 
        return res.json({
            status: status.FAILURE_STATUS,
            message: 'Chat id is required!',						
            data: {}
        });
    }

    try {
        
        let deviceToken = await db('users').where({ id: user_two }).select('fcm_token');        
        let upsertData = await db('user_chats').where({user_one: id, chat_id: chat_id }).select('*');
        if(upsertData&&upsertData.length==0){

            await db("user_chats").insert({
                user_one: id,
                user_two: user_two,
                chat_id: chat_id,                
            });

            if(deviceToken&&deviceToken.length){ 
                
                let message = {
                    notification: {
                        title: "Chat created",
                        body: "New chat created"
                    },
                    token: deviceToken[0].fcm_token
                }

                firebase.messaging().send(message)                                                         
                .then((response) => {
                    console.log("Successfully sent message:", response);
                })
                .catch((error) =>  {
                    console.log("Error sending message:", error);
                });                               
            }           
        }        

        res.json({
            status: status.SUCCESS_STATUS,
            message: 'User chat created successfully!',						
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


// ========= Get User Chat List ========= //

router.get("/get-chat-list", authToken.authHandler, async (req, res) => {    
    let { id } = req.user;

    try {
                
        let userChats = await db('user_chats').where({ user_one: id }).select('*');        
        if(userChats&&userChats.length){           

            const user = await db("users").where({ id: id }).select('first_name','last_name','profile_image');
            userChats = await db('user_chats')
            .join('users', 'user_chats.user_two', '=', 'users.id')
            .select('users.first_name', 'users.last_name', 'users.profile_image','user_chats.*')
            
            
            res.json({
                status: status.SUCCESS_STATUS,
                message: 'Get user chat successfully!',						
                data: {
                    userChats,
                    profile: user[0]
                }
            });            
        }else {
            res.json({
                status: status.SUCCESS_STATUS,
                message: 'No chats found!',						
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


// ========= Send Call Notification Api ========= //

router.post("/send-call-notification", authToken.authHandler, async (req, res) => {
    let { user_id, call_type } = req.body;
    let { id } = req.user;
    let contentType = "Call";

    try {
        
        let deviceToken = await db('users').where({ id: user_id }).select('fcm_token');                
        let userData = await db('users').where({ id: id }).select('*');                        
        if(deviceToken&&deviceToken.length){  

            if(userData&&userData.length){       
                let user = userData[0] 
                const payload = {
                    notification: {
                        title: contentType == 'Call' ? `call from ${user.first_name} ${user.last_name}` : `You have a message from ${user.first_name} ${user.last_name}`,
                        body: "Incoming Call"                    
                    },
                    data: {
                        senderName: user.first_name + user.last_name,
                        senderPicture: user.profile_image,
                        channel_id: req.body.channelName,
                        type: contentType,                
                    },
                    token: deviceToken[0].fcm_token
                }                        
                
                firebase.messaging().send(payload)
                    .then((response) => {
                        if(response) {
                            res.json({
                                status: status.SUCCESS_STATUS,
                                message: "Notification send successfully!",						                
                                data: {}
                            });                              
                        }                
                    })
                .catch((error) => {
                    return res.json({
                        status: status.FAILURE_STATUS,
                        message: error,						                
                        data: {}
                    });                
                });                            
            }
        }                          
    } catch (error) {

        res.json({
            status: status.FAILURE_STATUS,
            message: error,						                
            data: {
                
            }
        });      
    }    
});

//
// ========= Send Call Notification Api ========= //

router.post("/send-msg-notification", authToken.authHandler, async (req, res) => {
    let { user_id, msg } = req.body;
    let { id } = req.user;    

    if(!msg || (msg == null) || (msg == 'null') || (msg == '') ) { 
        return res.json({
            status: status.FAILURE_STATUS,
            message: 'Msg is required!',						
            data: {}
        });
    }

    try {
        
        let deviceToken = await db('users').where({ id: user_id }).select('fcm_token');                
        let userData = await db('users').where({ id: id }).select('*');                        
        if(deviceToken&&deviceToken.length){  

            if(userData&&userData.length){       
                let user = userData[0] 
                const payload = {
                    notification: {
                        title: `${user.first_name} sent you a message`,
                        body: msg                    
                    },
                    data: {
                        senderName: user.first_name + user.last_name,
                        senderPicture: user.profile_image,
                        message: msg                        
                    },
                    token: deviceToken[0].fcm_token
                }                        
                
                firebase.messaging().send(payload)
                    .then((response) => {
                        if(response) {
                            res.json({
                                status: status.SUCCESS_STATUS,
                                message: "Notification send successfully!",						                
                                data: {}
                            });                              
                        }                
                    })
                .catch((error) => {
                    return res.json({
                        status: status.FAILURE_STATUS,
                        message: error,						                
                        data: {}
                    });                
                });                            
            }
        }                          
    } catch (error) {

        res.json({
            status: status.FAILURE_STATUS,
            message: error,						                
            data: {
                
            }
        });      
    }    
});

module.exports = router;