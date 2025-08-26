import React, { useState } from 'react';
import { indexedDBService } from '../lib/indexedDB';

interface SaveCalculationProps {
  onSave: (name: string) => void;
  onClose: () => void;
  currentData: {
    year: number;
    componentKeys: string[];
    periods: any[];
    derivedItems: any[];
    totals: {
      totalsByComponent: Record<string, number>;
      derivedTotals: Record<string, number>;
      tcc: number;
    };
  };
}

export function SaveCalculation({ onSave, onClose, currentData }: SaveCalculationProps) {
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      alert('Please enter a name for this calculation');
      return;
    }

    try {
      setSaving(true);
      await indexedDBService.saveCalculation({
        name: name.trim(),
        year: currentData.year,
        componentKeys: currentData.componentKeys,
        periods: currentData.periods,
        derivedItems: currentData.derivedItems,
        totals: currentData.totals
      });
      onSave(name.trim());
    } catch (error) {
      console.error('Failed to save calculation:', error);
      alert('Failed to save calculation. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

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
        maxWidth: '500px',
        padding: '32px'
      }}>
        {/* Header */}
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 600, color: '#333', marginBottom: '8px' }}>
            Save Calculation
          </h2>
          <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>
            Give your calculation a name to save it for later use.
          </p>
        </div>

        {/* Form */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{
            display: 'block',
            fontSize: '14px',
            fontWeight: 500,
            color: '#333',
            marginBottom: '8px'
          }}>
            Calculation Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="e.g., Dr. Smith 2025 Compensation"
            style={{
              width: '100%',
              padding: '12px 16px',
              border: '1px solid #e0e0e0',
              borderRadius: '8px',
              fontSize: '16px',
              outline: 'none',
              transition: 'border-color 0.2s'
            }}
            onFocus={(e) => e.target.style.borderColor = '#1976d2'}
            onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
            autoFocus
          />
        </div>

        {/* Summary */}
        <div style={{
          backgroundColor: '#f8f9fa',
          padding: '16px',
          borderRadius: '8px',
          marginBottom: '24px'
        }}>
          <div style={{ fontSize: '14px', fontWeight: 500, color: '#333', marginBottom: '8px' }}>
            Summary
          </div>
          <div style={{ fontSize: '14px', color: '#666', lineHeight: '1.5' }}>
            <div>Year: {currentData.year}</div>
            <div>Periods: {currentData.periods.length}</div>
            <div>Components: {currentData.componentKeys.join(', ')}</div>
            <div>Total Cash Compensation: ${currentData.totals.tcc.toLocaleString()}</div>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            disabled={saving}
            style={{
              backgroundColor: 'transparent',
              color: '#666',
              border: '1px solid #e0e0e0',
              padding: '12px 24px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 500,
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !name.trim()}
            style={{
              backgroundColor: saving || !name.trim() ? '#ccc' : '#1976d2',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '8px',
              cursor: saving || !name.trim() ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: 500,
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => {
              if (!saving && name.trim()) {
                e.currentTarget.style.backgroundColor = '#1565c0';
              }
            }}
            onMouseLeave={(e) => {
              if (!saving && name.trim()) {
                e.currentTarget.style.backgroundColor = '#1976d2';
              }
            }}
          >
            {saving ? 'Saving...' : 'Save Calculation'}
          </button>
        </div>
      </div>
    </div>
  );
}
