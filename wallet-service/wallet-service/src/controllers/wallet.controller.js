const { BadRequestError } = require('../utils/errors');

function getUserId(req) {
  return req.header('x-user-id') || 'demo-user';
}

class WalletController {
  constructor(service) {
    this.service = service;
    this.getWallet = this.getWallet.bind(this);
    this.purchaseCoins = this.purchaseCoins.bind(this);
    this.convertDiamonds = this.convertDiamonds.bind(this);
    this.listTransactions = this.listTransactions.bind(this);
  }

  async getWallet(req, res, next) {
    try {
      const userId = getUserId(req);
      const data = await this.service.getWallet(userId);
      res.json(data);
    } catch (e) { next(e); }
  }

  async purchaseCoins(req, res, next) {
    try {
      const userId = getUserId(req);
      const { packageId } = req.body || {};
      if (!packageId) throw new BadRequestError('packageId is required');
      const data = await this.service.purchaseCoins(userId, packageId);
      res.json(data);
    } catch (e) { next(e); }
  }

  async convertDiamonds(req, res, next) {
    try {
      const userId = getUserId(req);
      const { amount } = req.body || {};
      if (typeof amount !== 'number') throw new BadRequestError('amount must be a number');
      const data = await this.service.convertDiamonds(userId, amount);
      res.json(data);
    } catch (e) { next(e); }
  }

  async listTransactions(req, res, next) {
    try {
      const userId = getUserId(req);
      const data = await this.service.listTransactions(userId);
      res.json(data);
    } catch (e) { next(e); }
  }
}

module.exports = WalletController;
