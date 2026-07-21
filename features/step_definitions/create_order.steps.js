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
});

// Correspond à : je soumets la requête de création d'ordre de paiement
When('je soumets la requête de création d\'ordre de paiement', async function () {
  // Implémentez ici la soumission du body de paiement à l'API
    try {
        const response = await fetch('https://cloudrun-api-yugcnet4yq-ew.a.run.app/v1/connector/order', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'accept': 'application/json',
            'Authorization': `Basic ${API_CREDENTIAL()}`
        },
        body: JSON.stringify(this.body)
        });
        const data = await response.json();
        console.log('Order créé :', data);
        this.statusCode = response.status;
        this.response = data;
    } catch (error) {
        console.error('Erreur :', error);
        throw error;
    }
});

// Correspond à : Then je devrais recevoir une réponse de l'API avec un code de statut {int}
Then('je reçois un statut 200 et un identifiant d\'ordre', function () {
  expect(this.statusCode).to.equal(200);
  expect(this.response).to.have.property('order_id').to.equal(this.body.order.order_id);
  expect(this.response).to.have.property('paymentStatus', 'Success');
});
