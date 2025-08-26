import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { BasePeriod, DerivedItem, validateInputs, prorate, computeDerived, calculateTCC } from '../../lib/proration';

export interface CalculatorState {
  year: number;
  componentKeys: string[];
  periods: BasePeriod[];
  derivedItems: DerivedItem[];
  targetComponents: string[];
  conversionFactor: number;
  useCustomAmount: boolean;
  customAmount: number;
}

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

const initialState: CalculatorState = {
  year: 2025,
  componentKeys: ['clinical'],
  periods: seedPeriods,
  derivedItems: seedDerivedItems,
  targetComponents: [],
  conversionFactor: 0,
  useCustomAmount: false,
  customAmount: 0,
};

const calculatorSlice = createSlice({
  name: 'calculator',
  initialState,
  reducers: {
    setYear: (state, action: PayloadAction<number>) => {
      state.year = action.payload;
    },
    setComponentKeys: (state, action: PayloadAction<string[]>) => {
      state.componentKeys = action.payload;
    },
    addComponentKey: (state, action: PayloadAction<string>) => {
      if (!state.componentKeys.includes(action.payload)) {
        state.componentKeys.push(action.payload);
      }
    },
    setPeriods: (state, action: PayloadAction<BasePeriod[]>) => {
      state.periods = action.payload;
    },
    addPeriod: (state) => {
      const newPeriod: BasePeriod = {
        id: crypto.randomUUID(),
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        baseSalary: 0,
        baseSalaryStr: '',
        splits: { clinical: 1.0 },
      };
      state.periods.push(newPeriod);
    },
    updatePeriod: (state, action: PayloadAction<{ id: string; updates: Partial<BasePeriod> }>) => {
      const { id, updates } = action.payload;
      const periodIndex = state.periods.findIndex(p => p.id === id);
      if (periodIndex !== -1) {
        state.periods[periodIndex] = { ...state.periods[periodIndex], ...updates };
      }
    },
    deletePeriod: (state, action: PayloadAction<string>) => {
      state.periods = state.periods.filter(p => p.id !== action.payload);
    },
    duplicatePeriod: (state, action: PayloadAction<string>) => {
      const period = state.periods.find(p => p.id === action.payload);
      if (period) {
        const newPeriod: BasePeriod = {
          ...period,
          id: crypto.randomUUID(),
        };
        state.periods.push(newPeriod);
      }
    },
    setDerivedItems: (state, action: PayloadAction<DerivedItem[]>) => {
      state.derivedItems = action.payload;
    },
    addDerivedItem: (state) => {
      const newItem: DerivedItem = {
        id: crypto.randomUUID(),
        name: '',
        sourceComponent: state.componentKeys[0] || '',
        percentOfSource: 0,
      };
      state.derivedItems.push(newItem);
    },
    updateDerivedItem: (state, action: PayloadAction<{ id: string; updates: Partial<DerivedItem> }>) => {
      const { id, updates } = action.payload;
      const itemIndex = state.derivedItems.findIndex(i => i.id === id);
      if (itemIndex !== -1) {
        state.derivedItems[itemIndex] = { ...state.derivedItems[itemIndex], ...updates };
      }
    },
    deleteDerivedItem: (state, action: PayloadAction<string>) => {
      state.derivedItems = state.derivedItems.filter(i => i.id !== action.payload);
    },
    setTargetComponents: (state, action: PayloadAction<string[]>) => {
      state.targetComponents = action.payload;
    },
    setConversionFactor: (state, action: PayloadAction<number>) => {
      state.conversionFactor = action.payload;
    },
    setUseCustomAmount: (state, action: PayloadAction<boolean>) => {
      state.useCustomAmount = action.payload;
    },
    setCustomAmount: (state, action: PayloadAction<number>) => {
      state.customAmount = action.payload;
    },
    resetCalculator: (state) => {
      state.year = 2025;
      state.componentKeys = ['clinical'];
      state.periods = [];
      state.derivedItems = [];
      state.targetComponents = [];
      state.conversionFactor = 0;
      state.useCustomAmount = false;
      state.customAmount = 0;
    },
  },
});

export const {
  setYear,
  setComponentKeys,
  addComponentKey,
  setPeriods,
  addPeriod,
  updatePeriod,
  deletePeriod,
  duplicatePeriod,
  setDerivedItems,
  addDerivedItem,
  updateDerivedItem,
  deleteDerivedItem,
  setTargetComponents,
  setConversionFactor,
  setUseCustomAmount,
  setCustomAmount,
  resetCalculator,
} = calculatorSlice.actions;

// Selectors
export const selectYear = (state: { calculator: CalculatorState }) => state.calculator.year;
export const selectComponentKeys = (state: { calculator: CalculatorState }) => state.calculator.componentKeys;
export const selectPeriods = (state: { calculator: CalculatorState }) => state.calculator.periods;
export const selectDerivedItems = (state: { calculator: CalculatorState }) => state.calculator.derivedItems;
export const selectTargetComponents = (state: { calculator: CalculatorState }) => state.calculator.targetComponents;
export const selectConversionFactor = (state: { calculator: CalculatorState }) => state.calculator.conversionFactor;
export const selectUseCustomAmount = (state: { calculator: CalculatorState }) => state.calculator.useCustomAmount;
export const selectCustomAmount = (state: { calculator: CalculatorState }) => state.calculator.customAmount;

// Computed selectors
export const selectDerivedComponentKeys = (state: { calculator: CalculatorState }) => {
  const periods = state.calculator.periods;
  const allKeys = new Set<string>();
  periods.forEach(period => {
    Object.keys(period.splits).forEach(key => {
      if (period.splits[key] && period.splits[key]! > 0) {
        allKeys.add(key);
      }
    });
  });
  return Array.from(allKeys);
};

export const selectValidation = (state: { calculator: CalculatorState }) => {
  return validateInputs(state.calculator.periods, state.calculator.year);
};

export const selectCalculationResult = (state: { calculator: CalculatorState }) => {
  const { periods, year, derivedItems } = state.calculator;
  const derivedComponentKeys = selectDerivedComponentKeys(state);
  
  const validation = validateInputs(periods, year);
  const prorationResult = prorate(periods, year, derivedComponentKeys);
  const derivedTotals = computeDerived(prorationResult.totalsByComponent, derivedItems);
  const tcc = calculateTCC(prorationResult.totalsByComponent, derivedTotals);
  
  return {
    ...prorationResult,
    derivedTotals,
    tcc,
  };
};

export default calculatorSlice.reducer;
