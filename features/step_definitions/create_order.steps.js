const { Given, When, Then, After } = require('@cucumber/cucumber');
const { expect } = require('chai');
const { pool } = require('../../environment/param.js');
const fs = require('fs');
const path = require('path');
const { API_CREDENTIAL } = require('../../environment/param.js');
const { order_id } = require('./jdd.js');

// Correspond à : Given je construit le body de paiement avec les informations de l'article
Given('je construit le body de paiement avec les informations de l\'article', function () {
  const filePath = path.resolve(__dirname, '../../data/create_order.json');
  this.body = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  this.body.order.order_id = order_id();
  console.log(this.body);
});

// Correspond à : je soumets la requête de création d'ordre de paiement
When('je soumets la requête de création d\'ordre de paiement', async function () {
  const url = 'https://cloudrun-api-yugcnet4yq-ew.a.run.app/v1/connector/order';
  const bodyStr = JSON.stringify(this.body, null, 2);

  const curlCmd = [
    `curl -X POST "${url}"`,
    `  -H "Content-Type: application/json"`,
    `  -H "accept: application/json"`,
    `  -H "Authorization: Basic <REDACTED>"`,
    `  -d '${JSON.stringify(this.body)}'`
  ].join(' \\\n');

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'accept': 'application/json',
        'Authorization': `Basic ${API_CREDENTIAL()}`
      },
      body: bodyStr
    });
    const data = await response.json();
    this.statusCode = response.status;
    this.response = data;
    this.orderId = this.body.order.order_id;

    // ── Logs console ──────────────────────────────
    console.log('\n── CURL ──────────────────────────────────────');
    console.log(curlCmd);
    console.log(`\n── ORDER_ID : ${this.orderId} ───────────────`);
    console.log(`\n── RESPONSE (${this.statusCode}) ─────────────`);
    console.log(JSON.stringify(data, null, 2));

    // ── Attachements rapport HTML ──────────────────
    this.attach(`CURL envoyé :\n\n${curlCmd}`, 'text/plain');
    this.attach(`ORDER_ID créé : ${this.orderId}`, 'text/plain');
    this.attach(JSON.stringify(data, null, 2), 'application/json');

  } catch (error) {
    this.attach(`CURL envoyé :\n\n${curlCmd}`, 'text/plain');
    this.attach(`ERREUR : ${error.message}`, 'text/plain');
    console.error('Erreur :', error);
    throw error;
  }
});

// Correspond à : Then je devrais recevoir une réponse de l'API avec un code de statut {int}
Then('je reçois un statut 200 et un identifiant d\'ordre', function () {
  expect(this.statusCode).to.equal(200);
  expect(this.response).to.have.property('order_id').to.equal(this.orderId);
  expect(this.response).to.have.property('paymentStatus', 'Success');
});
