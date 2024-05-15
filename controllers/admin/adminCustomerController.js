//js
const status = require('../../helpers/constants.js');
const db = require("../../config/connection.js");
// const utils = require('../../helpers/utility.js');  
// const dayjs = require('dayjs');
const User = require('../../models/user.js'); 
const {Role} = require('../../models/role.js'); 

const customerListing = async (req, res) => {
    const data =  {};
    const roleModel = new Role();	
    data.title = 'Customers';
    data.roles = await roleModel.getAll();
    data.listing_fetch_url = '/admin/customers/fetch';

    return res.render("admin/customer/index", data );
}

const customerListingFetch = async (req, res) => {
    // Define your PostgreSQL table name
    const queryResult = await getDatatablesQueryResult(req);

    const responseData = {
        draw: queryResult.draw,
        recordsTotal: queryResult.recordsTotal,
        recordsFiltered: queryResult.recordsFiltered,
        data: queryResult.data,
    };

    // Send the result as JSON
    res.json(responseData);
}

const getDatatablesQueryResult = async(req) => {
    const draw = req.body.draw;
    const start = req.body.start;
    const length = req.body.length;

    const userModel = new User();

    // Data query
    const query = userModel.getCollection().where('role_id', status.ROLE_USER );
    // query.join('roles', 'roles.id', '=', 'users.role_id');

    // Count query
    const queryTotalRecords = userModel.getCollection().where('role_id', status.ROLE_USER );

    if( (req.body.role) && (req.body.role!='') ) {
        query.where('role_id', req.body.role);
        queryTotalRecords.where('role_id', req.body.role);
    }

    if( (req.body.is_phone_verified) && (req.body.is_phone_verified!='') ) {
        query.where('is_phone_verified', req.body.is_phone_verified);
        queryTotalRecords.where('is_phone_verified', req.body.is_phone_verified);
    }

    if( (req.body.is_email_verified) && (req.body.is_email_verified!='') ) {
        query.where('is_email_verified', req.body.is_email_verified);
        queryTotalRecords.where('is_email_verified', req.body.is_email_verified);
    }

    if( (req.body.status) && (req.body.status!='') ) {
        query.where('status', req.body.status);
        queryTotalRecords.where('status', req.body.status);
    } else {
        query.whereNot('status',status.USER_PROFILE_DELETED);
        queryTotalRecords.whereNot('status',status.USER_PROFILE_DELETED);
    }

    if( (req.body.customer_id) && (req.body.customer_id!='') ) {
        query.where('users.id', req.body.customer_id);
        queryTotalRecords.where('users.id', req.body.customer_id);
    }

    if( (req.body.search) && req.body.search['value'] != '' ){
        query.where((builder) => {
            builder.orWhere('users.first_name', 'ILIKE', `%${req.body.search['value']}%`)
                    .orWhere('users.last_name', 'ILIKE', `%${req.body.search['value']}%`)
                    .orWhere('users.phone_number', 'ILIKE', `%${req.body.search['value']}%`)
                    .orWhere('users.email', 'ILIKE', `%${req.body.search['value']}%`);
          })
    }

    // Order By
    if( (req.body.order) && (req.body.order.length>0) ) {
        query.orderBy(req.body.columns[ req.body.order[0]['column'] ]['data'], req.body.order[0]['dir']);
    }

    query.select('users.*');

    // Apply DataTables server-side processing
    const data = await query.offset(start).limit(length);

    const totalRecords = await userModel.getTotalRecord(queryTotalRecords);

    // Loop through the data and append a key on runtime
    const modifiedData = data.map((row) => {
        const newRow = {
            ...row, 
            fullname : `${row.first_name??''} ${row.last_name??''}`,
            m_dob: userModel.getMDob(row),
            m_created_at: userModel.getMCreatedAt(row),
            m_updated_at: userModel.getMUpdatedAt(row),
            action_btns: `${userModel.getCustomerEditBtnHtml(row)} ${userModel.getCustomerViewBtnHtml(row)}`,
            status_html: userModel.getCustomerStatusHtml(row),
            is_phone_verified_html: userModel.getIsPhoneVerifiedHtml(row),
            is_email_verified_html: userModel.getIsEmailVerifiedHtml(row),
        };
        return newRow;
    });

    return {
        draw: draw,
        recordsTotal: totalRecords,
        recordsFiltered: totalRecords,
        data: modifiedData,
    }
}

const editCustomer = async (req, res) => {
    let encId =  req.params.encId;
    let data =  {};

    const userModel = new User();	

    data.title = 'Edit Customer';
    data.action_url = '/admin/customer/update/'+encId;
    data.user = await userModel.getByEncId(encId);
    data.user = {
        ...data.user,
        m_dob: userModel.getMDob(data.user),
        m_profile_image: userModel.getMProfileImage(data.user),
    }
    return res.render("admin/customer/add_edit", data );
}

