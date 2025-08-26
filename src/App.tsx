import React, { useState } from 'react';
import { useIndexedDBState } from './hooks/useIndexedDBState';
import { formatCurrency, parseCurrency, formatDate } from './lib/format';
import { titleCase } from './lib/keys';
import { BasePeriod, DerivedItem, validateInputs, prorate, computeDerived, calculateTCC, dayCountInclusive, daysInYear } from './lib/proration';
import { CalculationRecord, indexedDBService } from './lib/indexedDB';
import { History } from './components/History';
import { SaveCalculation } from './components/SaveCalculation';
import * as XLSX from 'xlsx';


// Google Material Design 3 Typography System
const typography = {
  // Display styles
  displayLarge: { fontSize: '57px', fontWeight: 400, lineHeight: '64px', letterSpacing: '-0.25px' },
  displayMedium: { fontSize: '45px', fontWeight: 400, lineHeight: '52px', letterSpacing: '0px' },
  displaySmall: { fontSize: '36px', fontWeight: 400, lineHeight: '44px', letterSpacing: '0px' },
  
  // Headline styles
  headlineLarge: { fontSize: '32px', fontWeight: 400, lineHeight: '40px', letterSpacing: '0px' },
  headlineMedium: { fontSize: '28px', fontWeight: 400, lineHeight: '36px', letterSpacing: '0px' },
  headlineSmall: { fontSize: '24px', fontWeight: 400, lineHeight: '32px', letterSpacing: '0px' },
  
  // Title styles
  titleLarge: { fontSize: '22px', fontWeight: 400, lineHeight: '28px', letterSpacing: '0px' },
  titleMedium: { fontSize: '16px', fontWeight: 500, lineHeight: '24px', letterSpacing: '0.15px' },
  titleSmall: { fontSize: '14px', fontWeight: 500, lineHeight: '20px', letterSpacing: '0.1px' },
  
  // Body styles
  bodyLarge: { fontSize: '16px', fontWeight: 400, lineHeight: '24px', letterSpacing: '0.5px' },
  bodyMedium: { fontSize: '14px', fontWeight: 400, lineHeight: '20px', letterSpacing: '0.25px' },
  bodySmall: { fontSize: '12px', fontWeight: 400, lineHeight: '16px', letterSpacing: '0.4px' },
  
  // Label styles
  labelLarge: { fontSize: '14px', fontWeight: 500, lineHeight: '20px', letterSpacing: '0.1px' },
  labelMedium: { fontSize: '12px', fontWeight: 500, lineHeight: '16px', letterSpacing: '0.5px' },
  labelSmall: { fontSize: '11px', fontWeight: 500, lineHeight: '16px', letterSpacing: '0.5px' }
};

// Google Material Design 3 Color System
const colors = {
  // Primary colors
  primary: '#1976d2',
  primaryContainer: '#e3f2fd',
  onPrimary: '#ffffff',
  onPrimaryContainer: '#0d47a1',
  
  // Surface colors
  surface: '#ffffff',
  surfaceVariant: '#f8f9fa',
  onSurface: '#1c1b1f',
  onSurfaceVariant: '#49454f',
  
  // Outline colors
  outline: '#79747e',
  outlineVariant: '#cac4d0',
  
  // State colors
  error: '#ba1a1a',
  errorContainer: '#ffebee',
  onError: '#ffffff',
  onErrorContainer: '#410002',
  
  // Neutral colors
  neutral: {
    50: '#fafafa',
    100: '#f5f5f5',
    200: '#eeeeee',
    300: '#e0e0e0',
    400: '#bdbdbd',
    500: '#9e9e9e',
    600: '#757575',
    700: '#616161',
    800: '#424242',
    900: '#212121'
  }
};

// Sample seed data
const seedPeriods: BasePeriod[] = [
  {
    id: crypto.randomUUID(),
    startDate: '2025-01-01',
    endDate: '2025-08-24',
    baseSalary: 1529264.25,
    baseSalaryStr: '$1,529,264.25',
    splits: { clinical: 0.8 },
  },
  {
    id: crypto.randomUUID(),
    startDate: '2025-08-25',
    endDate: '2025-12-31',
    baseSalary: 2150000.00,
    baseSalaryStr: '$2,150,000.00',
    splits: { clinical: 0.8 },
  },
];

const seedDerivedItems: DerivedItem[] = [
  {
    id: crypto.randomUUID(),
    name: 'PSQ',
    sourceComponent: 'clinical',
    percentOfSource: 5,
  },
];

