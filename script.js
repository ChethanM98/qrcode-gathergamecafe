// ===== CONFIG (CHANGE IF NEEDED) =====
const GST_PERCENT = 5;          // 5% GST
const SERVICE_CHARGE_PERCENT = 0;

// ===== TABLE NUMBER =====
const params = new URLSearchParams(window.location.search);
if (params.get("table")) {
  localStorage.setItem("tableNumber", params.get("table"));
}
const tableNumber = localStorage.getItem("tableNumber") || "Unknown";

// ===== CART =====
let cart = JSON.parse(localStorage.getItem("cart")) || [];

// ===== CHANGE QUANTITY =====
function changeQty(button, delta) {
  const span = button.parentElement.querySelector(".qty-value");
  let qty = parseInt(span.innerText);
  qty += delta;
  if (qty < 1) qty = 1;
  span.innerText = qty;
}

// ===== ADD TO CART =====
function addToCartFromUI(button, name, price) {
  const qtySpan = button.closest(".menu-item").querySelector(".qty-value");
  const qty = parseInt(qtySpan.innerText);

  const existing = cart.find(i => i.name === name);
  if (existing) {
    existing.qty += qty;
  } else {
    cart.push({ name, price, qty });
  }

  localStorage.setItem("cart", JSON.stringify(cart));
  alert(`${name} x${qty} added`);
  qtySpan.innerText = 1;
}

// ===== SHOW BILL =====
function showCart() {
  const billDiv = document.getElementById("bill");
  if (!billDiv) return;

  billDiv.innerHTML = "";
  let subtotal = 0;

  cart.forEach(item => {
    const lineTotal = item.price * item.qty;
    subtotal += lineTotal;

    billDiv.innerHTML += `
      <div class="row">
        <span>${item.name} x${item.qty}</span>
        <span>₹${lineTotal}</span>
      </div>
    `;
  });

  const gst = (subtotal * GST_PERCENT) / 100;
  const serviceCharge = (subtotal * SERVICE_CHARGE_PERCENT) / 100;
  const grandTotal = subtotal + gst + serviceCharge;

  billDiv.innerHTML += `
    <hr>
    <div class="row"><span>Subtotal</span><span>₹${subtotal.toFixed(2)}</span></div>
    <div class="row"><span>GST (${GST_PERCENT}%)</span><span>₹${gst.toFixed(2)}</span></div>
    <div class="row"><span>Service Charge</span><span>₹${serviceCharge.toFixed(2)}</span></div>
    <div class="row total"><span>Total</span><span>₹${grandTotal.toFixed(2)}</span></div>
    <p>Table: ${tableNumber}</p>
  `;
}

// ===== PLACE ORDER =====
function placeOrder() {
  fetch("/order", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      table: tableNumber,
      items: cart
    })
  })
  .then(() => {
    cart = [];
    localStorage.removeItem("cart");
    alert("Order placed!");
    window.location.href = "index.html?table=" + tableNumber;
  });
}

// ===== KITCHEN =====
function loadOrders() {
  fetch("/orders")
    .then(res => res.json())
    .then(data => {
      const div = document.getElementById("orders");
      if (!div) return;

      div.innerHTML = "";
      data.forEach(order => {
        const box = document.createElement("div");
        box.className = "order-box";
        const items = JSON.parse(order.items)
          .map(i => `${i.name} x${i.qty}`)
          .join(", ");

        box.innerHTML = `<strong>Table ${order.table_no}</strong><br>${items}`;
        div.appendChild(box);
      });
    });
}

showCart();
loadOrders();
setInterval(loadOrders, 2000);

