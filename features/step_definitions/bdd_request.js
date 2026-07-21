const { Then } = require('@cucumber/cucumber');
const { expect } = require('chai');
const { pool } = require('../../environment/Connexion_param.js');
const fs = require('fs');
const path = require('path');

// fonction pour avoir si la base est up, idéal pour mettre en condition d'execution ou non les mots clef du hook.js
const checkDatabaseHealth = async function () {
  let client;
    try {
        client = await pool.connect()
        const result = await client.query('SELECT 1'); // Exécute une requête simple pour vérifier la connexion
        console.log('✅ BDD opérationnelle');
        return {
            healthCheck: 'OK'
        };
    } catch (error) {
        console.error('❌ BDD non opérationnelle', error);
        return {
            healthCheck: 'FAIL'
        };
    } finally {
        if (client) {
            client.release();
        }
    }
};

// Correspond à : Then je vérifie que l'order est enregistré en bdd
Then('l\'enregistrement avec l\'order_id existe en base', async function () {
  if (process.env.CI) {
    console.log('⚠️  Vérification BDD ignorée en CI (config fictive).');
    return;
  }

  const orderId = this.response.order.order_id;
  const result = await pool.query(
    'SELECT * FROM orders WHERE order_id = $1',
    [orderId]
  );
  expect(result.rows.length).to.be.greaterThan(0);
});

 // Correspond à : And les notifications ont été reçues sur l'url notify
Then('les notifications ont été reçues sur l\'url notify', async function () {
  const notifyUrl = this.body.pos_technical_info.notify_url;
  const notifResult = await pool.query(
    'SELECT * FROM notifications WHERE order_id = $1 AND notify_url = $2',
    [this.body.order.order_id, notifyUrl]
  );
  expect(notifResult.rows.length, 'La notification doit avoir été reçue').to.be.greaterThan(0);
});

module.exports = { checkDatabaseHealth };