// src/utils/ids.js
const crypto = require('crypto');

function newId(prefix) {
  // 12 hex chars (~48 bits), short and URL-friendly
  const bytes = crypto.randomBytes(6).toString('hex');
  return `${prefix}_${bytes}`;
}

module.exports = { newId };