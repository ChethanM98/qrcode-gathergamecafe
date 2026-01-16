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
  const qtySpan = button
    .closest(".menu-item")
    .querySelector(".qty-value");

  const qty = parseInt(qtySpan.innerText);

  const existing = cart.find(item => item.name === name);

  if (existing) {
    existing.qty += qty;
  } else {
    cart.push({ name, price, qty });
  }

  localStorage.setItem("cart", JSON.stringify(cart));
  alert(`${name} x${qty} added to cart`);

  qtySpan.innerText = 1;
}

// ===== SHOW CART =====
function showCart() {
  const div = document.getElementById("cartItems");
  if (!div) return;

  div.innerHTML = "";
  if (cart.length === 0) {
    div.innerHTML = "<p>No items in cart</p>";
    return;
  }

  let total = 0;
  cart.forEach(item => {
    const itemTotal = item.price * item.qty;
    total += itemTotal;
    div.innerHTML += `<p>${item.name} x${item.qty} – ₹${itemTotal}</p>`;
  });

  div.innerHTML += `<h3>Total: ₹${total}</h3>`;
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
  .then(res => res.json())
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

        box.innerHTML = `
          <strong>Table ${order.table_no}</strong><br>
          ${items}
        `;
        div.appendChild(box);
      });
    });
}

showCart();
loadOrders();
setInterval(loadOrders, 2000);
