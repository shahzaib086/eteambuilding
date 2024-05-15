const db = require("../config/connection.js");
const constants = require('../helpers/constants.js');
const utils = require('../helpers/utility.js');

class Role {

    constructor() {
        this.tableName = 'roles';
    }

    getCollection() {
        return db(this.tableName);
    }

    getAll() {
        return db(this.tableName).whereNot('id',constants.ROLE_SUPER_ADMIN)
        .select('*');
    }

    getById(id) {
        return db(this.tableName).where({ id }).first();
    }

    getByEncId(encId) {
        let id = utils.decrypt(encId);
        return db(this.tableName).where({ id }).first();
    }

    create(item) {
        return db(this.tableName).insert(item, ['id']);
    }

    update(id, item) {
        return db(this.tableName).where({ id }).update(item, ['id']);
    }

    //   delete(id) {
    //     return db(this.tableName).where({ id }).del();
    //   }

    async getTotalRecord(collection){
        const totalRecordsQuery = collection.count('* as totalRecords');
        return await totalRecordsQuery.then((result) => {
            return result[0].totalRecords;
        }).catch((error) => {
            console.error(error);
            return 0;
        });
    }

    // Action Buttons
    getEditBtnHtml(item) {
        let e_id = utils.encrypt(item.id)
        let link = '/admin/role/edit/'+e_id;
        return '<a href="'+link+'" class="btn btn-primary btn-sm" title="Edit"><i class="icon icon-edit pr-0"></i> </a>';
    }

    async checkExist(name,role=null) {
        let query = db(this.tableName).where({ name });

        if (role) {
            query = query.whereNot('id', role.id);
        }

        return await query.first();
    }

    async getPermissions(role) {
        return await db('role_permission').where('role_id',role.id).select('*');
    }

    async setPermissions(role,permissions) {
        await db('role_permission')
        .where('role_id', role.id) // Replace roleId with the actual role_id
        .del();
        await permissions.forEach(async (permission) => {
            let insertData  = {
                role_id: role.id,
                permission_id: permission
            };
            await db('role_permission').returning('role_id').insert(insertData);
        });
    }

}

class Permission {

    static permissionGroupData = Object.freeze({
        'roles': {
            'name': 'Roles Management',
            'permissions': [
                'perm-role',
            ],
        },
        'users': {
            'name': 'Admin User Management',
            'permissions': [
                'perm-admin-user',
            ],
        },
        'client-member': {
            'name': 'Client Member Management',
            'permissions': [
                'perm-client-member',
            ],
        },
        'event': {
            'name': 'Event Management',
            'permissions': [
                'perm-event',
            ],
        },
        'perm-assessment': {
            'name': 'Assessment',
            'permissions': [
                'perm-assessment',
            ],
        },
        'perm-assessment-validation': {
            'name': 'Assessment Validation',
            'permissions': [
                'perm-assessment-validation',
            ],
        },
        'perm-analytics': {
            'name': 'Anlytics',
            'permissions': [
                'perm-analytics',
            ],
        },
    });

    constructor() {
        this.tableName = 'permissions';
    }

    getCollection() {
        return db(this.tableName);
    }

    getAll() {
        return db(this.tableName).select('*');
    }

}

module.exports = { Role, Permission };