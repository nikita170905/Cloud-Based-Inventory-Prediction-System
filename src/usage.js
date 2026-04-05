import { normalizeUsageHistory } from './prediction.js';

export function appendUsageEntry(product, usageAmount) {
  const amount = Number(usageAmount);
  const currentStock = Number(product.currentStock || 0);
  const safeAmount = Number.isFinite(amount) ? Math.max(0, amount) : 0;

  const usageHistory = normalizeUsageHistory(product.usageHistory);
  usageHistory.push(safeAmount);

  return {
    usageHistory,
    currentStock: Math.max(0, currentStock - safeAmount)
  };
}
