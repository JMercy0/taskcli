const path = require('path');
const os = require('os');

const CONFIG_DIR = path.join(os.homedir(), '.taskcli');
const DB_PATH = path.join(CONFIG_DIR, 'taskcli.db');

module.exports = {
  CONFIG_DIR,
  DB_PATH,
  GITHUB_TOKEN: process.env.GITHUB_TOKEN || null,
  PRIORITIES: ['low', 'medium', 'high'],
  STATUSES: ['pending', 'in-progress', 'completed'],
};
