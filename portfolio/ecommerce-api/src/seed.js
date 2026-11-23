require('dotenv').config();
const mongoose = require('mongoose');
const { Product } = require('./models');

const products = [
  { name: 'Arc Weekend Bag', category: 'Travel', price: 86, stock: 18, description: 'A light, durable carryall designed for short escapes and everyday movement.' },
  { name: 'Form Ceramic Set', category: 'Home', price: 42, stock: 30, description: 'Four hand-finished stoneware cups with a soft, natural glaze.' },
  { name: 'Field Notes Journal', category: 'Stationery', price: 18, stock: 52, description: 'A clothbound notebook made for sketches, plans and passing ideas.' },
  { name: 'Daily Carry Bottle', category: 'Travel', price: 29, stock: 24, description: 'Double-wall stainless steel that keeps drinks cold through the day.' }
];

async function seed() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/zaid_store';
  await mongoose.connect(uri);
  for (const product of products) await Product.updateOne({ name: product.name }, { $setOnInsert: product }, { upsert: true });
  console.log(`Demo catalog ready (${products.length} products; existing records preserved)`);
  await mongoose.disconnect();
}

seed().catch(async error => { console.error('Demo seed failed:', error.message); await mongoose.disconnect(); process.exit(1); });
