const express = require("express");
const multer = require("multer");
const session = require("express-session");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = 3000;

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

if (!ADMIN_PASSWORD) {
  console.error("ضع كلمة مرور الإدارة أولاً:");
  console.error("export ADMIN_PASSWORD='كلمة_المرور'");
  process.exit(1);
}

const uploadsDir = path.join(__dirname, "uploads");
const dataFile = path.join(__dirname, "products.json");

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

if (!fs.existsSync(dataFile)) {
  fs.writeFileSync(dataFile, "[]");
}

const upload = multer({
  dest: uploadsDir,
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 5
  }
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: process.env.SESSION_SECRET || "change-this-secret",
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: "lax"
  }
}));

function adminOnly(req, res, next) {
  if (req.session.admin) return next();

  if (req.path === "/admin.html") {
    return res.redirect("/login");
  }

  return res.status(401).json({
    error: "غير مصرح"
  });
}

app.get("/login", (req, res) => {
  res.send(`
<!doctype html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>دخول الإدارة</title>
<style>
body{font-family:Arial;background:#111;color:white;display:flex;
align-items:center;justify-content:center;min-height:100vh;margin:0}
.box{background:#222;padding:25px;border-radius:15px;width:90%;max-width:400px}
input,button{width:100%;padding:14px;margin-top:12px;box-sizing:border-box}
button{cursor:pointer}
</style>
</head>
<body>
<div class="box">
<h2>🔐 دخول الإدارة</h2>
<form method="post" action="/login">
<input type="password" name="password" placeholder="كلمة المرور" required>
<button type="submit">دخول</button>
</form>
</div>
</body>
</html>
  `);
});

app.post("/login", (req, res) => {
  if (req.body.password !== ADMIN_PASSWORD) {
    return res.status(401).send("كلمة المرور غير صحيحة");
  }

  req.session.admin = true;
  res.redirect("/admin.html");
});

app.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/login");
  });
});

app.get("/admin.html", adminOnly, (req, res) => {
  res.sendFile(path.join(__dirname, "public", "admin.html"));
});

app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static(uploadsDir));

function getProducts() {
  return JSON.parse(fs.readFileSync(dataFile, "utf8"));
}

function saveProducts(products) {
  fs.writeFileSync(dataFile, JSON.stringify(products, null, 2));
}

app.get("/api/products", (req, res) => {
  res.json(getProducts());
});

app.post(
  "/api/products",
  adminOnly,
  upload.array("images", 5),
  (req, res) => {

    const {
      name,
      category,
      price,
      old,
      badge,
      description
    } = req.body;

    if (!name || !category || !price) {
      return res.status(400).json({
        error: "الاسم والقسم والسعر مطلوبة"
      });
    }

    const priceNumber = Number(price);

    if (!Number.isFinite(priceNumber) || priceNumber <= 0) {
      return res.status(400).json({
        error: "السعر غير صحيح"
      });
    }

    const products = getProducts();

    const images = (req.files || []).map(file =>
      `/uploads/${file.filename}`
    );

    const product = {
      id: Date.now(),
      name,
      category,
      price: priceNumber,
      old: old ? Number(old) : null,
      badge: badge || "",
      description: description || "",
      images,
      img: images[0] || ""
    };

    products.push(product);
    saveProducts(products);

    res.json({
      success: true,
      product
    });
  }
);

app.delete("/api/products/:id", adminOnly, (req, res) => {
  const id = Number(req.params.id);
  const products = getProducts();

  const product = products.find(p => p.id === id);

  if (!product) {
    return res.status(404).json({
      error: "المنتج غير موجود"
    });
  }

  const images = Array.isArray(product.images)
    ? product.images
    : (product.img ? [product.img] : []);

  images.forEach(img => {
    if (img && img.startsWith("/uploads/")) {
      const filename = path.basename(img);
      const file = path.join(uploadsDir, filename);

      if (fs.existsSync(file)) {
        fs.unlinkSync(file);
      }
    }
  });

  saveProducts(products.filter(p => p.id !== id));

  res.json({
    success: true
  });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`المتجر يعمل على http://127.0.0.1:${PORT}`);
});
