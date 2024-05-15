const db = require("../config/connection.js");
const config = require('../config/app-config.js');
const utils = require('../helpers/utility.js');  
const status = require('../helpers/constants.js');
const dayjs = require('dayjs');

class Event {
    constructor() {
        this.tableName = 'events';
    }
    
    getCategory() {
        return [
            { value: 'Hobbies', label: 'Hobbies' },
            { value: 'Creativity', label: 'Creativity' },
            { value: 'Other', label: 'Other' },
        ];
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

    create(item) {
        return db(this.tableName).insert(item, ['id']);
    }

    update(id, item) {
        return db(this.tableName).where({ id }).update(item, ['id']);
    }

    async getTotalRecord(collection){
        let totalRecordsQuery = collection.count('* as totalRecords');
        return await totalRecordsQuery.then((result) => {
            return result[0].totalRecords;
        }).catch((error) => {
            console.error(error);
            return 0;
        });
    }

    delete(id) {
        return db(this.tableName).where({ id }).del();
    }

    async checkExist(name,item=null) {
        let query = db(this.tableName).where({ name });

        if (item) {
            query = query.whereNot('id', item.id);
        }

        return await query.first();
    }

    async checkUsed(item){
        let count = await this.getTotalRecord( db('user_interests').where({ interest_id: item.id }) );
        if( count == 0 ) {
            return false;
        } else {
            return true;
        }
    }

    // Action Buttons
    getEditBtnHtml(item) {
        let e_id = utils.encrypt(item.id)
        let link = '/admin/interest/edit/'+e_id;
        return '<a href="'+link+'" class="btn btn-primary btn-sm" title="Edit"><i class="icon icon-edit pr-0"></i> </a>';
    }

    getDeleteBtnHtml(item) {
        let e_id = utils.encrypt(item.id)
        let link = '/admin/interest/delete/'+e_id;
        return '<button data-href="'+link+'" class="btn btn-danger btn-sm delete_btn" title="Delete"><i class="icon icon-trash pr-0"></i> </a>';
    }

    getStatusHtml(item) {
        if( item.status==1 ){
            return '<label class="badge badge-success">Active</label>';
        } else {
            return '<label class="badge badge-danger">Inactive</label>';
        }
    }

    getMIconPath(item) {
        if( item.icon_path && (item.icon_path != '') ) {
            return config.app_base_url+item.icon_path;
        }
        return ''
    }

}

class Characteristic {
    constructor() {
        this.tableName = 'characteristics';
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

    create(item) {
        return db(this.tableName).insert(item, ['id']);
    }

    update(id, item) {
        return db(this.tableName).where({ id }).update(item, ['id']);
    }

    async getTotalRecord(collection){
        let totalRecordsQuery = collection.count('* as totalRecords');
        return await totalRecordsQuery.then((result) => {
            return result[0].totalRecords;
        }).catch((error) => {
            console.error(error);
            return 0;
        });
    }

    delete(id) {
        return db(this.tableName).where({ id }).del();
    }

    async checkExist(name,item=null) {
        let query = db(this.tableName).where({ name });

        if (item) {
            query = query.whereNot('id', item.id);
        }

        return await query.first();
    }

    async checkUsed(item){
        let count = await this.getTotalRecord( db('user_characteristics').where({ characteristic_id: item.id }) );
        if( count == 0 ) {
            return false;
        } else {
            return true;
        }
    }

    // Action Buttons
    getEditBtnHtml(item) {
        let e_id = utils.encrypt(item.id)
        let link = '/admin/characteristic/edit/'+e_id;
        return '<a href="'+link+'" class="btn btn-primary btn-sm" title="Edit"><i class="icon icon-edit pr-0"></i> </a>';
    }

    getDeleteBtnHtml(item) {
        let e_id = utils.encrypt(item.id)
        let link = '/admin/characteristic/delete/'+e_id;
        return '<button data-href="'+link+'" class="btn btn-danger btn-sm delete_btn" title="Delete"><i class="icon icon-trash pr-0"></i> </a>';
    }

    getStatusHtml(item) {
        if( item.status==1 ){
            return '<label class="badge badge-success">Active</label>';
        } else {
            return '<label class="badge badge-danger">Inactive</label>';
        }
    }

}

class Religion {
    constructor() {
        this.tableName = 'religions';
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

    create(item) {
        return db(this.tableName).insert(item, ['id']);
    }

    update(id, item) {
        return db(this.tableName).where({ id }).update(item, ['id']);
    }

    async getTotalRecord(collection){
        let totalRecordsQuery = collection.count('* as totalRecords');
        return await totalRecordsQuery.then((result) => {
            return result[0].totalRecords;
        }).catch((error) => {
            console.error(error);
            return 0;
        });
    }

    delete(id) {
        return db(this.tableName).where({ id }).del();
    }

    async checkExist(name,item=null) {
        let query = db(this.tableName).where({ name });

        if (item) {
            query = query.whereNot('id', item.id);
        }

        return await query.first();
    }

    async checkUsed(item){
        let count = await this.getTotalRecord( db('user_attributes').where({ religion_id: item.id }) );
        if( count == 0 ) {
            return false;
        } else {
            return true;
        }
    }

    // Action Buttons
    getEditBtnHtml(item) {
        let e_id = utils.encrypt(item.id)
        let link = '/admin/religion/edit/'+e_id;
        return '<a href="'+link+'" class="btn btn-primary btn-sm" title="Edit"><i class="icon icon-edit pr-0"></i> </a>';
    }

    getDeleteBtnHtml(item) {
        let e_id = utils.encrypt(item.id)
        let link = '/admin/religion/delete/'+e_id;
        return '<button data-href="'+link+'" class="btn btn-danger btn-sm delete_btn" title="Delete"><i class="icon icon-trash pr-0"></i> </a>';
    }

    getStatusHtml(item) {
        if( item.status==1 ){
            return '<label class="badge badge-success">Active</label>';
        } else {
            return '<label class="badge badge-danger">Inactive</label>';
        }
    }

}

class Community {
    constructor() {
        this.tableName = 'communities';
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

    create(item) {
        return db(this.tableName).insert(item, ['id']);
    }

    update(id, item) {
        return db(this.tableName).where({ id }).update(item, ['id']);
    }

    async getTotalRecord(collection){
        let totalRecordsQuery = collection.count('* as totalRecords');
        return await totalRecordsQuery.then((result) => {
            return result[0].totalRecords;
        }).catch((error) => {
            console.error(error);
            return 0;
        });
    }

    delete(id) {
        return db(this.tableName).where({ id }).del();
    }

    async checkExist(name,item=null) {
        let query = db(this.tableName).where({ name });

        if (item) {
            query = query.whereNot('id', item.id);
        }

        return await query.first();
    }

    async checkUsed(item){
        let count = await this.getTotalRecord( db('user_attributes').where({ community_id: item.id }) );
        if( count == 0 ) {
            return false;
        } else {
            return true;
        }
    }

    // Action Buttons
    getEditBtnHtml(item) {
        let e_id = utils.encrypt(item.id)
        let link = '/admin/community/edit/'+e_id;
        return '<a href="'+link+'" class="btn btn-primary btn-sm" title="Edit"><i class="icon icon-edit pr-0"></i> </a>';
    }

    getDeleteBtnHtml(item) {
        let e_id = utils.encrypt(item.id)
        let link = '/admin/community/delete/'+e_id;
        return '<button data-href="'+link+'" class="btn btn-danger btn-sm delete_btn" title="Delete"><i class="icon icon-trash pr-0"></i> </a>';
    }

    getStatusHtml(item) {
        if( item.status==1 ){
            return '<label class="badge badge-success">Active</label>';
        } else {
            return '<label class="badge badge-danger">Inactive</label>';
        }
    }

}

class Education {
    constructor() {
        this.tableName = 'educations';
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

    create(item) {
        return db(this.tableName).insert(item, ['id']);
    }

    update(id, item) {
        return db(this.tableName).where({ id }).update(item, ['id']);
    }

    async getTotalRecord(collection){
        let totalRecordsQuery = collection.count('* as totalRecords');
        return await totalRecordsQuery.then((result) => {
            return result[0].totalRecords;
        }).catch((error) => {
            console.error(error);
            return 0;
        });
    }

    delete(id) {
        return db(this.tableName).where({ id }).del();
    }

    async checkExist(name,item=null) {
        let query = db(this.tableName).where({ name });

        if (item) {
            query = query.whereNot('id', item.id);
        }

        return await query.first();
    }

    async checkUsed(item){
        let count = await this.getTotalRecord( db('user_attributes').where({ education_id: item.id }) );
        if( count == 0 ) {
            return false;
        } else {
            return true;
        }
    }

    // Action Buttons
    getEditBtnHtml(item) {
        let e_id = utils.encrypt(item.id)
        let link = '/admin/education/edit/'+e_id;
        return '<a href="'+link+'" class="btn btn-primary btn-sm" title="Edit"><i class="icon icon-edit pr-0"></i> </a>';
    }

    getDeleteBtnHtml(item) {
        let e_id = utils.encrypt(item.id)
        let link = '/admin/education/delete/'+e_id;
        return '<button data-href="'+link+'" class="btn btn-danger btn-sm delete_btn" title="Delete"><i class="icon icon-trash pr-0"></i> </a>';
    }

    getStatusHtml(item) {
        if( item.status==1 ){
            return '<label class="badge badge-success">Active</label>';
        } else {
            return '<label class="badge badge-danger">Inactive</label>';
        }
    }

}

class Work {
    constructor() {
        this.tableName = 'works';
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

    create(item) {
        return db(this.tableName).insert(item, ['id']);
    }

    update(id, item) {
        return db(this.tableName).where({ id }).update(item, ['id']);
    }

    async getTotalRecord(collection){
        let totalRecordsQuery = collection.count('* as totalRecords');
        return await totalRecordsQuery.then((result) => {
            return result[0].totalRecords;
        }).catch((error) => {
            console.error(error);
            return 0;
        });
    }

    delete(id) {
        return db(this.tableName).where({ id }).del();
    }

    async checkExist(name,item=null) {
        let query = db(this.tableName).where({ name });

        if (item) {
            query = query.whereNot('id', item.id);
        }

        return await query.first();
    }

    async checkUsed(item){
        let count = await this.getTotalRecord( db('user_attributes').where({ work_id: item.id }) );
        if( count == 0 ) {
            return false;
        } else {
            return true;
        }
    }

    // Action Buttons
    getEditBtnHtml(item) {
        let e_id = utils.encrypt(item.id)
        let link = '/admin/work/edit/'+e_id;
        return '<a href="'+link+'" class="btn btn-primary btn-sm" title="Edit"><i class="icon icon-edit pr-0"></i> </a>';
    }

    getDeleteBtnHtml(item) {
        let e_id = utils.encrypt(item.id)
        let link = '/admin/work/delete/'+e_id;
        return '<button data-href="'+link+'" class="btn btn-danger btn-sm delete_btn" title="Delete"><i class="icon icon-trash pr-0"></i> </a>';
    }

    getStatusHtml(item) {
        if( item.status==1 ){
            return '<label class="badge badge-success">Active</label>';
        } else {
            return '<label class="badge badge-danger">Inactive</label>';
        }
    }

}

class Question {
    constructor() {
        this.tableName = 'question_templates';
    }

