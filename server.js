const express = require("express");
const sqlite3 = require("sqlite3").verbose();

const app = express();
const db = new sqlite3.Database("orders.db");

app.use(express.json());
app.use(express.static(__dirname));

// Create table
db.run(`
  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    table_no TEXT,
    items TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Receive order
app.post("/order", (req, res) => {
  const tableNo = req.body.table;
  const items = JSON.stringify(req.body.items);

  db.run(
    "INSERT INTO orders (table_no, items) VALUES (?, ?)",
    [tableNo, items],
    function (err) {
      if (err) {
        console.error(err);
        res.status(500).json({ success: false });
      } else {
        res.json({ success: true });
      }
    }
  );
});

// Send orders to kitchen
app.get("/orders", (req, res) => {
  db.all("SELECT * FROM orders ORDER BY id DESC", (err, rows) => {
    res.json(rows);
  });
});

// Start server
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
