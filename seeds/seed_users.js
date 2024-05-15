/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
exports.seed = async function (knex) {
  await knex('users').insert([
    { 
      id: 1, 
      role_id: 1,
      name: 'Super Admin',
      email: 'admin@admin.com',
      password: '$2a$10$arLIo35c/lprPYYJj3/CPe14C8DfBQXjAqt3.i.k3m7/Hg97HsBBu',
      status: 1
    },
  ]);
};
