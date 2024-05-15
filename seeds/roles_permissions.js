/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
exports.seed = async function(knex) {
  
  await knex('roles').del();
  await knex('roles').insert([
    {id: 1, name: 'Super Admin', slug: 'super-admin'},
    {id: 2, name: 'Admin', slug: 'admin'},
    {id: 3, name: 'Instructor', slug: 'instructor'},
    {id: 4, name: 'HR', slug: 'hr'},
    {id: 5, name: 'Company Owner', slug: 'company-owner'},
  ]);

  await knex('role_permission').del();
  await knex('role_permission').insert([
    {id: 1, role_id: 1, permission_id: 1},
    {id: 2, role_id: 1, permission_id: 2},
    {id: 3, role_id: 1, permission_id: 3},
    {id: 4, role_id: 1, permission_id: 4},
    {id: 5, role_id: 1, permission_id: 5},
    {id: 6, role_id: 1, permission_id: 6},
    {id: 7, role_id: 1, permission_id: 7},
  ]);

};
