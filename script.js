/*************************************************
 * ADMIN SECURITY (admin.html only)
 *************************************************/
if (
  location.pathname.includes("admin.html") &&
  sessionStorage.getItem("admin") !== "yes"
) {
  location.href = "admin-login.html";
}

/*************************************************
 * TABLE HANDLING
 *************************************************/
const params = new URLSearchParams(location.search);
if (params.get("table")) {
  localStorage.setItem("table", params.get("table"));
}
const table = localStorage.getItem("table") || "Unknown";

/*************************************************
 * CART STORAGE
 *************************************************/
let cart = JSON.parse(localStorage.getItem("cart")) || [];

/*************************************************
 * CART COUNT BADGE
 *************************************************/
function updateCartCount() {
  const badge = document.getElementById("cart-count");
  if (!badge) return;

  const totalQty = cart.reduce((sum, item) => sum + item.qty, 0);
  badge.innerText = totalQty;
}

/*************************************************
 * QUANTITY CONTROL (MENU UI ONLY)
 *************************************************/
function changeQty(btn, delta) {
  const qtySpan = btn.parentElement.querySelector(".qty-value");
  if (!qtySpan) return;

  let qty = parseInt(qtySpan.innerText) + delta;
  if (qty < 1) qty = 1;
  qtySpan.innerText = qty;
}

/*************************************************
 * ADD TO CART (FROM MENU)
 *************************************************/
function addToCartFromUI(btn, name, price) {
  const itemBox = btn.closest(".menu-item");
  const qtySpan = itemBox.querySelector(".qty-value");
  const qty = parseInt(qtySpan.innerText);

  const existing = cart.find(i => i.name === name);

  if (existing) {
    existing.qty += qty;
  } else {
    cart.push({ name, price, qty });
  }

  localStorage.setItem("cart", JSON.stringify(cart));
  updateCartCount();
}

/*************************************************
 * SHOW CART (cart.html)
 *************************************************/
function showCart() {
  const container = document.getElementById("cartItems");
  if (!container) return;

  container.innerHTML = "";
  let total = 0;

  if (cart.length === 0) {
    container.innerHTML = "<p>Your cart is empty.</p>";
    return;
  }

  cart.forEach(item => {
    const lineTotal = item.price * item.qty;
    total += lineTotal;

    container.innerHTML += `
      <p>
        <span>${item.name} × ${item.qty}</span>
        <span>₹${lineTotal.toFixed(2)}</span>
      </p>
    `;
  });

  container.innerHTML += `
    <hr>
    <h3>Total: ₹${total.toFixed(2)}</h3>
  `;
}

/*************************************************
 * PLACE ORDER
 *************************************************/
function placeOrder() {
  if (cart.length === 0) {
    alert("Cart is empty");
    return;
  }

  fetch("/order", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      table,
      items: cart
    })
  })
    .then(() => {
      localStorage.removeItem("cart");
      cart = [];
      updateCartCount();
      alert("Order placed successfully!");
      location.href = "index.html?table=" + table;
    })
    .catch(() => alert("Server error. Try again."));
}

/*************************************************
 * ADMIN: LOAD LIVE ORDERS (admin.html)
 *************************************************/
function loadOrders() {
  fetch("/orders")
    .then(res => res.json())
    .then(rows => {
      const container = document.getElementById("orders");
      if (!container) return;

      container.innerHTML = "";

      if (!rows.length) {
        container.innerHTML = "<p>No active orders</p>";
        return;
      }

      rows.forEach(order => {
        const items = JSON.parse(order.items);

        let html = `<div style="border:1px solid #000;padding:10px;margin-bottom:10px;">
          <h3>Table ${order.table_no}</h3>`;

        items.forEach(i => {
          html += `<p>${i.name} × ${i.qty}</p>`;
        });

        html += `</div>`;
        container.innerHTML += html;
      });
    });
}

/*************************************************
 * AUTO INIT
 *************************************************/
document.addEventListener("DOMContentLoaded", () => {
  updateCartCount();
  showCart();
  loadOrders();
});
