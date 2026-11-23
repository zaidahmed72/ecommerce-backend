const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User, Product, Cart, Order } = require('./models');
const { asyncRoute, authenticate, authorize } = require('./middleware');

const router = express.Router();
const safeUser = user => ({ id: user._id, name: user.name, email: user.email, role: user.role });
const requireFields = (...fields) => (req, res, next) => {
  const missing = fields.filter(field => req.body[field] === undefined || req.body[field] === '');
  return missing.length ? res.status(400).json({ error: `Required fields: ${missing.join(', ')}` }) : next();
};

router.post('/auth/register', requireFields('name', 'email', 'password'), asyncRoute(async (req, res) => {
  const { name, email, password } = req.body;
  if (!/^\S+@\S+\.\S+$/.test(email)) return res.status(400).json({ error: 'Enter a valid email address' });
  if (typeof password !== 'string' || password.length < 10) return res.status(400).json({ error: 'Password must be at least 10 characters' });
  if (await User.exists({ email: email.toLowerCase() })) return res.status(409).json({ error: 'Email is already registered' });
  const user = await User.create({ name, email, passwordHash: await bcrypt.hash(password, 12) });
  res.status(201).json({ user: safeUser(user) });
}));

router.post('/auth/login', requireFields('email', 'password'), asyncRoute(async (req, res) => {
  const user = await User.findOne({ email: String(req.body.email).toLowerCase() }).select('+passwordHash');
  if (!user || !await bcrypt.compare(req.body.password, user.passwordHash)) return res.status(401).json({ error: 'Email or password is incorrect' });
  const token = jwt.sign({ sub: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '1h', issuer: 'zaid-ecommerce-api', audience: 'zaid-ecommerce-client' });
  res.json({ token, tokenType: 'Bearer', expiresIn: process.env.JWT_EXPIRES_IN || '1h', user: safeUser(user) });
}));
router.get('/auth/me', authenticate, asyncRoute(async (req, res) => {
  const user = await User.findById(req.auth.sub);
  if (!user) return res.status(401).json({ error: 'Account no longer exists' });
  res.json({ user: safeUser(user) });
}));

router.get('/products', asyncRoute(async (req, res) => {
  const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit, 10) || 20));
  const filter = { active: true };
  if (req.query.category) filter.category = String(req.query.category).slice(0, 100);
  if (req.query.q) filter.$text = { $search: String(req.query.q).slice(0, 100) };
  const [items, total] = await Promise.all([Product.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit), Product.countDocuments(filter)]);
  res.json({ items, page, limit, total, pages: Math.ceil(total / limit) });
}));
router.get('/products/:id', asyncRoute(async (req, res) => {
  const item = await Product.findOne({ _id: req.params.id, active: true });
  if (!item) return res.status(404).json({ error: 'Product not found' });
  res.json({ item });
}));
router.post('/products', authenticate, authorize('admin'), requireFields('name', 'price'), asyncRoute(async (req, res) => {
  const item = await Product.create({ name: req.body.name, description: req.body.description, price: req.body.price, category: req.body.category, imageUrl: req.body.imageUrl, stock: req.body.stock });
  res.status(201).json({ item });
}));
router.patch('/products/:id', authenticate, authorize('admin'), asyncRoute(async (req, res) => {
  const allowed = ['name', 'description', 'price', 'category', 'imageUrl', 'stock', 'active'];
  const updates = Object.fromEntries(Object.entries(req.body).filter(([key]) => allowed.includes(key)));
  const item = await Product.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
  if (!item) return res.status(404).json({ error: 'Product not found' });
  res.json({ item });
}));
router.delete('/products/:id', authenticate, authorize('admin'), asyncRoute(async (req, res) => {
  const item = await Product.findByIdAndUpdate(req.params.id, { active: false }, { new: true });
  if (!item) return res.status(404).json({ error: 'Product not found' });
  res.json({ item });
}));

router.get('/cart', authenticate, asyncRoute(async (req, res) => {
  const cart = await Cart.findOne({ user: req.auth.sub }).populate('items.product');
  res.json({ cart: cart || { items: [] } });
}));
router.put('/cart/items', authenticate, requireFields('productId', 'quantity'), asyncRoute(async (req, res) => {
  const quantity = Number(req.body.quantity);
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) return res.status(400).json({ error: 'Quantity must be an integer from 1 to 99' });
  const product = await Product.findOne({ _id: req.body.productId, active: true });
  if (!product) return res.status(404).json({ error: 'Product not found' });
  if (quantity > product.stock) return res.status(409).json({ error: 'Requested quantity exceeds available stock' });
  const cart = await Cart.findOneAndUpdate({ user: req.auth.sub }, { $setOnInsert: { user: req.auth.sub } }, { new: true, upsert: true });
  const line = cart.items.find(item => item.product.equals(product._id));
  if (line) line.quantity = quantity; else cart.items.push({ product: product._id, quantity });
  await cart.save(); await cart.populate('items.product');
  res.json({ cart });
}));
router.delete('/cart/items/:productId', authenticate, asyncRoute(async (req, res) => {
  const cart = await Cart.findOne({ user: req.auth.sub });
  if (!cart) return res.status(404).json({ error: 'Cart not found' });
  cart.items = cart.items.filter(item => !item.product.equals(req.params.productId));
  await cart.save(); res.json({ cart });
}));

router.post('/orders', authenticate, requireFields('shippingAddress'), asyncRoute(async (req, res) => {
  const cart = await Cart.findOne({ user: req.auth.sub }).populate('items.product');
  if (!cart?.items.length) return res.status(400).json({ error: 'Cart is empty' });
  const active = cart.items.filter(i => i.product?.active);
  if (active.length !== cart.items.length) return res.status(409).json({ error: 'Cart contains an unavailable product; update your cart' });
  const session = await Order.startSession();
  let order;
  try {
    await session.withTransaction(async () => {
      for (const line of active) {
        const updated = await Product.findOneAndUpdate({ _id: line.product._id, active: true, stock: { $gte: line.quantity } }, { $inc: { stock: -line.quantity } }, { new: true, session });
        if (!updated) { const e = new Error(`Insufficient stock for ${line.product.name}`); e.status = 409; throw e; }
      }
      const items = active.map(line => ({ product: line.product._id, name: line.product.name, unitPrice: line.product.price, quantity: line.quantity }));
      const [created] = await Order.create([{ user: req.auth.sub, items, total: Number(items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0).toFixed(2)), shippingAddress: req.body.shippingAddress }], { session });
      order = created;
      cart.items = []; await cart.save({ session });
    });
  } finally { await session.endSession(); }
  res.status(201).json({ order });
}));
router.get('/orders', authenticate, asyncRoute(async (req, res) => {
  const filter = req.auth.role === 'admin' ? {} : { user: req.auth.sub };
  res.json({ orders: await Order.find(filter).sort({ createdAt: -1 }).limit(100) });
}));
router.patch('/orders/:id/status', authenticate, authorize('admin'), requireFields('status'), asyncRoute(async (req, res) => {
  if (!['paid', 'shipped', 'cancelled'].includes(req.body.status)) return res.status(400).json({ error: 'Status must be paid, shipped, or cancelled' });
  const order = await Order.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true, runValidators: true });
  if (!order) return res.status(404).json({ error: 'Order not found' });
  res.json({ order });
}));

module.exports = router;
