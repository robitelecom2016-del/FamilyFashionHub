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
];
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(null, true); // allow all for now, restrict in production
  },
  credentials: true,
}));
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
app.post('/api/orders', async (req, res) => {
  try {
    const { customerName, customerPhone, customerAddress, deliveryArea, items, subtotal, total, notes } = req.body;
    if (!customerName || !customerPhone || !customerAddress || !items || !items.length)
      return res.status(400).json({ success: false, message: 'Required fields missing' });

    const orderId = generateOrderId();
    const order = await Order.create({
      orderId, customerName, customerPhone, customerAddress,
      deliveryArea: deliveryArea || 'inside',
      deliveryCharge: deliveryArea === 'outside' ? 120 : 60,
      items, subtotal, total, notes: notes || '',
      statusHistory: [{ status: 'pending', note: 'Order placed' }],
    });
    res.json({ success: true, data: { orderId: order.orderId, _id: order._id }, message: 'Order placed successfully' });
  } catch (err) {
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

// Start
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));