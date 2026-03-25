const sqlite3 = require("sqlite3").verbose()
const fs = require("fs")

const DB_FILE = "./data.db"
const exists = fs.existsSync(DB_FILE)
const db = new sqlite3.Database(DB_FILE)

if (!exists) {
  const schema = fs.readFileSync("./schema.sql", "utf-8")
  db.exec(schema)
}

module.exports = db
``
