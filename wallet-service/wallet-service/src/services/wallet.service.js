class WalletService {
  constructor(repo) {
    this.repo = repo;
  }
  async getWallet(userId) { return this.repo.getWallet(userId); }
  async purchaseCoins(userId, packageId) { return this.repo.purchaseCoins(userId, packageId); }
  async convertDiamonds(userId, amount) { return this.repo.convertDiamonds(userId, amount); }
  async listTransactions(userId) { return this.repo.listTransactions(userId); }
}

module.exports = WalletService;
