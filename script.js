const products=[
{id:1,name:"سماعة لاسلكية",category:"إلكترونيات",price:899,old:1099,badge:"خصم",img:"https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=700&q=80"},
{id:2,name:"ساعة ذكية",category:"إلكترونيات",price:1299,old:1499,badge:"الأكثر مبيعًا",img:"https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=700&q=80"},
{id:3,name:"حقيبة عصرية",category:"إكسسوارات",price:749,old:null,badge:"جديد",img:"https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=700&q=80"},
{id:4,name:"نظارة شمسية",category:"إكسسوارات",price:499,old:599,badge:"خصم",img:"https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=700&q=80"},
{id:5,name:"تيشيرت كلاسيك",category:"ملابس",price:399,old:null,badge:"جديد",img:"https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=700&q=80"},
{id:6,name:"حذاء رياضي",category:"ملابس",price:1199,old:1399,badge:"خصم",img:"https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=700&q=80"},
{id:7,name:"محفظة جلد",category:"إكسسوارات",price:349,old:null,badge:"",img:"https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=700&q=80"},
{id:8,name:"سماعة رأس",category:"إلكترونيات",price:999,old:1199,badge:"الأكثر مبيعًا",img:"https://images.unsplash.com/photo-1484704849700-f032a568e944?auto=format&fit=crop&w=700&q=80"}
];

let cart=JSON.parse(localStorage.getItem("ahmedCart")||"[]");
const $=s=>document.querySelector(s);
function money(n){return n.toLocaleString("ar-EG")+" ج.م"}
function render(){
 const q=$("#search").value.trim().toLowerCase(), c=$("#category").value;
 const list=products.filter(p=>(c==="all"||p.category===c)&&(!q||p.name.toLowerCase().includes(q)));
 $("#resultText").textContent=`عرض ${list.length} منتج`;
 $("#products").innerHTML=list.length?list.map(p=>`
 <article class="product">
  <div class="pic"><img src="${p.img}" alt="${p.name}" loading="lazy">${p.badge?`<span class="badge">${p.badge}</span>`:""}</div>
  <div class="info"><div class="cat">${p.category}</div><h3>${p.name}</h3>
  <div class="price">${money(p.price)} ${p.old?`<span class="old">${money(p.old)}</span>`:""}</div>
  <button class="add" onclick="add(${p.id})">🛒 أضف للسلة</button></div>
 </article>`).join(""):`<div class="empty">لا توجد منتجات مطابقة للبحث.</div>`;
 updateCart();
}
function add(id){const x=cart.find(i=>i.id===id);x?x.qty++:cart.push({id,qty:1});save();openCart()}
function save(){localStorage.setItem("ahmedCart",JSON.stringify(cart));render()}
function updateCart(){
 $("#cartCount").textContent=cart.reduce((s,i)=>s+i.qty,0);
 const box=$("#cartItems");
 if(!cart.length){box.innerHTML='<div class="empty">السلة فارغة 🛒</div>';$("#total").textContent="0 ج.م";return}
 let total=0;
 box.innerHTML=cart.map(i=>{const p=products.find(x=>x.id===i.id);total+=p.price*i.qty;return`
 <div class="cart-row"><img src="${p.img}" alt=""><div><h4>${p.name}</h4><div>${money(p.price)}</div><div class="qty"><button onclick="change(${p.id},-1)">−</button><b>${i.qty}</b><button onclick="change(${p.id},1)">+</button></div></div><button class="remove" onclick="removeItem(${p.id})">حذف</button></div>`}).join("");
 $("#total").textContent=money(total);
}
function change(id,n){const x=cart.find(i=>i.id===id);if(x){x.qty+=n;if(x.qty<=0)removeItem(id);else save()}}
function removeItem(id){cart=cart.filter(i=>i.id!==id);save()}
function openCart(){$("#cart").classList.add("open");$("#overlay").classList.add("open")}
function closeCart(){$("#cart").classList.remove("open");$("#overlay").classList.remove("open")}
$("#openCart").onclick=openCart;$("#closeCart").onclick=closeCart;$("#overlay").onclick=closeCart;
$("#search").oninput=render;$("#category").onchange=render;
$("#checkout").onclick=()=>{if(!cart.length)return alert("السلة فارغة");$("#modal").classList.add("open")};
$("#closeModal").onclick=()=>$("#modal").classList.remove("open");
$("#orderForm").onsubmit=e=>{
 e.preventDefault();
 if(!cart.length)return alert("السلة فارغة");
 const data=new FormData(e.target);
 const lines=cart.map(i=>{const p=products.find(x=>x.id===i.id);return `• ${p.name} × ${i.qty} = ${money(p.price*i.qty)}`});
 const total=cart.reduce((s,i)=>s+products.find(x=>x.id===i.id).price*i.qty,0);
 const msg=[
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
 const whatsappNumber="201025447607";
 window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(msg)}`,"_blank");
 $("#modal").classList.remove("open");
 cart=[];save();closeCart();
};
render();
