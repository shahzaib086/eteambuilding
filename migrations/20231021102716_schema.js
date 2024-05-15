/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
    return knex.schema
    .createTable('users', function (table) {

        table.increments('id');
        table.integer('role_id');
        table.string('name', 100);
        table.string('email', 100).nullable();
        table.string('password', 255).nullable();
        table.string('profile_image', 255).nullable();
        table.tinyint('status',1).defaultTo(0);

        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.timestamp('updated_at').defaultTo(knex.fn.now());

    }).createTable('client_members', function (table) {

        table.increments('id');
        table.string('name', 100);
        table.string('phone_number', 20);
        table.string('company', 50).nullable();
        table.string('details', 255).nullable();
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.timestamp('updated_at').defaultTo(knex.fn.now());

    }).createTable('events', function (table) {

        table.increments('id');
        table.string('name', 100);
        table.string('type', 20).nullable();
        table.date('event_date', 20).nullable();
        table.string('location', 50).nullable();
        table.integer('team_capacity').defaultTo(0);
        table.string('description', 255).nullable();

        table.tinyint('status',1).defaultTo(0);

        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.timestamp('updated_at').defaultTo(knex.fn.now());


    }).createTable('event_teams', function (table) {
        
        table.increments('id');
        table.integer('event_id');
        table.integer('team_number');
        table.integer('client_member_id');
        table.tinyint('is_leader').defaultTo(0);
        table.integer('score');
        table.string('comment').nullable();

    });


};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTableIfExists('users')
        .dropTableIfExists('client_members')
        .dropTableIfExists('events')
        .dropTableIfExists('event_teams')
};
