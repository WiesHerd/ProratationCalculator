import React, { useState, useEffect } from 'react';
import { indexedDBService, CalculationRecord } from '../lib/indexedDB';
import { formatCurrency } from '../lib/format';

interface HistoryScreenProps {
  onLoadCalculation: (record: CalculationRecord) => void;
  onBack: () => void;
}

export function HistoryScreen({ onLoadCalculation, onBack }: HistoryScreenProps) {
  const [calculations, setCalculations] = useState<CalculationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCalculation, setSelectedCalculation] = useState<CalculationRecord | null>(null);

  useEffect(() => {
    loadCalculations();
  }, []);

  const loadCalculations = async () => {
    try {
      setLoading(true);
      const records = await indexedDBService.getCalculations();
      setCalculations(records);
    } catch (error) {
      console.error('Failed to load calculations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, event: React.MouseEvent) => {
    event.stopPropagation();
    if (confirm('Are you sure you want to delete this calculation?')) {
      try {
        await indexedDBService.deleteCalculation(id);
        setCalculations(prev => prev.filter(calc => calc.id !== id));
        if (selectedCalculation?.id === id) {
          setSelectedCalculation(null);
        }
      } catch (error) {
        console.error('Failed to delete calculation:', error);
      }
    }
  };

  const handleLoad = (record: CalculationRecord) => {
    onLoadCalculation(record);
    onBack();
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  if (loading) {
    return (
      <div style={{
        padding: '40px',
        textAlign: 'center',
        backgroundColor: '#f8f9fa',
        minHeight: '100vh'
      }}>
        <div style={{ fontSize: '18px', marginBottom: '16px' }}>Loading calculations...</div>
      </div>
    );
  }

  return (
    <div style={{
      backgroundColor: '#f8f9fa',
      minHeight: '100vh',
      padding: '24px'
    }}>
      {/* Header */}
      <div style={{
        backgroundColor: 'white',
        padding: '24px',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        marginBottom: '24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <h1 style={{ 
            margin: 0, 
            fontSize: '28px', 
            fontWeight: 600, 
            color: '#333',
            marginBottom: '8px'
          }}>
            Calculation History
          </h1>
          <p style={{ 
            margin: 0, 
            fontSize: '16px', 
            color: '#666' 
          }}>
            View and manage your saved calculations
          </p>
        </div>
                 <button
           onClick={onBack}
           style={{
             backgroundColor: '#9ca3af',
             color: 'white',
             border: 'none',
             padding: '12px 24px',
             borderRadius: '6px',
             cursor: 'pointer',
             fontSize: '14px',
             fontWeight: '500',
             transition: 'background-color 0.2s'
           }}
           onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#6b7280'}
           onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#9ca3af'}
         >
           ← Back to Calculator
         </button>
      </div>

      <div style={{ display: 'flex', gap: '24px' }}>
        {/* Main Table */}
        <div style={{ flex: 1 }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            overflow: 'hidden'
          }}>
            {calculations.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '60px 24px',
                color: '#666'
              }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>📊</div>
                <div style={{ fontSize: '18px', marginBottom: '8px' }}>No saved calculations</div>
                <div style={{ fontSize: '14px' }}>Your saved calculations will appear here</div>
              </div>
            ) : (
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '14px'
              }}>
                <thead>
                  <tr style={{
                    backgroundColor: '#f8f9fa',
                    borderBottom: '1px solid #e0e0e0'
                  }}>
                    <th style={{
                      padding: '16px',
                      textAlign: 'left',
                      fontWeight: '600',
                      color: '#333',
                      borderBottom: '2px solid #e0e0e0'
                    }}>
                      Name
                    </th>
                    <th style={{
                      padding: '16px',
                      textAlign: 'left',
                      fontWeight: '600',
                      color: '#333',
                      borderBottom: '2px solid #e0e0e0'
                    }}>
                      Date
                    </th>
                    <th style={{
                      padding: '16px',
                      textAlign: 'left',
                      fontWeight: '600',
                      color: '#333',
                      borderBottom: '2px solid #e0e0e0'
                    }}>
                      Year
                    </th>
                    <th style={{
                      padding: '16px',
                      textAlign: 'right',
                      fontWeight: '600',
                      color: '#333',
                      borderBottom: '2px solid #e0e0e0'
                    }}>
                      Total TCC
                    </th>
                    <th style={{
                      padding: '16px',
                      textAlign: 'center',
                      fontWeight: '600',
                      color: '#333',
                      borderBottom: '2px solid #e0e0e0'
                    }}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {calculations.map((calc, index) => (
                    <tr 
                      key={calc.id}
                      style={{
                        backgroundColor: selectedCalculation?.id === calc.id ? '#f0f8ff' : 'white',
                        borderBottom: '1px solid #e0e0e0',
                        cursor: 'pointer',
                        transition: 'background-color 0.2s'
                      }}
                      onClick={() => setSelectedCalculation(calc)}
                      onMouseEnter={(e) => {
                        if (selectedCalculation?.id !== calc.id) {
                          e.currentTarget.style.backgroundColor = '#f8f9fa';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (selectedCalculation?.id !== calc.id) {
                          e.currentTarget.style.backgroundColor = 'white';
                        }
                      }}
                    >
                      <td style={{
                        padding: '16px',
                        fontWeight: '500',
                        color: '#333'
                      }}>
                        <span style={{
                          color: '#1976d2',
                          textDecoration: 'underline',
                          cursor: 'pointer'
                        }}>
                          {calc.name}
                        </span>
                      </td>
                      <td style={{
                        padding: '16px',
                        color: '#666'
                      }}>
                        {formatDate(calc.timestamp)}
                      </td>
                      <td style={{
                        padding: '16px',
                        color: '#666'
                      }}>
                        {calc.year}
                      </td>
                      <td style={{
                        padding: '16px',
                        textAlign: 'right',
                        fontWeight: '600',
                        color: '#333'
                      }}>
                        {formatCurrency(calc.totals.tcc)}
                      </td>
                      <td style={{
                        padding: '16px',
                        textAlign: 'center'
                      }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                          <button
                            onClick={(e) => handleLoad(calc)}
                            style={{
                              backgroundColor: '#1976d2',
                              color: 'white',
                              border: 'none',
                              padding: '6px 12px',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '12px',
                              fontWeight: '500',
                              transition: 'background-color 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1565c0'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#1976d2'}
                          >
                            Load
                          </button>
                          <button
                            onClick={(e) => handleDelete(calc.id, e)}
                            style={{
                              backgroundColor: '#dc3545',
                              color: 'white',
                              border: 'none',
                              padding: '6px 12px',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '12px',
                              transition: 'background-color 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#c82333'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#dc3545'}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Details Panel */}
        {selectedCalculation && (
          <div style={{
            width: '400px',
            backgroundColor: 'white',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            padding: '24px',
            height: 'fit-content'
          }}>
            <h3 style={{
              margin: '0 0 16px 0',
              fontSize: '20px',
              fontWeight: '600',
              color: '#333'
            }}>
              {selectedCalculation.name}
            </h3>
            
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>
                Created: {formatDate(selectedCalculation.timestamp)}
              </div>
              <div style={{ fontSize: '14px', color: '#666' }}>
                Year: {selectedCalculation.year}
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <h4 style={{
                margin: '0 0 12px 0',
                fontSize: '16px',
                fontWeight: '600',
                color: '#333'
              }}>
                Component Totals
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {Object.entries(selectedCalculation.totals.totalsByComponent).map(([key, amount]) => (
                  <div key={key} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '4px'
                  }}>
                    <span style={{ fontSize: '14px', color: '#666', textTransform: 'capitalize' }}>
                      {key.replace('_', ' ')}
                    </span>
                    <span style={{ fontSize: '14px', fontWeight: '600', color: '#333' }}>
                      {formatCurrency(amount)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{
              padding: '16px',
              backgroundColor: '#e3f2fd',
              borderRadius: '6px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '12px', color: '#1976d2', textTransform: 'uppercase', marginBottom: '4px' }}>
                Total Cash Compensation
              </div>
              <div style={{ fontSize: '24px', fontWeight: '700', color: '#1976d2' }}>
                {formatCurrency(selectedCalculation.totals.tcc)}
              </div>
            </div>

            <div style={{ marginTop: '20px' }}>
              <h4 style={{
                margin: '0 0 12px 0',
                fontSize: '16px',
                fontWeight: '600',
                color: '#333'
              }}>
                Summary
              </h4>
              <div style={{ fontSize: '14px', color: '#666', lineHeight: '1.5' }}>
                <div>Periods: {selectedCalculation.periods.length}</div>
                <div>Components: {selectedCalculation.componentKeys.join(', ')}</div>
                <div>Incentives: {selectedCalculation.derivedItems.length}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
