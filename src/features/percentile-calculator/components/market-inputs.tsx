import { MarketData } from '../types/percentile-types';
import { formatCurrency } from '../../../lib/format';

interface MarketInputsProps {
  marketData: MarketData;
  onMarketDataChange: (data: MarketData) => void;
  mode: 'tcc' | 'wrvu';
}

export function MarketInputs({ marketData, onMarketDataChange, mode }: MarketInputsProps) {
  const handlePercentileChange = (percentile: keyof MarketData['percentiles'], value: string) => {
    // Remove currency formatting for parsing
    const cleanValue = value.replace(/[$,]/g, '');
    const numValue = parseFloat(cleanValue) || 0;
    onMarketDataChange({
      ...marketData,
      percentiles: {
        ...marketData.percentiles,
        [percentile]: numValue,
      },
    });
  };

  const formatInputValue = (value: number) => {
    if (mode === 'tcc') {
      return value.toLocaleString('en-US', { 
        minimumFractionDigits: 0, 
        maximumFractionDigits: 0 
      });
    } else {
      return value.toLocaleString('en-US', { 
        minimumFractionDigits: 0, 
        maximumFractionDigits: 0 
      });
    }
  };

  // Calculate FTE-adjusted percentiles
  const getAdjustedPercentile = (percentile: number) => {
    const userFte = marketData.userFte || 1.0;
    return percentile * userFte;
  };

  const formatValue = (value: number) => {
    if (mode === 'tcc') {
      return formatCurrency(value);
    } else {
      return value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    }
  };



  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Basic Information - Field names above, single line */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '16px' }}>
        <div>
          <label style={{ 
            display: 'block', 
            fontSize: '12px', 
            fontWeight: '500', 
            color: '#5f6368', 
            marginBottom: '6px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            Specialty
          </label>
          <input
            type="text"
            value={marketData.specialty || ''}
            onChange={(e) => onMarketDataChange({ ...marketData, specialty: e.target.value })}
            style={{
              width: '100%',
              height: '36px',
              padding: '0 12px',
              border: '1px solid #dadce0',
              borderRadius: '4px',
              fontSize: '14px',
              backgroundColor: '#ffffff',
              transition: 'border-color 0.2s, box-shadow 0.2s',
              boxSizing: 'border-box'
            }}
            placeholder="e.g., Internal Medicine"
            onFocus={(e) => {
              e.target.style.borderColor = '#1a73e8';
              e.target.style.boxShadow = '0 0 0 2px rgba(26, 115, 232, 0.2)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#dadce0';
              e.target.style.boxShadow = 'none';
            }}
          />
        </div>
        <div>
          <label style={{ 
            display: 'block', 
            fontSize: '12px', 
            fontWeight: '500', 
            color: '#5f6368', 
            marginBottom: '6px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            Year
          </label>
          <input
            type="number"
            value={marketData.year}
            onChange={(e) => onMarketDataChange({ ...marketData, year: parseInt(e.target.value) || 2024 })}
            style={{
              width: '100%',
              height: '36px',
              padding: '0 12px',
              border: '1px solid #dadce0',
              borderRadius: '4px',
              fontSize: '14px',
              backgroundColor: '#ffffff',
              transition: 'border-color 0.2s, box-shadow 0.2s',
              boxSizing: 'border-box'
            }}
            min="2020"
            max="2030"
            onFocus={(e) => {
              e.target.style.borderColor = '#1a73e8';
              e.target.style.boxShadow = '0 0 0 2px rgba(26, 115, 232, 0.2)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#dadce0';
              e.target.style.boxShadow = 'none';
            }}
          />
        </div>
        <div>
          <label style={{ 
            display: 'block', 
            fontSize: '12px', 
            fontWeight: '500', 
            color: '#5f6368', 
            marginBottom: '6px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            FTE
          </label>
          <input
            type="number"
            value={marketData.userFte || 1.0}
            onChange={(e) => onMarketDataChange({ ...marketData, userFte: parseFloat(e.target.value) || 1.0 })}
            style={{
              width: '100%',
              height: '36px',
              padding: '0 12px',
              border: '1px solid #dadce0',
              borderRadius: '4px',
              fontSize: '14px',
              backgroundColor: '#ffffff',
              transition: 'border-color 0.2s, box-shadow 0.2s',
              boxSizing: 'border-box'
            }}
            min="0.1"
            max="2.0"
            step="0.1"
            placeholder="1.0"
            onFocus={(e) => {
              e.target.style.borderColor = '#1a73e8';
              e.target.style.boxShadow = '0 0 0 2px rgba(26, 115, 232, 0.2)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#dadce0';
              e.target.style.boxShadow = 'none';
            }}
          />
        </div>
      </div>

      {/* Market Percentiles - Field names above, all on one line */}
      <div>
        <label style={{ 
          display: 'block', 
          fontSize: '12px', 
          fontWeight: '500', 
          color: '#5f6368', 
          marginBottom: '6px',
          textTransform: 'uppercase',
          letterSpacing: '0.5px'
        }}>
          Market Percentiles (1.0 FTE)
        </label>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(4, 1fr)', 
          gap: '12px' 
        }}>
          <div>
            <label style={{ 
              display: 'block', 
              fontSize: '11px', 
              color: '#5f6368', 
              marginBottom: '6px',
              fontWeight: '500',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              25th Percentile
            </label>
            <input
              type="text"
              value={formatInputValue(marketData.percentiles.p25)}
              onChange={(e) => handlePercentileChange('p25', e.target.value)}
              style={{
                width: '100%',
                height: '36px',
                padding: '0 12px',
                border: '1px solid #dadce0',
                borderRadius: '4px',
                fontSize: '14px',
                backgroundColor: '#ffffff',
                transition: 'border-color 0.2s, box-shadow 0.2s',
                boxSizing: 'border-box'
              }}
              placeholder={mode === 'tcc' ? '$0' : '0'}
              onFocus={(e) => {
                e.target.style.borderColor = '#1a73e8';
                e.target.style.boxShadow = '0 0 0 2px rgba(26, 115, 232, 0.2)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#dadce0';
                e.target.style.boxShadow = 'none';
              }}
            />
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              marginTop: '4px',
              fontSize: '10px',
              color: '#5f6368'
            }}>
              <span>Raw: {formatValue(marketData.percentiles.p25)}</span>
              <span style={{ color: '#137333', fontWeight: '500' }}>
                Adj: {formatValue(getAdjustedPercentile(marketData.percentiles.p25))}
              </span>
            </div>
          </div>
          
          <div>
            <label style={{ 
              display: 'block', 
              fontSize: '11px', 
              color: '#5f6368', 
              marginBottom: '6px',
              fontWeight: '500',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              50th Percentile
            </label>
            <input
              type="text"
              value={formatInputValue(marketData.percentiles.p50)}
              onChange={(e) => handlePercentileChange('p50', e.target.value)}
              style={{
                width: '100%',
                height: '36px',
                padding: '0 12px',
                border: '1px solid #dadce0',
                borderRadius: '4px',
                fontSize: '14px',
                backgroundColor: '#ffffff',
                transition: 'border-color 0.2s, box-shadow 0.2s',
                boxSizing: 'border-box'
              }}
              placeholder={mode === 'tcc' ? '$0' : '0'}
              onFocus={(e) => {
                e.target.style.borderColor = '#1a73e8';
                e.target.style.boxShadow = '0 0 0 2px rgba(26, 115, 232, 0.2)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#dadce0';
                e.target.style.boxShadow = 'none';
              }}
            />
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              marginTop: '4px',
              fontSize: '10px',
              color: '#5f6368'
            }}>
              <span>Raw: {formatValue(marketData.percentiles.p50)}</span>
              <span style={{ color: '#137333', fontWeight: '500' }}>
                Adj: {formatValue(getAdjustedPercentile(marketData.percentiles.p50))}
              </span>
            </div>
          </div>
          
          <div>
            <label style={{ 
              display: 'block', 
              fontSize: '11px', 
              color: '#5f6368', 
              marginBottom: '6px',
              fontWeight: '500',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              75th Percentile
            </label>
            <input
              type="text"
              value={formatInputValue(marketData.percentiles.p75)}
              onChange={(e) => handlePercentileChange('p75', e.target.value)}
              style={{
                width: '100%',
                height: '36px',
                padding: '0 12px',
                border: '1px solid #dadce0',
                borderRadius: '4px',
                fontSize: '14px',
                backgroundColor: '#ffffff',
                transition: 'border-color 0.2s, box-shadow 0.2s',
                boxSizing: 'border-box'
              }}
              placeholder={mode === 'tcc' ? '$0' : '0'}
              onFocus={(e) => {
                e.target.style.borderColor = '#1a73e8';
                e.target.style.boxShadow = '0 0 0 2px rgba(26, 115, 232, 0.2)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#dadce0';
                e.target.style.boxShadow = 'none';
              }}
            />
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              marginTop: '4px',
              fontSize: '10px',
              color: '#5f6368'
            }}>
              <span>Raw: {formatValue(marketData.percentiles.p75)}</span>
              <span style={{ color: '#137333', fontWeight: '500' }}>
                Adj: {formatValue(getAdjustedPercentile(marketData.percentiles.p75))}
              </span>
            </div>
          </div>
          
          <div>
            <label style={{ 
              display: 'block', 
              fontSize: '11px', 
              color: '#5f6368', 
              marginBottom: '6px',
              fontWeight: '500',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              90th Percentile
            </label>
            <input
              type="text"
              value={formatInputValue(marketData.percentiles.p90)}
              onChange={(e) => handlePercentileChange('p90', e.target.value)}
              style={{
                width: '100%',
                height: '36px',
                padding: '0 12px',
                border: '1px solid #dadce0',
                borderRadius: '4px',
                fontSize: '14px',
                backgroundColor: '#ffffff',
                transition: 'border-color 0.2s, box-shadow 0.2s',
                boxSizing: 'border-box'
              }}
              placeholder={mode === 'tcc' ? '$0' : '0'}
              onFocus={(e) => {
                e.target.style.borderColor = '#1a73e8';
                e.target.style.boxShadow = '0 0 0 2px rgba(26, 115, 232, 0.2)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#dadce0';
                e.target.style.boxShadow = 'none';
              }}
            />
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              marginTop: '4px',
              fontSize: '10px',
              color: '#5f6368'
            }}>
              <span>Raw: {formatValue(marketData.percentiles.p90)}</span>
              <span style={{ color: '#137333', fontWeight: '500' }}>
                Adj: {formatValue(getAdjustedPercentile(marketData.percentiles.p90))}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
