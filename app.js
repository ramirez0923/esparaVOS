// CREDENCIALES DE ACCESO
const ADMIN_USER = "ramirezjulio";
const ADMIN_PASS = "lautaroagustin2015";

const PHONE_VENTAS = "5493858448460";
const PHONE_CONSULTAS = "5493858517967";

let products = JSON.parse(localStorage.getItem("esparavos_products")) || [];
let cart = [];
let currentBase64Image = "";

document.addEventListener("DOMContentLoaded", () => {
  renderProducts();
  renderAdminList();
  setupEventListeners();
});

function saveProducts() {
  localStorage.setItem("esparavos_products", JSON.stringify(products));
}

// Renderizado de tienda
function renderProducts() {
  const grid = document.getElementById("product-grid");
  grid.innerHTML = "";

  if (products.length === 0) {
    grid.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: #888; padding: 40px 0;">No hay productos cargados en la tienda. Toca el engranaje (⚙️) para iniciar sesión y agregar productos.</p>`;
    return;
  }

  products.forEach(p => {
    const isOut = p.stock <= 0;
    const card = document.createElement("div");
    card.className = "product-card";

    const imgContent = p.image 
      ? `<img src="${p.image}" alt="${p.title}" onerror="this.src='https://via.placeholder.com/150?text=Sin+Imagen'">`
      : `<svg viewBox="0 0 100 100" fill="none"><rect x="25" y="25" width="50" height="50" rx="5" stroke="#ccc" stroke-width="2"/><circle cx="50" cy="50" r="10" stroke="#ccc" stroke-width="2"/></svg>`;

    card.innerHTML = `
      <div class="card-image-wrapper">${imgContent}</div>
      <div class="product-info">
        <h3 class="product-title">${p.title}</h3>
        ${p.description ? `<p class="product-description">${p.description}</p>` : ''}
        <span class="current-price">$${parseFloat(p.price).toLocaleString("es-AR", {minimumFractionDigits: 2})}</span>
        ${isOut ? '<span class="stock-out-text">Sin stock</span>' : ''}
        <button class="btn-add" onclick="addToCart(${p.id})" ${isOut ? 'disabled' : ''}>
          ${isOut ? 'Agotado' : 'Agregar al carrito'}
        </button>
      </div>
    `;
    grid.appendChild(card);
  });
}

// Carrito
function addToCart(productId) {
  const product = products.find(p => p.id === productId);
  if (!product || product.stock <= 0) return;

  const cartItem = cart.find(item => item.id === productId);
  if (cartItem) {
    if (cartItem.qty < product.stock) cartItem.qty++;
    else { alert("Alcanzaste el límite de stock disponible."); return; }
  } else {
    cart.push({ ...product, qty: 1 });
  }

  updateCartUI();
  toggleCart(true);
}

function updateCartUI() {
  const container = document.getElementById("cart-items");
  const counter = document.getElementById("cart-counter");
  container.innerHTML = "";

  let totalItems = 0;
  cart.forEach(item => {
    totalItems += item.qty;
    const itemEl = document.createElement("div");
    itemEl.className = "cart-item";
    itemEl.innerHTML = `
      <div class="cart-item-info">
        <h5>${item.title}</h5>
        <p>$${parseFloat(item.price).toLocaleString("es-AR")} x ${item.qty}</p>
      </div>
      <div class="qty-controls">
        <button class="qty-btn" onclick="changeQty(${item.id}, -1)">-</button>
        <span>${item.qty}</span>
        <button class="qty-btn" onclick="changeQty(${item.id}, 1)">+</button>
      </div>
    `;
    container.appendChild(itemEl);
  });

  counter.textContent = totalItems;
  calculateTotals();
}

function changeQty(productId, change) {
  const itemIndex = cart.findIndex(item => item.id === productId);
  if (itemIndex === -1) return;

  const product = products.find(p => p.id === productId);
  const newQty = cart[itemIndex].qty + change;

  if (newQty <= 0) cart.splice(itemIndex, 1);
  else if (newQty <= product.stock) cart[itemIndex].qty = newQty;
  else alert("No hay más stock disponible.");

  updateCartUI();
}

function calculateTotals() {
  const subtotal = cart.reduce((acc, item) => acc + (parseFloat(item.price) * item.qty), 0);
  
  const isDelivery = document.querySelector('input[name="shipping-type"]:checked').value === "delivery";
  const zoneSelect = document.getElementById("shipping-zone");
  const shippingCost = isDelivery ? parseFloat(zoneSelect.options[zoneSelect.selectedIndex].dataset.cost || 0) : 0;

  const total = subtotal + shippingCost;
  document.getElementById("total-amount").textContent = `$${total.toLocaleString("es-AR", {minimumFractionDigits: 2})}`;

  return { total, isDelivery };
}

