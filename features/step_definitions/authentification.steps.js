const { When, Then } = require('@cucumber/cucumber');
const { expect } = require('chai');
const { API_CREDENTIAL_ERRONNE } = require('./jdd.js');
const HiPayClient = require('./clientAPI.js');

// Correspond à : je soumets la requête de création d'ordre de paiement avec une authorization invalide présente {boolean}
// Dans la feature, le step s'utilise avec true ou false sans guillemets (Cucumber les convertit automatiquement en booléen)
When('je soumets la requête de création d\'ordre de paiement avec une authorization invalide présente {boolean}', async function (presence) {
  const client = new HiPayClient();

  try {
    const { statusCode, body, curlCmd } = await client.createOrder(this.body, {
      withAuthorization: presence,
      tokenOverride: presence ? API_CREDENTIAL_ERRONNE() : undefined
    });

    this.statusCode = statusCode;
    this.response = body;
    this.orderId = this.body.order.order_id;

    HiPayClient.report(this, { statusCode, body, curlCmd, orderId: this.orderId });

  } catch (error) {
    HiPayClient.reportError(this, { error });
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