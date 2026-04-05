import './style.css';
import {
  addDailyUsage,
  addProduct,
  deleteProductsBulk,
  deleteProduct,
  fetchProductsOnce,
  subscribeToProducts,
  updateProductStock
} from './product.js';
import { renderUsageChart, clearAllCharts } from './chart.js';
import { exportProductsReport } from './export.js';

const app = document.querySelector('#app');
const selectedProducts = new Set();

app.innerHTML = `
  <main class="dashboard">
    <header class="hero">
      <div>
        <p class="eyebrow">Cloud-Based Inventory Prediction System</p>
        <h1>Smart Stock Dashboard</h1>
        <p class="hero-copy">
          Track products in Firestore, monitor daily usage, and predict refill timing before stock runs out.
        </p>
      </div>
      <div class="hero-actions">
        <div class="status-chip">Realtime sync: Firestore</div>
        <button id="export-button" class="ghost-btn" type="button">Export Report</button>
      </div>
    </header>

    <section class="panel form-panel">
      <h2>Add Product</h2>
      <form id="add-product-form" class="grid-form">
        <label>
          Product Name
          <input name="name" type="text" placeholder="Example: Rice Bag" required />
        </label>
        <label>
          Category
          <input name="category" type="text" placeholder="Example: Apparel" required />
        </label>
        <label>
          Current Stock
          <input name="currentStock" type="number" min="0" step="1" placeholder="120" required />
        </label>
        <label>
          Minimum Threshold
          <input name="minThreshold" type="number" min="0" step="1" placeholder="20" required />
        </label>
        <button type="submit">Add Product</button>
      </form>
      <p id="form-message" class="form-message" aria-live="polite"></p>
    </section>

    <section class="panel">
      <div class="section-head">
        <h2>Inventory Overview</h2>
        <div class="section-controls">
          <span id="product-count" class="pill">0 Products</span>
          <button id="delete-selected-button" class="danger-btn" type="button" disabled>
            Delete Selected (0)
          </button>
        </div>
      </div>

      <div id="loading-state" class="skeleton-grid"></div>
      <div id="empty-state" class="state empty hidden">
        No products yet. Add your first item to start tracking stock and predictions.
      </div>
      <div id="product-grid" class="product-grid hidden"></div>
    </section>

    <div id="toast-root" class="toast-root" aria-live="polite" aria-atomic="true"></div>
  </main>
`;

const addProductForm = document.querySelector('#add-product-form');
const formMessage = document.querySelector('#form-message');
const productGrid = document.querySelector('#product-grid');
const loadingState = document.querySelector('#loading-state');
const emptyState = document.querySelector('#empty-state');
const productCount = document.querySelector('#product-count');
const deleteSelectedButton = document.querySelector('#delete-selected-button');
const exportButton = document.querySelector('#export-button');
const toastRoot = document.querySelector('#toast-root');

function renderSkeletonCards(count = 6) {
  loadingState.innerHTML = Array.from({ length: count })
    .map(
      () => `
        <article class="skeleton-card">
          <div class="skeleton-line large"></div>
          <div class="skeleton-line medium"></div>
          <div class="skeleton-metric-grid">
            <div class="skeleton-line small"></div>
            <div class="skeleton-line small"></div>
            <div class="skeleton-line small"></div>
            <div class="skeleton-line small"></div>
          </div>
          <div class="skeleton-line medium"></div>
          <div class="skeleton-line medium"></div>
        </article>
      `
    )
    .join('');
}

renderSkeletonCards();

function formatNumber(value) {
  return Number(value).toFixed(2).replace(/\.00$/, '');
}

function formatRemainingDays(days) {
  if (!Number.isFinite(days)) {
    return 'No usage data';
  }

  return `${formatNumber(days)} days`;
}

function showMessage(text, tone = 'info') {
  formMessage.textContent = text;
  formMessage.dataset.tone = tone;
}

