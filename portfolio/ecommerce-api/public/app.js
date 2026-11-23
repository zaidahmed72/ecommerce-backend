const state = { products: [], token: sessionStorage.getItem('formaToken') || '', user: null, mode: 'login', toastTimer: null };
const $ = id => document.getElementById(id);
const currency = value => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(value || 0));

async function api(path, options = {}) {
  const headers = { ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...(state.token ? { Authorization: `Bearer ${state.token}` } : {}), ...options.headers };
  const response = await fetch(path, { ...options, headers });
  const data = response.status === 204 ? {} : await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'Something went wrong. Please try again.');
  return data;
}

function toast(message) {
  const node = $('toast'); node.textContent = message; node.classList.add('show');
  clearTimeout(state.toastTimer); state.toastTimer = setTimeout(() => node.classList.remove('show'), 2800);
}

function safeText(value) { return String(value ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]); }

function renderProducts() {
  const query = $('search-input').value.trim().toLowerCase();
  const category = $('category-filter').value;
  const list = state.products.filter(item => (!category || item.category === category) && (!query || `${item.name} ${item.description} ${item.category}`.toLowerCase().includes(query)));
  $('product-grid').innerHTML = list.map((item, index) => `<article class="product-card"><div class="product-art"><span class="product-category">${safeText(item.category)}</span><span class="shape" aria-hidden="true">${String(index + 1).padStart(2, '0')}</span><button class="quick-add" data-add="${safeText(item._id)}" aria-label="Add ${safeText(item.name)} to bag">+</button></div><div class="product-info"><div><h3>${safeText(item.name)}</h3><p>${safeText(item.description || 'A considered everyday essential.')}</p></div><strong>${currency(item.price)}</strong></div></article>`).join('');
  $('empty-state').hidden = list.length > 0;
  $('product-grid').hidden = list.length === 0;
}

async function loadProducts() {
  try {
    const { items } = await api('/api/products?limit=100'); state.products = items;
    const categories = [...new Set(items.map(item => item.category).filter(Boolean))].sort();
    $('category-filter').innerHTML = '<option value="">All categories</option>' + categories.map(value => `<option value="${safeText(value)}">${safeText(value)}</option>`).join('');
    renderProducts();
  } catch { $('product-grid').innerHTML = '<p class="empty-state">We could not reach the catalog. Check that the API is running and try again.</p>'; }
}

async function refreshBag() {
  if (!state.token) { $('bag-count').textContent = '0'; return; }
  try {
    const { cart } = await api('/api/cart'); const items = cart.items || [];
    $('bag-count').textContent = String(items.reduce((sum, line) => sum + line.quantity, 0));
    $('cart-total').textContent = currency(items.reduce((sum, line) => sum + (line.product?.price || 0) * line.quantity, 0));
    $('cart-lines').innerHTML = items.length ? items.filter(line => line.product).map(line => `<div class="cart-line"><div class="cart-thumb" aria-hidden="true">F</div><div><h3>${safeText(line.product.name)}</h3><p>${line.quantity} × ${currency(line.product.price)}</p></div><button class="remove-line" data-remove="${safeText(line.product._id)}" aria-label="Remove ${safeText(line.product.name)}">Remove</button></div>`).join('') : '<p class="cart-empty">Your bag is taking a quiet moment.</p>';
    $('checkout-button').disabled = items.length === 0;
  } catch { $('bag-count').textContent = '0'; }
}

function openCart() { $('overlay').hidden = false; $('cart-panel').classList.add('open'); $('cart-panel').setAttribute('aria-hidden', 'false'); document.body.style.overflow = 'hidden'; refreshBag(); }
function closeCart() { $('cart-panel').classList.remove('open'); $('cart-panel').setAttribute('aria-hidden', 'true'); $('overlay').hidden = true; document.body.style.overflow = ''; }
function openAuth(mode = 'login') { state.mode = mode; const register = mode === 'register'; $('auth-title').textContent = register ? 'Make yourself at home.' : 'Good to see you.'; $('name-field').hidden = !register; $('auth-form').elements.password.autocomplete = register ? 'new-password' : 'current-password'; $('auth-submit').innerHTML = `${register ? 'Create account' : 'Sign in'} <span>→</span>`; $('switch-auth').innerHTML = register ? 'Already have an account? <b>Sign in</b>' : 'New here? <b>Create an account</b>'; $('auth-error').textContent = ''; $('auth-dialog').showModal(); }

