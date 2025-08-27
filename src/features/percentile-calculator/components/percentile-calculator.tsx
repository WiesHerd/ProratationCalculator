import { useState, useEffect } from 'react';
import { MarketInputs } from './market-inputs';
import { PercentileResults } from './percentile-results';
import { calculatePercentile } from '../utils/percentile-calculations';
import { MarketData, PercentileResult, CalculatorMode } from '../types/percentile-types';

interface PercentileCalculatorProps {
  currentTcc: number;
  currentWrvus?: number;
  onSaveMarketData?: (marketData: MarketData) => void;
  savedMarketData?: MarketData[];
  tccComponents?: Record<string, number>;
  tccDerived?: Record<string, number>;
  derivedItems?: Array<{ id: string; name: string }>;
}

export function PercentileCalculator({ currentTcc, currentWrvus, onSaveMarketData, savedMarketData, tccComponents, tccDerived, derivedItems }: PercentileCalculatorProps) {
  const [mode, setMode] = useState<CalculatorMode>('tcc');
  const [marketData, setMarketData] = useState<MarketData>(() => {
    if (savedMarketData && savedMarketData.length > 0) {
      return savedMarketData[0];
    }
    return {
      id: crypto.randomUUID(),
      name: 'Market Data',
      specialty: '',
      year: new Date().getFullYear(),
      fte: 1.0,
      userFte: 1.0,
      percentiles: {
        p25: 0,
        p50: 0,
        p75: 0,
        p90: 0,
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
  });

  const [result, setResult] = useState<PercentileResult | null>(null);

  useEffect(() => {
    const currentValue = mode === 'tcc' ? currentTcc : (currentWrvus || 0);
    
    if (currentValue > 0 && marketData.percentiles.p90 > 0) {
      const calculatedResult = calculatePercentile(currentValue, marketData);
      setResult(calculatedResult);
    } else {
      setResult(null);
    }
  }, [mode, currentTcc, currentWrvus, marketData]);

  const handleMarketDataChange = (newData: MarketData) => {
    setMarketData({
      ...newData,
      updatedAt: Date.now(),
    });
  };

  const handleSaveMarketData = () => {
    if (onSaveMarketData) {
      onSaveMarketData(marketData);
    }
    // Show confirmation message
    alert('Market data saved successfully!');
  };

  const currentValue = mode === 'tcc' ? currentTcc : (currentWrvus || 0);

  return (
    <div style={{ width: '100%', padding: '24px' }}>
      {/* Header with Mode Toggle and Save Button */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '32px'
      }}>
        <div style={{
          display: 'flex',
          backgroundColor: '#f8fafc',
          borderRadius: '8px',
          padding: '4px',
          border: '1px solid #e2e8f0'
        }}>
          <button
            onClick={() => setMode('tcc')}
            title="Analyze Total Cash Compensation against market percentiles"
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '600',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.2s',
              backgroundColor: mode === 'tcc' ? '#ffffff' : 'transparent',
              color: mode === 'tcc' ? '#1e40af' : '#64748b',
              boxShadow: mode === 'tcc' ? '0 1px 3px rgba(0, 0, 0, 0.1)' : 'none'
            }}
          >
            TCC Analysis
          </button>
          <button
            onClick={() => setMode('wrvu')}
            title="Analyze work Relative Value Units against market percentiles"
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '600',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.2s',
              backgroundColor: mode === 'wrvu' ? '#ffffff' : 'transparent',
              color: mode === 'wrvu' ? '#1e40af' : '#64748b',
              boxShadow: mode === 'wrvu' ? '0 1px 3px rgba(0, 0, 0, 0.1)' : 'none'
            }}
          >
            wRVU Analysis
          </button>
        </div>
        
        <button
          onClick={handleSaveMarketData}
          title="Save current market data for use in main calculations"
          style={{
            backgroundColor: '#1976d2',
            color: 'white',
            border: '1px solid #1565c0',
            padding: '8px 16px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1565c0'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#1976d2'}
        >
          Save Market Data
        </button>
      </div>

      {/* Main Content - Single Container */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        padding: '32px',
        border: '1px solid #e5e7eb',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
      }}>
        
        {/* Section 1: Current Performance */}
        <div style={{
          marginBottom: '32px',
          position: 'relative'
        }}>
          <h3 style={{
            fontSize: '16px',
            fontWeight: '600',
            color: '#1e40af',
            margin: '0 0 16px 0',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            Current Performance
          </h3>
          
          {/* Current Value Display - Top Right Corner */}
          <div style={{
            position: 'absolute',
            top: '0',
            right: '0',
            display: 'flex',
            alignItems: 'center',
            gap: '20px'
          }}>
            <div style={{
              fontSize: '28px',
              fontWeight: '700',
              color: '#1f2937',
              lineHeight: '1.1'
            }}>
              {mode === 'tcc' 
                ? `$${currentTcc.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
                : currentWrvus 
                  ? `${currentWrvus.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} wRVUs`
                  : 'No wRVU data available'
              }
            </div>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start'
            }}>
              <div style={{
                fontSize: '12px',
                color: '#9ca3af',
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                marginBottom: '4px'
              }}>
                Your Current {mode.toUpperCase()}
              </div>
              <div style={{
                fontSize: '13px',
                color: '#9ca3af',
                fontWeight: '500',
                letterSpacing: '0.025em'
              }}>
                Compared against market data
              </div>
            </div>
          </div>
          
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* Horizontal Line */}
            <div style={{
              height: '1px',
              backgroundColor: '#d1d5db',
              marginTop: '20px',
              marginBottom: '12px'
            }}></div>
             
              {/* TCC Components Summary (only show if TCC mode and components exist) */}
              {mode === 'tcc' && tccComponents && Object.keys(tccComponents).length > 0 && (
                <div>
                  <div style={{
                    fontSize: '14px',
                    color: '#6b7280',
                    marginBottom: '16px',
                    fontWeight: '500'
                  }}>
                    TCC Breakdown
                  </div>
                
                {/* Base Components and Additional Incentives Side by Side */}
                <div style={{ 
                  display: 'flex', 
                  flexDirection: 'row', 
                  gap: '24px',
                  alignItems: 'flex-start'
                }}>
                  {/* Base Components */}
                  <div style={{ flex: '1' }}>
                    <div style={{
                      fontSize: '12px',
                      color: '#6b7280',
                      marginBottom: '8px',
                      fontWeight: '600',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      Base Components
                    </div>
                    <div style={{ 
                      display: 'flex', 
                      flexDirection: 'row', 
                      gap: '8px',
                      flexWrap: 'nowrap',
                      overflowX: 'auto'
                    }}>
                      {Object.entries(tccComponents).map(([component, amount]) => (
                        <div key={component} style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '16px 12px',
                          backgroundColor: '#ffffff',
                          borderRadius: '8px',
                          fontSize: '12px',
                          border: '1px solid #e5e7eb',
                          width: '120px',
                          height: '80px',
                          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                          transition: 'all 0.2s ease',
                          cursor: 'default'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
                        }}>
                          <span style={{ 
                            color: '#6b7280', 
                            fontWeight: '600',
                            textTransform: 'capitalize',
                            marginBottom: '6px',
                            textAlign: 'center',
                            fontSize: '11px',
                            letterSpacing: '0.025em'
                          }}>
                            {component.replace(/_/g, ' ')}
                          </span>
                          <span style={{ 
                            color: '#111827', 
                            fontWeight: '700',
                            fontSize: '14px',
                            letterSpacing: '0.025em'
                          }}>
                            ${amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Vertical Separator Line */}
                  <div style={{
                    width: '1px',
                    backgroundColor: '#e5e7eb',
                    margin: '0 12px',
                    alignSelf: 'stretch',
                    minHeight: '100px'
                  }}></div>
                  
                  {/* Additional Incentives */}
                  {tccDerived && Object.keys(tccDerived).length > 0 && (
                    <div style={{ flex: '1' }}>
                      <div style={{
                        fontSize: '12px',
                        color: '#6b7280',
                        marginBottom: '8px',
                        fontWeight: '600',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>
                        Additional Incentives
                      </div>
                      <div style={{ 
                        display: 'flex', 
                        flexDirection: 'row', 
                        gap: '8px',
                        flexWrap: 'nowrap',
                        overflowX: 'auto'
                      }}>
                        {Object.entries(tccDerived).map(([id, amount]) => {
                          const derivedItem = derivedItems?.find(item => item.id === id);
                          const displayName = derivedItem?.name || `Incentive ${id.slice(-4)}`;
                          
                          return (
                            <div key={id} style={{
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              justifyContent: 'center',
                              padding: '16px 12px',
                              backgroundColor: '#eff6ff',
                              borderRadius: '8px',
                              fontSize: '12px',
                              border: '1px solid #dbeafe',
                              width: '120px',
                              height: '80px',
                              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                              transition: 'all 0.2s ease',
                              cursor: 'default'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.transform = 'translateY(-2px)';
                              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = 'translateY(0)';
                              e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
                            }}>
                              <span style={{ 
                                color: '#6b7280', 
                                fontWeight: '600',
                                marginBottom: '6px',
                                textAlign: 'center',
                                fontSize: '11px',
                                letterSpacing: '0.025em'
                              }}>
                                {displayName}
                              </span>
                              <span style={{ 
                                color: '#111827', 
                                fontWeight: '700',
                                fontSize: '14px',
                                letterSpacing: '0.025em'
                              }}>
                                ${amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
                

              </div>
            )}
          </div>


        </div>

        {/* Section 2: Market Data Input */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          padding: '24px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          border: '1px solid #e5e7eb',
          marginBottom: '32px'
        }}>
          <h3 style={{
            fontSize: '16px',
            fontWeight: '600',
            color: '#059669',
            margin: '0 0 16px 0',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            Market Data Input
          </h3>
          <MarketInputs
            marketData={marketData}
            onMarketDataChange={handleMarketDataChange}
            mode={mode}
          />
          
          {/* Horizontal Line below Market Data Input */}
          <div style={{
            height: '1px',
            backgroundColor: '#d1d5db',
            marginTop: '28px',
            marginBottom: '24px'
          }}></div>
        </div>

        {/* Section 3: Percentile Analysis Results */}
        <div style={{
          marginTop: '16px'
        }}>
          <h3 style={{
            fontSize: '16px',
            fontWeight: '600',
            color: '#dc2626',
            margin: '0 0 16px 0',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            Percentile Analysis
          </h3>
          
          {result ? (
            <PercentileResults result={result} mode={mode} />
          ) : (
            <div style={{
              textAlign: 'center',
              padding: '32px 20px',
              color: '#6b7280'
            }}>
              <div style={{
                fontSize: '16px',
                marginBottom: '8px',
                fontWeight: '500'
              }}>
                {currentValue === 0 
                  ? `No ${mode.toUpperCase()} data available`
                  : 'Enter market percentiles to see analysis'
                }
              </div>
              {currentValue === 0 && mode === 'wrvu' && (
                <div style={{
                  fontSize: '14px',
                  color: '#9ca3af'
                }}>
                  Add wRVU incentive items to see wRVU analysis
                </div>
                                )}
                </div>
              )}
            </div>
      </div>
    </div>
  );
}
