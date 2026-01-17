const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const ExcelJS = require("exceljs");
const path = require("path");

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname)));
const db = new sqlite3.Database("orders.db");

// OPEN ORDERS
db.run(`
CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY,
  table_no TEXT,
  items TEXT
)
`);

// CLOSED SALES
db.run(`
CREATE TABLE IF NOT EXISTS sales (
  id INTEGER PRIMARY KEY,
  table_no TEXT,
  total REAL,
  payment_mode TEXT,
  created_at DATE DEFAULT (date('now'))
)
`);

app.post("/order",(r,s)=>{
  db.run(
    "INSERT INTO orders VALUES(NULL,?,?)",
    [r.body.table, JSON.stringify(r.body.items)],
    ()=>s.json({})
  );
});

app.get("/orders",(r,s)=>{
  db.all("SELECT * FROM orders",(e,rows)=>s.json(rows||[]));
});

app.post("/close-table",(r,s)=>{
  db.run(
    "INSERT INTO sales VALUES(NULL,?,?,?,date('now'))",
    [r.body.table, r.body.total, r.body.payment_mode]
  );
  db.run("DELETE FROM orders WHERE table_no=?",[r.body.table]);
  s.json({});
});

// DAY-WISE EXCEL
app.get("/export-daily-summary",(r,s)=>{
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Daily Summary");

  ws.columns = [
    { header:"Date", key:"date", width:18 },
    { header:"Total", key:"total", width:15 },
    { header:"Cash", key:"cash", width:15 },
    { header:"UPI", key:"upi", width:15 },
    { header:"GST (5%)", key:"gst", width:15 }
  ];

  db.all(`
    SELECT created_at date,
           SUM(total) total,
           SUM(CASE WHEN payment_mode='Cash' THEN total ELSE 0 END) cash,
           SUM(CASE WHEN payment_mode='UPI' THEN total ELSE 0 END) upi
    FROM sales
    GROUP BY created_at
  `,(e,rows)=>{
    rows.forEach(r=>{
      ws.addRow({
        date: new Date(r.date).toLocaleDateString("en-IN"),
        total: r.total.toFixed(2),
        cash: r.cash.toFixed(2),
        upi: r.upi.toFixed(2),
        gst: (r.total*0.05).toFixed(2)
      });
    });
    s.setHeader("Content-Disposition","attachment; filename=daily_sales.xlsx");
    wb.xlsx.write(s).then(()=>s.end());
  });
});

// MONTHLY EXCEL
app.get("/export-monthly",(r,s)=>{
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Monthly Summary");

  ws.columns = [
    { header:"Month", key:"month", width:15 },
    { header:"Total", key:"total", width:15 },
    { header:"Cash", key:"cash", width:15 },
    { header:"UPI", key:"upi", width:15 },
    { header:"GST (5%)", key:"gst", width:15 }
  ];

  db.all(`
    SELECT strftime('%Y-%m',created_at) month,
           SUM(total) total,
           SUM(CASE WHEN payment_mode='Cash' THEN total ELSE 0 END) cash,
           SUM(CASE WHEN payment_mode='UPI' THEN total ELSE 0 END) upi
    FROM sales
    GROUP BY month
  `,(e,rows)=>{
    rows.forEach(r=>{
      ws.addRow({
        month:r.month,
        total:r.total.toFixed(2),
        cash:r.cash.toFixed(2),
        upi:r.upi.toFixed(2),
        gst:(r.total*0.05).toFixed(2)
      });
    });
    s.setHeader("Content-Disposition","attachment; filename=monthly_sales.xlsx");
    wb.xlsx.write(s).then(()=>s.end());
  });
});

app.get("/monthly",(r,s)=>{
  db.all(`
    SELECT strftime('%Y-%m',created_at) month, SUM(total) total
    FROM sales GROUP BY month
  `,(e,rows)=>s.json(rows||[]));
});

app.listen(3000,()=>console.log("Server running on 3000"));

