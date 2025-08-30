require('dotenv').config();

const DEFAULT_COIN_PACKAGES = { PKG_499: 500, PKG_999: 1000, PKG_1999: 2100 };

function parseCoinPackages(envVal) {
  if (!envVal) return DEFAULT_COIN_PACKAGES;
  try {
    const obj = JSON.parse(envVal);
    return obj && typeof obj === 'object' ? obj : DEFAULT_COIN_PACKAGES;
  } catch {
    return DEFAULT_COIN_PACKAGES;
  }
}

module.exports = {
  port: process.env.PORT || 3000,
  dataBackend: process.env.DATA_BACKEND || 'memory', // memory | postgres
  coinPackages: parseCoinPackages(process.env.COIN_PACKAGES)
};
