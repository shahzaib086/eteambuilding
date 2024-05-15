//js
const status = require('../../helpers/constants.js');
// const db = require("../../config/connection.js");
// const utils = require('../../helpers/utility.js');  
const User = require('../../models/user.js'); 

//For Register Page
const dashboard = async (req, res) => {
    let data =  {};
    const userModel = new User();

    // Data query
    let totalUsers = userModel.getCollection().where('role_id', status.ROLE_USER);
    let ApprovedUsers = userModel.getCollection().where('role_id', status.ROLE_USER).where('status',status.USER_PROFILE_APPROVED);
    let pendingUsers = userModel.getCollection().where('role_id', status.ROLE_USER).where('status',status.USER_PROFILE_PENDING);
    let rejectedUsers = userModel.getCollection().where('role_id', status.ROLE_USER).where('status',status.USER_PROFILE_REJECTED);
    let bannedUsers = userModel.getCollection().where('role_id', status.ROLE_USER).where('status',status.USER_PROFILE_BANNED);
    let maleUsers = userModel.getCollection().where('role_id', status.ROLE_USER).join('user_attributes', 'users.id', '=', 'user_attributes.user_id').where('user_attributes.gender','man');
    let femaleUsers = userModel.getCollection().where('role_id', status.ROLE_USER).join('user_attributes', 'users.id', '=', 'user_attributes.user_id').where('user_attributes.gender','woman');

    data.total_users = await userModel.getTotalRecord(totalUsers);
    data.approved_users = await userModel.getTotalRecord(ApprovedUsers);
    data.pending_users = await userModel.getTotalRecord(pendingUsers);
    data.rejected_users = await userModel.getTotalRecord(rejectedUsers);
    data.banned_users = await userModel.getTotalRecord(bannedUsers);
    data.male_users = await userModel.getTotalRecord(maleUsers);
    data.female_users = await userModel.getTotalRecord(femaleUsers);

    return res.render("admin/dashboard", data );
}

module.exports =  {
    dashboard,
};