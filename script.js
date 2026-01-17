// ===== TABLE NUMBER =====
const params = new URLSearchParams(window.location.search);
if (params.get("table")) {
  localStorage.setItem("tableNumber", params.get("table"));
}
const tableNumber = localStorage.getItem("tableNumber") || "Unknown";

// ===== CART =====
let cart = JSON.parse(localStorage.getItem("cart")) || [];

// ===== QUANTITY BUTTON =====
function changeQty(button, delta) {
  const span = button.parentElement.querySelector(".qty-value");
  let qty = parseInt(span.innerText);
  qty += delta;
  if (qty < 1) qty = 1;
  span.innerText = qty;
}

// ===== ADD TO CART =====
function addToCartFromUI(button, name, price) {
  const qtySpan = button
    .closest(".menu-item")
    .querySelector(".qty-value");

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

// ===== SHOW CART =====
function showCart() {
  const div = document.getElementById("cartItems");
  if (!div) return;

  div.innerHTML = "";
  let total = 0;

  cart.forEach(i => {
    const itemTotal = i.price * i.qty;
    total += itemTotal;
    div.innerHTML += `<p>${i.name} x${i.qty} – ₹${itemTotal}</p>`;
  });

  div.innerHTML += `<h3>Total: ₹${total}</h3>`;
}

// ===== PLACE ORDER =====
function placeOrder() {
  fetch("/order", {
    method: "POST",
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify({ table: tableNumber, items: cart })
  })
  .then(r => r.json())
  .then(() => {
    cart = [];
    localStorage.removeItem("cart");
    showCart();
    alert("Order placed!");
    window.location.href = "index.html?table=" + tableNumber;
  });
}

// ===== KITCHEN =====
function loadOrders() {
  fetch("/orders")
    .then(r => r.json())
    .then(data => {
      const div = document.getElementById("orders");
      if (!div) return;
      div.innerHTML = "";
      data.forEach(o => {
        const box = document.createElement("div");
        box.className = "order-box";
        const items = JSON.parse(o.items)
          .map(i => `${i.name} x${i.qty}`).join(", ");
        box.innerHTML = `
          <strong>Table ${o.table_no}</strong><br>
          ${items}
        `;
        div.appendChild(box);
      });
    });
}

showCart();
setInterval(loadOrders,2000);
loadOrders();
