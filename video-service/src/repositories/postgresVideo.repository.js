class PostgresVideoRepository {
  constructor(pool) {
    this.pool = pool; // pg.Pool instance
  }

  async create() { throw new NotImplementedError('Postgres video repo not wired yet'); }
  async findById() { throw new NotImplementedError('Postgres video repo not wired yet'); }
  async delete() { throw new NotImplementedError('Postgres video repo not wired yet'); }
  async getStats() { throw new NotImplementedError('Postgres video repo not wired yet'); }
  async incrementView() { throw new NotImplementedError('Postgres video repo not wired yet'); }
  async addGift() { throw new NotImplementedError('Postgres video repo not wired yet'); }
}

module.exports.PostgresVideoRepository = PostgresVideoRepository;