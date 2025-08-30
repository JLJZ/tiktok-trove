import { InMemoryRepo } from './inMemoryRepo.js';

export function getRepo() {
  // Swap here later e.g., if (process.env.DB_URL) return new PostgresRepo(process.env.DB_URL)
  return new InMemoryRepo();
}
