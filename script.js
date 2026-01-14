// ================= TABLE NUMBER =================
const params = new URLSearchParams(window.location.search);

if (params.get("table")) {
  localStorage.setItem("tableNumber", params.get("table"));
}

const tableNumber = localStorage.getItem("tableNumber") || "Unknown";

// ================= CART STORAGE =================
let cart = JSON.parse(localStorage.getItem("cart")) || [];

// ================= ADD TO CART =================
function addToCart(name, price) {
  cart.push({ name, price });
  localStorage.setItem("cart", JSON.stringify(cart));
  alert(name + " added to cart");
}

// ================= SHOW CART =================
function showCart() {
  const cartDiv = document.getElementById("cartItems");
  if (!cartDiv) return;

  cartDiv.innerHTML = "";

  if (cart.length === 0) {
    cartDiv.innerHTML = "<p>No items in cart</p>";
    return;
  }

  let total = 0;

  cart.forEach(item => {
    total += item.price;

    const p = document.createElement("p");
    p.innerText = `${item.name} - ₹${item.price}`;
    cartDiv.appendChild(p);
  });

  const totalEl = document.createElement("h3");
  totalEl.innerText = `Total: ₹${total}`;
  cartDiv.appendChild(totalEl);
}

// ================= PLACE ORDER =================
function placeOrder() {
  if (cart.length === 0) {
    alert("Cart is empty");
    return;
  }

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

    alert("Order placed successfully. Please pay at the counter.");
    window.location.href = "index.html?table=" + tableNumber;
  })
  .catch(err => {
    console.error(err);
    alert("Order failed");
  });
}

// ================= LOAD CART =================
showCart();

// ================= LOAD KITCHEN ORDERS =================
function loadOrders() {
  fetch("/orders")
    .then(res => res.json())
    .then(data => {
      const ordersDiv = document.getElementById("orders");
      if (!ordersDiv) return;

      ordersDiv.innerHTML = "";

      data.forEach(order => {
        const orderBox = document.createElement("div");
        orderBox.className = "order-box";

        const items = JSON.parse(order.items);

        const itemText = items
          .map(i => `${i.name} (₹${i.price})`)
          .join(", ");

        orderBox.innerHTML = `
          <strong>Order #${order.id}</strong><br>
          <strong>Table:</strong> ${order.table_no}<br>
          <strong>Items:</strong> ${itemText}<br>
          <small>${order.created_at}</small>
        `;

        ordersDiv.appendChild(orderBox);
      });
    });
}

setInterval(loadOrders, 2000);
loadOrders();
