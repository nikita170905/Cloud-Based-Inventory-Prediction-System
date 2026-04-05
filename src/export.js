import { collection, getDocs } from 'firebase/firestore';
import { db } from './firebase.js';
import {
  calculateRemainingDays,
  calculateWeightedAverageUsage,
  getAlertStatus,
  normalizeUsageHistory
} from './prediction.js';

function csvEscape(value) {
  const safeValue = String(value ?? '');

  if (safeValue.includes(',') || safeValue.includes('"') || safeValue.includes('\n')) {
    return `"${safeValue.replaceAll('"', '""')}"`;
  }

  return safeValue;
}

export async function exportProductsReport() {
  const snapshot = await getDocs(collection(db, 'products'));

  const headers = [
    'Name',
    'Category',
    'Stock',
    'Weighted Avg Usage',
    'Remaining Days',
    'Alert Status'
  ];

  const rows = snapshot.docs.map((item) => {
    const data = item.data();
    const usageHistory = normalizeUsageHistory(data.usageHistory);
    const weightedAverageUsage = calculateWeightedAverageUsage(usageHistory);
    const remainingDays = calculateRemainingDays(data.currentStock, weightedAverageUsage);
    const alert = getAlertStatus(data.currentStock, data.minThreshold, remainingDays);

    return [
      data.name || 'Untitled Product',
      data.category || 'General',
      Number(data.currentStock || 0),
      Number(weightedAverageUsage.toFixed(2)),
      Number.isFinite(remainingDays) ? Number(remainingDays.toFixed(2)) : 'No usage data',
      alert.label
    ];
  });

  const csvContent = [headers, ...rows]
    .map((row) => row.map((cell) => csvEscape(cell)).join(','))
    .join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = `inventory-report-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
