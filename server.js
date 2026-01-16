const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const ExcelJS = require("exceljs");
const path = require("path");

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname)));
const db = new sqlite3.Database("orders.db");

// ORDERS (OPEN)
db.run(`CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY,
  table_no TEXT,
  items TEXT
)`);

// SALES (CLOSED)
db.run(`CREATE TABLE IF NOT EXISTS sales (
  id INTEGER PRIMARY KEY,
  table_no TEXT,
  total REAL,
  payment_mode TEXT,
  created_at DATE DEFAULT (date('now'))
)`);

app.post("/order",(r,s)=>{
  db.run("INSERT INTO orders VALUES(NULL,?,?)",
    [r.body.table,JSON.stringify(r.body.items)],()=>s.json({}));
});

// GROUP BY TABLE
app.get("/orders",(r,s)=>{
  db.all("SELECT table_no, GROUP_CONCAT(items) items FROM orders GROUP BY table_no",
    (e,rows)=>{
      rows.forEach(r=>{
        r.items = "[" + r.items.replace(/},{/g,"},{") + "]";
      });
      s.json(rows);
    });
});

app.post("/close-table",(r,s)=>{
  db.run("INSERT INTO sales VALUES(NULL,?,?,?,date('now'))",
    [r.body.table,r.body.total,r.body.payment_mode]);
  db.run("DELETE FROM orders WHERE table_no=?",[r.body.table]);
  s.json({});
});

app.get("/export",(r,s)=>{
  const wb=new ExcelJS.Workbook();
  const ws=wb.addWorksheet("Sales");
  ws.columns=[
    {header:"Table",key:"table"},
    {header:"Total",key:"total"},
    {header:"Mode",key:"mode"},
    {header:"Date",key:"date"}
  ];
  db.all("SELECT * FROM sales",(e,rw)=>{
    rw.forEach(r=>ws.addRow({table:r.table_no,total:r.total,mode:r.payment_mode,date:r.created_at}));
    s.setHeader("Content-Disposition","attachment; filename=sales.xlsx");
    wb.xlsx.write(s).then(()=>s.end());
  });
});

app.get("/monthly",(r,s)=>{
  db.all(`SELECT strftime('%Y-%m',created_at) month, SUM(total) total FROM sales GROUP BY month`,
    (e,rw)=>s.json(rw));
});

app.listen(3000,()=>console.log("Server running on 3000"));
