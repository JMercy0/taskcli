const Database = require('better-sqlite3');
const fs = require('fs');
const { CONFIG_DIR, DB_PATH } = require('../config');

let db = null;

function getConnection() {
  if (db) return db;

  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  }

  db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  return db;
}

function closeConnection() {
  if (db) {
    db.close();
    db = null;
  }
}

module.exports = { getConnection, closeConnection };
