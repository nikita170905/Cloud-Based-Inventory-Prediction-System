import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

const chartMap = new Map();

export function destroyUsageChart(productId) {
  const existingChart = chartMap.get(productId);

  if (existingChart) {
    existingChart.destroy();
    chartMap.delete(productId);
  }
}

export function renderUsageChart(productId, usageHistory = []) {
  const canvas = document.querySelector(`[data-chart-id="${productId}"]`);

  if (!canvas) {
    return;
  }

  destroyUsageChart(productId);

  const labels = usageHistory.map((_, index) => `Day ${index + 1}`);

  const chart = new Chart(canvas, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Usage',
          data: usageHistory,
          borderColor: '#0e9363',
          backgroundColor: 'rgba(14, 147, 99, 0.15)',
          fill: true,
          borderWidth: 2,
          tension: 0.35,
          pointRadius: 2,
          pointHoverRadius: 4
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        }
      },
      scales: {
        x: {
          ticks: {
            maxTicksLimit: 8,
            color: '#658373'
          },
          grid: {
            display: false
          }
        },
        y: {
          beginAtZero: true,
          ticks: {
            precision: 0,
            color: '#658373'
          },
          grid: {
            color: 'rgba(64, 110, 86, 0.12)'
          }
        }
      }
    }
  });

  chartMap.set(productId, chart);
}

export function clearAllCharts() {
  chartMap.forEach((chart) => chart.destroy());
  chartMap.clear();
}
