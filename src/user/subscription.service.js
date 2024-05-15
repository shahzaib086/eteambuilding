const express = require("express");

const authToken = require('../../helpers/jwt-module.js')
const db = require("../../config/connection.js");
const status = require('../../helpers/constants.js');
// const utils = require('../../helpers/utility.js'); 
// const firebase = require('../firebase/index.js');
const router = express.Router();
const {SubscriptionPlan} = require('../../models/subscription.js'); 
// const { route } = require("./user.service.js");
const dayjs = require('dayjs'); 


// ========= Subscription Plans List ========= //

router.get("/subscription-plans", authToken.authHandler, async (req, res) => {    
    let { id } = req.user;    

    try {

        // Data query
        const planModel = new SubscriptionPlan();
        const data = await planModel.getCollection().where({ status: 1 }).select("*");
        const identifiers = planModel.getIdentifierNormal();
        const identifiersDiscounted = planModel.getIdentifierDiscount();
        // Loop through the data and append a key on runtime
        const modifiedData = data.map((row) => {
            const newRow = {
                ...row,
                currency_symbol: '£',
                identifiers: (row.price<row.discounted_price)?identifiersDiscounted[row.duration]:identifiers[row.duration]
            };
            return newRow;
        });
        res.json({
            status: status.SUCCESS_STATUS,
            message: 'Get subcription plans successfully!',						
            data: {
                subscription_plans: modifiedData
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

// ========= Subscribe Package ========= //

router.post("/subscribe-package", async (req, res) => {
    let { 
            user_id, 
            plan_id, 
            transaction_id,
            amount, 
            duration, 
            subscription_start_date, 
            subscription_end_date,
            payment_status,
        } = req.body;
    if (!user_id || user_id == '') {
        res.json({
            status: status.FAILURE_STATUS,
            message: "User id is required",            
            data: {}
        });
    }
    
    if ( !plan_id || plan_id == '' || !transaction_id ) {
        res.json({
            status: status.FAILURE_STATUS,
            message: "Required parameters missing",            
            data: {}
        });
    } 

    if ( !amount || amount == '' || amount <= 0 ) {
        res.json({
            status: status.FAILURE_STATUS,
            message: "Amount is required",            
            data: {}
        });
    } 

    try {
        let serverCalculateEndDate = null;
        let currentDate = dayjs(subscription_start_date);
        if( duration == 'yearly' ) {
            serverCalculateEndDate = currentDate.add(365, 'day');
        } else if( duration == 'three_month' ) {
            serverCalculateEndDate = currentDate.add(90, 'day');
        } else if( duration == 'six_month' ) {
            serverCalculateEndDate = currentDate.add(180, 'day');
        } else {
            serverCalculateEndDate = currentDate.add(30, 'day');
        }
        const get_user = await db("users").where({ id: user_id }).select("*");
        if(get_user && get_user.length > 0) {

            let createData = {
                user_id: user_id, 
                plan_id: plan_id, 
                app_user_id: transaction_id,
                amount: amount, 
                duration: duration, 
                subscription_start_date: subscription_start_date, 
                // subscription_end_date: subscription_end_date,
                subscription_end_date: serverCalculateEndDate,
                payment_status: payment_status,                              
            };

            await db("transactions").insert( createData );

            return res.json({
                status: status.SUCCESS_STATUS,
                message: 'Subscription completed succesfully!',						
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

router.get("/user-transaction-history", authToken.authHandler, async (req, res) => {    
    let { id } = req.user; 

    try {
        
        const transactions = await db('transactions').where('user_id', id)
            .join('subscription_plans', 'subscription_plans.id', '=', 'transactions.plan_id')                                                            
            .orderBy('created_at','desc')
            .select(
                'transactions.*',
                'subscription_plans.name'
            );
        

        res.json({
            status: status.SUCCESS_STATUS,
            message: 'User Transaction History',						
            data: {
                transactions
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

router.get('/active-subscription', authToken.authHandler, async (req, res) => {
    let { id } = req.user;

    let today = dayjs().format(status.EDIT_DATE_FORMAT)

    const transaction = await db('transactions').where('user_id', id)
            .join('subscription_plans', 'subscription_plans.id', '=', 'transactions.plan_id')                                                            
            .orderBy('created_at','desc')
            .where('payment_status',status.TRANSACTION_PAYMENT_STATUS_SUCCESS)
            .where('subscription_start_date','<=',today)
            .where('subscription_end_date','>=',today)
            .first(
                'transactions.*',
                'subscription_plans.name'
            );

    res.json({
        status: status.SUCCESS_STATUS,
        message: 'User Transaction History',						
        data: {
            is_active_subscription: transaction?1:0,
            transaction:transaction??null
        }
    });

});

router.post('/verify-promo-code', authToken.authHandler, async (req, res) => {
    let { id } = req.user;
    let { 
        promo_code, 
    } = req.body;

    try{

        let today = dayjs().format(status.EDIT_DATE_FORMAT);

        const promoResult = await db('promo_codes').where('promo_code', 'ILIKE', `${promo_code}`)
                .where('status',1)
                .where('start_date','<=',today)
                .where('end_date','>=',today)
                .first();

        if( promoResult ){

            // Data query
            const planModel = new SubscriptionPlan();
            const data = await planModel.getCollection().where({ status: 1 }).select("*");

            // Loop through the data and append a key on runtime
            const modifiedData = data.map((row) => {
                let discounted_amount = 0;
                let plan_amount = 0;
                if( row.discounted_price > 0 ) {
                    plan_amount = row.discounted_price;
                } else {
                    plan_amount = row.price;
                }

                if( promoResult.type == 'percent' ){
                    discounted_amount = plan_amount - ( Math.round( (plan_amount*promoResult.value)/100, 2 ) );
                } else {
                    discounted_amount = plan_amount - promoResult.value;
                }

                const identifiersDiscounted = planModel.getIdentifierDiscount();
                const newRow = {
                    ...row,
                    // price: discounted_amount,
                    discounted_price: discounted_amount,
                    currency_symbol: '£',
                    identifiers: identifiersDiscounted[row.duration]
                };
                return newRow;
            });

            return res.json({
                status: status.SUCCESS_STATUS,
                message: 'Promo Code verified sucessfully!',						
                data: {
                    subscription_plans: modifiedData,
                    promo_code_details: promoResult
                }
            });
        }

        return res.json({
            status: status.FAILURE_STATUS,
            message: 'Invalid Promo Code',						
            data: {}
        });

    } catch (error) {

        return res.json({
            status: status.FAILURE_STATUS,
            message: error.message,						                
            data: {}
        });      
    } 

});


module.exports = router;