const { Given, When, Then, After } = require('@cucumber/cucumber');
const { expect } = require('chai');
const fs = require('fs');
const path = require('path');


// Correspond à : Then je vérifie que la réponse respecte le schéma JSON attendu
Then('je vérifie que la réponse respecte le schéma JSON attendu', async function () {
  const body = this.body;
  const response = this.response; // Body de la réponse parsé en JSON

  // ─────────────────────────────────────────────
  // 1. Vérif que le receipt est en base 64
  // ─────────────────────────────────────────────
  expect(response, 'La réponse doit contenir un receipt').to.have.property('receipt');
  const base64Regex = /^[A-Za-z0-9+/]+={0,2}$/;
  expect(response.receipt, 'Le receipt doit être en base64').to.match(base64Regex);

  // ─────────────────────────────────────────────
  // 4. Vérif présence du pricing et montant en centimes
  // ─────────────────────────────────────────────
  expect(body.order, 'L\'objet price doit être présent').to.have.property('price');
  expect(body.order.price, 'Le montant doit être présent').to.have.property('amount');
  expect(body.order.price.amount, 'Le montant doit être un nombre entier (centimes)').to.be.a('number');
  expect(Number.isInteger(body.order.price.amount), 'Le montant doit être exprimé en centimes (entier)').to.be.true;
  expect(body.order.price.amount, 'Le montant doit être 0 ou positif').to.be.at.least(0);

  // 5. Vérif devise ISO 4217
  // ─────────────────────────────────────────────
  const iso4217Regex = /^[A-Z]{3}$/;
  expect(body.order.price, 'La devise doit être présente').to.have.property('currency');
  expect(body.order.price.currency, 'La devise doit respecter le format ISO 4217').to.match(iso4217Regex);
  expect(body.order.price.currency, 'La devise doit être EUR').to.equal('EUR');

  // ─────────────────────────────────────────────
  // 6. Vérif présence du panier et de ses valeurs obligatoires
  // ─────────────────────────────────────────────
  expect(body.order, 'Le panier doit être présent').to.have.property('basket');
  expect(body.order.basket, 'Le panier doit être un tableau').to.be.an('array');
  expect(body.order.basket.length, 'Le panier ne doit pas être vide').to.be.greaterThan(0);

  body.order.basket.forEach((item, index) => {
    // Champs obligatoires
    expect(item, `Item ${index} : product_reference obligatoire`).to.have.property('product_reference');
    expect(item, `Item ${index} : name obligatoire`).to.have.property('name');
    expect(item, `Item ${index} : type obligatoire`).to.have.property('type');
    expect(item, `Item ${index} : quantity obligatoire`).to.have.property('quantity');
    expect(item, `Item ${index} : unit_price obligatoire`).to.have.property('unit_price');
    expect(item, `Item ${index} : discount obligatoire`).to.have.property('discount');
    expect(item, `Item ${index} : total_amount obligatoire`).to.have.property('total_amount');

    // Vérif discount toujours 0 ou négatif
    expect(item.discount, `Item ${index} : le discount doit être 0 ou négatif`).to.be.at.most(0);

    // Vérif total_amount = unit_price * quantity - discount (valeur absolue du discount)
    const expectedTotal = parseFloat(
      (item.unit_price * item.quantity - Math.abs(item.discount)).toFixed(2)
    );
    expect(item.total_amount, `Item ${index} : total_amount = unit_price * quantity - discount`).to.equal(expectedTotal);
  });

  // ─────────────────────────────────────────────
  // 7. Vérif présence du Device information
  // ─────────────────────────────────────────────
  expect(body.pos_technical_info, 'device_information doit être présent').to.have.property('device_information');

  const device = body.pos_technical_info.device_information;
  expect(device, 'serial_number doit être présent').to.have.property('serial_number');
  expect(device.serial_number, 'serial_number doit être une string non vide').to.be.a('string').and.not.empty;
  expect(device, 'manufacturer doit être présent').to.have.property('manufacturer');
  expect(device.manufacturer, 'manufacturer doit être une string non vide').to.be.a('string').and.not.empty;

  // ─────────────────────────────────────────────
  // 8. Vérif terminal_transaction_display
  // ─────────────────────────────────────────────
  expect(body.pos_technical_info, 'terminal_transaction_display doit être présent')
    .to.have.property('terminal_transaction_display');

  const terminal = body.pos_technical_info.terminal_transaction_display;

  // Protocol (par défaut ConcertV3.1)
  expect(terminal, 'protocol doit être présent').to.have.property('protocol');
  expect(terminal.protocol, 'protocol doit être une string non vide').to.be.a('string').and.not.empty;
  const validProtocols = ['ConcertV3.1', 'AppNepting','ConcertV3.2'];
  expect(validProtocols, `protocol doit être parmi ${validProtocols.join(', ')}`).to.include(terminal.protocol);

  // Présence du booléen force_authorization
  expect(terminal, 'force_authorization doit être présent').to.have.property('force_authorization');
  expect(terminal.force_authorization, 'force_authorization doit être un booléen').to.be.a('boolean');
});