function toggleCart(show) {
  document.getElementById("cart-drawer").classList.toggle("hidden", !show);
  document.getElementById("cart-overlay").classList.toggle("hidden", !show);
}

// PANEL Y AUTENTICACIÓN ADMIN
function toggleLoginModal(show) {
  document.getElementById("login-modal").classList.toggle("hidden", !show);
  if (show) {
    document.getElementById("login-form").reset();
    document.getElementById("login-error").classList.add("hidden");
  }
}

function handleLogin(e) {
  e.preventDefault();
  const user = document.getElementById("login-user").value.trim();
  const pass = document.getElementById("login-pass").value.trim();

  if (user === ADMIN_USER && pass === ADMIN_PASS) {
    toggleLoginModal(false);
    toggleAdminModal(true);
  } else {
    document.getElementById("login-error").classList.remove("hidden");
  }
}

function toggleAdminModal(show) {
  document.getElementById("admin-modal").classList.toggle("hidden", !show);
  if (!show) resetAdminForm();
}

function resetAdminForm() {
  document.getElementById("product-form").reset();
  document.getElementById("admin-prod-id").value = "";
  document.getElementById("admin-desc").value = "";
  document.getElementById("save-prod-btn").textContent = "Guardar Producto";
  document.getElementById("cancel-prod-btn").classList.add("hidden");
  document.getElementById("image-preview-container").classList.add("hidden");
  currentBase64Image = "";
}

function renderAdminList() {
  const list = document.getElementById("admin-prod-list");
  list.innerHTML = "";

  if (products.length === 0) {
    list.innerHTML = `<p style="font-size: 0.85rem; color: #888;">No hay productos cargados.</p>`;
    return;
  }

  products.forEach(p => {
    const item = document.createElement("div");
    item.className = "admin-item";
    item.innerHTML = `
      <div>
        <strong>${p.title}</strong> - $${p.price} (Stock: ${p.stock})
      </div>
      <div class="admin-item-actions">
        <button class="btn-edit-item" onclick="editProduct(${p.id})"><i class="fa-solid fa-pen"></i></button>
        <button class="btn-del-item" onclick="deleteProduct(${p.id})"><i class="fa-solid fa-trash"></i></button>
      </div>
    `;
    list.appendChild(item);
  });
}

// Conversión de imagen local a Base64
function handleImageUpload(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(event) {
    currentBase64Image = event.target.result;
    const preview = document.getElementById("image-preview");
    preview.src = currentBase64Image;
    document.getElementById("image-preview-container").classList.remove("hidden");
  };
  reader.readAsDataURL(file);
}

function saveProductFromForm(e) {
  e.preventDefault();
  const id = document.getElementById("admin-prod-id").value;
  const title = document.getElementById("admin-title").value.trim();
  const description = document.getElementById("admin-desc").value.trim();
  const price = parseFloat(document.getElementById("admin-price").value);
  const stock = parseInt(document.getElementById("admin-stock").value);
  const urlImage = document.getElementById("admin-image-url").value.trim();

  const finalImage = currentBase64Image || urlImage;

  if (id) {
    const prod = products.find(p => p.id === parseInt(id));
    if (prod) {
      prod.title = title;
      prod.description = description;
      prod.price = price;
      prod.stock = stock;
      prod.image = finalImage;
    }
  } else {
    const newProd = {
      id: Date.now(),
      title,
      description,
      price,
      stock,
      image: finalImage
    };
    products.push(newProd);
  }

  saveProducts();
  renderProducts();
  renderAdminList();
  resetAdminForm();
}

function editProduct(id) {
  const prod = products.find(p => p.id === id);
  if (!prod) return;

  document.getElementById("admin-prod-id").value = prod.id;
  document.getElementById("admin-title").value = prod.title;
  document.getElementById("admin-desc").value = prod.description || "";
  document.getElementById("admin-price").value = prod.price;
  document.getElementById("admin-stock").value = prod.stock;
  
  if (prod.image && prod.image.startsWith("data:image")) {
    currentBase64Image = prod.image;
    document.getElementById("image-preview").src = prod.image;
    document.getElementById("image-preview-container").classList.remove("hidden");
    document.getElementById("admin-image-url").value = "";
  } else {
    currentBase64Image = "";
    document.getElementById("admin-image-url").value = prod.image || "";
    document.getElementById("image-preview-container").classList.add("hidden");
  }

  document.getElementById("save-prod-btn").textContent = "Actualizar Producto";
  document.getElementById("cancel-prod-btn").classList.remove("hidden");
}

