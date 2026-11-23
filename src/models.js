const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 100 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
  passwordHash: { type: String, required: true, select: false },
  role: { type: String, enum: ['customer', 'admin'], default: 'customer' }
}, { timestamps: true });

const productSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 160, index: true },
  description: { type: String, default: '', maxlength: 4000 },
  price: { type: Number, required: true, min: 0 },
  imageUrl: { type: String, default: '' },
  category: { type: String, default: 'General', trim: true, index: true },
  stock: { type: Number, default: 0, min: 0 },
  active: { type: Boolean, default: true, index: true }
}, { timestamps: true });
productSchema.index({ name: 'text', description: 'text' });

const cartSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', unique: true, required: true },
  items: [{ product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true }, quantity: { type: Number, min: 1, required: true } }]
}, { timestamps: true });

const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  items: [{ product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' }, name: String, unitPrice: Number, quantity: Number }],
  total: { type: Number, required: true, min: 0 },
  status: { type: String, enum: ['pending', 'paid', 'shipped', 'cancelled'], default: 'pending', index: true },
  shippingAddress: { type: String, required: true, maxlength: 500 }
}, { timestamps: true });

module.exports = {
  User: mongoose.model('User', userSchema), Product: mongoose.model('Product', productSchema),
  Cart: mongoose.model('Cart', cartSchema), Order: mongoose.model('Order', orderSchema)
};
