import React, { useState, useEffect } from 'react';
import { indexedDBService, CalculationRecord } from '../lib/indexedDB';
import { formatCurrency } from '../lib/format';

interface HistoryProps {
  onLoadCalculation: (record: CalculationRecord) => void;
  onClose: () => void;
}

export function History({ onLoadCalculation, onClose }: HistoryProps) {
  const [calculations, setCalculations] = useState<CalculationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);

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
      } catch (error) {
        console.error('Failed to delete calculation:', error);
      }
    }
  };

  const handleLoad = (record: CalculationRecord) => {
    onLoadCalculation(record);
    onClose();
  };



  if (loading) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
      }}>
        <div style={{
          backgroundColor: 'white',
          padding: '40px',
          borderRadius: '12px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '18px', marginBottom: '16px' }}>Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
        width: '90%',
        maxWidth: '900px',
        maxHeight: '85vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{
          padding: '16px 24px',
          borderBottom: '1px solid #e1e5e9',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: '#ffffff'
        }}>
          <h2 style={{ 
            margin: 0, 
            fontSize: '18px', 
            fontWeight: '500', 
            color: '#1a1a1a',
            fontFamily: 'Google Sans, Roboto, Arial, sans-serif'
          }}>
            Saved Calculations ({calculations.length})
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '18px',
              cursor: 'pointer',
              color: '#5f6368',
              padding: '8px',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f1f3f4'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {calculations.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '48px 24px',
              color: '#5f6368',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '200px'
            }}>
              <div style={{ 
                fontSize: '48px', 
                marginBottom: '16px',
                opacity: '0.6'
              }}>📊</div>
              <div style={{ 
                fontSize: '16px', 
                marginBottom: '8px', 
                fontWeight: '500',
                color: '#1a1a1a'
              }}>No saved calculations</div>
              <div style={{ 
                fontSize: '14px', 
                marginBottom: '24px', 
                color: '#5f6368'
              }}>Your saved calculations will appear here</div>
              <button
                onClick={onClose}
                style={{
                  backgroundColor: '#1a73e8',
                  color: 'white',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  transition: 'background-color 0.2s',
                  fontFamily: 'Google Sans, Roboto, Arial, sans-serif'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1557b0'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#1a73e8'}
              >
                Close
              </button>
            </div>
          ) : (
            <div style={{ 
              flex: 1, 
              overflow: 'auto',
              maxHeight: 'calc(85vh - 80px)'
            }}>
              {/* Table */}
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontFamily: 'Google Sans, Roboto, Arial, sans-serif'
              }}>
                {/* Table Header */}
                <thead style={{
                  position: 'sticky',
                  top: 0,
                  backgroundColor: '#f8f9fa',
                  borderBottom: '1px solid #e1e5e9'
                }}>
                  <tr>
                    <th style={{
                      padding: '12px 16px',
                      textAlign: 'left',
                      fontSize: '12px',
                      fontWeight: '500',
                      color: '#5f6368',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      borderBottom: '1px solid #e1e5e9'
                    }}>
                      Name
                    </th>
                    <th style={{
                      padding: '12px 16px',
                      textAlign: 'left',
                      fontSize: '12px',
                      fontWeight: '500',
                      color: '#5f6368',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      borderBottom: '1px solid #e1e5e9'
                    }}>
                      Date
                    </th>
                    <th style={{
                      padding: '12px 16px',
                      textAlign: 'left',
                      fontSize: '12px',
                      fontWeight: '500',
                      color: '#5f6368',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      borderBottom: '1px solid #e1e5e9'
                    }}>
                      Year
                    </th>
                    <th style={{
                      padding: '12px 16px',
                      textAlign: 'right',
                      fontSize: '12px',
                      fontWeight: '500',
                      color: '#5f6368',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      borderBottom: '1px solid #e1e5e9'
                    }}>
                      Total TCC
                    </th>
                    <th style={{
                      padding: '12px 16px',
                      textAlign: 'center',
                      fontSize: '12px',
                      fontWeight: '500',
                      color: '#5f6368',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      borderBottom: '1px solid #e1e5e9',
                      width: '120px'
                    }}>
                      Actions
                    </th>
                  </tr>
                </thead>
                
                {/* Table Body */}
                <tbody>
                  {calculations.map((calc, index) => (
                    <tr
                      key={calc.id}
                      style={{
                        backgroundColor: selectedId === calc.id ? '#e8f0fe' : (index % 2 === 0 ? '#ffffff' : '#f8f9fa'),
                        borderBottom: '1px solid #f1f3f4',
                        cursor: 'pointer',
                        transition: 'background-color 0.15s'
                      }}
                      onClick={() => setSelectedId(calc.id)}
                      onMouseEnter={(e) => {
                        if (selectedId !== calc.id) {
                          e.currentTarget.style.backgroundColor = '#f1f3f4';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (selectedId !== calc.id) {
                          e.currentTarget.style.backgroundColor = index % 2 === 0 ? '#ffffff' : '#f8f9fa';
                        }
                      }}
                    >
                      {/* Name */}
                      <td style={{ padding: '12px 16px', borderBottom: '1px solid #f1f3f4' }}>
                        <div>
                          <div style={{ 
                            fontSize: '14px', 
                            fontWeight: '500', 
                            color: '#1a1a1a',
                            marginBottom: '2px'
                          }}>
                            {calc.name}
                          </div>
                          <div style={{ 
                            fontSize: '11px', 
                            color: '#5f6368'
                          }}>
                            ID: {calc.id.slice(-8)}
                          </div>
                        </div>
                      </td>

                      {/* Date */}
                      <td style={{ 
                        padding: '12px 16px', 
                        fontSize: '13px', 
                        color: '#5f6368',
                        borderBottom: '1px solid #f1f3f4'
                      }}>
                        {new Date(calc.timestamp).toLocaleDateString()}
                      </td>

                      {/* Year */}
                      <td style={{ 
                        padding: '12px 16px', 
                        fontSize: '13px', 
                        color: '#5f6368',
                        borderBottom: '1px solid #f1f3f4'
                      }}>
                        {calc.year}
                      </td>

                      {/* Total TCC */}
                      <td style={{ 
                        padding: '12px 16px', 
                        fontSize: '14px', 
                        fontWeight: '500', 
                        color: '#1a73e8',
                        fontFamily: 'monospace',
                        textAlign: 'right',
                        borderBottom: '1px solid #f1f3f4'
                      }}>
                        {formatCurrency(calc.totals.tcc)}
                      </td>

                      {/* Actions */}
                      <td style={{ 
                        padding: '12px 16px', 
                        textAlign: 'center',
                        borderBottom: '1px solid #f1f3f4'
                      }}>
                        <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleLoad(calc);
                            }}
                            style={{
                              backgroundColor: '#1a73e8',
                              color: 'white',
                              border: 'none',
                              padding: '6px 12px',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '11px',
                              fontWeight: '500',
                              transition: 'background-color 0.2s',
                              fontFamily: 'Google Sans, Roboto, Arial, sans-serif'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1557b0'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#1a73e8'}
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
                              fontSize: '11px',
                              transition: 'background-color 0.2s',
                              fontFamily: 'Google Sans, Roboto, Arial, sans-serif'
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
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
