import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);

export type SplitMap = Record<string, number | undefined>;

export type BasePeriod = {
  id: string;
  startDate: string; // ISO yyyy-mm-dd
  endDate: string;   // ISO yyyy-mm-dd
  baseSalary: number;
  baseSalaryStr?: string;
  compSalaryOverride?: number;
  compSalaryStr?: string;
  splits: SplitMap;
};

export type DerivedItem = {
  id: string;
  name: string;
  sourceComponent: string;
  percentOfSource: number;
  cap?: number;
  floor?: number;
  // wRVU incentive fields
  isWrvuIncentive?: boolean;
  actualWrvus?: number;
  actualWrvusStr?: string;
  targetWrvus?: number;
  wrvuConversionFactor?: number;
};

export type ValidationError = {
  type: 'date' | 'fte' | 'overlap' | 'general';
  message: string;
  periodId?: string;
};

export type ValidationResult = {
  ok: boolean;
  errors: ValidationError[];
};

export type ProrationBreakdown = {
  periodId: string;
  startDate: string;
  endDate: string;
  days: number;
  baseSalary: number;
  componentAmounts: Record<string, number>;
  totalAmount: number;
};

export type ProrationResult = {
  breakdown: ProrationBreakdown[];
  totalsByComponent: Record<string, number>;
  derivedTotals: Record<string, number>;
  tcc: number;
};

/**
 * Check if a year is a leap year
 */
export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
}

/**
 * Get the number of days in a year
 */
export function daysInYear(year: number): number {
  return isLeapYear(year) ? 366 : 365;
}

/**
 * Calculate inclusive day count between two dates
 */
export function dayCountInclusive(startISO: string, endISO: string): number {
  const start = dayjs.utc(startISO);
  const end = dayjs.utc(endISO);
  return end.diff(start, 'day') + 1;
}

/**
 * Check if two date ranges overlap
 */
export function overlaps(
  aStart: string,
  aEnd: string,
  bStart: string,
  bEnd: string
): boolean {
  const aStartDate = dayjs.utc(aStart);
  const aEndDate = dayjs.utc(aEnd);
  const bStartDate = dayjs.utc(bStart);
  const bEndDate = dayjs.utc(bEnd);

  return aStartDate.isBefore(bEndDate) && aEndDate.isAfter(bStartDate);
}

/**
 * Validate periods and component configuration
 */
export function validateInputs(
  periods: BasePeriod[],
  year: number
): ValidationResult {
  const errors: ValidationError[] = [];

  // Validate each period
  periods.forEach((period, index) => {
    // Check date order
    if (dayjs.utc(period.startDate).isAfter(dayjs.utc(period.endDate))) {
      errors.push({
        type: 'date',
        message: `Period ${index + 1}: Start date must be before end date`,
        periodId: period.id,
      });
    }

    // Check if dates are within the selected year
    const startYear = dayjs.utc(period.startDate).year();
    const endYear = dayjs.utc(period.endDate).year();
    
    if (startYear !== year || endYear !== year) {
      errors.push({
        type: 'date',
        message: `Period ${index + 1}: Dates must be within year ${year}`,
        periodId: period.id,
      });
    }

    // Check FTE values
    const fteValues = Object.values(period.splits).filter(v => v !== undefined) as number[];
    
    fteValues.forEach(fte => {
      if (fte < 0 || fte > 1) {
        errors.push({
          type: 'fte',
          message: `Period ${index + 1}: FTE values must be between 0 and 1`,
          periodId: period.id,
        });
      }
    });

    const totalFte = fteValues.reduce((sum, fte) => sum + fte, 0);
    if (totalFte > 1) {
      errors.push({
        type: 'fte',
        message: `Period ${index + 1}: Total FTE cannot exceed 100%`,
        periodId: period.id,
      });
    }
  });

  // Temporarily disable FTE validation to prevent loops and flickering
  // This validation was causing issues with the Type dropdown and Period Breakdown
  // Users can manually ensure FTE totals don't exceed 100%

  return {
    ok: errors.length === 0,
    errors,
  };
}

/**
 * Calculate proration for all periods
 */
export function prorate(
  periods: BasePeriod[],
  year: number,
  componentKeys: string[]
): ProrationResult {
  const breakdown: ProrationBreakdown[] = [];
  const totalsByComponent: Record<string, number> = {};
  
  // Initialize totals
  componentKeys.forEach(key => {
    totalsByComponent[key] = 0;
  });

  const daysInYearCount = daysInYear(year);

  periods.forEach(period => {
    const days = dayCountInclusive(period.startDate, period.endDate);
    const componentAmounts: Record<string, number> = {};
    let totalAmount = 0;

    componentKeys.forEach(componentKey => {
      const fte = period.splits[componentKey] || 0;
      const annualForComponent = period.baseSalary * fte;
      const dailyRate = annualForComponent / daysInYearCount;
      const proratedAmount = dailyRate * days;
      
      componentAmounts[componentKey] = proratedAmount;
      totalsByComponent[componentKey] += proratedAmount;
      totalAmount += proratedAmount;
    });

    breakdown.push({
      periodId: period.id,
      startDate: period.startDate,
      endDate: period.endDate,
      days,
      baseSalary: period.baseSalary,
      componentAmounts,
      totalAmount,
    });
  });

  return {
    breakdown,
    totalsByComponent,
    derivedTotals: {},
    tcc: Object.values(totalsByComponent).reduce((sum, amount) => sum + amount, 0),
  };
}

/**
 * Calculate derived items based on component totals
 */
export function computeDerived(
  totalsByComponent: Record<string, number>,
  derivedItems: DerivedItem[]
): Record<string, number> {
  const derivedTotals: Record<string, number> = {};

  derivedItems.forEach(item => {
    let derivedAmount = 0;

    if (item.isWrvuIncentive && item.actualWrvus !== undefined && item.targetWrvus !== undefined && item.wrvuConversionFactor !== undefined) {
      // wRVU incentive calculation
      if (item.actualWrvus > item.targetWrvus) {
        derivedAmount = item.wrvuConversionFactor * (item.actualWrvus - item.targetWrvus);
      }
      // If actual <= target, incentive is 0
    } else {
      // Regular percentage-based incentive calculation
      // Handle multiple source components (comma-separated)
      const sourceComponents = item.sourceComponent.split(',').filter(s => s.trim());
      let totalSourceAmount = 0;
      
      sourceComponents.forEach(component => {
        totalSourceAmount += totalsByComponent[component.trim()] || 0;
      });
      
      derivedAmount = totalSourceAmount * (item.percentOfSource / 100);

      // Apply floor
      if (item.floor !== undefined && derivedAmount < item.floor) {
        derivedAmount = item.floor;
      }

      // Apply cap
      if (item.cap !== undefined && derivedAmount > item.cap) {
        derivedAmount = item.cap;
      }
    }

    derivedTotals[item.id] = derivedAmount;
  });

  return derivedTotals;
}

/**
 * Calculate total cash compensation including derived items
 */
export function calculateTCC(
  totalsByComponent: Record<string, number>,
  derivedTotals: Record<string, number>
): number {
  const componentTotal = Object.values(totalsByComponent).reduce((sum, amount) => sum + amount, 0);
  const derivedTotal = Object.values(derivedTotals).reduce((sum, amount) => sum + amount, 0);
  return componentTotal + derivedTotal;
}



