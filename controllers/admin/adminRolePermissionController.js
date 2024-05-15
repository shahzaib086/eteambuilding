//js
const status = require('../../helpers/constants.js');
const db = require("../../config/connection.js");
const utils = require('../../helpers/utility.js');  
const {Role, Permission} = require('../../models/role.js'); 

const roleListing = async (req, res) => {
    const data =  {};
    data.title = 'Roles';
    data.listing_fetch_url = '/admin/roles/fetch';
    data.add_url = '/admin/role/create';

    return res.render("admin/roles/index", data );
}

const roleListingFetch = async (req, res) => {
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

    const userModel = new Role();

    // Data query
    const query = userModel.getCollection();

    // Count query
    const queryTotalRecords = userModel.getCollection();

    if( (req.body.search) && req.body.search['value'] != '' ){
        query.where((builder) => {
            builder.where('name', 'LIKE', `%${req.body.search['value']}%`);
          })
    }

    // Order By
    if( (req.body.order) && (req.body.order.length>0) ) {
        query.orderBy(req.body.columns[ req.body.order[0]['column'] ]['data'], req.body.order[0]['dir']);
    }

    // Apply DataTables server-side processing
    const data = await query.offset(start).limit(length);

    const totalRecords = await userModel.getTotalRecord(queryTotalRecords);

    // Loop through the data and append a key on runtime
    const modifiedData = data.map((row) => {
        const newRow = { 
            ...row, 
            edit_btn: userModel.getEditBtnHtml(row),
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

const createRole = async (req, res) => {
    let data =  {};

    data.title = 'Create Role';

    const roleModel = new Role();	
    const permissionModel = new Permission();	
    data.permissionGroupData = await Permission.permissionGroupData;  

    let permissions = await permissionModel.getAll();
    let permissionArray = {};
    permissions.forEach(permission => {
        permissionArray[permission.name] = {
            id: permission.id,
            name: permission.name
        };
    });
    data.arrangedPermission = permissionArray;

    data.action_url = '/admin/role/store';
    data.role = null

    return res.render("admin/roles/add_edit", data );
}

const storeRole = async (req, res) => {
    
    const roleModel = new Role();
    const checkRole = await roleModel.checkExist(req.body.name);

    if( checkRole ) {
        const errors = {
            name: "Role name already exist"
        }
        req.flash('errors', errors);
        return res.redirect('/admin/role/create');
    }

    let data = {
        name: req.body.name,
        slug: utils.createSlug(req.body.name)
    }
    let role = await roleModel.create(data);

    let permissions = req.body.permissions;
    await roleModel.setPermissions(role[0],permissions);

    req.flash('type', status.TOAST_SUCCESS);
    req.flash('message', 'Role created successfully!');
        
    return res.redirect('/admin/roles');
    
}

const editRole = async (req, res) => {
    let encId =  req.params.encId;
    let data =  {};

    const roleModel = new Role();	

    data.title = 'Edit Role';

    const permissionModel = new Permission();
    data.permissionGroupData = await Permission.permissionGroupData; 

    let permissions = await permissionModel.getAll();
    let permissionArray = {};
    permissions.forEach(permission => {
        permissionArray[permission.name] = {
            id: permission.id,
            name: permission.name
        };
    });
    data.arrangedPermission = permissionArray;

    data.action_url = '/admin/role/update/'+encId;
    data.role = await roleModel.getByEncId(encId);
    data.rolePermissions = await roleModel.getPermissions(data.role);

    return res.render("admin/roles/add_edit", data );
}

const updateRole = async (req, res) => {
    const roleModel = new Role();
    
    let encId =  req.params.encId;
    let role = await roleModel.getByEncId(encId);

    const checkRole = await roleModel.checkExist(req.body.name,role);
    if( checkRole ) {
        const errors = {
            name: "Role name already exist"
        }
        req.flash('errors', errors);
        return res.redirect('/admin/role/edit/'+encId);
    }

    let data = {
        name: req.body.name,
        slug: utils.createSlug(req.body.name)
    }
    await roleModel.update(role.id,data);

    let permissions = req.body.permissions;
    await roleModel.setPermissions(role,permissions);

    req.flash('type', status.TOAST_SUCCESS);
    req.flash('message', 'Role updated successfully!');

    return res.redirect('/admin/roles');
    
}

module.exports =  {
    roleListing,
    roleListingFetch,
    createRole,
    storeRole,
    editRole,
    updateRole
};