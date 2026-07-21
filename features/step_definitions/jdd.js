const order_id = function () {
  const timestamp = Date.now();
  return `ORDER_${timestamp}`;
};

const API_CREDENTIAL_ERRONNE = function () {
  return Buffer.from('invalid_login:invalid_password').toString('base64');
};

module.exports = { order_id, API_CREDENTIAL_ERRONNE };
