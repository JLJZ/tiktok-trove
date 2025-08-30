const { Router } = require('express');

module.exports = function walletRoutes(controller) {
  const r = Router();
  r.get('/wallet', controller.getWallet);
  r.post('/wallet/coins/purchase', controller.purchaseCoins);
  r.post('/wallet/diamonds/convert', controller.convertDiamonds);
  r.get('/wallet/transactions', controller.listTransactions);
  return r;
};
