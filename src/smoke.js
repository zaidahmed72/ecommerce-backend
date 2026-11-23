const base = process.env.API_URL || 'http://localhost:4000';

async function request(path, options = {}) {
  const response = await fetch(`${base}${path}`, options);
  const body = await response.json();
  if (!response.ok) throw new Error(`${options.method || 'GET'} ${path}: ${response.status} ${body.error || ''}`);
  return body;
}

async function smoke() {
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const email = `smoke-${suffix}@example.test`;
  await request('/api/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'Smoke Check', email, password: 'correct-horse-battery' }) });
  const { token } = await request('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password: 'correct-horse-battery' }) });
  const auth = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
  const { items } = await request('/api/products?limit=100');
  const product = items.find(item => item.stock > 0);
  if (!product) throw new Error('Demo catalog has no available product');
  await request('/api/cart/items', { method: 'PUT', headers: auth, body: JSON.stringify({ productId: product._id, quantity: 1 }) });
  const { order } = await request('/api/orders', { method: 'POST', headers: auth, body: JSON.stringify({ shippingAddress: '1 Test Street, Test City' }) });
  if (order.total !== product.price || order.items?.[0]?.name !== product.name) throw new Error('Order snapshot did not match the selected product');
  const { cart } = await request('/api/cart', { headers: auth });
  if (cart.items?.length) throw new Error('Checkout did not clear the cart');
  console.log(`E-commerce smoke passed: registration, login, catalog, cart and checkout (${order.total})`);
}

smoke().catch(error => { console.error(error.message); process.exit(1); });
