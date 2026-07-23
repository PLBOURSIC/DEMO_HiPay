
require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });

// pour construire le basic authentication pour l'API
const API_CREDENTIAL = function () {
  return Buffer.from(`${process.env.API_username}:${process.env.API_password}`).toString('base64');
};

// url de l'API a tester (surchargeable via la variable d'environnement API_BASE_URL, utilisée par la CI)
const BASE_API_URL = process.env.API_BASE_URL || "https://cloudrun-api-yugcnet4yq-ew.a.run.app";

// db.js - Connexion centralisée
const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'bdd_HiPay',
  user: process.env.LOGIN_BDD,
  password: process.env.PWS_BDD
});

module.exports = { API_CREDENTIAL, BASE_API_URL, pool };