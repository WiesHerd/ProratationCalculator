import { Button } from './ui/button';
import { formatDate } from '../lib/format';
import { titleCase } from '../lib/keys';
import { BasePeriod, DerivedItem, ProrationResult } from '../lib/proration';
import { FileSpreadsheet } from 'lucide-react';
import * as XLSX from 'xlsx';

interface ExportButtonProps {
  year: number;
  periods: BasePeriod[];
  componentKeys: string[];
  derivedItems: DerivedItem[];
  result: ProrationResult;
  disabled?: boolean;
}

export function ExportButton({
  year,
  periods,
  componentKeys,
  derivedItems,
  result,
  disabled = false,
}: ExportButtonProps) {
  const exportToExcel = () => {
    const workbook = XLSX.utils.book_new();

    // Sheet 1: Breakdown
    const breakdownData = result.breakdown.map((row) => ({
      'Start Date': formatDate(row.startDate),
      'End Date': formatDate(row.endDate),
      'Days': row.days,
      'Base Salary': row.baseSalary,
      ...Object.fromEntries(
        componentKeys.map((key) => [
          `${titleCase(key)} FTE`,
          periods.find((p) => p.id === row.periodId)?.splits[key] || 0,
        ])
      ),
      ...Object.fromEntries(
        componentKeys.map((key) => [
          `${titleCase(key)} $`,
          row.componentAmounts[key] || 0,
        ])
      ),
      'Total $': row.totalAmount,
    }));

    // Add totals row
    const totalsRow: Record<string, any> = {
      'Start Date': 'TOTALS',
      'End Date': '',
      'Days': result.breakdown.reduce((sum, row) => sum + row.days, 0),
      'Base Salary': periods.reduce((sum, p) => sum + p.baseSalary, 0),
    };

    componentKeys.forEach((key) => {
      totalsRow[`${titleCase(key)} FTE`] = '';
      totalsRow[`${titleCase(key)} $`] = result.totalsByComponent[key] || 0;
    });

    totalsRow['Total $'] = Object.values(result.totalsByComponent).reduce(
      (sum: number, amount: number) => sum + amount,
      0
    );

    breakdownData.push(totalsRow as any);

    const breakdownSheet = XLSX.utils.json_to_sheet(breakdownData);
    XLSX.utils.book_append_sheet(workbook, breakdownSheet, 'Breakdown');

    // Sheet 2: Totals
    const totalsData = [
      { Component: 'Component Totals', Amount: '' },
      ...componentKeys.map((key) => ({
        Component: titleCase(key),
        Amount: result.totalsByComponent[key] || 0,
      })),
      { Component: '', Amount: '' },
      { Component: 'Additional Incentives', Amount: '' },
      ...Object.entries(result.derivedTotals).map(([id, amount]) => ({
        Component: derivedItems.find((item) => item.id === id)?.name || id,
        Amount: amount,
      })),
      { Component: '', Amount: '' },
      {
        Component: 'Total Cash Compensation',
        Amount: result.tcc,
      },
    ];

    const totalsSheet = XLSX.utils.json_to_sheet(totalsData);
    XLSX.utils.book_append_sheet(workbook, totalsSheet, 'Totals');

    // Sheet 3: Inputs - Periods
    const periodsData = periods.map((period) => ({
      'Start Date': period.startDate,
      'End Date': period.endDate,
      'Base Salary': period.baseSalary,
      ...Object.fromEntries(
        componentKeys.map((key) => [
          `${titleCase(key)} FTE`,
          period.splits[key] || 0,
        ])
      ),
    }));

    const periodsSheet = XLSX.utils.json_to_sheet(periodsData);
    XLSX.utils.book_append_sheet(workbook, periodsSheet, 'Inputs-Periods');

    // Sheet 4: Inputs - Incentives
    const incentivesData = derivedItems.map((item) => ({
      Name: item.name,
      'Source Component': titleCase(item.sourceComponent),
      'Percent of Source': item.percentOfSource,
      Floor: item.floor || '',
      Cap: item.cap || '',
    }));

    const incentivesSheet = XLSX.utils.json_to_sheet(incentivesData);
    XLSX.utils.book_append_sheet(workbook, incentivesSheet, 'Inputs-Incentives');

    // Apply currency formatting to relevant columns
    const currencyColumns = ['Base Salary', 'Total $', 'Amount'];
    componentKeys.forEach((key) => {
      currencyColumns.push(`${titleCase(key)} $`);
    });

    // Format currency columns in all sheets
    [breakdownSheet, totalsSheet, periodsSheet].forEach((sheet) => {
      const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1');
      for (let col = range.s.c; col <= range.e.c; col++) {
        const colLetter = XLSX.utils.encode_col(col);
        const headerCell = sheet[`${colLetter}1`];
        if (headerCell && currencyColumns.includes(headerCell.v)) {
          for (let row = range.s.r + 1; row <= range.e.r; row++) {
            const cell = sheet[`${colLetter}${row + 1}`];
            if (cell && typeof cell.v === 'number') {
              cell.z = '"$"#,##0.00';
            }
          }
        }
      }
    });

    // Save the file
    const filename = `TotalCashComp_Prorate_${year}.xlsx`;
    XLSX.writeFile(workbook, filename);
  };

  return (
    <Button
      onClick={exportToExcel}
      disabled={disabled}
      className="flex items-center gap-2"
      size="lg"
    >
      <FileSpreadsheet className="h-5 w-5" />
      Export to Excel
    </Button>
  );
}
