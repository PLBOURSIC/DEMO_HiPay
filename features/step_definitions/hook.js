const { Before, After, AfterAll } = require('@cucumber/cucumber');
const { expect } = require('chai');
const { pool } = require('../../environment/param.js');
const fs = require('fs');
const path = require('path');

// Exécuté avant chaque scénario
Before(async function () {
  console.log('🚀 Début du scénario - initialisation');
});

// Purge la BDD après chaque scénario pour éviter de l'encombrer
After(async function () {
  const orderId = this.body?.order?.order_id;
  if (!orderId) return;
  await pool.query('DELETE FROM orders WHERE order_id = $1', [orderId]);
  console.log(`BDD purgée pour l'order_id : ${orderId}`);
});

// Exécuté une seule fois après TOUS les scénarios
AfterAll(async function () {
  await pool.end();
  console.log('Connexion PostgreSQL fermée');
});