const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database("./chat.db");

// Create table if not exists
db.run(`CREATE TABLE IF NOT EXISTS users (
  username TEXT PRIMARY KEY,
  password TEXT
)`);

module.exports = db;
