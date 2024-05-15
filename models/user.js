const db = require("../config/connection.js");
const config = require('../config/app-config.js');
const utils = require('../helpers/utility.js');  
const status = require('../helpers/constants.js');
const dayjs = require('dayjs');


class User {
    constructor() {
        this.tableName = 'users';
    }

    getCollection() {
        return db(this.tableName);
    }

    getAll() {
        return db(this.tableName).select('*');
    }

    getById(id) {
        return db(this.tableName).where({ id }).first();
    }

    getByEncId(encId) {
        let id = utils.decrypt(encId);
        return db(this.tableName).where({ id }).first();
    }

    create(user) {
        return db(this.tableName).insert(user, ['id']);
    }

    update(id, user) {
        return db(this.tableName).where({ id }).update(user, ['id']);
    }

    async checkEmailExist(email,user=null) {
        let query = db(this.tableName).where({ email });

        if (user) {
            query = query.whereNot('id', user.id);
        }

        return await query.first();
    }

    async getTotalRecord(collection){
        const totalRecordsQuery = collection.count('* as totalRecords');
        return await totalRecordsQuery.then((result) => {
            return result[0].totalRecords;
        }).catch((error) => {
            console.error(error);
            return 0;
        });
    }

    //   delete(id) {
    //     return db(this.tableName).where({ id }).del();
    //   }

    async getPermissions(user) {
        let permissions = await db("role_permission")
        .join('permissions', 'permissions.id', '=', 'role_permission.permission_id')
        .where('role_permission.role_id', '=', user.role_id)
        .select('role_permission.role_id', 'role_permission.permission_id', 'permissions.name');
        return permissions.map(obj => obj.name);
    }

    // Action Buttons
    getEditBtnHtml(item) {
        let e_id = utils.encrypt(item.id)
        let link = '/admin/user/edit/'+e_id;
        return '<a href="'+link+'" class="btn btn-primary btn-sm" title="Edit"><i class="icon icon-edit pr-0"></i> </a>';
    }

    getStatusHtml(item) {
        if( item.status==1 ){
            return '<span class="icon icon-unlock f-16 mr-1 text-success" title="Active"></span>';
        } else {
            return '<span class="icon icon-lock f-16 mr-1 text-danger" title="InActive"></span>';
        }
    }

    getCustomerEditBtnHtml(item) {
        let e_id = utils.encrypt(item.id)
        let link = '/admin/customer/edit/'+e_id;
        return '<a href="'+link+'" class="btn btn-primary btn-sm" title="Edit"><i class="icon icon-edit pr-0"></i> </a>';
    }

    getCustomerViewBtnHtml(item) {
        let e_id = utils.encrypt(item.id)
        let link = '/admin/customer/show/'+e_id;
        return '<a href="'+link+'" class="btn btn-primary btn-sm" title="View Details"><i class="icon icon-eye pr-0"></i> </a>';
    }

    getCustomerStatusHtml(item) {
        if( item.status == status.USER_PROFILE_PENDING ){
            return '<label class="badge badge-warning">Pending</label>';
        } else if( item.status == status.USER_PROFILE_APPROVED ){
            return '<label class="badge badge-success">Approved</label>';
        } else if( item.status == status.USER_PROFILE_REJECTED ){
            return '<label class="badge badge-danger">Rejected</label>';
        } else if( item.status == status.USER_PROFILE_BANNED ){
            return '<label class="badge badge-secondary">Banned</label>';
        } else if( item.status == status.USER_PROFILE_DELETED ){
            return '<label class="badge badge-secondary">Deleted</label>';
        } else {
            return '<label class="badge badge-primary">Incomplete</label>';
        }
    }

    getMProfileImage(item) {
        if( item.profile_image && (item.profile_image != '') ) {
            return config.app_base_url+item.profile_image;
        }
        return ''
    }

    getMCreatedAt(item) {
        return item.created_at?dayjs(item.created_at).format(status.DATATABLE_TIMESTAMP_FORMAT):'';
    }

    getMUpdatedAt(item) {
        return item.updated_at?dayjs(item.updated_at).format(status.DATATABLE_TIMESTAMP_FORMAT):'';
    }

}

module.exports = User;