// ===== TEMP PAYMENT MODE STORE (ADMIN) =====
const paymentSelection = {};

// ===== ADMIN SECURITY =====
if (location.pathname.includes("admin.html") &&
    sessionStorage.getItem("admin") !== "yes") {
  location.href = "admin-login.html";
}

// ===== TAX =====
const CGST = 2.5;
const SGST = 2.5;

// ===== TABLE =====
const params = new URLSearchParams(location.search);
if (params.get("table")) localStorage.setItem("table", params.get("table"));
const table = localStorage.getItem("table") || "Unknown";

// ===== CART =====
let cart = JSON.parse(localStorage.getItem("cart")) || [];

// ===== QUANTITY =====
function changeQty(btn, d) {
  const span = btn.parentElement.querySelector(".qty-value");
  let q = parseInt(span.innerText) + d;
  if (q < 1) q = 1;
  span.innerText = q;
}

// ===== ADD TO CART =====
function addToCartFromUI(btn, name, price) {
  const qty = parseInt(btn.closest(".menu-item").querySelector(".qty-value").innerText);
  const found = cart.find(i => i.name === name);
  if (found) found.qty += qty;
  else cart.push({ name, price, qty });
  localStorage.setItem("cart", JSON.stringify(cart));
  alert(`${name} x${qty} added`);
}

// ===== SHOW CART =====
function showCart() {
  const div = document.getElementById("cartItems");
  if (!div) return;
  div.innerHTML = "";
  cart.forEach(i => div.innerHTML += `<p>${i.name} x${i.qty}</p>`);
}

// ===== PLACE ORDER =====
function placeOrder() {
  fetch("/order", {
    method:"POST",
    headers:{ "Content-Type":"application/json" },
    body:JSON.stringify({ table, items:cart })
  }).then(() => {
    localStorage.removeItem("cart");
    cart = [];
    alert("Order placed");
    location.href = "index.html?table=" + table;
  });
}

// ===== ADMIN LOAD (TABLE-WISE) =====
function loadOrders() {
  fetch("/orders")
    .then(res => res.json())
    .then(rows => {
      const div = document.getElementById("orders");
      if (!div) return;

      div.innerHTML = "";

      // ===== GROUP BY TABLE =====
      const tableMap = {};

      rows.forEach(row => {
        const table = row.table_no;
        const items = JSON.parse(row.items);

        if (!tableMap[table]) tableMap[table] = [];
        tableMap[table].push(...items);
      });

      // ===== RENDER EACH TABLE =====
      Object.keys(tableMap).forEach(tableNo => {
        const merged = {};
        let subtotal = 0;

        tableMap[tableNo].forEach(item => {
          if (!merged[item.name]) {
            merged[item.name] = { ...item };
          } else {
            merged[item.name].qty += item.qty;
          }
        });

        const lines = Object.values(merged).map(i => {
          const lineTotal = i.price * i.qty;
          subtotal += lineTotal;
          return `${i.name} x${i.qty} – ₹${lineTotal}`;
        }).join("<br>");

        const cgst = subtotal * 0.025;
        const sgst = subtotal * 0.025;
        const total = subtotal + cgst + sgst;
const selectedMode = paymentSelection[tableNo] || "Cash";

const selectHTML = `
<select id="pay-${tableNo}" onchange="savePayment('${tableNo}')">
  <option value="Cash" ${selectedMode === "Cash" ? "selected" : ""}>Cash</option>
  <option value="UPI" ${selectedMode === "UPI" ? "selected" : ""}>UPI</option>
</select>
`;

div.innerHTML += `
  <div class="table-box">
    <div class="invoice">
      ...
    </div>

    ${selectHTML}<br>

    <button onclick="window.print()">Print Invoice</button>
    <button onclick="closeTable('${tableNo}', ${total})">Close Bill</button>
  </div>
`;

function closeTable(tableNo, total) {
  const mode = paymentSelection[tableNo] || "Cash";

  fetch("/close-table", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      table: tableNo,
      total,
      payment_mode: mode
    })
  })
  .then(() => {
    delete paymentSelection[tableNo]; // cleanup
    loadOrders();
  });
}

function savePayment(tableNo) {
  const value = document.getElementById(`pay-${tableNo}`).value;
  paymentSelection[tableNo] = value;
}

function exportExcel(){ window.open("/export"); }

function loadMonthly(){
  fetch("/monthly").then(r=>r.json()).then(d=>{
    document.getElementById("report").innerHTML =
      d.map(m=>`${m.month}: ₹${m.total}`).join("<br>");
  });
}

showCart();
loadOrders();
setInterval(loadOrders,3000);



