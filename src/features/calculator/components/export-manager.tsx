import React, { useRef } from 'react';
import { useSelector } from 'react-redux';
import { selectCalculationResult, selectPeriods, selectDerivedItems } from '../calculator-slice';
import { formatCurrency, formatDate } from '../../../lib/format';
import { titleCase } from '../../../lib/keys';
import { typography, colors } from '../../../styles/theme';

export const ExportManager: React.FC = () => {
  const result = useSelector(selectCalculationResult);
  const periods = useSelector(selectPeriods);
  const derivedItems = useSelector(selectDerivedItems);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const exportToPDF = () => {
    // Create a new window for PDF generation
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Proration Calculation Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .summary { margin-bottom: 30px; }
            .summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 20px; }
            .summary-card { border: 1px solid #ddd; padding: 15px; border-radius: 8px; text-align: center; }
            .summary-label { font-size: 12px; color: #666; text-transform: uppercase; margin-bottom: 5px; }
            .summary-value { font-size: 18px; font-weight: bold; }
            .breakdown { margin-bottom: 30px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f5f5f5; font-weight: bold; }
            .totals-row { background-color: #f0f0f0; font-weight: bold; }
            .periods { margin-bottom: 30px; }
            .period-card { border: 1px solid #ddd; padding: 15px; margin-bottom: 15px; border-radius: 8px; }
            .incentives { margin-bottom: 30px; }
            .incentive-item { border: 1px solid #ddd; padding: 10px; margin-bottom: 10px; border-radius: 4px; }
            @media print { body { margin: 0; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Proration Calculation Report</h1>
            <p>Generated on ${new Date().toLocaleDateString()}</p>
          </div>

          <div class="summary">
            <h2>Summary</h2>
            <div class="summary-grid">
              ${Object.entries(result.totalsByComponent).map(([key, value]) => `
                <div class="summary-card">
                  <div class="summary-label">${key === 'medical_director' ? 'Medical Director' : 
                    key === 'division_chief' ? 'Division Chief' : 
                    titleCase(key)}</div>
                  <div class="summary-value">${formatCurrency(value)}</div>
                </div>
              `).join('')}
              <div class="summary-card">
                <div class="summary-label">Additional Incentives</div>
                <div class="summary-value">${formatCurrency(Object.values(result.derivedTotals).reduce((sum, amount) => sum + amount, 0))}</div>
              </div>
              <div class="summary-card" style="background-color: #e8f5e8; border-color: #4caf50;">
                <div class="summary-label">Total Cash Compensation</div>
                <div class="summary-value" style="color: #2e7d32;">${formatCurrency(result.tcc)}</div>
              </div>
            </div>
          </div>

          <div class="breakdown">
            <h2>Period Breakdown</h2>
            <table>
              <thead>
                <tr>
                  <th>Period</th>
                  <th>Days</th>
                  <th>Base Salary</th>
                  ${Object.keys(result.totalsByComponent).map(key => 
                    `<th>${key === 'medical_director' ? 'Medical Director' : 
                      key === 'division_chief' ? 'Division Chief' : 
                      titleCase(key)}</th>`
                  ).join('')}
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                ${result.breakdown.map(row => `
                  <tr>
                    <td>${formatDate(row.startDate)} to ${formatDate(row.endDate)}</td>
                    <td>${row.days}</td>
                    <td>${formatCurrency(row.baseSalary)}</td>
                    ${Object.keys(result.totalsByComponent).map(key => 
                      `<td>${formatCurrency(row.componentAmounts[key] || 0)}</td>`
                    ).join('')}
                    <td>${formatCurrency(row.totalAmount)}</td>
                  </tr>
                `).join('')}
                <tr class="totals-row">
                  <td>TOTALS</td>
                  <td>${result.breakdown.reduce((sum, row) => sum + row.days, 0)}</td>
                  <td></td>
                  ${Object.keys(result.totalsByComponent).map(key => 
                    `<td>${formatCurrency(result.totalsByComponent[key] || 0)}</td>`
                  ).join('')}
                  <td>${formatCurrency(Object.values(result.totalsByComponent).reduce((sum, amount) => sum + amount, 0))}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="periods">
            <h2>Period Details</h2>
            ${periods.map(period => `
              <div class="period-card">
                <h3>${formatDate(period.startDate)} to ${formatDate(period.endDate)}</h3>
                <p><strong>Base Salary:</strong> ${formatCurrency(period.baseSalary)}</p>
                <p><strong>FTE Splits:</strong> ${Object.entries(period.splits).map(([key, value]) => 
                  `${titleCase(key)}: ${(value * 100).toFixed(1)}%`
                ).join(', ')}</p>
              </div>
            `).join('')}
          </div>

          ${derivedItems.length > 0 ? `
            <div class="incentives">
              <h2>Additional Incentives</h2>
              ${derivedItems.map(item => `
                <div class="incentive-item">
                  <h4>${item.name}</h4>
                  <p><strong>Source Components:</strong> ${item.sourceComponent.split(',').filter(s => s.trim()).map(s => titleCase(s)).join(', ')}</p>
                  <p><strong>Percentage:</strong> ${item.percentOfSource}%</p>
                  <p><strong>Calculated Amount:</strong> ${(() => {
                    const sourceComponents = item.sourceComponent.split(',').filter(s => s.trim());
                    const totalSourceAmount = sourceComponents.reduce((sum, component) => {
                      return sum + (result.totalsByComponent[component] || 0);
                    }, 0);
                    const calculatedAmount = totalSourceAmount * (item.percentOfSource / 100);
                    return formatCurrency(calculatedAmount);
                  })()}</p>
                </div>
              `).join('')}
            </div>
          ` : ''}
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
    
    // Wait for content to load then print
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
  };

  const exportToCSV = () => {
    // Create CSV content
    const csvContent = [
      // Header row
      ['Period', 'Start Date', 'End Date', 'Days', 'Base Salary', ...Object.keys(result.totalsByComponent).map(key => 
        key === 'medical_director' ? 'Medical Director' : 
        key === 'division_chief' ? 'Division Chief' : 
        titleCase(key)
      ), 'Total'],
      // Data rows
      ...result.breakdown.map(row => [
        `${formatDate(row.startDate)} to ${formatDate(row.endDate)}`,
        row.startDate,
        row.endDate,
        row.days.toString(),
        row.baseSalary.toString(),
        ...Object.keys(result.totalsByComponent).map(key => (row.componentAmounts[key] || 0).toString()),
        row.totalAmount.toString()
      ]),
      // Totals row
      ['TOTALS', '', '', result.breakdown.reduce((sum, row) => sum + row.days, 0).toString(), '', 
        ...Object.keys(result.totalsByComponent).map(key => (result.totalsByComponent[key] || 0).toString())],
      // Summary section
      [],
      ['Summary'],
      ['Component', 'Total Amount'],
      ...Object.entries(result.totalsByComponent).map(([key, value]) => [
        key === 'medical_director' ? 'Medical Director' : 
        key === 'division_chief' ? 'Division Chief' : 
        titleCase(key),
        value.toString()
      ]),
      ['Additional Incentives', Object.values(result.derivedTotals).reduce((sum, amount) => sum + amount, 0).toString()],
      ['Total Cash Compensation', result.tcc.toString()]
    ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');

    // Create and download CSV file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `proration-calculation-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToZIP = () => {
    // This would require a ZIP library like JSZip
    // For now, we'll create a simple text file with all data
    const zipContent = `
PRORATION CALCULATION REPORT
Generated: ${new Date().toLocaleString()}

SUMMARY:
${Object.entries(result.totalsByComponent).map(([key, value]) => 
  `${key === 'medical_director' ? 'Medical Director' : 
    key === 'division_chief' ? 'Division Chief' : 
    titleCase(key)}: ${formatCurrency(value)}`
).join('\n')}

Additional Incentives: ${formatCurrency(Object.values(result.derivedTotals).reduce((sum, amount) => sum + amount, 0))}
Total Cash Compensation: ${formatCurrency(result.tcc)}

PERIOD BREAKDOWN:
${result.breakdown.map(row => `
Period: ${formatDate(row.startDate)} to ${formatDate(row.endDate)}
Days: ${row.days}
Base Salary: ${formatCurrency(row.baseSalary)}
${Object.entries(row.componentAmounts).map(([key, value]) => 
  `${key === 'medical_director' ? 'Medical Director' : 
    key === 'division_chief' ? 'Division Chief' : 
    titleCase(key)}: ${formatCurrency(value)}`
).join('\n')}
Total: ${formatCurrency(row.totalAmount)}
`).join('\n')}

PERIOD DETAILS:
${periods.map(period => `
Period: ${formatDate(period.startDate)} to ${formatDate(period.endDate)}
Base Salary: ${formatCurrency(period.baseSalary)}
FTE Splits: ${Object.entries(period.splits).map(([key, value]) => 
  `${titleCase(key)}: ${(value * 100).toFixed(1)}%`
).join(', ')}
`).join('\n')}

${derivedItems.length > 0 ? `
ADDITIONAL INCENTIVES:
${derivedItems.map(item => `
Name: ${item.name}
Source Components: ${item.sourceComponent.split(',').filter(s => s.trim()).map(s => titleCase(s)).join(', ')}
Percentage: ${item.percentOfSource}%
Calculated Amount: ${(() => {
  const sourceComponents = item.sourceComponent.split(',').filter(s => s.trim());
  const totalSourceAmount = sourceComponents.reduce((sum, component) => {
    return sum + (result.totalsByComponent[component] || 0);
  }, 0);
  const calculatedAmount = totalSourceAmount * (item.percentOfSource / 100);
  return formatCurrency(calculatedAmount);
})()}
`).join('\n')}
` : ''}
    `.trim();

    const blob = new Blob([zipContent], { type: 'text/plain;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `proration-calculation-${new Date().toISOString().split('T')[0]}.txt`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
        borderBottom: `1px solid ${colors.outlineVariant}`,
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
            <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
          </svg>
          Export Options
        </h3>
      </div>
      
      <div style={{ padding: '24px' }}>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <button
            onClick={exportToPDF}
            style={{
              backgroundColor: colors.primary,
              color: colors.onPrimary,
              border: 'none',
              padding: '12px 24px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s ease-in-out'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
            </svg>
            Export to PDF
          </button>
          
          <button
            onClick={exportToCSV}
            style={{
              backgroundColor: colors.secondary,
              color: colors.onSecondary,
              border: 'none',
              padding: '12px 24px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s ease-in-out'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>
            </svg>
            Export to CSV
          </button>
          
          <button
            onClick={exportToZIP}
            style={{
              backgroundColor: colors.tertiary,
              color: colors.onTertiary,
              border: 'none',
              padding: '12px 24px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s ease-in-out'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20 6h-8l-2-2H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-1 12H5V8h14v10z"/>
            </svg>
            Export to ZIP
          </button>
        </div>
        
        <div style={{ 
          marginTop: '16px', 
          padding: '12px', 
          backgroundColor: colors.surfaceVariant, 
          borderRadius: '4px',
          ...typography.bodySmall,
          color: colors.onSurfaceVariant
        }}>
          <strong>Note:</strong> PDF export opens in a new window for printing. CSV export downloads a spreadsheet file. 
          ZIP export creates a compressed archive with all calculation data.
        </div>
      </div>
    </div>
  );
};
