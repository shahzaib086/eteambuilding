const {Client} = require('pg')

const knex = require("knex");
const knexFile = require("../knexfile.js");
require("dotenv").config();

const environment = process.env.NODE_ENV || "development";

module.exports = knex(knexFile[environment]);

// const client = new Client({
//     host: "localhost",
//     user: "postgres",
//     port: 5432,
//     password: "root",
//     database: "db_pel"
// })

// module.exports = client
