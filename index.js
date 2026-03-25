
const express = require("express")
const cron = require("node-cron")
const db = require("./db")

const app = express()
app.use(express.urlencoded({ extended: true }))
app.use(express.json())

const today = () => new Date().toISOString().slice(0, 10)

/* ---------- DEMO USERS (replace later) ---------- */
db.run("INSERT OR IGNORE INTO users (id, name) VALUES (1,'Alice'),(2,'Bob'),(3,'Charlie')")

/* ---------- POLL PAGE ---------- */
app.get("/", (req, res) => {
  res.send(`
    <h2>Availability Poll</h2>
    <form method="POST" action="/vote">
      <input name="userId" placeholder="User ID (1-3)" required />
      <br/><br/>
      <button name="vote" value="YES">YES</button>
      <button name="vote" value="NO">NO</button>
    </form>
  `)
})

app.post("/vote", (req, res) => {
  const { userId, vote } = req.body
  db.run(
    "INSERT INTO votes (user_id, date, vote) VALUES (?, ?, ?)",
    [userId, today(), vote]
  )
  res.send("✅ Vote recorded")
})

/* ---------- ADMIN: SPLIT AMOUNT ---------- */
app.post("/split", (req, res) => {
  const { total } = req.body

  db.all(
    "SELECT user_id FROM votes WHERE date=? AND vote='YES'",
    [today()],
    (err, rows) => {
      if (!rows.length) return res.send("No YES votes")

      const share = Math.floor(total / rows.length)

      rows.forEach(r => {
        db.run(
          "INSERT INTO payments (user_id, date, amount, status) VALUES (?, ?, ?, 'PENDING')",
          [r.user_id, today(), share]
        )
      })

      res.send(`✅ Amount split: ₹${share} each`)
    }
  )
})

/* ---------- USER: MARK PAID ---------- */
app.post("/paid", (req, res) => {
  const { userId } = req.body
  db.run(
    "UPDATE payments SET status='PAID' WHERE user_id=? AND status='PENDING'",
    [userId]
  )
  res.send("✅ Payment settled")
})

/* ---------- DAILY REMINDER JOB ---------- */
cron.schedule("0 9 * * *", () => {
  db.all(
    "SELECT user_id, amount FROM payments WHERE status='PENDING'",
    (err, rows) => {
      rows.forEach(r =>
        console.log(`🔔 Reminder: User ${r.user_id} owes ₹${r.amount}`)
      )
    }
  )
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => console.log("🚆 App running on port", PORT))