function showToast(text, tone = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast ${tone}`;
  toast.textContent = text;
  toastRoot.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('fade-out');
    setTimeout(() => {
      toast.remove();
    }, 220);
  }, 2200);
}

function syncBulkDeleteButton() {
  const selectedCount = selectedProducts.size;
  deleteSelectedButton.textContent = `Delete Selected (${selectedCount})`;
  deleteSelectedButton.disabled = selectedCount === 0;
}

function renderProducts(products) {
  selectedProducts.forEach((selectedId) => {
    const exists = products.some((product) => product.id === selectedId);
    if (!exists) {
      selectedProducts.delete(selectedId);
    }
  });

  productCount.textContent = `${products.length} Product${products.length === 1 ? '' : 's'}`;
  syncBulkDeleteButton();

  if (!products.length) {
    emptyState.classList.remove('hidden');
    productGrid.classList.add('hidden');
    productGrid.innerHTML = '';
    clearAllCharts();
    return;
  }

  emptyState.classList.add('hidden');
  productGrid.classList.remove('hidden');

  productGrid.innerHTML = products
    .map((product, index) => {
      const alertClass = `alert-${product.alert.tone}`;

      return `
        <article class="product-card" style="animation-delay:${index * 40}ms">
          <label class="select-row">
            <input
              type="checkbox"
              data-action="select"
              data-id="${product.id}"
              ${selectedProducts.has(product.id) ? 'checked' : ''}
            />
            Select
          </label>

          <div class="card-head">
            <div>
              <h3>${product.name}</h3>
              <p class="category">${product.category || 'General'}</p>
            </div>
            <span class="alert ${alertClass}">${product.alert.label}</span>
          </div>

          <div class="metrics">
            <div>
              <p>Current Stock</p>
              <strong>${formatNumber(product.currentStock)}</strong>
            </div>
            <div>
              <p>Weighted Avg Usage</p>
              <strong>${formatNumber(product.weightedAverageUsage)} / day</strong>
            </div>
            <div>
              <p>Days Left</p>
              <strong>${formatRemainingDays(product.remainingDays)}</strong>
            </div>
            <div>
              <p>Min Threshold</p>
              <strong>${formatNumber(product.minThreshold)}</strong>
            </div>
          </div>

          <div class="chart-wrap">
            <canvas data-chart-id="${product.id}"></canvas>
          </div>

          <div class="actions">
            <form class="inline-form" data-action="usage" data-id="${product.id}">
              <input name="usage" type="number" min="0" step="1" placeholder="Daily usage" required />
              <button type="submit">Add Usage</button>
            </form>

            <form class="inline-form" data-action="stock" data-id="${product.id}">
              <input name="stock" type="number" min="0" step="1" placeholder="Set stock" required />
              <button type="submit">Update Stock</button>
            </form>

            <button class="delete-btn" data-action="delete" data-id="${product.id}">Delete Product</button>
          </div>
        </article>
      `;
    })
    .join('');

  products.forEach((product) => {
    const chartData = product.usageHistory.slice(-30);
    renderUsageChart(product.id, chartData);
  });
}

addProductForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const formData = new FormData(addProductForm);

  const name = formData.get('name');
  const category = formData.get('category');
  const currentStock = Number(formData.get('currentStock'));
  const minThreshold = Number(formData.get('minThreshold'));

  try {
    await addProduct({ name, category, currentStock, minThreshold });
    addProductForm.reset();
    showMessage('Product added successfully.', 'success');
    showToast('Product added.', 'success');
  } catch (error) {
    showMessage(error.message || 'Failed to add product.', 'error');
    showToast(error.message || 'Failed to add product.', 'error');
  }
});

productGrid.addEventListener('submit', async (event) => {
  event.preventDefault();
  const form = event.target;
  const action = form.dataset.action;
  const productId = form.dataset.id;
  const formData = new FormData(form);

  try {
    if (action === 'usage') {
      const usage = Number(formData.get('usage'));
      await addDailyUsage(productId, usage);
      form.reset();
      showMessage('Usage recorded.', 'success');
      showToast('Usage updated.', 'success');
    }

    if (action === 'stock') {
      const stock = Number(formData.get('stock'));
      await updateProductStock(productId, stock);
      form.reset();
      showMessage('Stock updated.', 'success');
      showToast('Stock updated.', 'success');
    }
  } catch (error) {
    showMessage(error.message || 'Action failed.', 'error');
    showToast(error.message || 'Action failed.', 'error');
  }
});

productGrid.addEventListener('change', (event) => {
  const target = event.target;

  if (target.dataset.action !== 'select') {
    return;
  }

  if (target.checked) {
    selectedProducts.add(target.dataset.id);
  } else {
    selectedProducts.delete(target.dataset.id);
  }

  syncBulkDeleteButton();
});

productGrid.addEventListener('click', async (event) => {
  const target = event.target;

  if (target.dataset.action !== 'delete') {
    return;
  }

  try {
    await deleteProduct(target.dataset.id);
    showMessage('Product deleted.', 'success');
    showToast('Product deleted.', 'success');
  } catch (error) {
    showMessage(error.message || 'Unable to delete product.', 'error');
    showToast(error.message || 'Unable to delete product.', 'error');
  }
});

deleteSelectedButton.addEventListener('click', async () => {
  const ids = [...selectedProducts];

  if (!ids.length) {
    return;
  }

  try {
    await deleteProductsBulk(ids);
    selectedProducts.clear();
    syncBulkDeleteButton();
    showToast('Selected products deleted.', 'success');
  } catch (error) {
    showToast(error.message || 'Bulk delete failed.', 'error');
  }
});

exportButton.addEventListener('click', async () => {
  try {
    await exportProductsReport();
    showToast('CSV report exported.', 'success');
  } catch (error) {
    showToast(error.message || 'Export failed.', 'error');
  }
});

subscribeToProducts(
  (products) => {
    loadingState.classList.add('hidden');
    console.log('[ui] Rendering products from Firestore:', products.map((item) => item.name).slice(0, 5));
    renderProducts(products);
  },
  (error) => {
    loadingState.classList.remove('hidden');
    loadingState.innerHTML = `<div class="state empty">Failed to load products: ${error.message}</div>`;
  }
);

fetchProductsOnce()
  .then((products) => {
    console.log('[ui] Initial fetch after app start:', products.map((item) => item.name).slice(0, 5));
  })
  .catch((error) => {
    console.error('[ui] Initial fetch failed:', error);
  });