    getCategory() {
        return [
            { value: 'About', label: 'About' },
            { value: 'Personal', label: 'Personal' },
            { value: 'About Interest', label: 'About Interest' },
            { value: 'Other', label: 'Other' },
        ];
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

    create(item) {
        return db(this.tableName).insert(item, ['id']);
    }

    update(id, item) {
        return db(this.tableName).where({ id }).update(item, ['id']);
    }

    async getTotalRecord(collection){
        let totalRecordsQuery = collection.count('* as totalRecords');
        return await totalRecordsQuery.then((result) => {
            return result[0].totalRecords;
        }).catch((error) => {
            console.error(error);
            return 0;
        });
    }

    delete(id) {
        return db(this.tableName).where({ id }).del();
    }

    async checkExist(question,item=null) {
        let query = db(this.tableName).where({ question });

        if (item) {
            query = query.whereNot('id', item.id);
        }

        return await query.first();
    }

    // Action Buttons
    getEditBtnHtml(item) {
        let e_id = utils.encrypt(item.id)
        let link = '/admin/question/edit/'+e_id;
        return '<a href="'+link+'" class="btn btn-primary btn-sm" title="Edit"><i class="icon icon-edit pr-0"></i> </a>';
    }

    getDeleteBtnHtml(item) {
        let e_id = utils.encrypt(item.id)
        let link = '/admin/question/delete/'+e_id;
        return '<button data-href="'+link+'" class="btn btn-danger btn-sm delete_btn" title="Delete"><i class="icon icon-trash pr-0"></i> </a>';
    }

    getStatusHtml(item) {
        if( item.status==1 ){
            return '<label class="badge badge-success">Active</label>';
        } else {
            return '<label class="badge badge-danger">Inactive</label>';
        }
    }

}

class Content {
    constructor() {
        this.tableName = 'page_content';
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

    create(item) {
        return db(this.tableName).insert(item, ['id']);
    }

    update(id, item) {
        return db(this.tableName).where({ id }).update(item, ['id']);
    }

    async getTotalRecord(collection){
        let totalRecordsQuery = collection.count('* as totalRecords');
        return await totalRecordsQuery.then((result) => {
            return result[0].totalRecords;
        }).catch((error) => {
            console.error(error);
            return 0;
        });
    }

    delete(id) {
        return db(this.tableName).where({ id }).del();
    }

    async checkExist(name,item=null) {
        let query = db(this.tableName).where({ name });

        if (item) {
            query = query.whereNot('id', item.id);
        }

        return await query.first();
    }

    // Action Buttons
    getEditBtnHtml(item) {
        let e_id = utils.encrypt(item.id)
        let link = '/admin/content/edit/'+e_id;
        return '<a href="'+link+'" class="btn btn-primary btn-sm" title="Edit"><i class="icon icon-edit pr-0"></i> </a>';
    }

    getDeleteBtnHtml(item) {
        let e_id = utils.encrypt(item.id)
        let link = '/admin/content/delete/'+e_id;
        return '<button data-href="'+link+'" class="btn btn-danger btn-sm delete_btn" title="Delete"><i class="icon icon-trash pr-0"></i> </a>';
    }

    getStatusHtml(item) {
        if( item.status==1 ){
            return '<label class="badge badge-success">Active</label>';
        } else {
            return '<label class="badge badge-danger">Inactive</label>';
        }
    }

    getMImagePath(item) {
        if( item.image && (item.image != '') ) {
            return config.app_base_url+item.image;
        }
        return ''
    }

    getMCreatedAt(item) {
        return item.created_at?dayjs(item.created_at).format(status.DATATABLE_TIMESTAMP_FORMAT):'';
    }

}

module.exports = {Interest, Characteristic, Religion, Community, Education, Work, Question, Content};