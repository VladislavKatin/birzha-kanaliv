const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

function loadFirstExisting(paths) {
  for (const p of paths) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

function loadEnv() {
  // Never override environment variables already provided by Railway or CI.
  // dotenv defaults to override: false, which is the behavior we want.

  const root = process.cwd();

  const candidates = [
    path.join(root, '.env.local'),
    path.join(root, '.env'),
    path.join(root, '.env.development'),
    // Do not load .env.production here. Production env must come from hosting.
  ];

  const envPath = loadFirstExisting(candidates);

  if (envPath) {
    dotenv.config({ path: envPath, override: false });
  }
}

module.exports = { loadEnv };
