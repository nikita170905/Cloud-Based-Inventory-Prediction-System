import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  serverTimestamp,
  updateDoc,
  writeBatch
} from 'firebase/firestore';
import { db } from './firebase.js';
import {
  calculateWeightedAverageUsage,
  calculateRemainingDays,
  getAlertStatus,
  normalizeUsageHistory
} from './prediction.js';
import { appendUsageEntry } from './usage.js';

const productsCollection = collection(db, 'products');

function toProductView(rawProduct) {
  const usageHistory = normalizeUsageHistory(rawProduct.usageHistory);
  const weightedAverageUsage = calculateWeightedAverageUsage(usageHistory);
  const remainingDays = calculateRemainingDays(rawProduct.currentStock, weightedAverageUsage);
  const alert = getAlertStatus(rawProduct.currentStock, rawProduct.minThreshold, remainingDays);

  return {
    ...rawProduct,
    usageHistory,
    weightedAverageUsage,
    remainingDays,
    alert
  };
}

export async function addProduct({ name, category, currentStock, minThreshold }) {
  const trimmedName = String(name || '').trim();
  const trimmedCategory = String(category || 'General').trim();

  if (!trimmedName) {
    throw new Error('Product name is required.');
  }

  await addDoc(productsCollection, {
    name: trimmedName,
    category: trimmedCategory || 'General',
    currentStock: Number(currentStock),
    minThreshold: Number(minThreshold),
    usageHistory: [],
    createdAt: serverTimestamp()
  });
}

export async function deleteProduct(productId) {
  await deleteDoc(doc(db, 'products', productId));
}

export async function updateProductStock(productId, nextStock) {
  await updateDoc(doc(db, 'products', productId), {
    currentStock: Math.max(0, Number(nextStock))
  });
}

export async function deleteProductsBulk(productIds = []) {
  if (!Array.isArray(productIds) || productIds.length === 0) {
    return;
  }

  const batch = writeBatch(db);

  productIds.forEach((productId) => {
    batch.delete(doc(db, 'products', productId));
  });

  await batch.commit();
}

export async function addDailyUsage(productId, usageAmount) {
  const productRef = doc(db, 'products', productId);
  const snapshot = await getDoc(productRef);

  if (!snapshot.exists()) {
    throw new Error('Product not found.');
  }

  const product = snapshot.data();
  const nextData = appendUsageEntry(product, usageAmount);

  await updateDoc(productRef, nextData);
}

export async function fetchProductsOnce() {
  const snapshot = await getDocs(productsCollection);
  const products = snapshot.docs.map((item) => {
    const data = item.data();

    return toProductView({
      id: item.id,
      name: data.name || 'Unknown Product',
      category: data.category || 'General',
      currentStock: Number(data.currentStock || 0),
      minThreshold: Number(data.minThreshold || 0),
      usageHistory: normalizeUsageHistory(data.usageHistory),
      createdAt: data.createdAt || null
    });
  });

  products.sort((a, b) => {
    const left = a.createdAt?.seconds || 0;
    const right = b.createdAt?.seconds || 0;
    return right - left;
  });

  console.log('[ui] Firestore fetch (getDocs) count:', products.length);
  return products;
}

export function subscribeToProducts(onChange, onError) {
  return onSnapshot(
    productsCollection,
    (snapshot) => {
      const products = snapshot.docs.map((item) => {
        const data = item.data();

        return toProductView({
          id: item.id,
          name: data.name || 'Unknown Product',
          category: data.category || 'General',
          currentStock: Number(data.currentStock || 0),
          minThreshold: Number(data.minThreshold || 0),
          usageHistory: normalizeUsageHistory(data.usageHistory),
          createdAt: data.createdAt || null
        });
      });

      // Show latest created products first when timestamp is available.
      products.sort((a, b) => {
        const left = a.createdAt?.seconds || 0;
        const right = b.createdAt?.seconds || 0;
        return right - left;
      });

      console.log('[ui] Firestore realtime update count:', products.length);

      onChange(products);
    },
    (error) => {
      if (typeof onError === 'function') {
        onError(error);
      }
    }
  );
}
