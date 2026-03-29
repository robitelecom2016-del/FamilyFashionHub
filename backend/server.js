require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');

const app = express();
const PORT = process.env.PORT || 5000;

// ===== CLOUDINARY CONFIG =====
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ===== MULTER CLOUDINARY STORAGE =====
const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => ({
    folder: 'FamilyFashionHub',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 800, height: 800, crop: 'limit', quality: 'auto' }],
  }),
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

// ===== CORS =====
const allowedOrigins = [
  process.env.FRONTEND_URL,
  process.env.ADMIN_URL,
  'http://localhost:3000',
  'http://localhost:5500',
  'http://127.0.0.1:5500',
  'http://localhost:5173',
  'http://127.0.0.1:3000',
  'http://localhost:8080',
];
app.use(cors({
  origin: (origin, cb) => cb(null, true), // allow all origins
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));
app.options('*', cors()); // handle all preflight requests
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ===== MONGODB CONNECTION =====
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => console.error('❌ MongoDB Error:', err));

// ===================================================
// ================ MONGOOSE SCHEMAS =================
// ===================================================

// Admin Schema
const adminSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});
const Admin = mongoose.model('Admin', adminSchema);

// Category Schema
const categorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  image: { type: String, default: '' },
  imagePublicId: { type: String, default: '' },
  description: { type: String, default: '' },
  isActive: { type: Boolean, default: true },
  sortOrder: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
});
const Category = mongoose.model('Category', categorySchema);

// Product Schema
const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  oldPrice: { type: Number, default: 0 },
  saving: { type: Number, default: 0 },
  description: { type: String, default: '' },
  category: { type: String, required: true },
  img: { type: String, default: '' },
  imgPublicId: { type: String, default: '' },
  images: [{ url: String, publicId: String }],
  onSale: { type: Boolean, default: false },
  soldOut: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  featured: { type: Boolean, default: false },
  stock: { type: Number, default: 0 },
  sku: { type: String, default: '' },
  sortOrder: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});
const Product = mongoose.model('Product', productSchema);

// Order Schema
const orderSchema = new mongoose.Schema({
  orderId: { type: String, unique: true },
  customerName: { type: String, required: true },
  customerPhone: { type: String, required: true },
  customerAddress: { type: String, required: true },
  deliveryArea: { type: String, enum: ['inside', 'outside'], default: 'inside' },
  deliveryCharge: { type: Number, default: 60 },
  items: [{
    productId: { type: String },
    name: String,
    price: Number,
    quantity: Number,
    img: String,
    category: String,
  }],
  subtotal: { type: Number, required: true },
  total: { type: Number, required: true },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'],
    default: 'pending',
  },
  paymentMethod: { type: String, default: 'COD' },
  paymentStatus: { type: String, enum: ['unpaid', 'paid'], default: 'unpaid' },
  notes: { type: String, default: '' },
  statusHistory: [{
    status: String,
    note: String,
    time: { type: Date, default: Date.now },
  }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});
const Order = mongoose.model('Order', orderSchema);

// User Schema
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true, unique: true },
  email: { type: String, default: '' },
  password: { type: String, required: true },
  address: { type: String, default: '' },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});
const User = mongoose.model('User', userSchema);

// Review Schema
const reviewSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, default: '' },
  rating: { type: Number, min: 1, max: 5, required: true },
  comment: { type: String, required: true },
  productId: { type: String, default: '' },
  productName: { type: String, default: '' },
  image: { type: String, default: '' },
  imagePublicId: { type: String, default: '' },
  isApproved: { type: Boolean, default: false },
  isFeatured: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});
const Review = mongoose.model('Review', reviewSchema);

// Slider/Banner Schema
const sliderSchema = new mongoose.Schema({
  title: { type: String, default: '' },
  subtitle: { type: String, default: '' },
  image: { type: String, required: true },
  imagePublicId: { type: String, default: '' },
  link: { type: String, default: '#' },
  type: { type: String, enum: ['slider', 'banner', 'side-banner'], default: 'slider' },
  isActive: { type: Boolean, default: true },
  sortOrder: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
});
const Slider = mongoose.model('Slider', sliderSchema);

// Settings Schema
const settingsSchema = new mongoose.Schema({
  key: { type: String, unique: true, required: true },
  value: { type: mongoose.Schema.Types.Mixed },
  updatedAt: { type: Date, default: Date.now },
});
const Settings = mongoose.model('Settings', settingsSchema);

// ===================================================
// ================ MIDDLEWARE =======================
// ===================================================

