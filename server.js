const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname)));

const db = new sqlite3.Database("orders.db");

db.run(`
CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  table_no TEXT,
  items TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`);

app.post("/order", (req,res) => {
  db.run(
    "INSERT INTO orders (table_no, items) VALUES (?,?)",
    [req.body.table, JSON.stringify(req.body.items)],
    () => res.json({success:true})
  );
});

app.get("/orders", (req,res) => {
  db.all("SELECT * FROM orders ORDER BY id DESC", (e,r)=>res.json(r));
});

app.get("/", (req,res)=>{
  res.sendFile(path.join(__dirname,"index.html"));
});

app.listen(PORT, ()=>console.log("Server running on",PORT));
