
require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });

// pour construire le basic authentication pour l'API
const API_CREDENTIAL = function () {
  return Buffer.from(`${process.env.API_username}:${process.env.API_password}`).toString('base64');
};


// db.js - Connexion centralisée
const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'bdd_HiPay',
  user: process.env.LOGIN_BDD,
  password: process.env.PWS_BDD
});

module.exports = { API_CREDENTIAL, pool };