const updateCustomer = async (req, res) => {
    const userModel = new User();
    
    let encId =  req.params.encId;
    let user = await userModel.getByEncId(encId);
    let userStatus =  req.body.status;
    let reject_reason =  req.body.reject_reason;
    let payload = {};

    // console.log("SHAHZAIB",status,reject_reason, user);

    if( (userStatus==status.USER_PROFILE_INCOMPLETE) ) {
        const errors = {
            user_status: "Cannot set status incompleted."
        }
        req.flash('errors', errors);
        req.flash('type', status.TOAST_ERROR);
        req.flash('message', 'Cannot set status incompleted.');
        return res.redirect('/admin/customer/edit/'+encId);
    }

    if( (userStatus==status.USER_PROFILE_REJECTED) && (!(reject_reason) || (reject_reason=='')) ) {
        const errors = {
            reject_reason: "Rejection reason is required."
        }
        req.flash('errors', errors);
        req.flash('type', status.TOAST_ERROR);
        req.flash('message', 'Rejection reason is required.');
        return res.redirect('/admin/customer/edit/'+encId);
    }


    //check if user is approved then add his dating pref
    if( userStatus == status.USER_PROFILE_APPROVED ) {
        let heightIds = await db('user_height_preferences').where('user_id',user.id).pluck('height_id');
        let interestIds = await db('user_interests').where('user_id',user.id).pluck('interest_id');
        let userAttributes = await db('user_attributes').where('user_id',user.id).first('*');

        let checkDatingPref = await db("user_dating_preferences").where({ user_id: user.id }).select("*");
        if( !(checkDatingPref && checkDatingPref.length > 0) ) {
            await db("user_dating_preferences").insert(
                {
                    user_id: user.id,                    
                    gender_preferences: userAttributes?.like_to_date,                        
                    height_ids: (heightIds.length>0)?heightIds.join():null,
                    religion_ids: userAttributes?.religion_id,
                    interest_ids: (interestIds.length>0)?interestIds.join():null,
                    community_ids: userAttributes?.community_id,
                    age_preference_start: userAttributes?.age_preference_start,
                    age_preference_end: userAttributes?.age_preference_end                                         
                }
            );
        }

    }

    const data = {
        reject_reason: reject_reason,
        status: userStatus
    }
    await userModel.update(user.id,data); 

    req.flash('type', status.TOAST_SUCCESS);
    req.flash('message', 'Customer updated successfully!');

    return res.redirect('/admin/customer/edit/'+encId);

}

const showCustomer = async (req, res) => {
    let encId =  req.params.encId;
    let data =  {};

    const userModel = new User();	
    const transModel = new Transaction();	

    data.title = 'Customer Details';
    data.action_url = '/admin/customer/show/'+encId;
    data.user = await userModel.getByEncId(encId);
    data.user = {
        ...data.user,
        fullname : `${data.user.first_name??''} ${data.user.last_name??''}`,
        m_dob: userModel.getMDob(data.user),
        m_profile_image: userModel.getMProfileImage(data.user),
        m_created_at: userModel.getMCreatedAt(data.user),
        status_html: userModel.getCustomerStatusHtml(data.user),
        is_phone_verified_html: userModel.getIsPhoneVerifiedHtml(data.user),
        is_email_verified_html: userModel.getIsEmailVerifiedHtml(data.user),
    }

    data.attributes = await userModel.getAttributes(data.user);
    data.interests = await userModel.getInterestsGroupByCategory(data.user);
    data.interests_category = Object.keys(data.interests);
    data.questions = await userModel.getQuestionAnswers(data.user);
    data.characters = await userModel.getCharacteristics(data.user);
    data.height_prefs = await userModel.getHeightPreferences(data.user);
    data.gallery = await userModel.getGalleryImages(data.user);
    data.reports_count = await userModel.getReportsCount(data.user);
    data.active_subscription = await userModel.getActiveSubscription(data.user.id);

    return res.render("admin/customer/show", data );
}

const customerDropdownData = async (req, res) => {

    let searchTerms = req.query.term ? req.query.term.split(' ') : null;

    const userModel = new User();

    const query = userModel.getCollection().where('role_id', status.ROLE_USER );

    if( searchTerms ) {
        query.where((builder) => {
            searchTerms.forEach(term => {
                builder.orWhere('users.first_name', 'ILIKE', `%${term}%`);
                builder.orWhere('users.phone_number', 'ILIKE', `%${term}%`);
                builder.orWhere('users.last_name', 'ILIKE', `%${term}%`);
            });
        });
    }

    query.select('users.*');

    // Apply data processing
    let data = await query.limit(5);

    const results = [];
    data.forEach(row => {
        results.push({
            id: row.id,
            text: `${row.first_name??''} ${row.last_name??''} (${row.phone_number})`,
        });
    });

    return res.json( {results} );
}

module.exports =  {
    customerListing,
    customerListingFetch,
    editCustomer,
    updateCustomer,
    showCustomer,
    customerDropdownData,
};