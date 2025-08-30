const { InMemoryStore } = require('./memoryStore');
const { FileStore } = require('./fileStore');

function createStore() {
  const backend = process.env.DATA_BACKEND || 'memory';
  if (backend === 'file') {
    const path = process.env.DATA_FILE_PATH || './data.json';
    return new FileStore(path);
    }
  return new InMemoryStore();
}

module.exports = { createStore };
