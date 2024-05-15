/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {

    return knex.schema
        .createTable('roles', function (table) {

            table.increments('id').primary().index();
            table.string('name', 20);
            table.string('slug', 20);
            table.timestamp('created_at').defaultTo(knex.fn.now());
            table.timestamp('updated_at').defaultTo(knex.fn.now());

        }).createTable('permissions', function (table) {

            table.increments('id').primary().index();
            table.string('name', 50);

        })
        .createTable('role_permission', function (table) {

            table.increments('id').primary().index();
            table.integer('role_id').index();
            table.integer('permission_id').index();

        });

};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
    return knex.schema.dropTableIfExists('roles')
        .dropTableIfExists('permissions')
        .dropTableIfExists('role_permission');
};
