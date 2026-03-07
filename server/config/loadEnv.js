const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

let hasLoadedEnv = false;

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return;
  }

  dotenv.config({ path: filePath, override: false });
}

function loadEnv() {
  if (hasLoadedEnv) {
    return;
  }

  // Never override environment variables already provided by Railway or CI.
  // Load local overrides first, then fill remaining keys from shared env files.
  const root = process.cwd();

  const candidates = [
    path.join(root, '.env.local'),
    path.join(root, '.env'),
    path.join(root, '.env.development'),
  ];

  candidates.forEach(loadEnvFile);
  hasLoadedEnv = true;
}

module.exports = { loadEnv };