function deleteProduct(id) {
  if (confirm("¿Estás seguro de eliminar este producto?")) {
    products = products.filter(p => p.id !== id);
    saveProducts();
    renderProducts();
    renderAdminList();
    resetAdminForm();
  }
}

// Listeners
function setupEventListeners() {
  document.getElementById("cart-toggle-btn").addEventListener("click", () => toggleCart(true));
  document.getElementById("close-cart-btn").addEventListener("click", () => toggleCart(false));
  document.getElementById("cart-overlay").addEventListener("click", () => toggleCart(false));

  // Login y Admin Modal
  document.getElementById("admin-toggle-btn").addEventListener("click", () => toggleLoginModal(true));
  document.getElementById("close-login-btn").addEventListener("click", () => toggleLoginModal(false));
  document.getElementById("login-form").addEventListener("submit", handleLogin);

  document.getElementById("close-admin-btn").addEventListener("click", () => toggleAdminModal(false));
  document.getElementById("admin-image-file").addEventListener("change", handleImageUpload);
  document.getElementById("product-form").addEventListener("submit", saveProductFromForm);
  document.getElementById("cancel-prod-btn").addEventListener("click", resetAdminForm);

  // Formas de entrega
  document.querySelectorAll('input[name="shipping-type"]').forEach(radio => {
    radio.addEventListener("change", (e) => {
      document.getElementById("zone-selector-container").classList.toggle("hidden", e.target.value !== "delivery");
      calculateTotals();
    });
  });

  document.getElementById("shipping-zone").addEventListener("change", calculateTotals);

  // Métodos de pago
  document.querySelectorAll('input[name="payment-method"]').forEach(radio => {
    radio.addEventListener("change", (e) => {
      document.getElementById("transfer-options").classList.toggle("hidden", e.target.value !== "transfer");
    });
  });

  // WhatsApp
  document.getElementById("send-ws-1").addEventListener("click", () => checkoutToWhatsApp(PHONE_VENTAS));
  document.getElementById("send-ws-2").addEventListener("click", () => checkoutToWhatsApp(PHONE_CONSULTAS));
}

function checkoutToWhatsApp(phone) {
  if (cart.length === 0) { alert("El carrito está vacío."); return; }

  const isDelivery = document.querySelector('input[name="shipping-type"]:checked').value === "delivery";
  const isTransfer = document.querySelector('input[name="payment-method"]:checked').value === "transfer";
  const zoneSelect = document.getElementById("shipping-zone");

  if (isDelivery && zoneSelect.value === "0") {
    alert("Por favor, seleccioná una zona para el envío a domicilio.");
    return;
  }

  const calc = calculateTotals();

  // Descontar stock
  cart.forEach(cartItem => {
    const prod = products.find(p => p.id === cartItem.id);
    if (prod) prod.stock -= cartItem.qty;
  });
  saveProducts();
  renderProducts();

  // Formatear Mensaje de WhatsApp
  let msg = "🛒 *NUEVO PEDIDO DE COMPRA - ESPARAVOS*\n\n";
  msg += "*Productos:*\n";
  cart.forEach(item => {
    msg += `• ${item.title} (x${item.qty}) - $${(parseFloat(item.price) * item.qty).toLocaleString("es-AR")}\n`;
  });

  msg += "\n*Forma de Entrega:* " + (isDelivery ? `Domicilio (${zoneSelect.options[zoneSelect.selectedIndex].text})` : "Retiro en Local");
  
  if (isTransfer) {
    msg += "\n🏦 *Medio de Pago:* Transferencia Bancaria";
    msg += "\n📌 *Adjunto mi comprobante de transferencia a este chat.*";
  } else {
    msg += "\n💵 *Medio de Pago:* Efectivo (a abonar al retirar/entregar)";
  }

  msg += `\n\n💰 *TOTAL:* $${calc.total.toLocaleString("es-AR", {minimumFractionDigits: 2})}`;

  cart = [];
  updateCartUI();
  toggleCart(false);

  const encodedMsg = encodeURIComponent(msg);
  window.open(`https://wa.me/${phone}?text=${encodedMsg}`, "_blank");
}