function App() {
  // Local state management
  const [year, setYear] = useIndexedDBState('tcc.year', 2025);
  const [componentKeys, setComponentKeys] = useIndexedDBState('tcc.componentKeys', ['clinical']);
  const [periods, setPeriods] = useIndexedDBState('tcc.periods', seedPeriods);
  const [derivedItems, setDerivedItems] = useIndexedDBState('tcc.derivedItems', seedDerivedItems);

  // Save/History modal state
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  // Target Calculator state
  const [targetCalculatorItems, setTargetCalculatorItems] = useState<Array<{
    id: string;
    name: string;
    targetComponents: string[];
    conversionFactor: number;
    conversionFactorStr: string;
    useCustomAmount: boolean;
    customAmount: number;
  }>>([]);

  // Derive componentKeys from periods to prevent flickering
  const derivedComponentKeys = React.useMemo(() => {
    const allKeys = new Set<string>();
    periods.forEach(period => {
      Object.keys(period.splits).forEach(key => {
        if (period.splits[key] && period.splits[key]! > 0) {
          allKeys.add(key);
        }
      });
    });
    return Array.from(allKeys);
  }, [periods]);

  // Validation and calculation - simplified to prevent loops
  const validation = validateInputs(periods, year);
  const prorationResult = prorate(periods, year, derivedComponentKeys);
  const derivedTotals = computeDerived(prorationResult.totalsByComponent, derivedItems);
  const tcc = calculateTCC(prorationResult.totalsByComponent, derivedTotals);
  
  // Debug logging to see what's happening with componentKeys and breakdown
  console.log('Debug - componentKeys:', componentKeys);
  console.log('Debug - periods:', periods.map(p => ({ id: p.id, splits: p.splits })));
  console.log('Debug - breakdown:', prorationResult.breakdown);

  // Combine results
  const result = {
    ...prorationResult,
    derivedTotals,
    tcc,
  };

  // Remove the problematic useEffect entirely - we'll handle component key management differently

  const addPeriod = () => {
    const newPeriod: BasePeriod = {
      id: crypto.randomUUID(),
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
      baseSalary: 0,
      baseSalaryStr: '',
      splits: { clinical: 1.0 }, // Default to clinical with 1.0 FTE
    };
    setPeriods([...periods, newPeriod]);
  };

  const updatePeriod = (id: string, updates: Partial<BasePeriod>) => {
    setPeriods(
      periods.map((period) =>
        period.id === id ? { ...period, ...updates } : period
      )
    );
  };

  const deletePeriod = (id: string) => {
    setPeriods(periods.filter((period) => period.id !== id));
  };

  const duplicatePeriod = (id: string) => {
    const period = periods.find((p) => p.id === id);
    if (period) {
      const newPeriod: BasePeriod = {
        ...period,
        id: crypto.randomUUID(),
      };
      setPeriods([...periods, newPeriod]);
    }
  };

  const handleBaseSalaryChange = (id: string, value: string) => {
    updatePeriod(id, { baseSalaryStr: value });
  };

  const handleBaseSalaryBlur = (id: string) => {
    const period = periods.find((p) => p.id === id);
    if (period?.baseSalaryStr) {
      const parsed = parseCurrency(period.baseSalaryStr);
      updatePeriod(id, { 
        baseSalary: parsed,
        baseSalaryStr: formatCurrency(parsed)
      });
    }
  };

  const handleConversionFactorChange = (id: string, value: string) => {
    updateTargetCalculatorItem(id, { conversionFactorStr: value });
  };

  const handleConversionFactorBlur = (id: string) => {
    const item = targetCalculatorItems.find((i) => i.id === id);
    if (item?.conversionFactorStr) {
      const parsed = parseFloat(item.conversionFactorStr) || 0;
      updateTargetCalculatorItem(id, { 
        conversionFactor: parsed,
        conversionFactorStr: parsed === 0 ? '' : parsed.toString()
      });
    }
  };

  const handleSaveCalculation = () => {
    setShowSaveModal(false);
    // The save is handled in the SaveCalculation component
  };

  // Target Calculator helper functions
  const addTargetCalculatorItem = () => {
    const newItem = {
      id: crypto.randomUUID(),
      name: '',
      targetComponents: [],
      conversionFactor: 0,
      conversionFactorStr: '',
      useCustomAmount: false,
      customAmount: 0,
    };
    setTargetCalculatorItems([...targetCalculatorItems, newItem]);
  };

  const updateTargetCalculatorItem = (id: string, updates: Partial<{
    name: string;
    targetComponents: string[];
    conversionFactor: number;
    conversionFactorStr: string;
    useCustomAmount: boolean;
    customAmount: number;
  }>) => {
    setTargetCalculatorItems(
      targetCalculatorItems.map((item) =>
        item.id === id ? { ...item, ...updates } : item
      )
    );
  };

  const deleteTargetCalculatorItem = (id: string) => {
    setTargetCalculatorItems(targetCalculatorItems.filter((item) => item.id !== id));
  };

  const handleLoadCalculation = (record: CalculationRecord) => {
    setYear(record.year);
    setComponentKeys(record.componentKeys);
    setPeriods(record.periods);
    setDerivedItems(record.derivedItems);
    setTargetCalculatorItems(record.targetCalculatorItems || []); // Load Target Calculator items
  };

  const handleExportToExcel = () => {
    const workbook = XLSX.utils.book_new();

    // Calculate total days properly (sum of unique period days, not individual breakdown days)
    const uniquePeriods = new Map<string, { startDate: string; endDate: string }>();
    periods.forEach(period => {
      const key = `${period.startDate}-${period.endDate}`;
      if (!uniquePeriods.has(key)) {
        uniquePeriods.set(key, { startDate: period.startDate, endDate: period.endDate });
      }
    });
    const totalDays = Array.from(uniquePeriods.values()).reduce((sum, period) => 
      sum + dayCountInclusive(period.startDate, period.endDate), 0
    );

    // ===== SHEET 1: PERIOD BREAKDOWN =====
    // Get ALL FTE types from periods for Period Breakdown tab too
    const allFteTypesForBreakdown = new Set<string>();
    periods.forEach(period => {
      Object.keys(period.splits).forEach(key => {
        allFteTypesForBreakdown.add(key);
      });
    });
    const allComponentKeysForBreakdown = Array.from(allFteTypesForBreakdown);
    
    const breakdownSheet = XLSX.utils.aoa_to_sheet([
      ['Period Breakdown'],
      [`Calendar Year ${year} - Generated on ${new Date().toLocaleDateString()}`],
      [],
      [
        'Period', 'Days', 'Base Salary',
        ...allComponentKeysForBreakdown.map(key => titleCase(key)),
        'Total'
      ],
      ...result.breakdown.map((row) => [
        `(${formatDate(row.startDate)}) to (${formatDate(row.endDate)})`,
        row.days,
        row.baseSalary,
        ...allComponentKeysForBreakdown.map((key) => row.componentAmounts[key] || 0),
        row.totalAmount,
      ]),
      [
        'TOTALS',
        totalDays,
        '', // Don't sum base salary
        ...allComponentKeysForBreakdown.map((key) => result.totalsByComponent[key] || 0),
        Object.values(result.totalsByComponent).reduce((sum: number, amount: number) => sum + amount, 0)
      ]
    ]);

    // Apply formatting to breakdown sheet
    breakdownSheet['!cols'] = [
      { width: 25 }, // Period
      { width: 8 },  // Days
      { width: 15 }, // Base Salary
      ...allComponentKeysForBreakdown.map(() => ({ width: 15 })), // Component columns
      { width: 15 }  // Total
    ];

    // Style breakdown sheet - columns 2 (Base Salary) and 4+ (Total) should be currency formatted
    applySheetStyling(breakdownSheet, 0, 3, allComponentKeysForBreakdown.length + 4, [2, allComponentKeysForBreakdown.length + 3]);

    XLSX.utils.book_append_sheet(workbook, breakdownSheet, 'Period Breakdown');

    // ===== SHEET 2: FTE DETAILS =====
    // Get ALL FTE types from periods, not just those with values > 0
    const allFteTypes = new Set<string>();
    periods.forEach(period => {
      Object.keys(period.splits).forEach(key => {
        allFteTypes.add(key);
      });
    });
    const allComponentKeys = Array.from(allFteTypes);
    
    const fteSheet = XLSX.utils.aoa_to_sheet([
      ['FTE Details'],
      [`Calendar Year ${year} - Generated on ${new Date().toLocaleDateString()}`],
      [],
      [
        'Start Date', 'End Date', 'Days', 'Base Salary',
        ...allComponentKeys.map(key => `${titleCase(key)} FTE`),
        ...allComponentKeys.map(key => `${titleCase(key)} $`),
        'Total $'
      ],
      ...result.breakdown.map((row) => {
        const period = periods.find((p) => p.id === row.periodId);
        return [
        formatDate(row.startDate),
        formatDate(row.endDate),
        row.days,
        row.baseSalary,
          ...allComponentKeys.map((key) => period?.splits[key] || 0),
          ...allComponentKeys.map((key) => row.componentAmounts[key] || 0),
        row.totalAmount,
        ];
      }),
      [
        'TOTALS',
        '',
        totalDays,
        '', // Don't sum base salary
        ...allComponentKeys.map((key) => {
          return periods.reduce((sum, period) => sum + (period.splits[key] || 0), 0);
        }),
        ...allComponentKeys.map((key) => result.totalsByComponent[key] || 0),
        Object.values(result.totalsByComponent).reduce((sum: number, amount: number) => sum + amount, 0)
      ]
    ]);

    // Apply formatting to FTE sheet
    fteSheet['!cols'] = [
      { width: 12 }, // Start Date
      { width: 12 }, // End Date
      { width: 8 },  // Days
      { width: 15 }, // Base Salary
      ...allComponentKeys.map(() => ({ width: 12 })), // FTE columns
      ...allComponentKeys.map(() => ({ width: 15 })), // $ columns
      { width: 15 }  // Total $
    ];

    // Style FTE sheet
    applySheetStyling(fteSheet, 0, 3, 4 + allComponentKeys.length * 2 + 1);

    XLSX.utils.book_append_sheet(workbook, fteSheet, 'FTE Details');

    // ===== SHEET 3: ADDITIONAL INCENTIVES =====
    const incentivesData = [
      ['Additional Incentives'],
      [`Calendar Year ${year} - Generated on ${new Date().toLocaleDateString()}`],
      [],
      ['Name', 'FTE Type', 'Percent/Target', 'Actual/CF', 'Calculated Amount']
    ];

    if (derivedItems.length > 0) {
      derivedItems.forEach(item => {
        if (item.isWrvuIncentive) {
          // wRVU incentive
          incentivesData.push([
            item.name,
            'wRVUs',
            item.targetWrvus?.toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            }) || '0.00',
            `${item.actualWrvusStr || (item.actualWrvus || 0).toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            })} / $${item.wrvuConversionFactor || 0}`,
            (result.derivedTotals[item.id] || 0).toLocaleString('en-US', {
              style: 'currency',
              currency: 'USD',
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            })
          ]);
        } else {
          // Regular percentage incentive
          incentivesData.push([
            item.name,
            item.sourceComponent || 'All',
            `${item.percentOfSource}%`,
            'N/A',
            (result.derivedTotals[item.id] || 0).toLocaleString('en-US', {
              style: 'currency',
              currency: 'USD',
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            })
          ]);
        }
      });
    } else {
      incentivesData.push(['No additional incentives configured']);
    }

    const incentivesSheet = XLSX.utils.aoa_to_sheet(incentivesData);
    incentivesSheet['!cols'] = [
      { width: 20 }, // Name
      { width: 15 }, // FTE Type
      { width: 15 }, // Percent/Target
      { width: 15 }, // Actual/CF
      { width: 18 }  // Calculated Amount
    ];

    // Style incentives sheet - column 4 (Calculated Amount) should be currency formatted
    applySheetStyling(incentivesSheet, 0, 3, 5, [4]);

    XLSX.utils.book_append_sheet(workbook, incentivesSheet, 'Additional Incentives');

    // ===== SHEET 4: TARGET CALCULATOR =====
    const targetData = [
      ['Target Calculator'],
      [`Calendar Year ${year} - Generated on ${new Date().toLocaleDateString()}`],
      [],
      ['Name', 'FTE Type', 'Selected Total', 'Conversion Factor', 'Custom Amount', 'Calculated Target']
    ];

    if (targetCalculatorItems.length > 0) {
      targetCalculatorItems.forEach(item => {
        // Calculate the correct target based on the conversion factor and source components
        // Follow the exact same logic as the web app
        let sourceAmount = 0;
        if (item.useCustomAmount) {
          sourceAmount = item.customAmount;
        } else {
          sourceAmount = item.targetComponents.reduce((sum, component) => {
            return sum + (result.totalsByComponent[component] || 0);
          }, 0);
        }
        
        // Use the same calculation as the web app: divide by conversion factor
        const calculatedTarget = (sourceAmount > 0 && item.conversionFactor > 0) 
          ? sourceAmount / item.conversionFactor 
          : 0;
        
        targetData.push([
          item.name,
          item.targetComponents.join(', ') || 'All',
          sourceAmount.toLocaleString('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          }),
          item.conversionFactor.toString(),
          item.useCustomAmount ? item.customAmount.toString() : 'N/A',
          calculatedTarget.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          })
        ]);
      });
    } else {
      targetData.push(['No target calculators configured']);
    }

    const targetSheet = XLSX.utils.aoa_to_sheet(targetData);
    targetSheet['!cols'] = [
      { width: 20 }, // Name
      { width: 15 }, // FTE Type
      { width: 18 }, // Selected Total
      { width: 18 }, // Conversion Factor
      { width: 15 }, // Custom Amount
      { width: 18 }  // Calculated Target
    ];

    // Style target sheet - columns 2 (Selected Total) and 4 (Custom Amount) should be currency formatted
    applySheetStyling(targetSheet, 0, 3, 6, [2, 4]);

    XLSX.utils.book_append_sheet(workbook, targetSheet, 'Target Calculator');

    // ===== SHEET 5: SUMMARY =====
    const summaryData = [
      ['Compensation Summary'],
      [`Calendar Year ${year} - Generated on ${new Date().toLocaleDateString()}`],
      [],
      ['Component', 'Amount'],
      ...componentKeys.map((key) => [titleCase(key), result.totalsByComponent[key] || 0]),
      [],
      ['Additional Incentives', Object.values(result.derivedTotals).reduce((sum, amount) => sum + amount, 0)],
      [],
      ['Total Cash Compensation', result.tcc]
    ];

    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    summarySheet['!cols'] = [
      { width: 25 }, // Component
      { width: 18 }  // Amount
    ];

    // Style summary sheet - column 1 (Amount) should be currency formatted
    applySheetStyling(summarySheet, 0, 3, 2, [1]);

    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

    // Save the file
    const filename = `TotalCashComp_Prorate_${year}.xlsx`;
    XLSX.writeFile(workbook, filename);
  };

  // Helper function to apply consistent styling
  const applySheetStyling = (sheet: any, titleRow: number, headerRow: number, numCols: number, currencyColumns: number[] = []) => {
    // Style title
    if (sheet[XLSX.utils.encode_cell({ r: titleRow, c: 0 })] && titleRow >= 0) {
      sheet[XLSX.utils.encode_cell({ r: titleRow, c: 0 })].s = {
        font: { bold: true, size: 16, color: { rgb: '1976d2' } },
        alignment: { horizontal: 'center' }
      };
    }

    // Style subtitle
    if (sheet[XLSX.utils.encode_cell({ r: titleRow + 1, c: 0 })] && titleRow + 1 >= 0) {
      sheet[XLSX.utils.encode_cell({ r: titleRow + 1, c: 0 })].s = {
        font: { size: 12, color: { rgb: '666666' } },
        alignment: { horizontal: 'center' }
      };
    }

    // Style header row
    for (let col = 0; col < numCols; col++) {
      const cellRef = XLSX.utils.encode_cell({ r: headerRow, c: col });
      if (sheet[cellRef]) {
        sheet[cellRef].s = {
          font: { bold: true, color: { rgb: 'ffffff' } },
          fill: { fgColor: { rgb: '1976d2' } },
          alignment: { horizontal: 'center' },
          border: {
            top: { style: 'thin' },
            bottom: { style: 'thin' },
            left: { style: 'thin' },
            right: { style: 'thin' }
          }
        };
      }
    }

    // Style data rows and apply currency formatting
    const dataRows = Object.keys(sheet).filter(key => key.match(/^[A-Z]+\d+$/)).map(key => {
      const cell = XLSX.utils.decode_cell(key);
      return cell.r;
    });
    const maxRow = Math.max(...dataRows);

    for (let row = headerRow + 1; row <= maxRow; row++) {
      for (let col = 0; col < numCols; col++) {
        const cellRef = XLSX.utils.encode_cell({ r: row, c: col });
        if (sheet[cellRef]) {
          sheet[cellRef].s = {
            border: {
              top: { style: 'thin' },
              bottom: { style: 'thin' },
              left: { style: 'thin' },
              right: { style: 'thin' }
            },
            alignment: { horizontal: col < 2 ? 'center' : 'right' }
          };
          
          // Style totals row
          if (row === maxRow) {
            sheet[cellRef].s.font = { bold: true };
            sheet[cellRef].s.fill = { fgColor: { rgb: 'f0f0f0' } };
          }

          // Apply currency formatting only to currency columns (Base Salary, $ amounts)
          // Days (col 2) and FTE columns should NOT be formatted as currency
          if (typeof sheet[cellRef].v === 'number') {
            // For FTE Details tab, we need to handle the dynamic number of FTE columns
            const isFteDetailsTab = numCols > 10; // FTE Details has more columns than other tabs
            
            if (isFteDetailsTab) {
              // FTE Details tab: Base Salary (col 3), $ amount columns (after FTE columns), or specified currency columns
              const fteColumnCount = (numCols - 5) / 2; // Calculate number of FTE types
              const isCurrencyColumn = col === 3 || // Base Salary
                                     col > 4 + fteColumnCount || // $ amount columns (after FTE columns)
                                     currencyColumns.includes(col);
              
              if (isCurrencyColumn) {
                sheet[cellRef].z = '"$"#,##0.00';
            } else {
                // Non-currency columns: Days, FTE values - use number format
                sheet[cellRef].z = '#,##0.00';
              }
            } else {
              // Other tabs: use the original logic
              if (col === 3 || (col > 4 + componentKeys.length - 1) || currencyColumns.includes(col)) {
                // Currency columns: Base Salary (col 3), $ amount columns, or specified currency columns
                sheet[cellRef].z = '"$"#,##0.00';
              } else {
                // Non-currency columns: Days, FTE values - use number format
                sheet[cellRef].z = '#,##0.00';
              }
            }
          }
        }
      }
    }
  };



  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: colors.surface,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* Header */}
      <div style={{
        backgroundColor: colors.primary,
        color: colors.onPrimary,
        padding: '16px 24px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ 
              margin: 0, 
              ...typography.headlineSmall,
              fontWeight: 500,
              color: colors.onPrimary
            }}>
              Total Cash Compensation (Proration)
            </h1>
            <p style={{ 
              margin: '4px 0 0 0', 
              opacity: 0.9, 
              ...typography.bodyMedium,
              color: colors.onPrimary
            }}>
              Prorate compensation across calendar year using dated salary/FTE periods and dynamic incentives
            </p>
          </div>
          

        </div>
      </div>

      {/* Main Content */}
      <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Action Buttons */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            gap: '16px',
            padding: '16px 0',
            borderBottom: `2px solid ${colors.outlineVariant}`,
            marginBottom: '24px'
          }}>
            <button
              onClick={() => {
                // Reset to default state - force a complete reset
                const resetState = async () => {
                  try {
                    // Clear all IndexedDB data first
                    await indexedDBService.clearAllSettings();
                    
                    // Then reset state to defaults
                    setYear(2025);
                    setComponentKeys(['clinical']);
                    setPeriods([]);
                    setDerivedItems([]);
                  } catch (error) {
                    console.error('Error resetting state:', error);
                    // Fallback to just resetting state
                    setYear(2025);
                    setComponentKeys(['clinical']);
                    setPeriods([]);
                    setDerivedItems([]);
                  }
                };
                
                resetState();
              }}
              style={{
                backgroundColor: '#6b7280',
                color: 'white',
                border: '1px solid #4b5563',
                padding: '8px 16px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                transition: 'all 0.2s',
                width: '160px',
                flex: '1'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#4b5563'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#6b7280'}
            >
              New Calculation
            </button>
            <button
              onClick={() => {
                // Clear everything and start completely fresh
                const clearAll = async () => {
                  try {
                    // Clear all IndexedDB data
                    await indexedDBService.clearAllSettings();
                    
                    // Reset to absolute defaults
                    setYear(2025);
                    setComponentKeys(['clinical']);
                    setPeriods([]);
                    setDerivedItems([]);
                    
                    // Force a page reload to ensure complete reset
                    window.location.reload();
                  } catch (error) {
                    console.error('Error clearing all data:', error);
                    // Fallback to page reload
                    window.location.reload();
                  }
                };
                
                clearAll();
              }}
              style={{
                backgroundColor: '#6b7280',
                color: 'white',
                border: '1px solid #4b5563',
                padding: '8px 16px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                transition: 'all 0.2s',
                width: '160px',
                flex: '1'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#4b5563'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#6b7280'}
            >
              Clear All & Reload
            </button>
            <button
              onClick={() => setShowSaveModal(true)}
              style={{
                backgroundColor: '#1976d2',
                color: 'white',
                border: '1px solid #1565c0',
                padding: '8px 16px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                transition: 'all 0.2s',
                width: '160px',
                flex: '1'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1565c0'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#1976d2'}
            >
              Save Calculation
            </button>
            <button
              onClick={() => setShowHistoryModal(true)}
              style={{
                backgroundColor: '#1976d2',
                color: 'white',
                border: '1px solid #1565c0',
                padding: '8px 16px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                transition: 'all 0.2s',
                width: '160px',
                flex: '1'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1565c0'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#1976d2'}
            >
              History
            </button>
            <button
              onClick={handleExportToExcel}
              disabled={!validation.ok}
              style={{
                backgroundColor: !validation.ok ? '#d1d5db' : '#1976d2',
                color: 'white',
                border: '1px solid #1565c0',
                padding: '8px 16px',
                borderRadius: '4px',
                cursor: !validation.ok ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                transition: 'all 0.2s',
                width: '160px',
                flex: '1'
              }}
              onMouseEnter={(e) => {
                if (validation.ok) {
                  e.currentTarget.style.backgroundColor = '#1565c0';
                }
              }}
              onMouseLeave={(e) => {
                if (validation.ok) {
                  e.currentTarget.style.backgroundColor = '#1976d2';
                }
              }}
            >
              Export to Excel
            </button>

          </div>

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

          {/* Periods & FTE Splits */}
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
                  onClick={addPeriod}
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
                  onClick={() => {
                    // Duplicate the last period if it exists
                    if (periods.length > 0) {
                      const lastPeriod = periods[periods.length - 1];
                      const newPeriod: BasePeriod = {
                        ...lastPeriod,
                        id: crypto.randomUUID(),
                      };
                      setPeriods([...periods, newPeriod]);
                    } else {
                      // If no periods exist, just add a new one
                      addPeriod();
                    }
                  }}
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
                    

                    
                    // Get the currently selected component type for this period
                    // const selectedComponent = Object.keys(period.splits).find(key => period.splits[key] && period.splits[key]! > 0) || componentKeys[0] || 'clinical';
                    
                    return (
                      <tr key={period.id} style={{ 
                        backgroundColor: colors.surface
                      }}>
                        <td style={{ padding: '12px' }}>
                          <input
                            type="date"
                            value={period.startDate}
                            onChange={(e) => updatePeriod(period.id, { startDate: e.target.value })}
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
                            onChange={(e) => updatePeriod(period.id, { endDate: e.target.value })}
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
                              // Find the component with the highest FTE value
                              const maxFte = Math.max(...Object.values(period.splits).map(v => v ?? 0));
                              return maxFte > 0 ? maxFte : 0;
                            })()}
                            onChange={(e) => {
                              const newFte = parseFloat(e.target.value) || 0;
                              const newSplits = { ...period.splits };
                              
                              // Find which component currently has the highest FTE (this is the one being edited)
                              const currentMaxFte = Math.max(...Object.values(period.splits).map(v => v ?? 0));
                              const activeComponent = Object.keys(period.splits).find(key => (period.splits[key] ?? 0) === currentMaxFte);
                              
                              if (activeComponent) {
                                // Simply update the active component's FTE - don't change anything else
                                newSplits[activeComponent] = Math.max(0, newFte);
                              }
                              
                              updatePeriod(period.id, { splits: newSplits });
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
                              // Find the component with the highest FTE value
                              const maxFte = Math.max(...Object.values(period.splits).map(v => v ?? 0));
                              const activeComponent = Object.keys(period.splits).find(key => (period.splits[key] ?? 0) === maxFte);
                              return activeComponent || 'clinical';
                            })()}
                            onChange={(e) => {
                              const selectedType = e.target.value;
                              
                              // Add the new type to component keys if it doesn't exist
                              if (!componentKeys.includes(selectedType)) {
                                setComponentKeys(prevKeys => [...prevKeys, selectedType]);
                              }
                              
                              // Create new splits - keep existing FTE values, just switch the type
                              const newSplits: Record<string, number> = {};
                              
                              // Initialize all component keys to 0
                              const allKeys = [...componentKeys, selectedType];
                              allKeys.forEach(key => {
                                newSplits[key] = 0;
                              });
                              
                              // Get the current FTE value (from the highest FTE component)
                              const currentFte = Math.max(...Object.values(period.splits).map(v => v ?? 0));
                              
                              // Set the selected type to the current FTE value (or 0 if no current FTE)
                              newSplits[selectedType] = currentFte;
                              
                              updatePeriod(period.id, { splits: newSplits });
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
                               onClick={() => duplicatePeriod(period.id)}
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
                               onClick={() => deletePeriod(period.id)}
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
                      {/* Calculate unique days by grouping by start date */}
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
                      {/* Total FTE - sum of all component FTEs */}
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
                      {/* Total % of Time */}
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
                onClick={() => {
                  const newItem: DerivedItem = {
                    id: crypto.randomUUID(),
                    name: '',
                    sourceComponent: derivedComponentKeys[0] || '',
                    percentOfSource: 0,
                  };
                  setDerivedItems([...derivedItems, newItem]);
                }}
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
                    <div style={{ display: 'grid', gridTemplateColumns: item.isWrvuIncentive ? '1fr 1fr 1fr 1fr 1fr 1fr auto' : '1fr 1fr 1fr 1fr auto', gap: '16px', alignItems: 'end' }}>
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
                            setDerivedItems(derivedItems.map(i => 
                              i.id === item.id ? { ...i, name: e.target.value } : i
                            ));
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
                                
                                // Always position dropdown above the button
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
                              {item.isWrvuIncentive 
                                ? 'wRVUs'
                                : item.sourceComponent.split(',').filter(s => s.trim()).length > 0 
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
                              // Close dropdown when mouse leaves
                              setTimeout(() => {
                                const dropdown = document.getElementById(`dropdown-${item.id}`);
                                if (dropdown) {
                                  dropdown.style.display = 'none';
                                }
                              }, 100);
                            }}
                          >
                            {/* wRVU Option */}
                            <label
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '8px 12px',
                                cursor: 'pointer',
                                ...typography.bodyMedium,
                                borderBottom: `1px solid ${colors.outlineVariant}`,
                                backgroundColor: item.isWrvuIncentive ? colors.surfaceVariant : colors.surface
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = item.isWrvuIncentive ? colors.primaryContainer : colors.surfaceVariant;
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = item.isWrvuIncentive ? colors.surfaceVariant : colors.surface;
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center' }}>
                                <input
                                  type="checkbox"
                                  checked={item.isWrvuIncentive || false}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      // Switch to wRVU mode
                                                                              setDerivedItems(derivedItems.map(i => 
                                          i.id === item.id ? { 
                                            ...i, 
                                            isWrvuIncentive: true,
                                            sourceComponent: '',
                                            percentOfSource: 0,
                                            actualWrvus: 0,
                                            actualWrvusStr: '0.00',
                                            targetWrvus: targetCalculatorItems.length > 0 ? (() => {
                                              const item = targetCalculatorItems[0];
                                              if (item.useCustomAmount) {
                                                return item.customAmount;
                                              } else {
                                                const sourceAmount = item.targetComponents.reduce((sum, component) => {
                                                  return sum + (result.totalsByComponent[component] || 0);
                                                }, 0);
                                                return sourceAmount / item.conversionFactor;
                                              }
                                            })() : 0,
                                            wrvuConversionFactor: targetCalculatorItems.length > 0 ? targetCalculatorItems[0].conversionFactor || 0 : 0
                                          } : i
                                        ));
                                    } else {
                                      // Switch back to regular mode
                                                                              setDerivedItems(derivedItems.map(i => 
                                          i.id === item.id ? { 
                                            ...i, 
                                            isWrvuIncentive: false,
                                            actualWrvus: undefined,
                                            actualWrvusStr: undefined,
                                            targetWrvus: undefined,
                                            wrvuConversionFactor: undefined
                                          } : i
                                        ));
                                    }
                                  }}
                                  style={{
                                    marginRight: '8px',
                                    width: '16px',
                                    height: '16px',
                                    accentColor: colors.primary
                                  }}
                                />
                                <span>wRVUs</span>
                              </div>
                              <span style={{ 
                                color: colors.onSurfaceVariant, 
                                fontSize: '0.75rem',
                                fontWeight: 400,
                                marginLeft: '12px',
                                whiteSpace: 'nowrap'
                              }}>
                                (Productivity)
                              </span>
                            </label>
                            
                            {/* Regular Component Options */}
                            {derivedComponentKeys.map((key) => {
                              const isSelected = !item.isWrvuIncentive && item.sourceComponent.split(',').filter(s => s.trim()).includes(key);
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
                                        setDerivedItems(derivedItems.map(i => 
                                          i.id === item.id ? { ...i, sourceComponent: newComponents.join(',') } : i
                                        ));
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
                      
                      {item.isWrvuIncentive ? (
                        // wRVU incentive fields
                        <>
                          <div>
                            <label style={{ 
                              display: 'block', 
                              ...typography.labelMedium,
                              color: colors.onSurfaceVariant, 
                              marginBottom: '4px' 
                            }}>
                              Target wRVUs
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
                              {item.targetWrvus?.toLocaleString('en-US', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                              }) || '0.00'}
                            </div>
                          </div>
                          
                          <div>
                            <label style={{ 
                              display: 'block', 
                              ...typography.labelMedium,
                              color: colors.onSurfaceVariant, 
                              marginBottom: '4px' 
                            }}>
                              Actual wRVUs
                            </label>
                            <input
                              type="text"
                              value={item.actualWrvusStr || (item.actualWrvus || 0).toLocaleString('en-US', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                              })}
                              onChange={(e) => {
                                const value = e.target.value.replace(/[^\d.]/g, '');
                                setDerivedItems(derivedItems.map(i => 
                                  i.id === item.id ? { ...i, actualWrvusStr: value } : i
                                ));
                              }}
                              onBlur={(e) => {
                                const value = parseFloat(e.target.value.replace(/,/g, '')) || 0;
                                setDerivedItems(derivedItems.map(i => 
                                  i.id === item.id ? { 
                                    ...i, 
                                    actualWrvus: value,
                                    actualWrvusStr: value.toLocaleString('en-US', {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2
                                    })
                                  } : i
                                ));
                              }}
                              placeholder="0.00"
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
                              Conversion Factor
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={item.wrvuConversionFactor || 0}
                              onChange={(e) => {
                                const value = parseFloat(e.target.value) || 0;
                                setDerivedItems(derivedItems.map(i => 
                                  i.id === item.id ? { ...i, wrvuConversionFactor: value } : i
                                ));
                              }}
                              placeholder="0.00"
                              style={{
                                border: `1px solid ${colors.outlineVariant}`,
                                borderRadius: '4px',
                                padding: '8px 12px',
                                ...typography.bodyMedium,
                                width: '100%'
                              }}
                            />
                          </div>
                        </>
                      ) : (
                        // Regular percentage field
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
                                setDerivedItems(derivedItems.map(i => 
                                  i.id === item.id ? { ...i, percentOfSource: Math.min(100, Math.max(0, value)) } : i
                                ));
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
                      )}
                      
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
                            if (item.isWrvuIncentive && item.actualWrvus !== undefined && item.targetWrvus !== undefined && item.wrvuConversionFactor !== undefined) {
                              // wRVU incentive calculation
                              if (item.actualWrvus > item.targetWrvus) {
                                const incentive = item.wrvuConversionFactor * (item.actualWrvus - item.targetWrvus);
                                return formatCurrency(incentive);
                              } else {
                                return formatCurrency(0);
                              }
                            } else {
                              // Regular percentage-based incentive calculation
                              const sourceComponents = item.sourceComponent.split(',').filter(s => s.trim());
                              const totalSourceAmount = sourceComponents.reduce((sum, component) => {
                                return sum + (result.totalsByComponent[component] || 0);
                              }, 0);
                              const calculatedAmount = totalSourceAmount * (item.percentOfSource / 100);
                              return formatCurrency(calculatedAmount);
                            }
                          })()}
                        </div>
                      </div>
                      
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', alignItems: 'flex-end' }}>
                        <button
                          onClick={() => {
                            const newItem: DerivedItem = {
                              id: crypto.randomUUID(),
                              name: item.name,
                              sourceComponent: item.sourceComponent,
                              percentOfSource: item.percentOfSource,
                            };
                            setDerivedItems([...derivedItems, newItem]);
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
                          onClick={() => {
                            setDerivedItems(derivedItems.filter(i => i.id !== item.id));
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
            overflow: 'hidden'
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
                onClick={addTargetCalculatorItem}
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
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr auto', gap: '16px', alignItems: 'end' }}>
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
                            updateTargetCalculatorItem(item.id, { name: e.target.value });
                          }}
                          placeholder="e.g., wRVU Target"
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
                                
                                // Always position dropdown above the button
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
                              // Close dropdown when mouse leaves
                              setTimeout(() => {
                                const dropdown = document.getElementById(`dropdown-${item.id}`);
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
                                          updateTargetCalculatorItem(item.id, { 
                                            targetComponents: [...item.targetComponents, key] 
                                          });
                                        } else {
                                          updateTargetCalculatorItem(item.id, { 
                                            targetComponents: item.targetComponents.filter(c => c !== key) 
                                          });
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
                          value={item.conversionFactorStr || ''}
                          onChange={(e) => handleConversionFactorChange(item.id, e.target.value)}
                          onBlur={() => handleConversionFactorBlur(item.id)}
                          placeholder="Enter conversion factor (e.g., 52.08)"
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
                          Custom Amount
                        </label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <button
                            onClick={() => {
                              updateTargetCalculatorItem(item.id, { useCustomAmount: !item.useCustomAmount });
                            }}
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
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={item.customAmount === 0 ? '' : item.customAmount.toString()}
                              onChange={(e) => {
                                const parsed = parseFloat(e.target.value) || 0;
                                updateTargetCalculatorItem(item.id, { customAmount: parsed });
                              }}
                              onBlur={(e) => {
                                const value = parseFloat(e.target.value) || 0;
                                updateTargetCalculatorItem(item.id, { customAmount: value });
                              }}
                              placeholder="Enter amount"
                              style={{
                                border: `1px solid ${colors.outlineVariant}`,
                                borderRadius: '4px',
                                padding: '8px 12px',
                                ...typography.bodyMedium,
                                width: '120px'
                              }}
                            />
                          )}
                        </div>
                      </div>
                      
                      <div>
                        <label style={{ 
                          display: 'block', 
                          ...typography.labelMedium,
                          color: colors.onSurfaceVariant, 
                          marginBottom: '4px' 
                        }}>
                          Calculated Target
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
                            let sourceAmount = 0;
                            if (item.useCustomAmount) {
                              sourceAmount = item.customAmount;
                            } else {
                              sourceAmount = item.targetComponents.reduce((sum, component) => {
                                return sum + (result.totalsByComponent[component] || 0);
                              }, 0);
                            }
                            
                            if (sourceAmount > 0 && item.conversionFactor > 0) {
                              const targetAmount = sourceAmount / item.conversionFactor;
                              return targetAmount.toLocaleString('en-US', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                              });
                            }
                            
                            return '0.00';
                          })()}
                        </div>
                      </div>
                      
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', alignItems: 'flex-end' }}>
                        <button
                          onClick={() => {
                            const newItem = {
                              id: crypto.randomUUID(),
                              name: item.name,
                              targetComponents: item.targetComponents,
                              conversionFactor: item.conversionFactor,
                              conversionFactorStr: item.conversionFactorStr,
                              useCustomAmount: item.useCustomAmount,
                              customAmount: item.customAmount,
                            };
                            setTargetCalculatorItems([...targetCalculatorItems, newItem]);
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
                          onClick={() => {
                            deleteTargetCalculatorItem(item.id);
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
        </div>
      </div>

      {/* Modals */}
      {showSaveModal && (
        <SaveCalculation
          onSave={handleSaveCalculation}
          onClose={() => setShowSaveModal(false)}
          currentData={{
            year,
            componentKeys,
            periods,
            derivedItems,
            targetCalculatorItems,
            totals: {
              totalsByComponent: result.totalsByComponent,
              derivedTotals: result.derivedTotals,
              tcc: result.tcc
            }
          }}
        />
      )}

      {showHistoryModal && (
        <History
          onLoadCalculation={handleLoadCalculation}
          onClose={() => setShowHistoryModal(false)}
        />
      )}
    </div>
  );
}

export default App;
