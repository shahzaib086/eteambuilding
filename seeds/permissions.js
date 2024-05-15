/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
exports.seed = async function(knex) {
  
  await knex('permissions').del();
  await knex('permissions').insert([

    {id: 1, name: 'perm-role'},

    {id: 2, name: 'perm-admin-user'},

    {id: 3, name: 'perm-client-member'},

    {id: 4, name: 'perm-event'},
    {id: 5, name: 'perm-assessment'},
    {id: 6, name: 'perm-assessment-validation'},
    {id: 7, name: 'perm-analytics'},

  ]);

};
