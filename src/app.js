const express = require('express');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const router = require('./routes');
const { errors } = require('./middleware');

const app = express();
app.disable('x-powered-by');
app.use(helmet());
app.use(compression());
app.use(express.json({ limit: '32kb' }));
app.use('/api', rateLimit({ windowMs: 15 * 60 * 1000, limit: 300, standardHeaders: 'draft-8', legacyHeaders: false }));
app.get('/health/live', (req, res) => res.json({ status: 'ok', service: 'ecommerce-api' }));
app.use('/api', router);
app.use((req, res) => res.status(404).json({ error: 'Route not found' }));
app.use(errors);
module.exports = app;
