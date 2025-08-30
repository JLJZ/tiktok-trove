const { v4: uuid } = require('uuid');
const { BadRequestError } = require('../utils/errors');

class InMemoryWalletRepository {
  constructor({ coinPackages }) {
    this.coinPackages = coinPackages;
    this.wallets = new Map();         // userId -> { coins, diamonds }
    this.transactions = new Map();    // userId -> [ ... ]
  }

  ensureUser(userId) {
    if (!this.wallets.has(userId)) this.wallets.set(userId, { coins: 0, diamonds: 0 });
    if (!this.transactions.has(userId)) this.transactions.set(userId, []);
  }

  async getWallet(userId) {
    this.ensureUser(userId);
    return this.wallets.get(userId);
  }

  async purchaseCoins(userId, packageId) {
    this.ensureUser(userId);
    const amount = this.coinPackages[packageId];
    if (!amount) throw new BadRequestError('Invalid packageId');
    const wallet = this.wallets.get(userId);
    wallet.coins += amount;
    const txnId = uuid();
    this.transactions.get(userId).push({
      id: txnId, type: 'coin_purchase', amount, timestamp: new Date().toISOString()
    });
    return { newBalance: wallet.coins, transactionId: txnId };
  }

  async convertDiamonds(userId, amount) {
    this.ensureUser(userId);
    if (typeof amount !== 'number' || amount <= 0) throw new BadRequestError('Amount must be a positive number');
    const wallet = this.wallets.get(userId);
    if (wallet.diamonds < amount) throw new BadRequestError('Insufficient diamonds');
    wallet.diamonds -= amount;
    const payoutId = uuid();
    this.transactions.get(userId).push({
      id: payoutId, type: 'diamond_conversion', amount: -amount, timestamp: new Date().toISOString()
    });
    return { payoutId, amount, status: 'processing' };
  }

  async listTransactions(userId) {
    this.ensureUser(userId);
    return this.transactions.get(userId);
  }
}

module.exports = InMemoryWalletRepository;
