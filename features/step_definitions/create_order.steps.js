const { Given, When, Then } = require('@cucumber/cucumber');
const { expect } = require('chai');
const fs = require('fs');
const path = require('path');
const { order_id } = require('./jdd.js');
const { HiPayClient, _buildCurl } = require('./clientAPI.js');

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

// Correspond à : Then je simule la requête de création d'ordre de paiement avec une réponse 200
Then('je simule la requête de création d\'ordre de paiement avec une réponse 200', async function () {
  this.orderId = this.body.order.order_id;
  this.statusCode = 200;
  const url = this.url_order || `${process.env.API_BASE_URL || 'https://cloudrun-api-yugcnet4yq-ew.a.run.app'}/v1/connector/order`;

  // construction de la requête simulée
  this.responseFile = path.resolve(__dirname, '../../data/example_create_order_response.json');
  this.response = JSON.parse(fs.readFileSync(this.responseFile, 'utf8'));
  this.response.order.order_id = this.orderId; // on utilise l'order_id généré dans le body de la requête pour simuler la réponse

  // utilisation de la fonction _buildCurl présent dans clientAPI pour générer le curlCmd à partir des informations de la requête simulée
  HiPayClient.report(this,
    {
      statusCode: this.statusCode,
      body: this.response,
      curlCmd: _buildCurl('POST', url, { 'Content-Type': 'application/json' }, JSON.stringify(this.body)),
      orderId: this.orderId,
      requestLabel: 'CURL simulé envoyé',
      responseLabel: 'Réponse simulée obtenue'
    });

  console.log(this.response);
});

// Correspond à : Then je devrais recevoir une réponse de l'API avec un code de statut {int}
Then('je reçois un statut 200 et un identifiant d\'ordre', function () {
  expect(this.statusCode).to.equal(200);
  expect(this.response).to.have.property('order_id').to.equal(this.orderId);
  expect(this.response).to.have.property('paymentStatus', 'Success');
});
