//js
const status = require('../../helpers/constants.js');
const db = require("../../config/connection.js");
const utils = require('../../helpers/utility.js');  
const authToken = require('../../helpers/jwt-module.js');
const dayjs = require('dayjs');
const User = require('../../models/user.js'); 
const {Role} = require('../../models/role.js'); 

const adminUserListing = async (req, res) => {
    const data =  {};
    const roleModel = new Role();	
    data.title = 'Admin Users';
    data.roles = await roleModel.getAll();
    data.listing_fetch_url = '/admin/users/fetch';
    data.add_url = '/admin/user/create';

    return res.render("admin/admin_user/index", data );
}

const adminUserListingFetch = async (req, res) => {
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
    const query = userModel.getCollection().whereNotIn('role_id', [status.ROLE_SUPER_ADMIN]);
    query.join('roles', 'roles.id', '=', 'users.role_id');

    // Count query
    const queryTotalRecords = userModel.getCollection().whereNotIn('role_id', [status.ROLE_SUPER_ADMIN]);

    if( (req.body.role) && (req.body.role!='') ) {
        query.where('role_id', req.body.role);
        queryTotalRecords.where('role_id', req.body.role);
    }

    if( (req.body.status) && (req.body.status!='') ) {
        query.where('status', req.body.status);
        queryTotalRecords.where('status', req.body.status);
    }

    if( (req.body.search) && req.body.search['value'] != '' ){
        query.where((builder) => {
            builder.orWhere('users.name', 'ILIKE', `%${req.body.search['value']}%`)
                    .orWhere('users.email', 'ILIKE', `%${req.body.search['value']}%`);
          })
    }

    // Order By
    if( (req.body.order) && (req.body.order.length>0) ) {
        query.orderBy(req.body.columns[ req.body.order[0]['column'] ]['data'], req.body.order[0]['dir']);
    }

    query.select('users.*','roles.name AS role');

    // Apply DataTables server-side processing
    const data = await query.offset(start).limit(length);

    const totalRecords = await userModel.getTotalRecord(queryTotalRecords);

    // Loop through the data and append a key on runtime
    const modifiedData = data.map((row) => {
        const newRow = { 
            ...row, 
            m_updated_at: dayjs(row.updated_at??row.created_at).format(status.DATATABLE_TIMESTAMP_FORMAT),
            edit_btn: userModel.getEditBtnHtml(row),
            status_html: userModel.getStatusHtml(row),
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

const createAdminUser = async (req, res) => {
    let data =  {};
    const roleModel = new Role();	
    data.title = 'Create Admin User';
    data.roles = await roleModel.getAll();  
    data.action_url = '/admin/user/store';
    data.user = null

    return res.render("admin/admin_user/add_edit", data );
}

const storeAdminUser = async (req, res) => {

    const userModel = new User();
    const checkUser = await userModel.checkEmailExist(req.body.email);

    if( checkUser ) {
        const errors = {
            email: "Email address already exist"
        }
        req.flash('errors', errors);
        return res.redirect('/admin/user/create');
    }

    await utils.cryptPassword(req.body.password, async(hashPassword) => {                        
        if(hashPassword) {
            const data = {
                name: req.body.name,
                email: req.body.email,
                password: hashPassword,
                role_id: req.body.role_id,
                status: (req.body.status=='on')?1:0,
                phone_number: '00000000000'
            }
            const user = await userModel.create(data);    

            req.flash('type', status.TOAST_SUCCESS);
            req.flash('message', 'Admin user created successfully!');
            
        } else {
            req.flash('type', status.TOAST_ERROR);
            req.flash('message', status.TOAST_ERROR_MSG);
        }
        return res.redirect('/admin/users');
    }); 
    
}

const editAdminUser = async (req, res) => {
    let encId =  req.params.encId;
    let data =  {};

    const roleModel = new Role();	
    const userModel = new User();	

    data.title = 'Edit Admin User';
    data.roles = await roleModel.getAll();  
    data.action_url = '/admin/user/update/'+encId;
    data.user = await userModel.getByEncId(encId);
    return res.render("admin/admin_user/add_edit", data );
}

const updateAdminUser = async (req, res) => {
    const userModel = new User();
    
    let encId =  req.params.encId;
    let user = await userModel.getByEncId(encId);

    const checkUser = await userModel.checkEmailExist(req.body.email,user);

    if( checkUser ) {
        const errors = {
            email: "Email address already exist"
        }
        req.flash('errors', errors);
        return res.redirect('/admin/user/edit/'+encId);
    }

    if( req.body.password && (req.body.password!='') ) {
        await utils.cryptPassword(req.body.password, async(hashPassword) => {                        
            if(hashPassword) {
                const data = {
                    name: req.body.name,
                    email: req.body.email,
                    password: hashPassword,
                    role_id: req.body.role_id,
                    status: (req.body.status=='on')?1:0,
                }
                await userModel.update(user.id,data);    
    
                req.flash('type', status.TOAST_SUCCESS);
                req.flash('message', 'Admin user updated successfully!');
                
            } else {
                req.flash('type', status.TOAST_ERROR);
                req.flash('message', status.TOAST_ERROR_MSG);
            }
        }); 
    } else {
        const data = {
            name: req.body.name,
            email: req.body.email,
            role_id: req.body.role_id,
            status: (req.body.status=='on')?1:0,
        }
        await userModel.update(user.id,data);    

        req.flash('type', status.TOAST_SUCCESS);
        req.flash('message', 'Admin user updated successfully!');
    }

    return res.redirect('/admin/users');
    
}

const changePasswordAdminUser = async (req, res) => {
    let data =  {};
    data.title = 'Change Password';
    data.action_url = '/admin/update-password';
    return res.render("admin/admin_user/change_password", data );
}

const updatePasswordAdminUser = async (req, res) => {
    const user = req.session.auth;

    await utils.comparePassword(req.body.current_password, user.password, async (isPasswordMatch) => {                        
        if(isPasswordMatch) {
            
        } else {
            req.flash('type', status.TOAST_ERROR);
            req.flash('message', 'Old password does not matched.');
            return res.redirect('/admin/change-password');
        }
    }); 

    if( (req.body.password.length > 20) ){
        req.flash('type', status.TOAST_ERROR);
        req.flash('message', 'Password length must not be greater than 20 characters.');
        return res.redirect('/admin/change-password');
    }

    if( (req.body.password != req.body.password_confirmation) ){
        req.flash('type', status.TOAST_ERROR);
        req.flash('message', 'Confirm password not matched.');
        return res.redirect('/admin/change-password');
    }

    if( req.body.password && (req.body.password!='') ) {
        await utils.cryptPassword(req.body.password, async(hashPassword) => {                        
            if(hashPassword) {
                const data = {
                    password: hashPassword,
                }
                const userModel = new User();
                await userModel.update(user.id,data);    
    
                req.flash('type', status.TOAST_SUCCESS);
                req.flash('message', 'Password changed successfully!');
                
            } else {
                req.flash('type', status.TOAST_ERROR);
                req.flash('message', status.TOAST_ERROR_MSG);
            }
            return res.redirect('/admin/change-password');
        }); 
    } else {
        req.flash('type', status.TOAST_ERROR);
        req.flash('message', status.TOAST_ERROR_MSG);
        return res.redirect('/admin/change-password');
    }
}

module.exports =  {
    adminUserListing,
    adminUserListingFetch,
    createAdminUser,
    storeAdminUser,
    editAdminUser,
    updateAdminUser,
    changePasswordAdminUser,
    updatePasswordAdminUser
};