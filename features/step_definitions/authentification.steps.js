const { Given, When, Then, After } = require('@cucumber/cucumber');
const { expect } = require('chai');
const fs = require('fs');
const path = require('path');
const { API_CREDENTIAL_ERRONNE, order_id } = require('./jdd.js');

// Correspond à : je soumets la requête de création d'ordre de paiement
When('je soumets la requête de création d\'ordre de paiement avec une authorization invalide présente {boolean}', async function (presence) {
  const url = 'https://cloudrun-api-yugcnet4yq-ew.a.run.app/v1/connector/order';
  const bodyStr = JSON.stringify(this.body, null, 2);

// Dans la feature, le step s'utilise avec true ou false sans guillemets (Cucumber les convertit automatiquement en booléen)
// pour créer le curl qui sera affiché dans le rapport, on enlève le header Authorization pour ne pas exposer les credentials dans le rapport : 
  const curlCmd = [
    `curl -X POST "${url}"`,
    `  -H "Content-Type: application/json"`,
    `  -H "accept: application/json"`,
    `  -d '${JSON.stringify(this.body)}'`
  ].join(' \\\n');

  try {
    const headers = {
      'Content-Type': 'application/json',
      'accept': 'application/json',
    };
    if (presence) {
      headers['Authorization'] = `Basic ${API_CREDENTIAL_ERRONNE()}`;
    }

    const response = await fetch(url, { method: 'POST', headers, body: bodyStr });
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
Then('je reçois un statut {int} et un message d\'erreur {string}', function (statusCodeAttendu, messageAttendu) {

// CucumberJS capture automatiquement ce qui est entre guillemets dans le fichier .feature et l'injecte comme argument dans la fonction
  expect(this.statusCode).to.equal(statusCodeAttendu);
  expect(this.response).to.have.property('error');
  expect(this.response.error).to.have.property('code', 'connector.api.login.unauthorized');
  expect(this.response.error).to.have.property('message', 'Unauthorized');
  expect(this.response.error).to.have.property('description', 'The login has been rejected.');
  expect(this.response.error).to.have.property('details', messageAttendu);
});