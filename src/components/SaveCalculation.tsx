import React, { useState, useEffect } from 'react';
import { indexedDBService } from '../lib/indexedDB';

interface SaveCalculationProps {
  onSave: (name: string) => void;
  onClose: () => void;
  currentData: {
    year: number;
    componentKeys: string[];
    periods: any[];
    derivedItems: any[];
    targetCalculatorItems: any[]; // Add Target Calculator items
    marketData?: any[]; // Market data for percentile analysis
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
  const [saveMode, setSaveMode] = useState<'new' | 'overwrite'>('new');
  const [selectedExistingId, setSelectedExistingId] = useState<string | null>(null);


  // Fetch existing calculations for overwrite mode
  const [existingCalculations, setExistingCalculations] = useState<{ id: string; name: string; year: number }[]>([]);

  useEffect(() => {
    const fetchExistingCalculations = async () => {
      try {
        const savedCalculations = await indexedDBService.getCalculations();
        setExistingCalculations(savedCalculations);
      } catch (error) {
        console.error('Failed to fetch existing calculations:', error);
      }
    };
    fetchExistingCalculations();
  }, []);

  // Check if name already exists
  const existingCalculation = existingCalculations.find(calc => calc.name === name.trim());

  // Auto-populate name when overwrite mode is selected
  useEffect(() => {
    if (saveMode === 'overwrite' && selectedExistingId) {
      const selectedCalc = existingCalculations.find(calc => calc.id === selectedExistingId);
      if (selectedCalc) {
        setName(selectedCalc.name);
      }
    }
  }, [saveMode, selectedExistingId, existingCalculations]);

  const handleSave = async () => {
    if (!name.trim()) {
      alert('Please enter a name for this calculation');
      return;
    }

    // Check for conflicts only in "new" mode
    if (saveMode === 'new' && existingCalculation) {
      
      return;
    }

    try {
      console.log('Starting save operation...');
      setSaving(true);
      
      const saveData = {
        name: name.trim(),
        year: currentData.year,
        componentKeys: currentData.componentKeys,
        periods: currentData.periods,
        derivedItems: currentData.derivedItems,
        targetCalculatorItems: currentData.targetCalculatorItems,
        marketData: currentData.marketData,
        totals: currentData.totals
      };

      // Check if data is serializable
      try {
        JSON.stringify(saveData);
        console.log('Data validation passed - data is serializable');
      } catch (validationError) {
        console.error('Data validation failed - data contains non-serializable objects:', validationError);
        throw new Error('Data contains non-serializable objects. Please check your calculation data.');
      }
      
      console.log('Saving calculation data:', {
        name: saveData.name,
        year: saveData.year,
        componentKeys: saveData.componentKeys,
        periodsCount: saveData.periods.length,
        derivedItemsCount: saveData.derivedItems.length,
        targetCalculatorItemsCount: saveData.targetCalculatorItems.length,
        marketDataCount: saveData.marketData?.length || 0,
        totals: saveData.totals
      });

      let result: string;

      if (saveMode === 'overwrite' && selectedExistingId) {
        // Delete existing and save new
        await indexedDBService.deleteCalculation(selectedExistingId);
        result = await indexedDBService.saveCalculation(saveData);
      } else {
        // Save as new
        result = await indexedDBService.saveCalculation(saveData);
      }
      
      console.log('Save operation completed successfully:', result);
      onSave(name.trim());
    } catch (error) {
      console.error('Failed to save calculation:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error details:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: errorMessage,
        stack: error instanceof Error ? error.stack : 'No stack trace'
      });
      alert(`Failed to save calculation: ${errorMessage}. Please try again.`);
    } finally {
      console.log('Save operation finished, setting saving to false');
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
        <div style={{ marginBottom: '20px' }}>
          <label style={{
            display: 'block',
            fontSize: '14px',
            fontWeight: '500',
            color: '#5f6368',
            marginBottom: '8px'
          }}>
            Calculation Name
            {saveMode === 'overwrite' && (
              <span style={{ fontSize: '12px', color: '#9aa0a6', marginLeft: '8px' }}>
                (will replace selected calculation)
              </span>
            )}
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={saveMode === 'overwrite' ? "Select a calculation to overwrite..." : "Enter calculation name..."}
            disabled={saveMode === 'overwrite'}
            style={{
              width: '100%',
              padding: '12px',
              border: '1px solid #dadce0',
              borderRadius: '4px',
              fontSize: '14px',
              outline: 'none',
              transition: 'border-color 0.2s',
              backgroundColor: saveMode === 'overwrite' ? '#f8f9fa' : 'white',
              color: saveMode === 'overwrite' ? '#5f6368' : '#1a1a1a',
              cursor: saveMode === 'overwrite' ? 'not-allowed' : 'text'
            }}
            onFocus={(e) => {
              if (saveMode !== 'overwrite') {
                e.target.style.borderColor = '#1a73e8';
              }
            }}
            onBlur={(e) => {
              if (saveMode !== 'overwrite') {
                e.target.style.borderColor = '#dadce0';
              }
            }}
            autoFocus={saveMode === 'new'}
          />
        </div>

        {/* Save Mode Selection */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{
            display: 'block',
            fontSize: '14px',
            fontWeight: '500',
            color: '#5f6368',
            marginBottom: '8px'
          }}>
            Save Options
          </label>
          <div style={{ display: 'flex', gap: '12px' }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              color: '#1a1a1a'
            }}>
              <input
                type="radio"
                name="saveMode"
                value="new"
                checked={saveMode === 'new'}
                onChange={(e) => {
                  setSaveMode(e.target.value as 'new' | 'overwrite');
                  setSelectedExistingId(null);
                  setName('');
                }}
                style={{ margin: 0 }}
              />
              Save as New
            </label>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              color: '#1a1a1a'
            }}>
              <input
                type="radio"
                name="saveMode"
                value="overwrite"
                checked={saveMode === 'overwrite'}
                onChange={(e) => setSaveMode(e.target.value as 'new' | 'overwrite')}
                style={{ margin: 0 }}
              />
              Overwrite Existing
            </label>
          </div>
        </div>

        {/* Existing Calculations Dropdown (for overwrite mode) */}
        {saveMode === 'overwrite' && existingCalculations.length > 0 && (
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: '#5f6368',
              marginBottom: '8px'
            }}>
              Select Calculation to Overwrite
            </label>
            <select
              value={selectedExistingId || ''}
              onChange={(e) => setSelectedExistingId(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #dadce0',
                borderRadius: '4px',
                fontSize: '14px',
                outline: 'none',
                backgroundColor: 'white'
              }}
            >
              <option value="">Select a calculation...</option>
              {existingCalculations.map(calc => (
                <option key={calc.id} value={calc.id}>
                  {calc.name} (Year {calc.year})
                </option>
              ))}
            </select>
          </div>
        )}

        

        {/* Actions */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            disabled={saving}
            style={{
              backgroundColor: 'transparent',
              color: '#5f6368',
              border: '1px solid #dadce0',
              padding: '8px 16px',
              borderRadius: '4px',
              cursor: saving ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              transition: 'all 0.2s',
              opacity: saving ? 0.6 : 1
            }}
            onMouseEnter={(e) => !saving && (e.currentTarget.style.backgroundColor = '#f8f9fa')}
            onMouseLeave={(e) => !saving && (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !name.trim() || (saveMode === 'overwrite' && !selectedExistingId)}
            style={{
              backgroundColor: saving || !name.trim() || (saveMode === 'overwrite' && !selectedExistingId) ? '#dadce0' : '#1a73e8',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '4px',
              cursor: saving || !name.trim() || (saveMode === 'overwrite' && !selectedExistingId) ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => {
              if (!saving && name.trim() && !(saveMode === 'overwrite' && !selectedExistingId)) {
                e.currentTarget.style.backgroundColor = '#1557b0';
              }
            }}
            onMouseLeave={(e) => {
              if (!saving && name.trim() && !(saveMode === 'overwrite' && !selectedExistingId)) {
                e.currentTarget.style.backgroundColor = '#1a73e8';
              }
            }}
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
