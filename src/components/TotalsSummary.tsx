import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { formatCurrency } from '../lib/format';
import { titleCase } from '../lib/keys';
import { ProrationResult } from '../lib/proration';

interface TotalsSummaryProps {
  result: ProrationResult;
  componentKeys: string[];
}

export function TotalsSummary({ result, componentKeys }: TotalsSummaryProps) {
  const { totalsByComponent, derivedTotals, tcc } = result;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Component totals */}
      {componentKeys.map((key) => (
        <Card key={key} className="bg-gradient-to-br from-blue-50 to-indigo-100 border-blue-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-900">
              {titleCase(key)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">
              {formatCurrency(totalsByComponent[key] || 0)}
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Additional Incentives */}
      <Card className="bg-gradient-to-br from-green-50 to-emerald-100 border-green-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-green-900">
            Additional Incentives
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-900">
            {formatCurrency(Object.values(derivedTotals).reduce((sum, amount) => sum + amount, 0))}
          </div>
        </CardContent>
      </Card>

      {/* Total Cash Compensation */}
      <Card className="bg-gradient-to-br from-purple-50 to-violet-100 border-purple-200 col-span-full lg:col-span-1">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-purple-900">
            Total Cash Compensation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-purple-900">
            {formatCurrency(tcc)}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

