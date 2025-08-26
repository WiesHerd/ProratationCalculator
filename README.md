# Total Cash Compensation (Proration Machine)

A single-page React application for prorating compensation across a selected calendar year using dated salary/FTE periods and dynamic incentives. The app provides period breakdowns, annual totals by component, derived items, and Total Cash Compensation (TCC) calculations with Excel export functionality.

## Features

- **Local-First Design**: All data persists to localStorage automatically
- **Dynamic Component Management**: Add/remove compensation components (e.g., Clinical, Division Chief, Program Director)
- **Period-Based Proration**: Define multiple salary periods with different base salaries and FTE splits
- **Additional Incentives**: Configure derived items based on component percentages with optional caps/floors
- **Real-Time Validation**: Comprehensive validation for date ranges, FTE values, and overlaps
- **Excel Export**: Generate detailed Excel workbooks with multiple sheets
- **Responsive UI**: Modern interface built with Tailwind CSS and shadcn/ui components

## Tech Stack

- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **shadcn/ui** for UI components
- **dayjs** for date calculations
- **xlsx** (SheetJS) for Excel export
- **zod** for validation schemas

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd ProrationMachine
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173`

## Usage

### Basic Workflow

1. **Set the Year**: Select the calendar year for proration calculations
2. **Configure Components**: Add compensation components (Clinical is included by default)
3. **Define Periods**: Add salary periods with start/end dates, base salaries, and FTE splits
4. **Add Incentives**: Configure additional incentives based on component percentages
5. **Review Results**: View real-time calculations in the summary cards and breakdown table
6. **Export**: Generate Excel files with detailed breakdowns and input data

### Key Concepts

#### Proration Rules
- **Daily Calculation**: Compensation is prorated on a daily basis
- **Inclusive Day Counting**: Period days = (end date - start date) + 1
- **FTE Validation**: Total FTE per period must be ≤ 1.0
- **Overlap Prevention**: No overlapping active ranges for the same component

#### Component Salary Quick-Fill
- Enter a component salary amount to automatically calculate the corresponding FTE
- FTE = Component Salary / Base Salary (clamped between 0 and 1)

#### Additional Incentives
- Calculate as percentage of source component totals
- Apply optional minimum (floor) and maximum (cap) values
- Computed on annual component totals, not per-period

### Sample Data

The app comes pre-loaded with sample data for 2025:
- **Period 1**: 01/01/2025 - 08/24/2025, $1,529,264.25, 80% Clinical FTE
- **Period 2**: 08/25/2025 - 12/31/2025, $2,150,000.00, 80% Clinical FTE
- **PSQ Incentive**: 5% of Clinical component

Expected results:
- Clinical Total: ~$1,398,918.06
- PSQ: ~$69,945.90
- TCC: ~$1,468,863.96

## File Structure

```
src/
├── components/
│   ├── ui/                 # shadcn/ui components
│   ├── PeriodGrid.tsx      # Period management and FTE splits
│   ├── IncentivesEditor.tsx # Additional incentives configuration
│   ├── TotalsSummary.tsx   # Summary cards with totals
│   └── ExportButton.tsx    # Excel export functionality
├── hooks/
│   └── useLocalState.ts    # localStorage state management
├── lib/
│   ├── proration.ts        # Core calculation logic
│   ├── format.ts           # Currency and date formatting
│   ├── storage.ts          # localStorage utilities
│   ├── keys.ts             # Key normalization utilities
│   └── utils.ts            # General utilities
├── App.tsx                 # Main application component
└── main.tsx               # Application entry point
```

## Data Model

### BasePeriod
```typescript
{
  id: string;
  startDate: string;        // ISO yyyy-mm-dd
  endDate: string;          // ISO yyyy-mm-dd
  baseSalary: number;
  baseSalaryStr?: string;   // Formatted display string
  compSalaryOverride?: number;
  compSalaryStr?: string;
  splits: SplitMap;         // Component FTE splits
}
```

### DerivedItem
```typescript
{
  id: string;
  name: string;
  sourceComponent: string;
  percentOfSource: number;
  cap?: number;
  floor?: number;
}
```

## Excel Export

The export functionality generates a comprehensive Excel workbook with four sheets:

1. **Breakdown**: Detailed period-by-period calculations with FTE and dollar amounts
2. **Totals**: Component totals, derived items, and final TCC
3. **Inputs-Periods**: Raw period data for reference
4. **Inputs-Incentives**: Derived item configurations

## Validation Rules

- **Dates**: Must be within selected year, start ≤ end
- **FTE Values**: Must be between 0 and 1, total ≤ 1.0 per period
- **Overlaps**: No overlapping periods for the same component
- **Required Fields**: All periods must have valid dates and base salaries

## Local Storage Keys

- `tcc.year`: Selected calendar year
- `tcc.componentKeys`: Array of component keys
- `tcc.periods`: Array of period data
- `tcc.derivedItems`: Array of derived item configurations

## Development

### Available Scripts

- `npm run dev`: Start development server
- `npm run build`: Build for production
- `npm run preview`: Preview production build
- `npm run lint`: Run ESLint

### Adding New Features

1. **New Components**: Add to `componentKeys` array, update UI components
2. **New Calculations**: Extend `proration.ts` with new calculation functions
3. **New UI Elements**: Create components in `src/components/`
4. **New Validation**: Add rules to `validateInputs()` function

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## License

This project is licensed under the MIT License.