document.addEventListener('click', async event => {
  const add = event.target.closest('[data-add]');
  if (add) {
    if (!state.token) return openAuth();
    try { const { cart } = await api('/api/cart'); const existing = cart.items?.find(line => line.product?._id === add.dataset.add); await api('/api/cart/items', { method: 'PUT', body: JSON.stringify({ productId: add.dataset.add, quantity: (existing?.quantity || 0) + 1 }) }); toast('Added to your bag'); await refreshBag(); }
    catch (error) { toast(error.message); }
  }
  const remove = event.target.closest('[data-remove]');
  if (remove) { try { await api(`/api/cart/items/${encodeURIComponent(remove.dataset.remove)}`, { method: 'DELETE' }); await refreshBag(); } catch (error) { toast(error.message); } }
});

$('search-input').addEventListener('input', renderProducts);
$('category-filter').addEventListener('change', renderProducts);
$('bag-button').addEventListener('click', openCart);
document.querySelectorAll('.close-panel').forEach(button => button.addEventListener('click', closeCart));
$('overlay').addEventListener('click', closeCart);
$('account-button').addEventListener('click', () => state.token ? (state.token = '', state.user = null, sessionStorage.removeItem('formaToken'), $('account-button').textContent = 'Sign in', $('bag-count').textContent = '0', toast('You are signed out')) : openAuth());
$('switch-auth').addEventListener('click', () => openAuth(state.mode === 'login' ? 'register' : 'login'));
document.querySelectorAll('.dialog-close').forEach(button => button.addEventListener('click', () => button.closest('dialog').close()));
$('auth-form').addEventListener('submit', async event => {
  event.preventDefault(); $('auth-error').textContent = '';
  const form = new FormData(event.currentTarget); const payload = { email: form.get('email'), password: form.get('password') };
  if (state.mode === 'register') payload.name = form.get('name');
  try {
    const path = state.mode === 'register' ? '/api/auth/register' : '/api/auth/login';
    const result = await api(path, { method: 'POST', body: JSON.stringify(payload) });
    state.token = result.token || ''; state.user = result.user || null;
    if (!state.token && state.mode === 'register') { openAuth(); $('auth-error').textContent = 'Account created. Sign in to continue.'; return; }
    sessionStorage.setItem('formaToken', state.token); $('account-button').textContent = 'Sign out'; $('auth-dialog').close(); toast(`Welcome${state.user?.name ? `, ${state.user.name.split(' ')[0]}` : ''}`); await refreshBag();
  } catch (error) { $('auth-error').textContent = error.message; }
});
$('checkout-button').addEventListener('click', async () => { closeCart(); if (!state.token) return openAuth(); $('checkout-error').textContent = ''; $('checkout-dialog').showModal(); });
$('checkout-form').addEventListener('submit', async event => {
  event.preventDefault(); $('checkout-error').textContent = '';
  try { const shippingAddress = new FormData(event.currentTarget).get('shippingAddress'); const result = await api('/api/orders', { method: 'POST', body: JSON.stringify({ shippingAddress }) }); $('checkout-dialog').close(); event.currentTarget.reset(); toast(`Order placed · ${currency(result.order.total)}`); await refreshBag(); }
  catch (error) { $('checkout-error').textContent = error.message; }
});
$('menu-button').addEventListener('click', event => { const open = $('menu-button').getAttribute('aria-expanded') !== 'true'; $('menu-button').setAttribute('aria-expanded', String(open)); document.querySelector('.desktop-nav').classList.toggle('open', open); });
document.querySelectorAll('.desktop-nav a').forEach(link => link.addEventListener('click', () => { document.querySelector('.desktop-nav').classList.remove('open'); $('menu-button').setAttribute('aria-expanded', 'false'); }));
$('year').textContent = String(new Date().getFullYear());
if (state.token) { $('account-button').textContent = 'Sign out'; }
loadProducts(); refreshBag();
