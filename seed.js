import fs from 'node:fs';
import path from 'node:path';
import Papa from 'papaparse';
import { initializeApp } from 'firebase/app';
import {
  addDoc,
  collection,
  deleteDoc,
  getDocs,
  getFirestore
} from 'firebase/firestore/lite';

// One-time script: run manually with `npm run seed`.
// You can change SAMPLE_SIZE by passing a number, e.g. `npm run seed -- 50`.
const SAMPLE_SIZE = Math.min(Math.max(Number(process.argv[2] || 40), 30), 50);

// Keep this in sync with src/firebase.js.
const firebaseConfig = {
  apiKey: 'AIzaSyBixhApLvbn-sLNUVKXIl2_WxZAiEQFx7s',
  authDomain: 'inventory-predictor-2c4a3.firebaseapp.com',
  projectId: 'inventory-predictor-2c4a3',
  storageBucket: 'inventory-predictor-2c4a3.firebasestorage.app',
  messagingSenderId: '1007685266706',
  appId: '1:1007685266706:web:79e9de1dcec38d70c317cb',
  measurementId: 'G-KGNKVBQSBC'
};

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateUsageHistory(days = 30) {
  const history = [];
  const base = randomInt(2, 7);
  const trend = Math.random() < 0.5 ? -0.05 : 0.07;

  for (let day = 0; day < days; day += 1) {
    const noise = (Math.random() - 0.5) * 2.2;
    const value = Math.max(1, Math.round(base + day * trend + noise));
    history.push(value);
  }

  return history;
}

function mapRowToProduct(row) {
  const rawName = String(
    row.product_name || row.name || row.Deatils || row.Details || row.ProductName || row.Title || ''
  ).trim();
  const brandName = String(row.BrandName || '').trim();
  const category = String(row.category || row.Category || 'General').trim() || 'General';

  let name = rawName;

  if (!name && brandName) {
    name = `${brandName} product`;
  }

  if (!name) {
    return null;
  }

  return {
    name,
    category,
    currentStock: randomInt(50, 200),
    minThreshold: randomInt(10, 30),
    usageHistory: generateUsageHistory(30),
    createdAt: new Date()
  };
}

function resolveDatasetPath() {
  const candidateNames = ['FashionDatset.csv', 'FashionDataset.csv'];

  for (const fileName of candidateNames) {
    const candidatePath = path.resolve(process.cwd(), fileName);
    if (fs.existsSync(candidatePath)) {
      return candidatePath;
    }
  }

  throw new Error(
    'Dataset file not found. Expected either FashionDatset.csv or FashionDataset.csv in project root.'
  );
}

async function clearProductsCollection(db) {
  const snapshot = await getDocs(collection(db, 'products'));

  console.log(`[seed] Existing docs before cleanup: ${snapshot.size}`);

  for (const item of snapshot.docs) {
    await deleteDoc(item.ref);
  }

  console.log(`[seed] Cleanup complete. Deleted ${snapshot.size} existing docs.`);
}

async function runSeed() {
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);

  const csvPath = resolveDatasetPath();
  const csvRaw = fs.readFileSync(csvPath, 'utf8');

  console.log(`[seed] CSV file loaded from: ${csvPath}`);
  console.log(`[seed] CSV size: ${csvRaw.length} characters`);

  const parsed = Papa.parse(csvRaw, {
    header: true,
    skipEmptyLines: true
  });

  console.log(`[seed] Parsed rows: ${parsed.data.length}`);

  if (parsed.errors.length > 0) {
    console.error('CSV parse error:', parsed.errors[0]);
    process.exit(1);
  }

  const mappedProducts = parsed.data
    .map(mapRowToProduct)
    .filter(Boolean)
    .slice(0, SAMPLE_SIZE);

  if (!mappedProducts.length) {
    console.error('No valid rows found to seed.');
    process.exit(1);
  }

  await clearProductsCollection(db);

  console.log(`[seed] Ready to insert ${mappedProducts.length} products into Firestore.`);
  console.log('[seed] Sample product names:', mappedProducts.slice(0, 5).map((item) => item.name));

  let inserted = 0;

  for (const product of mappedProducts) {
    await addDoc(collection(db, 'products'), product);
    inserted += 1;
  }

  console.log(`[seed] Seed completed. Inserted ${inserted} products.`);

  const afterSeedSnapshot = await getDocs(collection(db, 'products'));
  console.log(`[seed] Firestore products after seed: ${afterSeedSnapshot.size}`);
}

runSeed().catch((error) => {
  console.error('Seed failed:', error);
  process.exit(1);
});
