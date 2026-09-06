let products = [];
let cart = JSON.parse(localStorage.getItem("ahmedCart") || "[]");

const $ = s => document.querySelector(s);

function money(n) {
  return Number(n).toLocaleString("ar-EG") + " ج.م";
}

async function loadProducts() {
  try {
    const res = await fetch("/products.json");
    products = await res.json();
    render();
  } catch (err) {
    console.error(err);
    $("#products").innerHTML =
      '<div class="empty">تعذر تحميل المنتجات.</div>';
  }
}

function render() {
  const q = $("#search").value.trim().toLowerCase();
  const c = $("#category").value;

  const list = products.filter(p =>
    (c === "all" || p.category === c) &&
    (!q || p.name.toLowerCase().includes(q))
  );

  $("#resultText").textContent = `عرض ${list.length} منتج`;

  $("#products").innerHTML = list.length
    ? list.map(p => `
      <article class="product">
        <div class="pic">
          ${
            p.img
              ? `<img src="${p.img}" alt="${p.name}" loading="lazy">`
              : `<div style="height:100%;display:flex;align-items:center;justify-content:center;color:#888">لا توجد صورة</div>`
          }
          ${p.badge ? `<span class="badge">${p.badge}</span>` : ""}
        </div>

        <div class="info">
          <div class="cat">${p.category}</div>
          <h3>${p.name}</h3>

          <div class="price">
            ${money(p.price)}
            ${
              p.old
                ? `<span class="old">${money(p.old)}</span>`
                : ""
            }
          </div>

          <button class="add" onclick="add(${p.id})">
            🛒 أضف للسلة
          </button>
        </div>
      </article>
    `).join("")
    : `<div class="empty">لا توجد منتجات مطابقة للبحث.</div>`;

  updateCart();
}

function add(id) {
  const x = cart.find(i => i.id === id);

  if (x) {
    x.qty++;
  } else {
    cart.push({ id, qty: 1 });
  }

  save();
  openCart();
}

function save() {
  localStorage.setItem("ahmedCart", JSON.stringify(cart));
  updateCart();
}

function updateCart() {
  $("#cartCount").textContent =
    cart.reduce((s, i) => s + i.qty, 0);

  const box = $("#cartItems");

  if (!cart.length) {
    box.innerHTML = '<div class="empty">السلة فارغة 🛒</div>';
    $("#total").textContent = "0 ج.م";
    return;
  }

  let total = 0;

  box.innerHTML = cart.map(i => {
    const p = products.find(x => x.id === i.id);

    if (!p) return "";

    total += Number(p.price) * i.qty;

    return `
      <div class="cart-row">
        <img src="${p.img || ""}" alt="">
        <div>
          <h4>${p.name}</h4>
          <div>${money(p.price)}</div>

          <div class="qty">
            <button onclick="change(${p.id},-1)">−</button>
            <b>${i.qty}</b>
            <button onclick="change(${p.id},1)">+</button>
          </div>
        </div>

        <button class="remove" onclick="removeItem(${p.id})">
          حذف
        </button>
      </div>
    `;
  }).join("");

  $("#total").textContent = money(total);
}

function change(id, n) {
  const x = cart.find(i => i.id === id);

  if (!x) return;

  x.qty += n;

  if (x.qty <= 0) {
    removeItem(id);
  } else {
    save();
  }
}

function removeItem(id) {
  cart = cart.filter(i => i.id !== id);
  save();
}

function openCart() {
  $("#cart").classList.add("open");
  $("#overlay").classList.add("open");
}

function closeCart() {
  $("#cart").classList.remove("open");
  $("#overlay").classList.remove("open");
}

$("#openCart").onclick = openCart;
$("#closeCart").onclick = closeCart;
$("#overlay").onclick = closeCart;

$("#search").oninput = render;
$("#category").onchange = render;

$("#checkout").onclick = () => {
  if (!cart.length) {
    return alert("السلة فارغة");
  }

  $("#modal").classList.add("open");
};

$("#closeModal").onclick = () => {
  $("#modal").classList.remove("open");
};

$("#orderForm").onsubmit = e => {
  e.preventDefault();

  if (!cart.length) {
    return alert("السلة فارغة");
  }

  const data = new FormData(e.target);

  const lines = cart.map(i => {
    const p = products.find(x => x.id === i.id);

    if (!p) return "";

    return `• ${p.name} × ${i.qty} = ${money(Number(p.price) * i.qty)}`;
  });

  const total = cart.reduce((s, i) => {
    const p = products.find(x => x.id === i.id);
    return p ? s + Number(p.price) * i.qty : s;
  }, 0);

  const msg = [
    "🛍️ طلب جديد - متجر أحمد البلاسي",
    "",
    `👤 الاسم: ${data.get("name")}`,
    `📞 الهاتف: ${data.get("phone")}`,
    `📍 العنوان: ${data.get("address")}`,
    "",
    "📦 المنتجات:",
    ...lines,
    "",
    `💰 الإجمالي: ${money(total)}`,
    "💳 طريقة الدفع: الدفع عند الاستلام"
  ].join("\n");

  const whatsappNumber = "201025447607";

  window.open(
    `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(msg)}`,
    "_blank"
  );

  $("#modal").classList.remove("open");

  cart = [];
  save();
  closeCart();
};

loadProducts();
