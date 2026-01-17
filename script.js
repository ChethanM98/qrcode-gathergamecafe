// ===== ADMIN SECURITY =====
if (
  location.pathname.includes("admin.html") &&
  sessionStorage.getItem("admin") !== "yes"
) {
  location.href = "admin-login.html";
}

// ===== TAX =====
const CGST = 2.5;
const SGST = 2.5;

// ===== PAYMENT MEMORY =====
const paymentSelection = {};

// ===== TABLE =====
const params = new URLSearchParams(location.search);
if (params.get("table")) localStorage.setItem("table", params.get("table"));
const table = localStorage.getItem("table") || "Unknown";

// ===== CART =====
let cart = JSON.parse(localStorage.getItem("cart")) || [];

// ===== CART COUNT =====
function updateCartCount() {
  const countEl = document.getElementById("cart-count");
  if (!countEl) return;

  const totalQty = cart.reduce((sum, item) => sum + item.qty, 0);
  countEl.innerText = totalQty;
}

// ===== QUANTITY (UI ONLY) =====
function changeQty(btn, delta) {
  const span = btn.parentElement.querySelector(".qty-value");
  let qty = parseInt(span.innerText) + delta;
  if (qty < 1) qty = 1;
  span.innerText = qty;
}

// ===== ADD TO CART =====
function addToCartFromUI(btn, name, price) {
  const qty = parseInt(
    btn.closest(".menu-item").querySelector(".qty-value").innerText
  );

  const found = cart.find(i => i.name === name);
  if (found) {
    found.qty += qty;
  } else {
    cart.push({ name, price, qty });
  }

  localStorage.setItem("cart", JSON.stringify(cart));
  updateCartCount();
}

// ===== SHOW CART (cart.html) =====
function showCart() {
  const div = document.getElementById("cartItems");
  if (!div) return;

  div.innerHTML = "";
  let total = 0;

  cart.forEach(item => {
    const lineTotal = item.price * item.qty;
    total += lineTotal;

    div.innerHTML += `
      <p>
        ${item.name} x${item.qty}
        — ₹${lineTotal.toFixed(2)}
      </p>
    `;
  });

  div.innerHTML += `
    <hr>
    <h3>Total: ₹${total.toFixed(2)}</h3>
  `;

  updateCartCount();
}

// ===== PLACE ORDER =====
function placeOrder() {
  fetch("/order", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ table, items: cart })
  }).then(() => {
    localStorage.removeItem("cart");
    cart = [];
    updateCartCount();
    alert("Order placed successfully");
    location.href = "index.html?table=" + table;
  });
}

// ===== ADMIN LOAD ORDERS (TABLE-WISE) =====
function loadOrders() {
  fetch("/orders")
    .then(r => r.json())
    .then(rows => {
      const div = document.getElementById("orders");
      if (!div) return;

      div.innerHTML = "";
      const tableMap = {};

      rows.forEach(r => {
        if (!tableMap[r.table_no]) tableMap[r.table_no] = [];
        tableMap[r.table_no].push(...JSON.parse(r.items));
      });

      Object.keys(tableMap).forEach(tableNo => {
        const merged = {};
        let subtotal = 0;

        tableMap[tableNo].forEach(i => {
          if (!merged[i.name]) merged[i.name] = { ...i };
          else merged[i.name].qty += i.qty;
        });

        const lines = Object.values(merged)
          .map(i => {
            const t = i.price * i.qty;
            subtotal += t;
            return `${i.name} x${i.qty} – ₹${t}`;
          })
          .join("<br>");

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
              <h3>Gather Game Café</h3>
              GSTIN: 29ABCDE1234F1Z5<br>
              Invoice: INV-${tableNo}<br>
              Date: ${new Date().toLocaleDateString("en-IN")}<br>
              Table: ${tableNo}<br><br>
              ${lines}
              <hr>
              <div class="line"><span>Subtotal</span><span>₹${subtotal.toFixed(2)}</span></div>
              <div class="line"><span>CGST 2.5%</span><span>₹${cgst.toFixed(2)}</span></div>
              <div class="line"><span>SGST 2.5%</span><span>₹${sgst.toFixed(2)}</span></div>
              <div class="line"><b>Total</b><b>₹${total.toFixed(2)}</b></div>
            </div>

            ${selectHTML}<br>
            <button onclick="window.print()">Print Invoice</button>
            <button onclick="closeTable('${tableNo}', ${total})">Close Bill</button>
          </div>
        `;
      });
    });
}

function savePayment(tableNo) {
  paymentSelection[tableNo] =
    document.getElementById(`pay-${tableNo}`).value;
}

function closeTable(tableNo, total) {
  const mode = paymentSelection[tableNo] || "Cash";
  fetch("/close-table", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ table: tableNo, total, payment_mode: mode })
  }).then(() => {
    delete paymentSelection[tableNo];
    loadOrders();
  });
}

// ===== REPORTS =====
function exportDailySummaryExcel() {
  window.open("/export-daily-summary");
}

function exportMonthlyExcel() {
  window.open("/export-monthly");
}

function loadMonthly() {
  fetch("/monthly")
    .then(r => r.json())
    .then(d => {
      document.getElementById("report").innerHTML =
        d.map(m => `${m.month}: ₹${m.total}`).join("<br>");
    });
}

// ===== INIT =====
showCart();
updateCartCount();
loadOrders();
setInterval(loadOrders, 10000);
