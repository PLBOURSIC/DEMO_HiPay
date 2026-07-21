const { Before, After, AfterAll, BeforeAll } = require('@cucumber/cucumber');
const { expect } = require('chai');
const { pool } = require('../../environment/Connexion_param.js');
const { checkDatabaseHealth } = require('./bdd_request.js');
const fs = require('fs');
const path = require('path');

let dbHealth = 'UNKNOWN';

// ─────────────────────────────────────────
// Vérifie la BDD avant de lancer les tests
// ─────────────────────────────────────────
BeforeAll(async function () {
  if (process.env.CI) {
    console.log('⚠️  Environnement CI détecté — vérification BDD ignorée (config fictive).');
    dbHealth = 'SKIP';
  } else {
    const health = await checkDatabaseHealth();
    dbHealth = health.healthCheck;

    // if (dbHealth === 'FAIL') {
    //   throw new Error(`Impossible de lancer les tests : BDD inaccessible. ${health.error}`);
    //   // ↑ Stoppe tous les tests si la BDD ne répond pas
    // }
  }

  console.log('⏱️ Démarrage des tests CucumberJS...');
});

// Exécuté avant chaque scénario
// this.pickle contient toutes les metadonnees du scénario en cours d'exécution
Before(async function (scenario) {
  console.log(`🧪 Début du scénario - ${scenario.pickle.name}`);
});

// Purge la BDD après chaque scénario pour éviter de l'encombrer
After(async function (scenario) {
  const orderId = this.body?.order?.order_id;
  if (!orderId) return;

  // on exécute la purge uniquement si le test a réussi ou que la connexion BDD est up. A noter que l'on peut passer plusieurs équivalence dans le même if
  if ( 
    //scenario.result.status === 'PASSED' || 
    dbHealth === 'OK') {
    await pool.query('DELETE FROM orders WHERE order_id = $1', [orderId]);
    console.log(`BDD purgée pour l'order_id : ${orderId}`);
  }
});

// Exécuté une seule fois après TOUS les scénarios
AfterAll(async function () {
  if (!process.env.CI) {
    await pool.end();
    console.log('🚧 Connexion PostgreSQL fermée');
  }
});