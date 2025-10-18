import React, { useEffect, useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import './EarningsChart.css';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const EarningsChart = ({ earningsData, chartType = 'line' }) => {
  // Default data if none provided
  const defaultData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    daily: [450, 520, 380, 670, 590, 720, 650],
    weekly: [2500, 2800, 3200, 2900],
    monthly: [12000, 13500, 14200, 15800, 14900, 16200]
  };

  const data = earningsData || defaultData;

  // Line chart configuration
  const lineChartData = {
    labels: data.labels,
    datasets: [
      {
        label: 'Earnings (₹)',
        data: data.daily || data.weekly || data.monthly,
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.4,
        fill: true,
        pointRadius: 5,
        pointHoverRadius: 7,
        pointBackgroundColor: 'rgb(75, 192, 192)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
      }
    ]
  };

  // Bar chart configuration
  const barChartData = {
    labels: data.labels,
    datasets: [
      {
        label: 'Earnings (₹)',
        data: data.daily || data.weekly || data.monthly,
        backgroundColor: [
          'rgba(255, 99, 132, 0.7)',
          'rgba(54, 162, 235, 0.7)',
          'rgba(255, 206, 86, 0.7)',
          'rgba(75, 192, 192, 0.7)',
          'rgba(153, 102, 255, 0.7)',
          'rgba(255, 159, 64, 0.7)',
          'rgba(99, 255, 132, 0.7)',
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)',
          'rgba(255, 159, 64, 1)',
          'rgba(99, 255, 132, 1)',
        ],
        borderWidth: 2,
        borderRadius: 8,
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: {
          font: {
            size: 14,
            weight: 'bold'
          },
          color: '#333',
          padding: 15
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleFont: {
          size: 14,
          weight: 'bold'
        },
        bodyFont: {
          size: 13
        },
        padding: 12,
        cornerRadius: 8,
        callbacks: {
          label: function(context) {
            return `Earnings: ₹${context.parsed.y.toFixed(2)}`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            return '₹' + value;
          },
          font: {
            size: 12
          },
          color: '#666'
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
          drawBorder: false
        }
      },
      x: {
        ticks: {
          font: {
            size: 12
          },
          color: '#666'
        },
        grid: {
          display: false
        }
      }
    }
  };

  return (
    <div className="earnings-chart-container">
      <div className="chart-wrapper">
        {chartType === 'line' ? (
          <Line data={lineChartData} options={options} />
        ) : (
          <Bar data={barChartData} options={options} />
        )}
      </div>
    </div>
  );
};

export default EarningsChart;
