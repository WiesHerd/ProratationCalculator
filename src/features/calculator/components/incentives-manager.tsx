import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  selectDerivedItems,
  selectDerivedComponentKeys,
  selectCalculationResult,
  selectTargetComponents,
  selectConversionFactor,
  selectUseCustomAmount,
  selectCustomAmount,
  addDerivedItem,
  updateDerivedItem,
  deleteDerivedItem,
  setTargetComponents,
  setConversionFactor,
  setUseCustomAmount,
  setCustomAmount
} from '../calculator-slice';
import { formatCurrency } from '../../../lib/format';
import { titleCase } from '../../../lib/keys';
import { typography, colors } from '../../../styles/theme';

export const IncentivesManager: React.FC = () => {
  const dispatch = useDispatch();
  const derivedItems = useSelector(selectDerivedItems);
  const derivedComponentKeys = useSelector(selectDerivedComponentKeys);
  const result = useSelector(selectCalculationResult);
  const targetComponents = useSelector(selectTargetComponents);
  const conversionFactor = useSelector(selectConversionFactor);
  const useCustomAmount = useSelector(selectUseCustomAmount);
  const customAmount = useSelector(selectCustomAmount);

  return (
    <>
      {/* Additional Incentives */}
      <div style={{
        backgroundColor: colors.surface,
        borderRadius: '8px',
        border: `1px solid ${colors.outlineVariant}`,
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          padding: '16px 24px',
          borderBottom: `1px solid ${colors.outlineVariant}`,
          backgroundColor: '#e8f5e8',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h3 style={{ 
            margin: 0, 
            ...typography.titleLarge,
            fontWeight: 500,
            color: '#2e7d32',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
            Additional Incentives
          </h3>
          <button
            onClick={() => dispatch(addDerivedItem())}
            style={{
              backgroundColor: '#1976d2',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 500
            }}
          >
            Add Incentive
          </button>
        </div>
        <div style={{ padding: '24px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {derivedItems.map((item, index) => (
              <div key={item.id} style={{
                padding: '16px',
                border: `1px solid ${colors.outlineVariant}`,
                borderRadius: '8px',
                backgroundColor: index % 2 === 0 ? colors.surface : colors.neutral[50]
              }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr auto', gap: '16px', alignItems: 'end' }}>
                  <div>
                    <label style={{ 
                      display: 'block', 
                      ...typography.labelMedium,
                      color: colors.onSurfaceVariant, 
                      marginBottom: '4px' 
                    }}>
                      Name
                    </label>
                    <input
                      value={item.name}
                      onChange={(e) => {
                        dispatch(updateDerivedItem({ id: item.id, updates: { name: e.target.value } }));
                      }}
                      placeholder="e.g., PSQ"
                      style={{
                        border: `1px solid ${colors.outlineVariant}`,
                        borderRadius: '4px',
                        padding: '8px 12px',
                        ...typography.bodyMedium,
                        width: '100%'
                      }}
                    />
                  </div>
                  
                  <div>
                    <label style={{ 
                      display: 'block', 
                      ...typography.labelMedium,
                      color: colors.onSurfaceVariant, 
                      marginBottom: '4px' 
                    }}>
                      FTE Type
                    </label>
                    <div style={{ position: 'relative' }}>
                      <button
                        onClick={() => {
                          const currentOpen = document.getElementById(`dropdown-${item.id}`);
                          if (currentOpen) {
                            const isVisible = currentOpen.style.display === 'block';
                            currentOpen.style.display = isVisible ? 'none' : 'block';
                            
                            if (!isVisible) {
                              setTimeout(() => {
                                  currentOpen.style.top = 'auto';
                                  currentOpen.style.bottom = '100%';
                                  currentOpen.style.transform = 'translateY(-4px)';
                              }, 10);
                            }
                          }
                        }}
                        style={{
                          border: `1px solid ${colors.outlineVariant}`,
                          borderRadius: '4px',
                          padding: '8px 12px',
                          ...typography.bodyMedium,
                          width: '100%',
                          backgroundColor: colors.surface,
                          textAlign: 'left',
                          cursor: 'pointer',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}
                      >
                        <span style={{ color: colors.onSurfaceVariant }}>
                          {item.sourceComponent.split(',').filter(s => s.trim()).length > 0 
                            ? `${item.sourceComponent.split(',').filter(s => s.trim()).length} selected`
                            : 'Select components...'
                          }
                        </span>
                        <span style={{ ...typography.labelSmall, color: colors.onSurfaceVariant }}>▼</span>
                      </button>
                      <div
                        id={`dropdown-${item.id}`}
                        style={{
                          position: 'absolute',
                          top: '100%',
                          left: 0,
                          minWidth: '300px',
                          backgroundColor: colors.surface,
                          border: `1px solid ${colors.outlineVariant}`,
                          borderRadius: '4px',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                          zIndex: 9999,
                          display: 'none',
                          maxHeight: '200px',
                          overflowY: 'auto',
                          transform: 'translateY(4px)'
                        }}
                        onMouseLeave={() => {
                          setTimeout(() => {
                            const dropdown = document.getElementById(`dropdown-${item.id}`);
                            if (dropdown) {
                              dropdown.style.display = 'none';
                            }
                          }, 100);
                        }}
                      >
                        {derivedComponentKeys.map((key) => {
                          const isSelected = item.sourceComponent.split(',').filter(s => s.trim()).includes(key);
                          const componentAmount = result.totalsByComponent[key] || 0;
                          return (
                            <label
                              key={key}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '8px 12px',
                                cursor: 'pointer',
                                ...typography.bodyMedium,
                                borderBottom: `1px solid ${colors.outlineVariant}`,
                                backgroundColor: isSelected ? colors.surfaceVariant : colors.surface
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = isSelected ? colors.primaryContainer : colors.surfaceVariant;
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = isSelected ? colors.surfaceVariant : colors.surface;
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center' }}>
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={(e) => {
                                    const currentComponents = item.sourceComponent.split(',').filter(s => s.trim());
                                    let newComponents;
                                    if (e.target.checked) {
                                      newComponents = [...currentComponents, key];
                                    } else {
                                      newComponents = currentComponents.filter(c => c !== key);
                                    }
                                    dispatch(updateDerivedItem({ 
                                      id: item.id, 
                                      updates: { sourceComponent: newComponents.join(',') } 
                                    }));
                                  }}
                                  style={{
                                    marginRight: '8px',
                                    width: '16px',
                                    height: '16px',
                                    accentColor: colors.primary
                                  }}
                                />
                                <span>{titleCase(key)}</span>
                              </div>
                              <span style={{ 
                                color: colors.onSurfaceVariant, 
                                fontSize: '0.75rem',
                                fontWeight: 400,
                                marginLeft: '12px',
                                whiteSpace: 'nowrap'
                              }}>
                                ({formatCurrency(componentAmount)})
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <label style={{ 
                      display: 'block', 
                      ...typography.labelMedium,
                      color: colors.onSurfaceVariant, 
                      marginBottom: '4px' 
                    }}>
                      Percent
                    </label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        value={item.percentOfSource}
                        onChange={(e) => {
                          const value = parseFloat(e.target.value) || 0;
                          dispatch(updateDerivedItem({ 
                            id: item.id, 
                            updates: { percentOfSource: Math.min(100, Math.max(0, value)) } 
                          }));
                        }}
                        placeholder="5.0"
                        style={{
                          border: `1px solid ${colors.outlineVariant}`,
                          borderRadius: '4px',
                          padding: '8px 12px',
                          paddingRight: '32px',
                          ...typography.bodyMedium,
                          width: '100%'
                        }}
                      />
                      <div style={{
                        position: 'absolute',
                        right: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: colors.onSurfaceVariant,
                        ...typography.bodyMedium,
                        fontWeight: 500,
                        pointerEvents: 'none'
                      }}>
                        %
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <label style={{ 
                      display: 'block', 
                      ...typography.labelMedium,
                      color: colors.onSurfaceVariant, 
                      marginBottom: '4px' 
                    }}>
                      Calculated Amount
                    </label>
                    <div style={{
                      border: `1px solid ${colors.outlineVariant}`,
                      borderRadius: '4px',
                      padding: '8px 12px',
                      ...typography.bodyMedium,
                      width: '100%',
                      backgroundColor: colors.surfaceVariant,
                      color: colors.onSurfaceVariant,
                      minHeight: '38px',
                      display: 'flex',
                      alignItems: 'center'
                    }}>
                      {(() => {
                        const sourceComponents = item.sourceComponent.split(',').filter(s => s.trim());
                        const totalSourceAmount = sourceComponents.reduce((sum, component) => {
                          return sum + (result.totalsByComponent[component] || 0);
                        }, 0);
                        const calculatedAmount = totalSourceAmount * (item.percentOfSource / 100);
                        return formatCurrency(calculatedAmount);
                      })()}
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', alignItems: 'flex-end' }}>
                    <button
                      onClick={() => {
                        const newItem = {
                          id: crypto.randomUUID(),
                          name: item.name,
                          sourceComponent: item.sourceComponent,
                          percentOfSource: item.percentOfSource,
                        };
                        dispatch(addDerivedItem());
                      }}
                      style={{
                        border: `1px solid ${colors.outlineVariant}`,
                        backgroundColor: colors.surface,
                        borderRadius: '4px',
                        padding: '8px',
                        cursor: 'pointer',
                        ...typography.labelSmall,
                        width: '40px',
                        height: '40px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: colors.onSurfaceVariant
                      }}
                      title="Duplicate"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
                      </svg>
                    </button>
                    <button
                      onClick={() => dispatch(deleteDerivedItem(item.id))}
                      style={{
                        border: `1px solid ${colors.outlineVariant}`,
                        backgroundColor: colors.surface,
                        borderRadius: '4px',
                        padding: '8px',
                        cursor: 'pointer',
                        ...typography.labelSmall,
                        width: '40px',
                        height: '40px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: colors.error
                      }}
                      title="Delete"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
            
            {derivedItems.length === 0 && (
              <div style={{
                textAlign: 'center',
                color: colors.onSurfaceVariant,
                padding: '48px 24px',
                ...typography.bodyMedium,
                backgroundColor: colors.surface,
                borderRadius: '8px',
                border: `2px dashed ${colors.outlineVariant}`
              }}>
                No additional incentives configured. Click "Add Incentive" to get started.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Target Calculator */}
      <div style={{
        backgroundColor: colors.surface,
        borderRadius: '8px',
        border: `1px solid ${colors.outlineVariant}`,
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        overflow: 'visible'
      }}>
        {/* Header */}
        <div style={{
          padding: '16px 24px',
          borderBottom: `1px solid ${colors.outlineVariant}`,
          backgroundColor: '#fff3e0', // Light orange background
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h3 style={{
            margin: 0,
            ...typography.titleLarge,
            fontWeight: 500,
            color: '#e65100', // Dark orange text
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
            Target Calculator
          </h3>
          <button
            onClick={() => dispatch(addTargetCalculatorItem())}
            style={{
              backgroundColor: '#e65100',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 500
            }}
          >
            Add Target
          </button>
        </div>
        <div style={{ padding: '24px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {targetCalculatorItems.map((item, index) => (
              <div key={item.id} style={{
                padding: '16px',
                border: `1px solid ${colors.outlineVariant}`,
                borderRadius: '8px',
                backgroundColor: index % 2 === 0 ? colors.surface : colors.neutral[50]
              }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr auto', gap: '16px', alignItems: 'end' }}>
                  <div>
                    <label style={{ 
                      display: 'block', 
                      ...typography.labelMedium,
                      color: colors.onSurfaceVariant, 
                      marginBottom: '4px' 
                    }}>
                      Name
                    </label>
                    <input
                      value={item.name}
                      onChange={(e) => {
                        dispatch(updateTargetCalculatorItem({ id: item.id, updates: { name: e.target.value } }));
                      }}
                      placeholder="e.g., Clinical Target"
                      style={{
                        border: `1px solid ${colors.outlineVariant}`,
                        borderRadius: '4px',
                        padding: '8px 12px',
                        ...typography.bodyMedium,
                        width: '100%'
                      }}
                    />
                  </div>
                  
                  <div>
                    <label style={{ 
                      display: 'block', 
                      ...typography.labelMedium,
                      color: colors.onSurfaceVariant, 
                      marginBottom: '4px' 
                    }}>
                      FTE Type
                    </label>
                    <div style={{ position: 'relative' }}>
                      <button
                        onClick={() => {
                          const currentOpen = document.getElementById(`target-dropdown-${item.id}`);
                          if (currentOpen) {
                            const isVisible = currentOpen.style.display === 'block';
                            currentOpen.style.display = isVisible ? 'none' : 'block';
                            
                            if (!isVisible) {
                              setTimeout(() => {
                                  currentOpen.style.top = 'auto';
                                  currentOpen.style.bottom = '100%';
                                  currentOpen.style.transform = 'translateY(-4px)';
                              }, 10);
                            }
                          }
                        }}
                        style={{
                          border: `1px solid ${colors.outlineVariant}`,
                          borderRadius: '4px',
                          padding: '8px 12px',
                          ...typography.bodyMedium,
                          width: '100%',
                          backgroundColor: colors.surface,
                          textAlign: 'left',
                          cursor: 'pointer',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}
                      >
                        <span style={{ color: colors.onSurfaceVariant }}>
                          {item.targetComponents.length > 0 
                            ? `${item.targetComponents.length} selected`
                            : 'Select components...'
                          }
                        </span>
                        <span style={{ ...typography.labelSmall, color: colors.onSurfaceVariant }}>▼</span>
                      </button>
                      <div
                        id={`target-dropdown-${item.id}`}
                        style={{
                          position: 'absolute',
                          bottom: '100%',
                          left: 0,
                          minWidth: '300px',
                          backgroundColor: colors.surface,
                          border: `1px solid ${colors.outlineVariant}`,
                          borderRadius: '4px',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                          zIndex: 9999,
                          display: 'none',
                          maxHeight: '200px',
                          overflowY: 'auto',
                          transform: 'translateY(-4px)'
                        }}
                        onMouseLeave={() => {
                          setTimeout(() => {
                            const dropdown = document.getElementById(`target-dropdown-${item.id}`);
                            if (dropdown) {
                              dropdown.style.display = 'none';
                            }
                          }, 100);
                        }}
                      >
                        {derivedComponentKeys.map((key) => {
                          const isSelected = item.targetComponents.includes(key);
                          const componentAmount = result.totalsByComponent[key] || 0;
                          return (
                            <label
                              key={key}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '8px 12px',
                                cursor: 'pointer',
                                ...typography.bodyMedium,
                                borderBottom: `1px solid ${colors.outlineVariant}`,
                                backgroundColor: isSelected ? colors.surfaceVariant : colors.surface
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = isSelected ? colors.primaryContainer : colors.surfaceVariant;
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = isSelected ? colors.surfaceVariant : colors.surface;
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center' }}>
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      dispatch(updateTargetCalculatorItem({ 
                                        id: item.id, 
                                        updates: { targetComponents: [...item.targetComponents, key] } 
                                      }));
                                    } else {
                                      dispatch(updateTargetCalculatorItem({ 
                                        id: item.id, 
                                        updates: { targetComponents: item.targetComponents.filter(c => c !== key) } 
                                      }));
                                    }
                                  }}
                                  style={{
                                    marginRight: '8px',
                                    width: '16px',
                                    height: '16px',
                                    accentColor: colors.primary
                                  }}
                                />
                                <span>{titleCase(key)}</span>
                              </div>
                              <span style={{ 
                                color: colors.onSurfaceVariant, 
                                fontSize: '0.75rem',
                                fontWeight: 400,
                                marginLeft: '12px',
                                whiteSpace: 'nowrap'
                              }}>
                                ({formatCurrency(componentAmount)})
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <label style={{ 
                      display: 'block', 
                      ...typography.labelMedium,
                      color: colors.onSurfaceVariant, 
                      marginBottom: '4px' 
                    }}>
                      Conversion Factor
                    </label>
                    <input
                      type="text"
                      value={item.conversionFactor === 0 ? '' : item.conversionFactor.toString()}
                      onChange={(e) => {
                        const inputValue = e.target.value;
                        // Allow empty input, numbers, and decimal points
                        // More permissive regex that allows typing decimal numbers
                        if (inputValue === '' || /^[\d.]*$/.test(inputValue)) {
                          // Only update if it's a valid number or empty
                          if (inputValue === '' || !isNaN(parseFloat(inputValue))) {
                            const value = parseFloat(inputValue) || 0;
                            dispatch(updateTargetCalculatorItem({ 
                              id: item.id, 
                              updates: { conversionFactor: value } 
                            }));
                          }
                        }
                      }}
                      onBlur={(e) => {
                        const value = parseFloat(e.target.value) || 0;
                        dispatch(updateTargetCalculatorItem({ 
                          id: item.id, 
                          updates: { conversionFactor: value } 
                        }));
                      }}
                      placeholder="Enter conversion factor (e.g., 50.00)"
                      style={{
                        border: `1px solid ${colors.outlineVariant}`,
                        borderRadius: '4px',
                        padding: '8px 12px',
                        ...typography.bodyMedium,
                        width: '100%',
                        fontFamily: 'inherit'
                      }}
                    />
                  </div>
                  
                  <div>
                    <label style={{ 
                      display: 'block', 
                      ...typography.labelMedium,
                      color: colors.onSurfaceVariant, 
                      marginBottom: '4px' 
                    }}>
                      Target Amount
                    </label>
                    <div style={{
                      border: `1px solid ${colors.outlineVariant}`,
                      borderRadius: '4px',
                      padding: '8px 12px',
                      ...typography.bodyMedium,
                      width: '100%',
                      backgroundColor: colors.surfaceVariant,
                      color: colors.onSurfaceVariant,
                      minHeight: '38px',
                      display: 'flex',
                      alignItems: 'center'
                    }}>
                      {(() => {
                        if (item.useCustomAmount) {
                          return formatCurrency(item.customAmount);
                        }
                        
                        const totalSelectedAmount = item.targetComponents.reduce((sum, component) => {
                          return sum + (result.totalsByComponent[component] || 0);
                        }, 0);
                        
                        const targetAmount = totalSelectedAmount * item.conversionFactor;
                        return formatCurrency(targetAmount);
                      })()}
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', alignItems: 'flex-end' }}>
                    <button
                      onClick={() => {
                        // Copy target calculator settings to clipboard
                        const targetData = {
                          name: item.name,
                          targetComponents: item.targetComponents,
                          conversionFactor: item.conversionFactor,
                          useCustomAmount: item.useCustomAmount,
                          customAmount: item.customAmount,
                          targetAmount: (() => {
                            if (item.useCustomAmount) {
                              return item.customAmount;
                            }
                            const totalSelectedAmount = item.targetComponents.reduce((sum, component) => {
                              return sum + (result.totalsByComponent[component] || 0);
                            }, 0);
                            return totalSelectedAmount * item.conversionFactor;
                          })()
                        };
                        
                        navigator.clipboard.writeText(JSON.stringify(targetData, null, 2)).then(() => {
                          console.log('Target calculator settings copied to clipboard');
                        }).catch(err => {
                          console.error('Failed to copy to clipboard:', err);
                        });
                      }}
                      style={{
                        border: `1px solid ${colors.outlineVariant}`,
                        backgroundColor: colors.surface,
                        borderRadius: '4px',
                        padding: '8px',
                        cursor: 'pointer',
                        ...typography.labelSmall,
                        width: '40px',
                        height: '40px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: colors.onSurfaceVariant
                      }}
                      title="Copy Target Calculator Settings"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
                      </svg>
                    </button>
                    <button
                      onClick={() => dispatch(deleteTargetCalculatorItem(item.id))}
                      style={{
                        border: `1px solid ${colors.outlineVariant}`,
                        backgroundColor: colors.surface,
                        borderRadius: '4px',
                        padding: '8px',
                        cursor: 'pointer',
                        ...typography.labelSmall,
                        width: '40px',
                        height: '40px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: colors.error
                      }}
                      title="Delete Target Calculator"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                      </svg>
                    </button>
                  </div>
                </div>
                
                {/* Custom Amount Toggle */}
                <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    onClick={() => dispatch(updateTargetCalculatorItem({ 
                      id: item.id, 
                      updates: { useCustomAmount: !item.useCustomAmount } 
                    }))}
                    style={{
                      border: `1px solid ${colors.outlineVariant}`,
                      backgroundColor: item.useCustomAmount ? colors.primary : colors.surface,
                      color: item.useCustomAmount ? colors.onPrimary : colors.onSurface,
                      borderRadius: '4px',
                      padding: '8px 12px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: '500',
                      whiteSpace: 'nowrap'
                    }}
                    title={item.useCustomAmount ? 'Use calculated amounts' : 'Use custom amount'}
                  >
                    {item.useCustomAmount ? 'Use Calculated' : 'Use Custom'}
                  </button>
                  
                  {item.useCustomAmount && (
                    <div style={{ flex: 1 }}>
                      <label style={{ 
                        display: 'block', 
                        ...typography.labelMedium,
                        color: colors.onSurfaceVariant, 
                        marginBottom: '4px'
                      }}>
                        Custom Amount ($)
                      </label>
                      <input
                        type="text"
                        value={item.customAmount === 0 ? '' : item.customAmount.toString()}
                        onChange={(e) => {
                          const value = e.target.value.replace(/[^0-9.]/g, '');
                          const parsed = parseFloat(value) || 0;
                          dispatch(updateTargetCalculatorItem({ 
                            id: item.id, 
                            updates: { customAmount: parsed } 
                          }));
                        }}
                        onBlur={(e) => {
                          const value = parseFloat(e.target.value) || 0;
                          dispatch(updateTargetCalculatorItem({ 
                            id: item.id, 
                            updates: { customAmount: value } 
                          }));
                        }}
                        placeholder="Enter custom amount"
                        style={{
                          border: `1px solid ${colors.outlineVariant}`,
                          borderRadius: '4px',
                          padding: '8px 12px',
                          ...typography.bodyMedium,
                          width: '100%',
                          textAlign: 'left',
                          backgroundColor: colors.surface,
                          color: colors.onSurface
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {targetCalculatorItems.length === 0 && (
              <div style={{
                textAlign: 'center',
                color: colors.onSurfaceVariant,
                padding: '48px 24px',
                ...typography.bodyMedium,
                backgroundColor: colors.surface,
                borderRadius: '8px',
                border: `2px dashed ${colors.outlineVariant}`
              }}>
                No target calculators configured. Click "Add Target" to get started.
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};
