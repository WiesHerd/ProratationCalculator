import React from 'react';
import { useSelector } from 'react-redux';
import { selectCalculationResult, selectDerivedComponentKeys } from '../calculator-slice';
import { formatCurrency, formatDate } from '../../../lib/format';
import { titleCase } from '../../../lib/keys';
import { dayCountInclusive } from '../../../lib/proration';
import { typography, colors } from '../../../styles/theme';

export const TotalsDisplay: React.FC = () => {
  const result = useSelector(selectCalculationResult);
  const derivedComponentKeys = useSelector(selectDerivedComponentKeys);

  return (
    <>
      {/* Totals Summary Cards */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '16px' 
      }}>
        {derivedComponentKeys.map((key) => (
          <div key={key} style={{
            backgroundColor: colors.surface,
            padding: '20px',
            borderRadius: '12px',
            border: `1px solid ${colors.outlineVariant}`,
            boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)',
            textAlign: 'center',
            transition: 'all 0.2s ease-in-out',
            cursor: 'pointer'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15), 0 2px 4px rgba(0,0,0,0.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)';
          }}>
            <div style={{ 
              ...typography.labelMedium,
              textTransform: 'uppercase', 
              color: colors.onSurfaceVariant,
              marginBottom: '12px',
              letterSpacing: '0.5px',
              fontWeight: 600
            }}>
              {key === 'medical_director' ? 'MEDICAL DIRECTOR' : 
               key === 'division_chief' ? 'DIVISION CHIEF' : 
               titleCase(key).toUpperCase()}
            </div>
            <div style={{ 
              ...typography.headlineSmall,
              fontWeight: 600,
              color: colors.onSurface,
              fontSize: '24px'
            }}>
              {formatCurrency(result.totalsByComponent[key] || 0)}
            </div>
          </div>
        ))}
        <div style={{
          backgroundColor: colors.surface,
          padding: '20px',
          borderRadius: '12px',
          border: `1px solid ${colors.outlineVariant}`,
          boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)',
          textAlign: 'center',
          transition: 'all 0.2s ease-in-out',
          cursor: 'pointer'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15), 0 2px 4px rgba(0,0,0,0.1)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)';
        }}>
          <div style={{ 
            ...typography.labelMedium,
            textTransform: 'uppercase', 
            color: colors.onSurfaceVariant,
            marginBottom: '12px',
            letterSpacing: '0.5px',
            fontWeight: 600
          }}>
            Additional Incentives
          </div>
          <div style={{ 
            ...typography.headlineSmall,
            fontWeight: 600,
            color: colors.onSurface,
            fontSize: '24px'
          }}>
            {formatCurrency(Object.values(result.derivedTotals).reduce((sum, amount) => sum + amount, 0))}
          </div>
        </div>
        <div style={{
          backgroundColor: '#e8f5e8', // Light green background
          color: '#2e7d32', // Dark green text
          padding: '20px',
          borderRadius: '12px',
          border: `1px solid #c8e6c9`,
          boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)',
          textAlign: 'center',
          transition: 'all 0.2s ease-in-out',
          cursor: 'pointer'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15), 0 2px 4px rgba(0,0,0,0.1)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)';
        }}>
          <div style={{ 
            ...typography.labelMedium,
            textTransform: 'uppercase', 
            opacity: 0.9,
            marginBottom: '12px',
            letterSpacing: '0.5px',
            fontWeight: 600
          }}>
            Total Cash Compensation
          </div>
          <div style={{ 
            ...typography.headlineSmall,
            fontWeight: 600,
            color: '#2e7d32',
            fontSize: '24px'
          }}>
            {formatCurrency(result.tcc)}
          </div>
        </div>
      </div>

      {/* Period Breakdown */}
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
          backgroundColor: colors.primaryContainer
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
              <path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z"/>
            </svg>
            Period Breakdown
          </h3>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px', border: 'none' }}>
            <thead>
              <tr style={{ backgroundColor: colors.primaryContainer, borderBottom: `1px solid ${colors.outlineVariant}` }}>
                <th style={{ 
                  padding: '12px', 
                  textAlign: 'left', 
                  ...typography.labelLarge,
                  color: colors.onPrimaryContainer 
                }}>Period</th>
                <th style={{ 
                  padding: '12px', 
                  textAlign: 'center', 
                  ...typography.labelLarge,
                  color: colors.onPrimaryContainer 
                }}>Days</th>
                <th style={{ 
                  padding: '12px', 
                  textAlign: 'right', 
                  ...typography.labelLarge,
                  color: colors.onPrimaryContainer 
                }}>Base Salary</th>
                {derivedComponentKeys.map((key) => (
                  <th key={key} style={{ 
                    padding: '12px', 
                    textAlign: 'right', 
                    ...typography.labelLarge,
                    color: colors.onPrimaryContainer 
                  }}>
                    {key === 'medical_director' ? 'Medical Director' : 
                     key === 'division_chief' ? 'Division Chief' : 
                     titleCase(key)}
                  </th>
                ))}
                <th style={{ 
                  padding: '12px', 
                  textAlign: 'right', 
                  ...typography.labelLarge,
                  color: colors.onPrimaryContainer 
                }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {result.breakdown.map((row) => (
                <tr key={row.periodId} style={{ 
                  backgroundColor: colors.surface
                }}>
                  <td style={{ 
                    padding: '12px', 
                    ...typography.bodyMedium,
                    fontWeight: 500, 
                    whiteSpace: 'nowrap', 
                    color: colors.onSurface 
                  }}>
                    ({formatDate(row.startDate)}) to ({formatDate(row.endDate)})
                  </td>
                  <td style={{ 
                    padding: '12px', 
                    textAlign: 'center', 
                    ...typography.bodyMedium,
                    fontWeight: 500, 
                    color: colors.onSurface 
                  }}>
                    {row.days}
                  </td>
                  <td style={{ 
                    padding: '12px', 
                    textAlign: 'right', 
                    ...typography.bodyMedium,
                    fontWeight: 500, 
                    color: colors.onSurface 
                  }}>
                    {formatCurrency(row.baseSalary)}
                  </td>
                  {derivedComponentKeys.map((key) => (
                    <td key={key} style={{ 
                      padding: '12px', 
                      textAlign: 'right', 
                      ...typography.bodyMedium,
                      fontWeight: 500, 
                      color: colors.onSurface 
                    }}>
                      {formatCurrency(row.componentAmounts[key] || 0)}
                    </td>
                  ))}
                  <td style={{ 
                    padding: '12px', 
                    textAlign: 'right', 
                    ...typography.bodyMedium,
                    fontWeight: 500, 
                    color: colors.onSurface 
                  }}>
                    {formatCurrency(row.totalAmount)}
                  </td>
                </tr>
              ))}
              <tr style={{ 
                backgroundColor: colors.neutral[100],
                borderTop: `2px solid ${colors.outlineVariant}`
              }}>
                <td style={{ 
                  padding: '12px', 
                  ...typography.labelLarge,
                  fontWeight: 500, 
                  color: colors.onSurface 
                }}>TOTALS</td>
                <td style={{ 
                  padding: '12px', 
                  textAlign: 'center', 
                  ...typography.labelLarge,
                  fontWeight: 500, 
                  color: colors.onSurface 
                }}>
                  {/* Calculate unique days by grouping by start/end date combinations */}
                  {(() => {
                    const uniquePeriods = new Map<string, { startDate: string; endDate: string }>();
                    result.breakdown.forEach(row => {
                      const key = `${row.startDate}-${row.endDate}`;
                      if (!uniquePeriods.has(key)) {
                        uniquePeriods.set(key, { startDate: row.startDate, endDate: row.endDate });
                      }
                    });
                    return Array.from(uniquePeriods.values()).reduce((sum, period) => 
                      sum + dayCountInclusive(period.startDate, period.endDate), 0
                    );
                  })()}
                </td>
                <td style={{ 
                  padding: '12px', 
                  textAlign: 'right', 
                  ...typography.labelLarge,
                  fontWeight: 500, 
                  color: colors.onSurface 
                }}>
                  {/* Empty for Base Salary total */}
                </td>
                {derivedComponentKeys.map((key) => (
                  <td key={key} style={{ 
                    padding: '12px', 
                    textAlign: 'right', 
                    ...typography.labelLarge,
                    fontWeight: 500, 
                    color: colors.onSurface 
                  }}>
                    {formatCurrency(result.totalsByComponent[key] || 0)}
                  </td>
                ))}
                <td style={{ 
                  padding: '12px', 
                  textAlign: 'right', 
                  ...typography.labelLarge,
                  fontWeight: 500, 
                  color: colors.onSurface 
                }}>
                  {formatCurrency(Object.values(result.totalsByComponent).reduce((sum, amount) => sum + amount, 0))}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};
