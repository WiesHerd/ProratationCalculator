
import { PercentileResult } from '../types/percentile-types';
import { formatCurrency } from '../../../lib/format';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface PercentileResultsProps {
  result: PercentileResult;
  mode: 'tcc' | 'wrvu';
}

export function PercentileResults({ result, mode }: PercentileResultsProps) {
  const formatValue = (value: number) => {
    if (mode === 'tcc') {
      return formatCurrency(value);
    } else {
      return `${value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} wRVUs`;
    }
  };

  const p25 = result.marketData.percentiles.p25 * (result.marketData.userFte || 1.0);
  const p50 = result.marketData.percentiles.p50 * (result.marketData.userFte || 1.0);
  const p75 = result.marketData.percentiles.p75 * (result.marketData.userFte || 1.0);
  const p90 = result.marketData.percentiles.p90 * (result.marketData.userFte || 1.0);
  const currentValue = result.currentValue;

  // Create market data line
  const marketData = [
    { percentile: 25, value: p25 },
    { percentile: 50, value: p50 },
    { percentile: 75, value: p75 },
    { percentile: 90, value: p90 }
  ];

  // Add current value point if it's within the range
  const allData = [...marketData];
  if (currentValue >= p25 && currentValue <= p90) {
    // Calculate approximate percentile for current value
    let currentPercentile = 25;
    if (currentValue > p75) {
      currentPercentile = 75 + ((currentValue - p75) / (p90 - p75)) * 15; // 75-90 range
    } else if (currentValue > p50) {
      currentPercentile = 50 + ((currentValue - p50) / (p75 - p50)) * 25; // 50-75 range
    } else if (currentValue > p25) {
      currentPercentile = 25 + ((currentValue - p25) / (p50 - p25)) * 25; // 25-50 range
    }
    allData.push({ percentile: currentPercentile, value: currentValue });
  }

  // Sort by percentile for proper line drawing
  allData.sort((a, b) => a.percentile - b.percentile);

  const chartData = {
    labels: allData.map(d => `${d.percentile.toFixed(0)}th`),
    datasets: [
      {
        label: 'Market Data',
        data: allData.map(d => d.value),
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: allData.map(d => 
          d.value === currentValue ? '#dc2626' : '#3b82f6'
        ),
        pointBorderColor: allData.map(d => 
          d.value === currentValue ? '#dc2626' : '#3b82f6'
        ),
        pointRadius: allData.map(d => 
          d.value === currentValue ? 8 : 6
        ),
        pointHoverRadius: allData.map(d => 
          d.value === currentValue ? 10 : 8
        ),
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: '#3b82f6',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: false,
        callbacks: {
          title: (context: any) => {
            const dataIndex = context[0].dataIndex;
            const data = allData[dataIndex];
            return `${data.percentile.toFixed(0)}th Percentile`;
          },
          label: (context: any) => {
            const value = context.parsed.y;
            return formatValue(value);
          }
        }
      }
    },
    scales: {
      x: {
        type: 'category' as const,
        grid: {
          color: '#e5e7eb',
          drawBorder: false
        },
        ticks: {
          color: '#6b7280',
          font: {
            size: 12,
            weight: 'normal' as const
          }
        },
        title: {
          display: true,
          text: 'Market Percentile',
          color: '#374151',
          font: {
            size: 14,
            weight: 'bold' as const
          }
        }
      },
      y: {
        type: 'linear' as const,
        grid: {
          color: '#e5e7eb',
          drawBorder: false
        },
        ticks: {
          color: '#6b7280',
          font: {
            size: 12,
            weight: 'normal' as const
          },
          callback: (value: any) => formatValue(value)
        },
        title: {
          display: true,
          text: mode === 'tcc' ? 'Total Cash Compensation' : 'wRVUs',
          color: '#374151',
          font: {
            size: 14,
            weight: 'bold' as const
          }
        }
      }
    },
    interaction: {
      intersect: false,
      mode: 'index' as const
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Market Data Graph */}
      <div style={{ 
        padding: '24px',
        backgroundColor: '#ffffff',
        borderRadius: '8px',
        border: '1px solid #e5e7eb',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{
          fontSize: '16px',
          fontWeight: '600',
          color: '#111827',
          marginBottom: '20px',
          textAlign: 'center'
        }}>
          Market Data: {result.marketData.specialty || result.marketData.name} ({result.marketData.year})
        </div>

        {/* Chart Container */}
        <div style={{
          height: '300px',
          position: 'relative',
          marginBottom: '16px'
        }}>
          <Line data={chartData} options={options} />
        </div>

        {/* Current Value Summary */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '20px',
          backgroundColor: '#f8fafc',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
        }}>
          {/* Left side - Legend items */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '24px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <div style={{
                width: '14px',
                height: '14px',
                backgroundColor: '#3b82f6',
                borderRadius: '50%',
                boxShadow: '0 2px 4px rgba(59, 130, 246, 0.3)'
              }}></div>
              <span style={{ 
                fontSize: '14px', 
                color: '#374151', 
                fontWeight: '600',
                letterSpacing: '0.025em'
              }}>
                Market Trend
              </span>
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <div style={{
                width: '14px',
                height: '14px',
                backgroundColor: '#dc2626',
                borderRadius: '50%',
                boxShadow: '0 2px 4px rgba(220, 38, 38, 0.3)'
              }}></div>
              <span style={{ 
                fontSize: '14px', 
                color: '#374151', 
                fontWeight: '600',
                letterSpacing: '0.025em'
              }}>
                Your {mode.toUpperCase()}
              </span>
            </div>
          </div>

          {/* Right side - Value and percentile */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px'
          }}>
            <span style={{ 
              fontSize: '16px', 
              color: '#111827', 
              fontWeight: '700',
              letterSpacing: '0.025em'
            }}>
              {formatValue(currentValue)}
            </span>
            <div style={{
              padding: '6px 12px',
              backgroundColor: '#dc2626',
              color: 'white',
              borderRadius: '16px',
              fontSize: '12px',
              fontWeight: '600',
              letterSpacing: '0.025em'
            }}>
              {result.percentile}th Percentile
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
