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

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
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
        borderRadius: '12px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
        width: '90%',
        maxWidth: '800px',
        maxHeight: '80vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{
          padding: '24px',
          borderBottom: '1px solid #e0e0e0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: '#f8f9fa'
        }}>
          <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 600, color: '#333' }}>
            Calculation History
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: '#666',
              padding: '8px',
              borderRadius: '4px',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e0e0e0'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflow: 'auto', padding: '24px' }}>
          {calculations.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '60px 20px',
              color: '#666'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>📊</div>
              <div style={{ fontSize: '18px', marginBottom: '8px' }}>No saved calculations</div>
              <div style={{ fontSize: '14px' }}>Your saved calculations will appear here</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {calculations.map((calc) => (
                <div
                  key={calc.id}
                  style={{
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px',
                    padding: '20px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    backgroundColor: selectedId === calc.id ? '#f0f8ff' : 'white'
                  }}
                  onClick={() => setSelectedId(calc.id)}
                  onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)'}
                  onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'none'}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: '#333' }}>
                        {calc.name}
                      </h3>
                      <div style={{ fontSize: '14px', color: '#666', marginTop: '4px' }}>
                        {formatDate(calc.timestamp)} • Year {calc.year}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={(e) => handleLoad(calc)}
                        style={{
                          backgroundColor: '#1976d2',
                          color: 'white',
                          border: 'none',
                          padding: '8px 16px',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '14px',
                          fontWeight: 500,
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
                          padding: '8px 12px',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '14px',
                          transition: 'background-color 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#c82333'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#dc3545'}
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  {/* Summary Cards */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px' }}>
                    {Object.entries(calc.totals.totalsByComponent).map(([key, amount]) => (
                      <div key={key} style={{
                        backgroundColor: '#f8f9fa',
                        padding: '12px',
                        borderRadius: '6px',
                        textAlign: 'center'
                      }}>
                        <div style={{ fontSize: '12px', color: '#666', textTransform: 'uppercase', marginBottom: '4px' }}>
                          {key.replace('_', ' ')}
                        </div>
                        <div style={{ fontSize: '16px', fontWeight: 600, color: '#333' }}>
                          {formatCurrency(amount)}
                        </div>
                      </div>
                    ))}
                    <div style={{
                      backgroundColor: '#e3f2fd',
                      padding: '12px',
                      borderRadius: '6px',
                      textAlign: 'center'
                    }}>
                      <div style={{ fontSize: '12px', color: '#1976d2', textTransform: 'uppercase', marginBottom: '4px' }}>
                        Total
                      </div>
                      <div style={{ fontSize: '16px', fontWeight: 600, color: '#1976d2' }}>
                        {formatCurrency(calc.totals.tcc)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
