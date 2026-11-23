require('dotenv').config();
const mongoose = require('mongoose');
const app = require('./app');

const port = Number(process.env.PORT || 4000);
async function start() {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) throw new Error('JWT_SECRET must contain at least 32 characters');
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/zaid_store', { serverSelectionTimeoutMS: 10000 });
  const server = app.listen(port, () => console.log(`E-commerce API listening on ${port}`));
  const shutdown = async signal => { console.log(`${signal}: shutting down`); server.close(async () => { await mongoose.disconnect(); process.exit(0); }); setTimeout(() => process.exit(1), 10000).unref(); };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}
start().catch(error => { console.error('Startup failed:', error.message); process.exit(1); });
