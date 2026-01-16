// ===== SECURITY =====
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

// ===== ADD =====
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

// ===== ADMIN =====
function loadOrders() {
  fetch("/orders").then(r=>r.json()).then(data=>{
    const div = document.getElementById("orders");
    if (!div) return;
    div.innerHTML = "";
    data.forEach(o=>{
      const items = JSON.parse(o.items);
      let subtotal = 0;
      let lines = items.map(i=>{
        let t = i.price * i.qty;
        subtotal += t;
        return `${i.name} x${i.qty} – ₹${t}`;
      }).join("<br>");

      const cgst = subtotal * CGST/100;
      const sgst = subtotal * SGST/100;
      const total = subtotal + cgst + sgst;

      div.innerHTML += `
      <div class="order-box">
        <div class="invoice">
          <h3>Gather Game Café</h3>
          GSTIN: 29ABCDE1234F1Z5<br>
          Invoice: INV-${o.id}<br>
          Date: ${new Date().toLocaleDateString("en-IN")}<br>
          Table: ${o.table_no}<br><br>
          ${lines}<hr>
          <div class="line"><span>Subtotal</span><span>₹${subtotal}</span></div>
          <div class="line"><span>CGST 2.5%</span><span>₹${cgst}</span></div>
          <div class="line"><span>SGST 2.5%</span><span>₹${sgst}</span></div>
          <div class="line"><b>Total</b><b>₹${total}</b></div>
        </div>
        <select id="pay-${o.id}">
          <option>Cash</option>
          <option>UPI</option>
        </select>
        <button onclick="window.print()">Print</button>
        <button onclick="closeOrder(${o.id},${total})">Close</button>
      </div>`;
    });
  });
}

function closeOrder(id,total) {
  const mode = document.getElementById(`pay-${id}`).value;
  fetch(`/close-order/${id}`,{
    method:"POST",
    headers:{ "Content-Type":"application/json" },
    body:JSON.stringify({ total, payment_mode:mode })
  }).then(()=>loadOrders());
}

function exportExcel() { window.open("/export"); }

function loadMonthly() {
  fetch("/monthly").then(r=>r.json()).then(d=>{
    document.getElementById("report").innerHTML =
      d.map(m=>`${m.month}: ₹${m.total}`).join("<br>");
  });
}

showCart();
loadOrders();
setInterval(loadOrders,3000);
