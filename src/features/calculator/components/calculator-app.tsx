import React, { useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { PeriodsTable } from './periods-table';
import { TotalsSummary } from './totals-summary';
import { PeriodBreakdown } from './period-breakdown';
import { AdditionalIncentives } from './additional-incentives';
import { TargetCalculator } from './target-calculator';
import { ActionButtons } from './action-buttons';
import { Header } from './header';
import { selectValidation, selectCalculationResult } from '../calculator-slice';
import { colors, typography } from '../../../styles/theme';
import { SaveCalculation } from '../../../components/SaveCalculation';
import { History } from '../../../components/History';

export const CalculatorApp: React.FC = () => {
  const pdfRef = useRef<HTMLDivElement>(null);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  
  const validation = useSelector(selectValidation);
  const result = useSelector(selectCalculationResult);

  const handleSaveCalculation = () => {
    setShowSaveModal(false);
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: colors.surface,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <Header />
      
      <div ref={pdfRef} style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <ActionButtons 
            validation={validation}
            onSave={() => setShowSaveModal(true)}
            onHistory={() => setShowHistoryModal(true)}
          />
          
          <TotalsSummary result={result} />
          <PeriodsTable />
          <PeriodBreakdown result={result} />
          <AdditionalIncentives />
          <TargetCalculator />
        </div>
      </div>

      {showSaveModal && (
        <SaveCalculation onClose={() => setShowSaveModal(false)} />
      )}
      
      {showHistoryModal && (
        <History onClose={() => setShowHistoryModal(false)} />
      )}
    </div>
  );
};
