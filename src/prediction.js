export function normalizeUsageHistory(usageHistory = []) {
  if (!Array.isArray(usageHistory)) {
    return [];
  }

  return usageHistory
    .map((item) => {
      if (typeof item === 'number') {
        return item;
      }

      if (item && typeof item === 'object') {
        return Number(item.amount || 0);
      }

      return Number(item || 0);
    })
    .filter((item) => Number.isFinite(item) && item >= 0);
}

export function calculateWeightedAverageUsage(usageHistory = []) {
  const normalizedUsage = normalizeUsageHistory(usageHistory);

  if (!normalizedUsage.length) {
    return 0;
  }

  let weightedSum = 0;
  let totalWeight = 0;

  normalizedUsage.forEach((usage, index) => {
    const weight = index + 1;
    weightedSum += usage * weight;
    totalWeight += weight;
  });

  if (totalWeight === 0) {
    return 0;
  }

  return weightedSum / totalWeight;
}

export function calculateRemainingDays(currentStock, weightedAverageUsage) {
  const stock = Number(currentStock || 0);

  if (weightedAverageUsage <= 0) {
    return Infinity;
  }

  return stock / weightedAverageUsage;
}

export function getAlertStatus(currentStock, minThreshold, remainingDays) {
  if (Number(currentStock) < Number(minThreshold)) {
    return {
      label: 'Low Stock',
      tone: 'warning'
    };
  }

  if (remainingDays < 3) {
    return {
      label: 'Urgent Refill',
      tone: 'danger'
    };
  }

  return {
    label: 'Healthy',
    tone: 'ok'
  };
}
