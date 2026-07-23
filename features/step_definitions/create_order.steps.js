const { Given, When, Then } = require('@cucumber/cucumber');
const { expect } = require('chai');
const fs = require('fs');
const path = require('path');
const { order_id } = require('./jdd.js');
const HiPayClient = require('./clientAPI.js');

// Correspond à : Given je construit le body de paiement avec les informations de l'article
Given('je construit le body de paiement avec les informations de l\'article', function () {
  const filePath = path.resolve(__dirname, '../../data/create_order.json');
  this.body = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  this.body.order.order_id = order_id();
  console.log(this.body);
});

// Correspond à : je soumets la requête de création d'ordre de paiement
When('je soumets la requête de création d\'ordre de paiement', async function () {
  const client = new HiPayClient();
  try {
    const { statusCode, body, curlCmd } = await client.createOrder(this.body);
    this.statusCode = statusCode;
    this.response = body;
    this.orderId = this.body.order.order_id;

    // pour imprimer le curl dans le rapport HTML et les logs console
    HiPayClient.report(this, { statusCode, body, curlCmd, orderId: this.orderId });

  } catch (error) {
    HiPayClient.reportError(this, { error });
    throw error;
  }
});

// Correspond à : Then je devrais recevoir une réponse de l'API avec un code de statut {int}
Then('je reçois un statut 200 et un identifiant d\'ordre', function () {
  expect(this.statusCode).to.equal(200);
  expect(this.response).to.have.property('order_id').to.equal(this.orderId);
  expect(this.response).to.have.property('paymentStatus', 'Success');
});
