const order_id = function () {
  const timestamp = Date.now();
  return `ORDER_${timestamp}`;
};

module.exports = { order_id };
