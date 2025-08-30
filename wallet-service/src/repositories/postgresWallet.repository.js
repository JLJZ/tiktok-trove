const { NotImplementedError } = require('../utils/errors');

class PostgresWalletRepository {
  constructor() {}
  async getWallet() { throw new NotImplementedError('PostgreSQL repository not wired yet'); }
  async purchaseCoins() { throw new NotImplementedError('PostgreSQL repository not wired yet'); }
  async convertDiamonds() { throw new NotImplementedError('PostgreSQL repository not wired yet'); }
  async listTransactions() { throw new NotImplementedError('PostgreSQL repository not wired yet'); }
}

module.exports = PostgresWalletRepository;