const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ success: false, message: 'Unauthorized' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.admin = decoded;
    next();
  } catch {
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

const generateOrderId = () => {
  const d = new Date();
  return `FFH${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}-${Math.random().toString(36).substr(2,6).toUpperCase()}`;
};

// ===================================================
// =================== ROUTES ========================
// ===================================================

// Health Check
app.get('/', (req, res) => res.json({ success: true, message: 'Family Fashion Hub API Running 🚀' }));

// ============ ADMIN AUTH ============
app.post('/api/admin/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ success: false, message: 'Username and password required' });

    // Check env credentials first
    if (username === process.env.ADMIN_USERNAME && password === process.env.ADMIN_PASSWORD) {
      const token = jwt.sign({ id: 'superadmin', username, role: 'superadmin' }, process.env.JWT_SECRET, { expiresIn: '7d' });
      return res.json({ success: true, token, admin: { username, role: 'superadmin' } });
    }

    const admin = await Admin.findOne({ username });
    if (!admin) return res.status(401).json({ success: false, message: 'Invalid credentials' });
    const valid = await bcrypt.compare(password, admin.password);
    if (!valid) return res.status(401).json({ success: false, message: 'Invalid credentials' });

    const token = jwt.sign({ id: admin._id, username: admin.username, role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ success: true, token, admin: { username: admin.username, role: 'admin' } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/admin/change-password', authMiddleware, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    if (req.admin.role === 'superadmin') {
      return res.json({ success: false, message: 'Cannot change superadmin password via API. Edit .env file.' });
    }
    const admin = await Admin.findById(req.admin.id);
    const valid = await bcrypt.compare(oldPassword, admin.password);
    if (!valid) return res.status(400).json({ success: false, message: 'Old password incorrect' });
    admin.password = await bcrypt.hash(newPassword, 10);
    await admin.save();
    res.json({ success: true, message: 'Password changed successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ============ DASHBOARD STATS ============
app.get('/api/admin/dashboard', authMiddleware, async (req, res) => {
  try {
    const [totalOrders, totalProducts, totalUsers, totalReviews, pendingOrders, deliveredOrders] = await Promise.all([
      Order.countDocuments(),
      Product.countDocuments({ isActive: true }),
      User.countDocuments(),
      Review.countDocuments({ isApproved: true }),
      Order.countDocuments({ status: 'pending' }),
      Order.countDocuments({ status: 'delivered' }),
    ]);

    const revenueResult = await Order.aggregate([
      { $match: { status: { $in: ['delivered', 'shipped'] } } },
      { $group: { _id: null, total: { $sum: '$total' } } },
    ]);
    const totalRevenue = revenueResult[0]?.total || 0;

    const recentOrders = await Order.find().sort({ createdAt: -1 }).limit(5);

    // Orders by status
    const statusCounts = await Order.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    // Monthly orders (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const monthlyOrders = await Order.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      { $group: { _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } }, count: { $sum: 1 }, revenue: { $sum: '$total' } } },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    // Top selling products
    const topProducts = await Order.aggregate([
      { $unwind: '$items' },
      { $group: { _id: '$items.productId', name: { $first: '$items.name' }, totalSold: { $sum: '$items.quantity' }, revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } } } },
      { $sort: { totalSold: -1 } },
      { $limit: 5 },
    ]);

    res.json({
      success: true,
      data: { totalOrders, totalProducts, totalUsers, totalReviews, pendingOrders, deliveredOrders, totalRevenue, recentOrders, statusCounts, monthlyOrders, topProducts },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ============ CATEGORIES ============
app.get('/api/categories', async (req, res) => {
  try {
    const cats = await Category.find({ isActive: true }).sort({ sortOrder: 1, createdAt: 1 });
    res.json({ success: true, data: cats });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/admin/categories', authMiddleware, async (req, res) => {
  try {
    const cats = await Category.find().sort({ sortOrder: 1, createdAt: 1 });
    res.json({ success: true, data: cats });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/admin/categories', authMiddleware, upload.single('image'), async (req, res) => {
  try {
    const { name, slug, description, isActive, sortOrder } = req.body;
    if (!name || !slug) return res.status(400).json({ success: false, message: 'Name and slug required' });
    const existing = await Category.findOne({ slug });
    if (existing) return res.status(400).json({ success: false, message: 'Slug already exists' });

    const catData = { name, slug, description, isActive: isActive !== 'false', sortOrder: Number(sortOrder) || 0 };
    if (req.file) {
      catData.image = req.file.path;
      catData.imagePublicId = req.file.filename;
    }
    const cat = await Category.create(catData);
    res.json({ success: true, data: cat, message: 'Category created' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.put('/api/admin/categories/:id', authMiddleware, upload.single('image'), async (req, res) => {
  try {
    const { name, slug, description, isActive, sortOrder } = req.body;
    const cat = await Category.findById(req.params.id);
    if (!cat) return res.status(404).json({ success: false, message: 'Category not found' });

    if (req.file) {
      if (cat.imagePublicId) await cloudinary.uploader.destroy(cat.imagePublicId).catch(() => {});
      cat.image = req.file.path;
      cat.imagePublicId = req.file.filename;
    }
    if (name) cat.name = name;
    if (slug) cat.slug = slug;
    if (description !== undefined) cat.description = description;
    if (isActive !== undefined) cat.isActive = isActive !== 'false';
    if (sortOrder !== undefined) cat.sortOrder = Number(sortOrder);
    await cat.save();
    res.json({ success: true, data: cat, message: 'Category updated' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.delete('/api/admin/categories/:id', authMiddleware, async (req, res) => {
  try {
    const cat = await Category.findById(req.params.id);
    if (!cat) return res.status(404).json({ success: false, message: 'Category not found' });
    if (cat.imagePublicId) await cloudinary.uploader.destroy(cat.imagePublicId).catch(() => {});
    await cat.deleteOne();
    res.json({ success: true, message: 'Category deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ============ PRODUCTS ============
app.get('/api/products', async (req, res) => {
  try {
    const { category, search, onSale, featured, limit = 100, page = 1 } = req.query;
    const filter = { isActive: true };
    if (category && category !== 'all') filter.category = category;
    if (onSale === 'true') filter.onSale = true;
    if (featured === 'true') filter.featured = true;
    if (search) filter.name = { $regex: search, $options: 'i' };

    const skip = (Number(page) - 1) * Number(limit);
    const [products, total] = await Promise.all([
      Product.find(filter).sort({ sortOrder: 1, createdAt: -1 }).skip(skip).limit(Number(limit)),
      Product.countDocuments(filter),
    ]);
    res.json({ success: true, data: products, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/products/:id', async (req, res) => {
  try {
    const p = await Product.findById(req.params.id);
    if (!p) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, data: p });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/admin/products', authMiddleware, async (req, res) => {
  try {
    const { category, search, page = 1, limit = 50 } = req.query;
    const filter = {};
    if (category && category !== 'all') filter.category = category;
    if (search) filter.name = { $regex: search, $options: 'i' };
    const skip = (Number(page) - 1) * Number(limit);
    const [products, total] = await Promise.all([
      Product.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      Product.countDocuments(filter),
    ]);
    res.json({ success: true, data: products, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/admin/products', authMiddleware, upload.array('images', 5), async (req, res) => {
  try {
    const { name, price, oldPrice, saving, description, category, onSale, soldOut, featured, stock, sku, sortOrder } = req.body;
    if (!name || !price || !category) return res.status(400).json({ success: false, message: 'Name, price, category required' });

    const productData = {
      name, price: Number(price), oldPrice: Number(oldPrice) || 0,
      saving: Number(saving) || 0, description, category,
      onSale: onSale === 'true', soldOut: soldOut === 'true',
      featured: featured === 'true', stock: Number(stock) || 0,
      sku: sku || '', sortOrder: Number(sortOrder) || 0,
    };

    if (req.files && req.files.length > 0) {
      productData.img = req.files[0].path;
      productData.imgPublicId = req.files[0].filename;
      productData.images = req.files.map(f => ({ url: f.path, publicId: f.filename }));
    }

    const product = await Product.create(productData);
    res.json({ success: true, data: product, message: 'Product created successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.put('/api/admin/products/:id', authMiddleware, upload.array('images', 5), async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    const fields = ['name','price','oldPrice','saving','description','category','sku','stock','sortOrder'];
    fields.forEach(f => { if (req.body[f] !== undefined) product[f] = ['price','oldPrice','saving','stock','sortOrder'].includes(f) ? Number(req.body[f]) : req.body[f]; });
    ['onSale','soldOut','featured','isActive'].forEach(f => { if (req.body[f] !== undefined) product[f] = req.body[f] === 'true'; });

    if (req.files && req.files.length > 0) {
      // Delete old images from cloudinary
      if (product.imgPublicId) await cloudinary.uploader.destroy(product.imgPublicId).catch(() => {});
      for (const img of product.images) { if (img.publicId) await cloudinary.uploader.destroy(img.publicId).catch(() => {}); }

      product.img = req.files[0].path;
      product.imgPublicId = req.files[0].filename;
      product.images = req.files.map(f => ({ url: f.path, publicId: f.filename }));
    }

    product.updatedAt = new Date();
    await product.save();
    res.json({ success: true, data: product, message: 'Product updated successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.delete('/api/admin/products/:id', authMiddleware, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    if (product.imgPublicId) await cloudinary.uploader.destroy(product.imgPublicId).catch(() => {});
    for (const img of product.images) { if (img.publicId) await cloudinary.uploader.destroy(img.publicId).catch(() => {}); }
    await product.deleteOne();
    res.json({ success: true, message: 'Product deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Bulk operations
app.post('/api/admin/products/bulk', authMiddleware, async (req, res) => {
  try {
    const { action, ids } = req.body;
    if (!ids || !ids.length) return res.status(400).json({ success: false, message: 'No products selected' });
    if (action === 'delete') {
      const products = await Product.find({ _id: { $in: ids } });
      for (const p of products) {
        if (p.imgPublicId) await cloudinary.uploader.destroy(p.imgPublicId).catch(() => {});
        for (const img of p.images) { if (img.publicId) await cloudinary.uploader.destroy(img.publicId).catch(() => {}); }
      }
      await Product.deleteMany({ _id: { $in: ids } });
      return res.json({ success: true, message: `${ids.length} products deleted` });
    }
    if (action === 'activate') await Product.updateMany({ _id: { $in: ids } }, { isActive: true });
    if (action === 'deactivate') await Product.updateMany({ _id: { $in: ids } }, { isActive: false });
    if (action === 'sale') await Product.updateMany({ _id: { $in: ids } }, { onSale: true });
    res.json({ success: true, message: 'Bulk action completed' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ============ ORDERS (PUBLIC) ============
app.options('/api/orders', (req, res) => res.sendStatus(200)); // explicit preflight

app.post('/api/orders', async (req, res) => {
  try {
    let body = req.body;
    // Handle cases where body might be a string (some frontend setups)
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch { body = {}; }
    }

    const { customerName, customerPhone, customerAddress, deliveryArea, items, subtotal, total, notes } = body;

    if (!customerName || !customerPhone || !customerAddress)
      return res.status(400).json({ success: false, message: 'নাম, ফোন ও ঠিকানা আবশ্যক' });
    if (!items || !Array.isArray(items) || items.length === 0)
      return res.status(400).json({ success: false, message: 'অর্ডারে কোনো পণ্য নেই' });

    // Normalize items - handle different frontend data structures
    const normalizedItems = items.map(item => ({
      productId: item.productId || item._id || item.id || '',
      name: item.name || item.productName || 'Unknown Product',
      price: Number(item.price) || 0,
      quantity: Number(item.quantity) || 1,
      img: item.img || item.image || item.thumbnail || '',
      category: item.category || '',
    }));

    const area = deliveryArea || 'inside';
    const charge = area === 'outside' ? 120 : 60;
    const calcSubtotal = normalizedItems.reduce((s, i) => s + (i.price * i.quantity), 0);
    const finalSubtotal = Number(subtotal) || calcSubtotal;
    const finalTotal = Number(total) || (finalSubtotal + charge);

    const orderId = generateOrderId();
    const order = await Order.create({
      orderId,
      customerName: String(customerName).trim(),
      customerPhone: String(customerPhone).trim(),
      customerAddress: String(customerAddress).trim(),
      deliveryArea: area,
      deliveryCharge: charge,
      items: normalizedItems,
      subtotal: finalSubtotal,
      total: finalTotal,
      notes: notes ? String(notes).trim() : '',
      statusHistory: [{ status: 'pending', note: 'অর্ডার দেওয়া হয়েছে' }],
    });

    res.json({
      success: true,
      data: { orderId: order.orderId, _id: order._id },
      message: 'অর্ডার সফলভাবে দেওয়া হয়েছে',
    });
  } catch (err) {
    console.error('Order error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/orders/track/:orderId', async (req, res) => {
  try {
    const order = await Order.findOne({ orderId: req.params.orderId });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    res.json({ success: true, data: order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ============ ORDERS (ADMIN) ============
app.get('/api/admin/orders', authMiddleware, async (req, res) => {
  try {
    const { status, search, page = 1, limit = 20, dateFrom, dateTo } = req.query;
    const filter = {};
    if (status && status !== 'all') filter.status = status;
    if (search) filter.$or = [
      { orderId: { $regex: search, $options: 'i' } },
      { customerName: { $regex: search, $options: 'i' } },
      { customerPhone: { $regex: search, $options: 'i' } },
    ];
    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
      if (dateTo) { const d = new Date(dateTo); d.setHours(23,59,59,999); filter.createdAt.$lte = d; }
    }
    const skip = (Number(page) - 1) * Number(limit);
    const [orders, total] = await Promise.all([
      Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      Order.countDocuments(filter),
    ]);
    res.json({ success: true, data: orders, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/admin/orders/:id', authMiddleware, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    res.json({ success: true, data: order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.put('/api/admin/orders/:id/status', authMiddleware, async (req, res) => {
  try {
    const { status, note, paymentStatus } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    order.status = status;
    order.statusHistory.push({ status, note: note || '' });
    if (paymentStatus) order.paymentStatus = paymentStatus;
    order.updatedAt = new Date();
    await order.save();
    res.json({ success: true, data: order, message: 'Order status updated' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.delete('/api/admin/orders/:id', authMiddleware, async (req, res) => {
  try {
    await Order.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Order deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ============ USERS ============
app.post('/api/users/register', async (req, res) => {
  try {
    const { name, phone, password, email, address } = req.body;
    if (!name || !phone || !password) return res.status(400).json({ success: false, message: 'Name, phone, password required' });
    const existing = await User.findOne({ phone });
    if (existing) return res.status(400).json({ success: false, message: 'Phone already registered' });
    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ name, phone, password: hashed, email: email || '', address: address || '' });
    const token = jwt.sign({ id: user._id, phone: user.phone }, process.env.JWT_SECRET, { expiresIn: '30d' });
    res.json({ success: true, token, user: { _id: user._id, name: user.name, phone: user.phone, email: user.email } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/users/login', async (req, res) => {
  try {
    const { phone, password } = req.body;
    const user = await User.findOne({ phone });
    if (!user) return res.status(401).json({ success: false, message: 'Invalid credentials' });
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ success: false, message: 'Invalid credentials' });
    const token = jwt.sign({ id: user._id, phone: user.phone }, process.env.JWT_SECRET, { expiresIn: '30d' });
    res.json({ success: true, token, user: { _id: user._id, name: user.name, phone: user.phone, email: user.email, address: user.address } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/admin/users', authMiddleware, async (req, res) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (search) filter.$or = [{ name: { $regex: search, $options: 'i' } }, { phone: { $regex: search, $options: 'i' } }];
    const skip = (Number(page) - 1) * Number(limit);
    const [users, total] = await Promise.all([
      User.find(filter, '-password').sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      User.countDocuments(filter),
    ]);
    res.json({ success: true, data: users, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.put('/api/admin/users/:id', authMiddleware, async (req, res) => {
  try {
    const { isActive } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, { isActive }, { new: true, select: '-password' });
    res.json({ success: true, data: user, message: 'User updated' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.delete('/api/admin/users/:id', authMiddleware, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ============ REVIEWS ============
app.post('/api/reviews', async (req, res) => {
  try {
    const { name, phone, rating, comment, productId, productName } = req.body;
    if (!name || !rating || !comment) return res.status(400).json({ success: false, message: 'Name, rating, comment required' });
    const review = await Review.create({ name, phone, rating, comment, productId, productName });
    res.json({ success: true, data: review, message: 'Review submitted, pending approval' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/reviews', async (req, res) => {
  try {
    const { productId, featured } = req.query;
    const filter = { isApproved: true };
    if (productId) filter.productId = productId;
    if (featured === 'true') filter.isFeatured = true;
    const reviews = await Review.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, data: reviews });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/admin/reviews', authMiddleware, async (req, res) => {
  try {
    const { approved, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (approved !== undefined) filter.isApproved = approved === 'true';
    const skip = (Number(page) - 1) * Number(limit);
    const [reviews, total] = await Promise.all([
      Review.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      Review.countDocuments(filter),
    ]);
    res.json({ success: true, data: reviews, total });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.put('/api/admin/reviews/:id', authMiddleware, async (req, res) => {
  try {
    const { isApproved, isFeatured } = req.body;
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ success: false, message: 'Review not found' });
    if (isApproved !== undefined) review.isApproved = isApproved;
    if (isFeatured !== undefined) review.isFeatured = isFeatured;
    await review.save();
    res.json({ success: true, data: review, message: 'Review updated' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.delete('/api/admin/reviews/:id', authMiddleware, async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ success: false, message: 'Review not found' });
    if (review.imagePublicId) await cloudinary.uploader.destroy(review.imagePublicId).catch(() => {});
    await review.deleteOne();
    res.json({ success: true, message: 'Review deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ============ SLIDERS / BANNERS ============
app.get('/api/sliders', async (req, res) => {
  try {
    const { type } = req.query;
    const filter = { isActive: true };
    if (type) filter.type = type;
    const sliders = await Slider.find(filter).sort({ sortOrder: 1 });
    res.json({ success: true, data: sliders });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/admin/sliders', authMiddleware, async (req, res) => {
  try {
    const sliders = await Slider.find().sort({ sortOrder: 1 });
    res.json({ success: true, data: sliders });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/admin/sliders', authMiddleware, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'Image required' });
    const { title, subtitle, link, type, isActive, sortOrder } = req.body;
    const slider = await Slider.create({
      title, subtitle, link: link || '#', type: type || 'slider',
      isActive: isActive !== 'false', sortOrder: Number(sortOrder) || 0,
      image: req.file.path, imagePublicId: req.file.filename,
    });
    res.json({ success: true, data: slider, message: 'Slider created' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.put('/api/admin/sliders/:id', authMiddleware, upload.single('image'), async (req, res) => {
  try {
    const slider = await Slider.findById(req.params.id);
    if (!slider) return res.status(404).json({ success: false, message: 'Slider not found' });
    const { title, subtitle, link, type, isActive, sortOrder } = req.body;
    if (title !== undefined) slider.title = title;
    if (subtitle !== undefined) slider.subtitle = subtitle;
    if (link !== undefined) slider.link = link;
    if (type !== undefined) slider.type = type;
    if (isActive !== undefined) slider.isActive = isActive !== 'false';
    if (sortOrder !== undefined) slider.sortOrder = Number(sortOrder);
    if (req.file) {
      if (slider.imagePublicId) await cloudinary.uploader.destroy(slider.imagePublicId).catch(() => {});
      slider.image = req.file.path;
      slider.imagePublicId = req.file.filename;
    }
    await slider.save();
    res.json({ success: true, data: slider, message: 'Slider updated' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.delete('/api/admin/sliders/:id', authMiddleware, async (req, res) => {
  try {
    const slider = await Slider.findById(req.params.id);
    if (!slider) return res.status(404).json({ success: false, message: 'Slider not found' });
    if (slider.imagePublicId) await cloudinary.uploader.destroy(slider.imagePublicId).catch(() => {});
    await slider.deleteOne();
    res.json({ success: true, message: 'Slider deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ============ SETTINGS ============
app.get('/api/settings', async (req, res) => {
  try {
    const settings = await Settings.find({ key: { $in: ['storeName','storePhone','storeAddress','deliveryInside','deliveryOutside','currency','announcement'] } });
    const data = {};
    settings.forEach(s => data[s.key] = s.value);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/admin/settings', authMiddleware, async (req, res) => {
  try {
    const settings = await Settings.find();
    const data = {};
    settings.forEach(s => data[s.key] = s.value);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/admin/settings', authMiddleware, async (req, res) => {
  try {
    const updates = req.body;
    for (const [key, value] of Object.entries(updates)) {
      await Settings.findOneAndUpdate({ key }, { key, value, updatedAt: new Date() }, { upsert: true });
    }
    res.json({ success: true, message: 'Settings saved' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ============ IMAGE UPLOAD (standalone) ============
app.post('/api/admin/upload', authMiddleware, upload.array('images', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) return res.status(400).json({ success: false, message: 'No files uploaded' });
    const uploaded = req.files.map(f => ({ url: f.path, publicId: f.filename }));
    res.json({ success: true, data: uploaded });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.delete('/api/admin/upload/:publicId', authMiddleware, async (req, res) => {
  try {
    const publicId = decodeURIComponent(req.params.publicId);
    await cloudinary.uploader.destroy(publicId);
    res.json({ success: true, message: 'Image deleted from Cloudinary' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ============ SEED ADMIN ============
app.post('/api/admin/seed', async (req, res) => {
  try {
    const { secret } = req.body;
    if (secret !== 'FFH_SEED_2024') return res.status(403).json({ success: false, message: 'Forbidden' });
    const existing = await Admin.findOne({ username: 'admin' });
    if (existing) return res.json({ success: false, message: 'Admin already exists' });
    const hashed = await bcrypt.hash('admin123', 10);
    await Admin.create({ username: 'admin', password: hashed });
    res.json({ success: true, message: 'Admin created: admin/admin123' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ============ SEED ALL (Categories + Products) ============
app.post('/api/admin/seed-all', async (req, res) => {
  try {
    const { secret } = req.body;
    if (secret !== 'FFH_SEED_2024') return res.status(403).json({ success: false, message: 'Forbidden' });

    // ---- CATEGORIES ----
    const categoriesData = [
      { name: 'শাড়ি', slug: 'saree', description: 'সুন্দর ও বৈচিত্র্যময় শাড়ির কালেকশন', sortOrder: 1 },
      { name: 'থ্রি-পিস', slug: 'three-piece', description: 'মহিলাদের থ্রি-পিস কালেকশন', sortOrder: 2 },
      { name: 'কামিজ ও সালোয়ার', slug: 'kamiz-salwar', description: 'সালোয়ার কামিজ কালেকশন', sortOrder: 3 },
      { name: 'পাঞ্জাবি', slug: 'panjabi', description: 'ছেলেদের পাঞ্জাবি কালেকশন', sortOrder: 4 },
      { name: 'কিডস কালেকশন', slug: 'kids', description: 'ছেলে ও মেয়ে শিশুদের পোশাক', sortOrder: 5 },
      { name: 'লেহেঙ্গা', slug: 'lehenga', description: 'বিশেষ অনুষ্ঠানের জন্য লেহেঙ্গা', sortOrder: 6 },
      { name: 'কুর্তি', slug: 'kurti', description: 'কুর্তি কালেকশন', sortOrder: 7 },
      { name: 'বোরখা ও হিজাব', slug: 'borka-hijab', description: 'বোরখা, হিজাব ও আবায়া কালেকশন', sortOrder: 8 },
    ];

    const createdCats = {};
    for (const cat of categoriesData) {
      const existing = await Category.findOne({ slug: cat.slug });
      if (!existing) {
        const created = await Category.create({ ...cat, isActive: true });
        createdCats[cat.slug] = created;
      } else {
        createdCats[cat.slug] = existing;
      }
    }

    // ---- PRODUCTS ----
    const productsData = [
      // শাড়ি
      { name: 'মসলিন সিল্ক শাড়ি - লাল', price: 1850, oldPrice: 2200, saving: 350, category: 'saree', description: 'উচ্চমানের মসলিন সিল্ক শাড়ি, বিশেষ অনুষ্ঠানের জন্য আদর্শ।', onSale: true, featured: true, stock: 25, img: 'https://res.cloudinary.com/dsiccgigh/image/upload/v1/FamilyFashionHub/saree-red', sortOrder: 1 },
      { name: 'জামদানি শাড়ি - সবুজ', price: 2500, oldPrice: 3000, saving: 500, category: 'saree', description: 'ঐতিহ্যবাহী জামদানি শাড়ি, হাতে বোনা নকশা।', onSale: true, featured: true, stock: 15, img: 'https://res.cloudinary.com/dsiccgigh/image/upload/v1/FamilyFashionHub/saree-green', sortOrder: 2 },
      { name: 'কাতান সিল্ক শাড়ি - নীল', price: 3200, oldPrice: 3800, saving: 600, category: 'saree', description: 'বিবাহ ও বিশেষ অনুষ্ঠানের জন্য কাতান সিল্ক শাড়ি।', onSale: false, featured: true, stock: 10, img: 'https://res.cloudinary.com/dsiccgigh/image/upload/v1/FamilyFashionHub/saree-blue', sortOrder: 3 },
      { name: 'সুতি শাড়ি - হলুদ', price: 950, oldPrice: 1200, saving: 250, category: 'saree', description: 'আরামদায়ক সুতি শাড়ি, দৈনন্দিন পরিধানের জন্য উপযুক্ত।', onSale: true, stock: 40, img: 'https://res.cloudinary.com/dsiccgigh/image/upload/v1/FamilyFashionHub/saree-yellow', sortOrder: 4 },
      { name: 'জর্জেট শাড়ি - গোলাপি', price: 1450, oldPrice: 1700, saving: 250, category: 'saree', description: 'হালকা ও স্বাচ্ছন্দ্যময় জর্জেট শাড়ি।', onSale: false, stock: 30, img: 'https://res.cloudinary.com/dsiccgigh/image/upload/v1/FamilyFashionHub/saree-pink', sortOrder: 5 },

      // থ্রি-পিস
      { name: 'প্রিন্টেড থ্রি-পিস - বেগুনি', price: 1200, oldPrice: 1500, saving: 300, category: 'three-piece', description: 'সুন্দর প্রিন্টেড থ্রি-পিস সেট, সহজ পরিধান।', onSale: true, featured: true, stock: 20, img: 'https://res.cloudinary.com/dsiccgigh/image/upload/v1/FamilyFashionHub/threepiece-purple', sortOrder: 1 },
      { name: 'এমব্রয়ডারি থ্রি-পিস - সাদা', price: 1800, oldPrice: 2100, saving: 300, category: 'three-piece', description: 'হাতে কাজ করা এমব্রয়ডারি থ্রি-পিস।', onSale: false, featured: true, stock: 18, img: 'https://res.cloudinary.com/dsiccgigh/image/upload/v1/FamilyFashionHub/threepiece-white', sortOrder: 2 },
      { name: 'লিনেন থ্রি-পিস - আকাশি', price: 1350, oldPrice: 1600, saving: 250, category: 'three-piece', description: 'লিনেন কাপড়ের থ্রি-পিস, গরমের জন্য আদর্শ।', onSale: true, stock: 22, img: 'https://res.cloudinary.com/dsiccgigh/image/upload/v1/FamilyFashionHub/threepiece-sky', sortOrder: 3 },

      // কামিজ ও সালোয়ার
      { name: 'ঈদ স্পেশাল কামিজ সেট', price: 1100, oldPrice: 1400, saving: 300, category: 'kamiz-salwar', description: 'ঈদ উপলক্ষে বিশেষ কামিজ সেট, সুতি মিক্স কাপড়।', onSale: true, featured: true, stock: 35, img: 'https://res.cloudinary.com/dsiccgigh/image/upload/v1/FamilyFashionHub/kamiz-eid', sortOrder: 1 },
      { name: 'সিম্পল ডেইলি কামিজ - সবুজ', price: 750, oldPrice: 900, saving: 150, category: 'kamiz-salwar', description: 'দৈনন্দিন পরিধানের জন্য আরামদায়ক কামিজ।', onSale: false, stock: 50, img: 'https://res.cloudinary.com/dsiccgigh/image/upload/v1/FamilyFashionHub/kamiz-green', sortOrder: 2 },
      { name: 'এক্সক্লুসিভ সালোয়ার কামিজ - কমলা', price: 1300, oldPrice: 1550, saving: 250, category: 'kamiz-salwar', description: 'এক্সক্লুসিভ ডিজাইনের সালোয়ার কামিজ।', onSale: true, stock: 28, img: 'https://res.cloudinary.com/dsiccgigh/image/upload/v1/FamilyFashionHub/kamiz-orange', sortOrder: 3 },

      // পাঞ্জাবি
      { name: 'ঈদ স্পেশাল পাঞ্জাবি - সাদা', price: 1200, oldPrice: 1500, saving: 300, category: 'panjabi', description: 'ঈদের জন্য বিশেষ পাঞ্জাবি, উচ্চমানের কাপড়।', onSale: true, featured: true, stock: 30, img: 'https://res.cloudinary.com/dsiccgigh/image/upload/v1/FamilyFashionHub/panjabi-white', sortOrder: 1 },
      { name: 'ক্যাজুয়াল পাঞ্জাবি - নীল', price: 850, oldPrice: 1050, saving: 200, category: 'panjabi', description: 'ক্যাজুয়াল ওয়্যার পাঞ্জাবি, আরামদায়ক ফ্যাব্রিক।', onSale: false, stock: 40, img: 'https://res.cloudinary.com/dsiccgigh/image/upload/v1/FamilyFashionHub/panjabi-blue', sortOrder: 2 },
      { name: 'সিল্ক পাঞ্জাবি - ক্রিম', price: 1800, oldPrice: 2200, saving: 400, category: 'panjabi', description: 'বিশেষ অনুষ্ঠানের জন্য সিল্ক পাঞ্জাবি।', onSale: true, featured: true, stock: 15, img: 'https://res.cloudinary.com/dsiccgigh/image/upload/v1/FamilyFashionHub/panjabi-cream', sortOrder: 3 },
      { name: 'কটন পাঞ্জাবি - হালকা বাদামি', price: 700, oldPrice: 850, saving: 150, category: 'panjabi', description: 'সুতি পাঞ্জাবি, গরম আবহাওয়ার জন্য উপযুক্ত।', onSale: false, stock: 45, img: 'https://res.cloudinary.com/dsiccgigh/image/upload/v1/FamilyFashionHub/panjabi-brown', sortOrder: 4 },

      // কিডস
      { name: 'বাচ্চাদের ফ্রক - গোলাপি', price: 550, oldPrice: 700, saving: 150, category: 'kids', description: 'মেয়ে শিশুদের জন্য সুন্দর ফ্রক, নরম কাপড়।', onSale: true, featured: true, stock: 35, img: 'https://res.cloudinary.com/dsiccgigh/image/upload/v1/FamilyFashionHub/kids-frock', sortOrder: 1 },
      { name: 'ছেলেদের পাঞ্জাবি সেট - হলুদ', price: 700, oldPrice: 900, saving: 200, category: 'kids', description: 'ছেলে শিশুদের পাঞ্জাবি সেট, ঈদের জন্য আদর্শ।', onSale: true, stock: 28, img: 'https://res.cloudinary.com/dsiccgigh/image/upload/v1/FamilyFashionHub/kids-panjabi', sortOrder: 2 },
      { name: 'মেয়েদের সালোয়ার কামিজ - লাল', price: 650, oldPrice: 800, saving: 150, category: 'kids', description: 'মেয়ে শিশুদের সালোয়ার কামিজ, টেকসই ও আরামদায়ক।', onSale: false, stock: 30, img: 'https://res.cloudinary.com/dsiccgigh/image/upload/v1/FamilyFashionHub/kids-kamiz', sortOrder: 3 },

      // লেহেঙ্গা
      { name: 'পার্টি লেহেঙ্গা - মেরুন', price: 3500, oldPrice: 4200, saving: 700, category: 'lehenga', description: 'বিয়ে ও পার্টির জন্য বিশেষ লেহেঙ্গা।', onSale: true, featured: true, stock: 12, img: 'https://res.cloudinary.com/dsiccgigh/image/upload/v1/FamilyFashionHub/lehenga-maroon', sortOrder: 1 },
      { name: 'ব্রাইডাল লেহেঙ্গা - গোল্ডেন', price: 5500, oldPrice: 6500, saving: 1000, category: 'lehenga', description: 'বিয়ের অনুষ্ঠানের জন্য বিশেষ ব্রাইডাল লেহেঙ্গা।', onSale: false, featured: true, stock: 8, img: 'https://res.cloudinary.com/dsiccgigh/image/upload/v1/FamilyFashionHub/lehenga-golden', sortOrder: 2 },

      // কুর্তি
      { name: 'কটন কুর্তি - সাদা প্রিন্ট', price: 650, oldPrice: 800, saving: 150, category: 'kurti', description: 'হালকা সুতির কুর্তি, অফিস ও বাড়ির জন্য উপযুক্ত।', onSale: true, stock: 40, img: 'https://res.cloudinary.com/dsiccgigh/image/upload/v1/FamilyFashionHub/kurti-white', sortOrder: 1 },
      { name: 'রেয়ন কুর্তি - ফুলেল প্রিন্ট', price: 850, oldPrice: 1000, saving: 150, category: 'kurti', description: 'রঙিন ফুলের প্রিন্টের কুর্তি, ক্যাজুয়াল লুকের জন্য।', onSale: false, featured: true, stock: 35, img: 'https://res.cloudinary.com/dsiccgigh/image/upload/v1/FamilyFashionHub/kurti-floral', sortOrder: 2 },

      // বোরখা ও হিজাব
      { name: 'প্রিমিয়াম আবায়া - কালো', price: 1800, oldPrice: 2200, saving: 400, category: 'borka-hijab', description: 'উচ্চমানের নরম কাপড়ের আবায়া, আরামদায়ক।', onSale: true, featured: true, stock: 25, img: 'https://res.cloudinary.com/dsiccgigh/image/upload/v1/FamilyFashionHub/abaya-black', sortOrder: 1 },
      { name: 'হিজাব সেট (৩ পিস)', price: 450, oldPrice: 600, saving: 150, category: 'borka-hijab', description: 'তিনটি বিভিন্ন রঙের হিজাব একসাথে।', onSale: true, stock: 60, img: 'https://res.cloudinary.com/dsiccgigh/image/upload/v1/FamilyFashionHub/hijab-set', sortOrder: 2 },
      { name: 'ডিজাইনার বোরখা - নেভি ব্লু', price: 2200, oldPrice: 2700, saving: 500, category: 'borka-hijab', description: 'সুন্দর এমব্রয়ডারি কাজের বোরখা।', onSale: false, featured: true, stock: 20, img: 'https://res.cloudinary.com/dsiccgigh/image/upload/v1/FamilyFashionHub/borka-navy', sortOrder: 3 },
    ];

    let productsCreated = 0;
    let productsSkipped = 0;
    for (const prod of productsData) {
      const existing = await Product.findOne({ name: prod.name, category: prod.category });
      if (!existing) {
        await Product.create({ ...prod, isActive: true, images: prod.img ? [{ url: prod.img, publicId: '' }] : [] });
        productsCreated++;
      } else {
        productsSkipped++;
      }
    }

    const catCount = await Category.countDocuments();
    const prodCount = await Product.countDocuments({ isActive: true });

    res.json({
      success: true,
      message: `Seed সম্পন্ন! ${productsCreated} পণ্য তৈরি, ${productsSkipped} টি ইতিমধ্যে ছিল।`,
      stats: { totalCategories: catCount, totalProducts: prodCount, productsCreated, productsSkipped },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Start
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));