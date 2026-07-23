const { Then } = require('@cucumber/cucumber');
const { expect } = require('chai');

// Correspond à : Then je vérifie que la réponse respecte le schéma JSON attendu
Then('je vérifie que la réponse respecte le schéma JSON attendu', async function () {
  const requestBody = this.body;
  const response = this.response;

  expect(response, 'La réponse API doit être un objet JSON').to.be.an('object');
  expect(response, 'La réponse API doit contenir un objet order').to.have.property('order');
  expect(response.order, 'L\'objet order de la réponse doit être un objet').to.be.an('object');

  // ─────────────────────────────────────────────
  // 1. Vérif des champs racine de la réponse API
  // ─────────────────────────────────────────────
  expect(response, 'La réponse doit contenir un paymentStatus').to.have.property('paymentStatus');
  expect(response.paymentStatus, 'paymentStatus doit être une string').to.be.a('string').and.not.empty;
  expect(response, 'La réponse doit contenir un receipt').to.have.property('receipt');
  const base64Regex = /^[A-Za-z0-9+/]+={0,2}$/;
  expect(response.receipt, 'Le receipt doit être en base64').to.match(base64Regex);
  //errorData toujours présent même si vide
  expect(response, 'La réponse doit contenir errorData').to.have.property('errorData');
  expect(response.errorData, 'errorData doit être un objet').to.be.an('object');

  // ─────────────────────────────────────────────
  // 2. Vérif du contrat de réponse sur order
  // ─────────────────────────────────────────────
  expect(response.order, 'order_id doit être présent dans la réponse').to.have.property('order_id');
  expect(response.order.order_id, 'order_id doit correspondre à la requête').to.equal(requestBody.order.order_id);
  expect(response.order, 'transaction_type doit être présent dans la réponse').to.have.property('transaction_type');
  expect(response.order.transaction_type, 'transaction_type doit correspondre à la requête').to.equal(requestBody.order.transaction_type);
  expect(response.order, 'L\'objet price doit être présent dans la réponse').to.have.property('price');
  expect(response.order.price, 'Le montant doit être présent dans la réponse').to.have.property('amount');
  expect(response.order.price.amount, 'Le montant retourné doit être un nombre entier (centimes)').to.be.a('number');
  expect(Number.isInteger(response.order.price.amount), 'Le montant retourné doit être exprimé en centimes (entier)').to.be.true;
  expect(response.order.price.amount, 'Le montant retourné doit être 0 ou positif').to.be.at.least(0);
  expect(response.order.price.amount, 'Le montant retourné doit correspondre à la requête').to.equal(requestBody.order.price.amount);

  // 3. Vérif devise ISO 4217 sur la réponse
  // ─────────────────────────────────────────────
  const iso4217Regex = /^[A-Z]{3}$/;
  expect(response.order.price, 'La devise doit être présente dans la réponse').to.have.property('currency');
  expect(response.order.price.currency, 'La devise retournée doit respecter le format ISO 4217').to.match(iso4217Regex);
  expect(response.order.price.currency, 'La devise retournée doit correspondre à la requête').to.equal(requestBody.order.price.currency);

  // ─────────────────────────────────────────────
  // 4. Vérif présence du panier et de ses valeurs obligatoires dans la réponse
  // ─────────────────────────────────────────────
  expect(response.order, 'Le panier doit être présent dans la réponse').to.have.property('basket');
  expect(response.order.basket, 'Le panier retourné doit être un tableau').to.be.an('array');
  expect(response.order.basket.length, 'Le panier retourné ne doit pas être vide').to.be.greaterThan(0);
  expect(response.order.basket.length, 'Le nombre d\'articles retournés doit correspondre à la requête').to.equal(requestBody.order.basket.length);

  response.order.basket.forEach((item, index) => {
    const requestItem = requestBody.order.basket[index];

    // Champs obligatoires
    expect(item, `Item ${index} : product_reference obligatoire dans la réponse`).to.have.property('product_reference');
    expect(item, `Item ${index} : name obligatoire dans la réponse`).to.have.property('name');
    expect(item, `Item ${index} : type obligatoire dans la réponse`).to.have.property('type');
    expect(item, `Item ${index} : quantity obligatoire dans la réponse`).to.have.property('quantity');
    expect(item, `Item ${index} : unit_price obligatoire dans la réponse`).to.have.property('unit_price');
    expect(item, `Item ${index} : discount obligatoire dans la réponse`).to.have.property('discount');
    expect(item, `Item ${index} : total_amount obligatoire dans la réponse`).to.have.property('total_amount');

    expect(item.product_reference, `Item ${index} : product_reference doit correspondre à la requête`).to.equal(requestItem.product_reference);
    expect(item.name, `Item ${index} : name doit correspondre à la requête`).to.equal(requestItem.name);
    expect(item.type, `Item ${index} : type doit correspondre à la requête`).to.equal(requestItem.type);
    expect(item.quantity, `Item ${index} : quantity doit correspondre à la requête`).to.equal(requestItem.quantity);
    expect(item.unit_price, `Item ${index} : unit_price doit correspondre à la requête`).to.equal(requestItem.unit_price);

    // Vérif discount toujours 0 ou négatif
    expect(item.discount, `Item ${index} : le discount retourné doit être 0 ou négatif`).to.be.at.most(0);
    expect(item.discount, `Item ${index} : le discount retourné doit correspondre à la requête`).to.equal(requestItem.discount);

    // Vérif cohérence métier sur la réponse et alignement avec la requête
    const expectedTotal = parseFloat(
      (item.unit_price * item.quantity - Math.abs(item.discount)).toFixed(2)
    );
    expect(item.total_amount, `Item ${index} : total_amount retourné = unit_price * quantity - discount`).to.equal(expectedTotal);
    expect(item.total_amount, `Item ${index} : total_amount retourné doit correspondre à la requête`).to.equal(requestItem.total_amount);
  });

  // ─────────────────────────────────────────────
  // 5. Vérif du contrat customer sur la réponse
  // ─────────────────────────────────────────────
  expect(response, 'La réponse doit contenir customer').to.have.property('customer');
  expect(response.customer, 'customer doit être un objet').to.be.an('object');
  expect(response.customer.customer_id, 'customer_id doit correspondre à la requête').to.equal(requestBody.customer.customer_id);
  expect(response.customer.phone, 'phone doit correspondre à la requête').to.equal(requestBody.customer.phone);
  expect(response.customer.first_name, 'first_name doit correspondre à la requête').to.equal(requestBody.customer.first_name);
  expect(response.customer.last_name, 'last_name doit correspondre à la requête').to.equal(requestBody.customer.last_name);
  expect(response.customer.email, 'email retourné doit être une string non vide').to.be.a('string').and.not.empty;

  // ─────────────────────────────────────────────
  // 6. Vérif des informations techniques sur la réponse
  // ─────────────────────────────────────────────
  const technicalInfo = response.technical_pos_info || response.pos_technical_info;
  expect(technicalInfo, 'La réponse doit contenir technical_pos_info ou pos_technical_info').to.be.an('object');
  expect(technicalInfo, 'device_information doit être présent dans la réponse').to.have.property('device_information');

  const device = technicalInfo.device_information;
  expect(device, 'serial_number doit être présent dans la réponse').to.have.property('serial_number');
  expect(device.serial_number, 'serial_number doit être une string non vide').to.be.a('string').and.not.empty;
  expect(device.serial_number, 'serial_number doit correspondre à la requête').to.equal(requestBody.pos_technical_info.device_information.serial_number);
  expect(device, 'manufacturer doit être présent dans la réponse').to.have.property('manufacturer');
  expect(device.manufacturer, 'manufacturer doit être une string non vide').to.be.a('string').and.not.empty;
  expect(device.manufacturer, 'manufacturer doit correspondre à la requête').to.equal(requestBody.pos_technical_info.device_information.manufacturer);

  // ─────────────────────────────────────────────
  // 7. Vérif terminal_transaction_display sur la réponse
  // ─────────────────────────────────────────────
  expect(technicalInfo, 'terminal_transaction_display doit être présent dans la réponse')
    .to.have.property('terminal_transaction_display');

  const terminal = technicalInfo.terminal_transaction_display;

  expect(terminal, 'protocol doit être présent dans la réponse').to.have.property('protocol');
  expect(terminal.protocol, 'protocol doit être une string non vide').to.be.a('string').and.not.empty;
  const validProtocols = ['ConcertV3.1', 'AppNepting', 'ConcertV3.2'];
  expect(validProtocols, `protocol retourné doit être parmi ${validProtocols.join(', ')}`).to.include(terminal.protocol);
  expect(terminal.protocol, 'protocol retourné doit correspondre à la requête').to.equal(requestBody.pos_technical_info.terminal_transaction_display.protocol);

  expect(terminal, 'force_authorization doit être présent dans la réponse').to.have.property('force_authorization');
  expect(terminal.force_authorization, 'force_authorization doit être un booléen').to.be.a('boolean');
  expect(terminal.force_authorization, 'force_authorization doit correspondre à la requête').to.equal(requestBody.pos_technical_info.terminal_transaction_display.force_authorization);

  expect(technicalInfo, 'notify_url doit être présent dans la réponse').to.have.property('notify_url');
  expect(technicalInfo.notify_url, 'notify_url doit correspondre à la requête').to.equal(requestBody.pos_technical_info.notify_url);
});