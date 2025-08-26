import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  selectPeriods, 
  selectComponentKeys, 
  selectValidation,
  addPeriod, 
  updatePeriod, 
  deletePeriod, 
  duplicatePeriod,
  addComponentKey 
} from '../calculator-slice';
import { formatCurrency, parseCurrency } from '../../../lib/format';
import { titleCase } from '../../../lib/keys';
import { dayCountInclusive, daysInYear } from '../../../lib/proration';
import { typography, colors } from '../../../styles/theme';

export const PeriodsManager: React.FC = () => {
  const dispatch = useDispatch();
  const periods = useSelector(selectPeriods);
  const componentKeys = useSelector(selectComponentKeys);
  const validation = useSelector(selectValidation);

  const handleBaseSalaryChange = (id: string, value: string) => {
    dispatch(updatePeriod({ id, updates: { baseSalaryStr: value } }));
  };

  const handleBaseSalaryBlur = (id: string) => {
    const period = periods.find((p) => p.id === id);
    if (period?.baseSalaryStr) {
      const parsed = parseCurrency(period.baseSalaryStr);
      dispatch(updatePeriod({ 
        id, 
        updates: { 
          baseSalary: parsed,
          baseSalaryStr: formatCurrency(parsed)
        }
      }));
    }
  };

  const handleAddPeriod = () => {
    dispatch(addPeriod());
  };

  const handleDuplicateLast = () => {
    if (periods.length > 0) {
      const lastPeriod = periods[periods.length - 1];
      dispatch(duplicatePeriod(lastPeriod.id));
    } else {
      dispatch(addPeriod());
    }
  };

  return (
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
        borderBottom: 'none',
        backgroundColor: colors.neutral[200],
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h3 style={{ 
          margin: 0, 
          ...typography.titleLarge,
          fontWeight: 500,
          color: colors.onPrimaryContainer,
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/>
          </svg>
          Periods & FTE Splits
        </h3>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={handleAddPeriod}
            style={{
              backgroundColor: '#1976d2',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1565c0'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#1976d2'}
          >
            Add Period
          </button>
          <button
            onClick={handleDuplicateLast}
            style={{
              backgroundColor: '#6b7280',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#4b5563'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#6b7280'}
          >
            Duplicate Last
          </button>
        </div>
      </div>

      {/* Validation Errors */}
      {validation.errors.length > 0 && (
        <div style={{
          padding: '16px 24px',
          borderBottom: '1px solid #e0e0e0',
          backgroundColor: '#ffebee',
          color: '#c62828'
        }}>
          <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: 600 }}>
            Validation Errors:
          </h4>
          <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '14px' }}>
            {validation.errors.map((error, index) => (
              <li key={index}>{error.message}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px', border: 'none' }}>
          <thead>
            <tr style={{ backgroundColor: colors.neutral[200], borderBottom: `1px solid ${colors.outlineVariant}` }}>
              <th style={{ 
                padding: '12px', 
                textAlign: 'left', 
                ...typography.labelLarge,
                color: colors.onSurface,
                border: 'none'
              }}>Start Date</th>
              <th style={{ 
                padding: '12px', 
                textAlign: 'left', 
                ...typography.labelLarge,
                color: colors.onSurface,
                border: 'none'
              }}>End Date</th>
              <th style={{ 
                padding: '12px', 
                textAlign: 'center', 
                ...typography.labelLarge,
                color: colors.onSurface,
                border: 'none'
              }}>Days</th>
              <th style={{ 
                padding: '12px', 
                textAlign: 'center', 
                ...typography.labelLarge,
                color: colors.onSurface,
                border: 'none'
              }}>FTE</th>
              <th style={{ 
                padding: '12px', 
                textAlign: 'center', 
                ...typography.labelLarge,
                color: colors.onSurface,
                border: 'none'
              }}>% of Time</th>
              <th style={{ 
                padding: '12px', 
                textAlign: 'right', 
                ...typography.labelLarge,
                color: colors.onSurface,
                border: 'none'
              }}>Base Salary</th>
              <th style={{ 
                padding: '12px', 
                textAlign: 'left', 
                ...typography.labelLarge,
                color: colors.onSurface,
                border: 'none'
              }}>FTE Type</th>
              <th style={{ 
                padding: '12px', 
                textAlign: 'right', 
                ...typography.labelLarge,
                color: colors.onSurface,
                border: 'none'
              }}>Prorated Salary</th>
              <th style={{ 
                padding: '12px', 
                textAlign: 'center', 
                ...typography.labelLarge,
                color: colors.onSurface,
                border: 'none'
              }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {periods.map((period) => {
              const days = dayCountInclusive(period.startDate, period.endDate);
              const daysInYearValue = daysInYear(2025);
              const percentOfYear = ((days / daysInYearValue) * 100).toFixed(1);
              const totalFte = Object.values(period.splits).reduce((sum: number, fte: number | undefined) => sum + (fte ?? 0), 0);
              const proratedSalary = (period.baseSalary * totalFte * days) / daysInYearValue;

              return (
                <tr key={period.id} style={{ backgroundColor: colors.surface }}>
                  <td style={{ padding: '12px' }}>
                    <input
                      type="date"
                      value={period.startDate}
                      onChange={(e) => dispatch(updatePeriod({ id: period.id, updates: { startDate: e.target.value } }))}
                      placeholder="YYYY-MM-DD"
                      title="Click to open calendar or type date (YYYY-MM-DD)"
                      style={{
                        border: `1px solid ${colors.outlineVariant}`,
                        borderRadius: '4px',
                        padding: '6px 8px',
                        ...typography.bodyMedium,
                        width: '130px',
                        fontFamily: 'inherit',
                        fontWeight: 500,
                        color: colors.onSurface
                      }}
                    />
                  </td>
                  <td style={{ padding: '12px' }}>
                    <input
                      type="date"
                      value={period.endDate}
                      onChange={(e) => dispatch(updatePeriod({ id: period.id, updates: { endDate: e.target.value } }))}
                      placeholder="YYYY-MM-DD"
                      title="Click to open calendar or type date (YYYY-MM-DD)"
                      style={{
                        border: `1px solid ${colors.outlineVariant}`,
                        borderRadius: '4px',
                        padding: '6px 8px',
                        ...typography.bodyMedium,
                        width: '130px',
                        fontFamily: 'inherit',
                        fontWeight: 500,
                        color: colors.onSurface
                      }}
                    />
                  </td>
                  <td style={{ 
                    padding: '12px', 
                    textAlign: 'center', 
                    ...typography.bodyMedium,
                    fontWeight: 500,
                    color: colors.onSurface
                  }}>
                    {days}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={(() => {
                        const maxFte = Math.max(...Object.values(period.splits).map(v => v ?? 0));
                        return maxFte > 0 ? maxFte : 0;
                      })()}
                      onChange={(e) => {
                        const newFte = parseFloat(e.target.value) || 0;
                        const newSplits = { ...period.splits };
                        
                        const currentMaxFte = Math.max(...Object.values(period.splits).map(v => v ?? 0));
                        const activeComponent = Object.keys(period.splits).find(key => (period.splits[key] ?? 0) === currentMaxFte);
                        
                        if (activeComponent) {
                          newSplits[activeComponent] = Math.max(0, newFte);
                        }
                        
                        dispatch(updatePeriod({ id: period.id, updates: { splits: newSplits } }));
                      }}
                      style={{
                        border: `1px solid ${colors.outlineVariant}`,
                        borderRadius: '4px',
                        padding: '6px 8px',
                        ...typography.bodyMedium,
                        width: '70px',
                        textAlign: 'center',
                        fontWeight: 500,
                        color: colors.onSurface
                      }}
                    />
                  </td>
                  <td style={{ 
                    padding: '12px', 
                    textAlign: 'center', 
                    ...typography.bodyMedium,
                    fontWeight: 500,
                    color: colors.onSurface
                  }}>
                    {percentOfYear}%
                  </td>
                  <td style={{ padding: '12px' }}>
                    <input
                      value={period.baseSalaryStr || ''}
                      onChange={(e) => handleBaseSalaryChange(period.id, e.target.value)}
                      onBlur={() => handleBaseSalaryBlur(period.id)}
                      placeholder="0.00"
                      style={{
                        border: `1px solid ${colors.outlineVariant}`,
                        borderRadius: '4px',
                        padding: '6px 8px',
                        ...typography.bodyMedium,
                        width: '110px',
                        textAlign: 'right',
                        fontWeight: 500,
                        color: colors.onSurface
                      }}
                    />
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    <select 
                      key={`${period.id}-type`}
                      value={(() => {
                        const maxFte = Math.max(...Object.values(period.splits).map(v => v ?? 0));
                        const activeComponent = Object.keys(period.splits).find(key => (period.splits[key] ?? 0) === maxFte);
                        return activeComponent || 'clinical';
                      })()}
                      onChange={(e) => {
                        const selectedType = e.target.value;
                        
                        if (!componentKeys.includes(selectedType)) {
                          dispatch(addComponentKey(selectedType));
                        }
                        
                        const newSplits: Record<string, number> = {};
                        const allKeys = [...componentKeys, selectedType];
                        allKeys.forEach(key => {
                          newSplits[key] = 0;
                        });
                        
                        const currentFte = Math.max(...Object.values(period.splits).map(v => v ?? 0));
                        newSplits[selectedType] = currentFte;
                        
                        dispatch(updatePeriod({ id: period.id, updates: { splits: newSplits } }));
                      }}
                      style={{
                        border: `1px solid ${colors.outlineVariant}`,
                        borderRadius: '4px',
                        padding: '6px 8px',
                        ...typography.bodyMedium,
                        width: '140px',
                        fontWeight: 500,
                        color: colors.onSurface
                      }}
                    >
                      <option value="clinical">Clinical</option>
                      <option value="medical_director">Medical Director</option>
                      <option value="division_chief">Division Chief</option>
                      <option value="section_chief">Section Chief</option>
                      <option value="admin">Admin</option>
                      <option value="research">Research</option>
                      <option value="teaching">Teaching</option>
                      <option value="other">Other</option>
                    </select>
                  </td>
                  <td style={{ 
                    padding: '12px', 
                    textAlign: 'right', 
                    ...typography.bodyMedium,
                    fontWeight: 500,
                    color: colors.onSurface
                  }}>
                    {formatCurrency(proratedSalary)}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                      <button
                        onClick={() => dispatch(duplicatePeriod(period.id))}
                        style={{
                          border: `1px solid ${colors.outlineVariant}`,
                          backgroundColor: colors.surface,
                          borderRadius: '4px',
                          padding: '6px',
                          cursor: 'pointer',
                          ...typography.labelSmall,
                          width: '32px',
                          height: '32px',
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
                        onClick={() => dispatch(deletePeriod(period.id))}
                        style={{
                          border: `1px solid ${colors.outlineVariant}`,
                          backgroundColor: colors.surface,
                          borderRadius: '4px',
                          padding: '6px',
                          cursor: 'pointer',
                          ...typography.labelSmall,
                          width: '32px',
                          height: '32px',
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
                  </td>
                </tr>
              );
            })}
            
            {/* Totals Row */}
            <tr style={{ 
              backgroundColor: colors.neutral[100],
              borderTop: `2px solid ${colors.outlineVariant}`
            }}>
              <td style={{ 
                padding: '12px', 
                ...typography.labelLarge,
                fontWeight: 600,
                color: colors.onSurface
              }}>
                TOTALS
              </td>
              <td style={{ 
                padding: '12px', 
                ...typography.labelLarge,
                fontWeight: 600,
                color: colors.onSurface
              }}>
                {/* Empty for End Date */}
              </td>
              <td style={{ 
                padding: '12px', 
                textAlign: 'center',
                ...typography.labelLarge,
                fontWeight: 600,
                color: colors.onSurface
              }}>
                {(() => {
                  const uniquePeriods = new Map<string, { startDate: string; endDate: string }>();
                  periods.forEach(period => {
                    const key = `${period.startDate}-${period.endDate}`;
                    if (!uniquePeriods.has(key)) {
                      uniquePeriods.set(key, { startDate: period.startDate, endDate: period.endDate });
                    }
                  });
                  return Array.from(uniquePeriods.values()).reduce((sum, period) => 
                    sum + dayCountInclusive(period.startDate, period.endDate), 0
                  );
                })()}
              </td>
              <td style={{ 
                padding: '12px', 
                textAlign: 'center',
                ...typography.labelLarge,
                fontWeight: 600,
                color: colors.onSurface
              }}>
                {periods.reduce((sum: number, period) => {
                  const periodFte = Object.values(period.splits).reduce((periodSum: number, fte: number | undefined) => periodSum + (fte || 0), 0);
                  return sum + periodFte;
                }, 0).toFixed(2)}
              </td>
              <td style={{ 
                padding: '12px', 
                textAlign: 'center',
                ...typography.labelLarge,
                fontWeight: 600,
                color: colors.onSurface
              }}>
                {(((() => {
                  const uniquePeriods = new Map<string, { startDate: string; endDate: string }>();
                  periods.forEach(period => {
                    const key = `${period.startDate}-${period.endDate}`;
                    if (!uniquePeriods.has(key)) {
                      uniquePeriods.set(key, { startDate: period.startDate, endDate: period.endDate });
                    }
                  });
                  return Array.from(uniquePeriods.values()).reduce((sum, period) => 
                    sum + dayCountInclusive(period.startDate, period.endDate), 0
                  );
                })()) / daysInYear(2025) * 100).toFixed(1)}%
              </td>
              <td style={{ 
                padding: '12px', 
                textAlign: 'right',
                ...typography.labelLarge,
                fontWeight: 600,
                color: colors.onSurface
              }}>
                {/* Empty for Base Salary */}
              </td>
              <td style={{ 
                padding: '12px', 
                textAlign: 'center',
                ...typography.labelLarge,
                fontWeight: 600,
                color: colors.onSurface
              }}>
                {/* Empty for Type */}
              </td>
              <td style={{ 
                padding: '12px', 
                textAlign: 'right',
                ...typography.labelLarge,
                fontWeight: 600,
                color: colors.onSurface
              }}>
                {formatCurrency(periods.reduce((sum: number, period) => {
                  const days = dayCountInclusive(period.startDate, period.endDate);
                  const daysInYearValue = daysInYear(2025);
                  const totalFte = Object.values(period.splits).reduce((periodSum: number, fte: number | undefined) => periodSum + (fte || 0), 0);
                  const proratedSalary = (period.baseSalary * totalFte * days) / daysInYearValue;
                  return sum + proratedSalary;
                }, 0))}
              </td>
              <td style={{ 
                padding: '12px', 
                textAlign: 'center',
                ...typography.labelLarge,
                fontWeight: 600,
                color: colors.onSurface
              }}>
                {/* Empty for Actions */}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};
