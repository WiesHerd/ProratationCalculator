import React, { useState } from 'react';
import { 
  Button, 
  TextField, 
  Paper, 
  Box, 
  Typography, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  IconButton,
  Alert,
  AlertTitle,
  FormControl,
  Select,
  MenuItem,
  SelectChangeEvent
} from '@mui/material';
import { 
  Add as AddIcon, 
  ContentCopy as CopyIcon, 
  Delete as DeleteIcon 
} from '@mui/icons-material';
import { formatCurrency, parseCurrency, formatDate } from '../lib/format';
import { normalizeKey, titleCase } from '../lib/keys';
import { BasePeriod, ValidationError, dayCountInclusive, daysInYear } from '../lib/proration';

interface PeriodGridProps {
  periods: BasePeriod[];
  componentKeys: string[];
  onPeriodsChange: (periods: BasePeriod[]) => void;
  onComponentKeysChange: (keys: string[]) => void;
  validationErrors: ValidationError[];
}

export function PeriodGrid({
  periods,
  componentKeys,
  onPeriodsChange,
  onComponentKeysChange,
  validationErrors,
}: PeriodGridProps) {
  const [newComponentKey, setNewComponentKey] = useState('');
  const [newComponentLabel, setNewComponentLabel] = useState('');

  const addPeriod = () => {
    const newPeriod: BasePeriod = {
      id: crypto.randomUUID(),
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
      baseSalary: 0,
      baseSalaryStr: '',
      splits: componentKeys.reduce((acc, key) => ({ ...acc, [key]: 0 }), {}),
    };
    onPeriodsChange([...periods, newPeriod]);
  };

  const updatePeriod = (id: string, updates: Partial<BasePeriod>) => {
    onPeriodsChange(
      periods.map((period) =>
        period.id === id ? { ...period, ...updates } : period
      )
    );
  };

  const deletePeriod = (id: string) => {
    onPeriodsChange(periods.filter((period) => period.id !== id));
  };

  const duplicatePeriod = (id: string) => {
    const period = periods.find((p) => p.id === id);
    if (period) {
      const newPeriod: BasePeriod = {
        ...period,
        id: crypto.randomUUID(),
      };
      onPeriodsChange([...periods, newPeriod]);
    }
  };

  const addComponentKey = () => {
    if (newComponentLabel.trim() && !componentKeys.includes(normalizeKey(newComponentLabel))) {
      const key = normalizeKey(newComponentLabel);
      onComponentKeysChange([...componentKeys, key]);
      
      // Add the new component to all existing periods
      onPeriodsChange(
        periods.map((period) => ({
          ...period,
          splits: { ...period.splits, [key]: 0 },
        }))
      );
      
      setNewComponentLabel('');
    }
  };

  const removeComponentKey = (keyToRemove: string) => {
    if (keyToRemove === 'clinical') return; // Prevent deletion of clinical
    
    onComponentKeysChange(componentKeys.filter((key) => key !== keyToRemove));
    
    // Remove the component from all periods
    onPeriodsChange(
      periods.map((period) => {
        const newSplits = { ...period.splits };
        delete newSplits[keyToRemove];
        return { ...period, splits: newSplits };
      })
    );
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

  const handleComponentSalaryChange = (id: string, value: string, targetKey: string) => {
    const period = periods.find((p) => p.id === id);
    if (period) {
      updatePeriod(id, { compSalaryStr: value });
    }
  };

  const handleComponentSalaryBlur = (id: string, targetKey: string) => {
    const period = periods.find((p) => p.id === id);
    if (period?.compSalaryStr && period.baseSalary > 0) {
      const parsed = parseCurrency(period.compSalaryStr);
      const newFte = Math.max(0, Math.min(1, parsed / period.baseSalary));
      
      updatePeriod(id, {
        compSalaryOverride: parsed,
        compSalaryStr: formatCurrency(parsed),
        splits: { ...period.splits, [targetKey]: newFte }
      });
    }
  };

  const getComponentSalaryPlaceholder = (period: BasePeriod) => {
    const totalFte = Object.values(period.splits).reduce((sum, fte) => sum + (fte || 0), 0);
    return formatCurrency(period.baseSalary * totalFte);
  };

  return (
    <Paper elevation={2}>
      {/* Header */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', bgcolor: 'grey.50', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6" fontWeight="semibold">
          Periods & FTE Splits
        </Typography>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />}
          onClick={addPeriod}
          size="small"
        >
          Add Period
        </Button>
      </Box>

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <Alert severity="error" sx={{ m: 2 }}>
          <AlertTitle>Validation Errors:</AlertTitle>
          <Box component="ul" sx={{ m: 0, pl: 2 }}>
            {validationErrors.map((error, index) => (
              <Box component="li" key={index} sx={{ mb: 0.5 }}>
                {error.message}
              </Box>
            ))}
          </Box>
        </Alert>
      )}

      {/* Table */}
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: 'grey.200' }}>
              <TableCell sx={{ fontWeight: 600 }}>Start Date</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>End Date</TableCell>
              <TableCell align="center" sx={{ fontWeight: 600 }}>Days</TableCell>
              <TableCell align="center" sx={{ fontWeight: 600 }}>FTE</TableCell>
              <TableCell align="center" sx={{ fontWeight: 600 }}>% of Time</TableCell>
              <TableCell align="right" sx={{ fontWeight: 600 }}>Base Salary</TableCell>
              <TableCell align="center" sx={{ fontWeight: 600 }}>Type</TableCell>
              <TableCell align="right" sx={{ fontWeight: 600 }}>Prorated Salary</TableCell>
              <TableCell align="center" sx={{ fontWeight: 600 }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {periods.map((period, index) => {
              const days = dayCountInclusive(period.startDate, period.endDate);
              const daysInYearValue = daysInYear(2025);
              const percentOfYear = ((days / daysInYearValue) * 100).toFixed(1);
              const totalFte = Object.values(period.splits).reduce((sum, fte) => sum + (fte || 0), 0);
              const proratedSalary = period.baseSalary * totalFte;
              
              return (
                <TableRow 
                  key={period.id} 
                  sx={{ 
                    bgcolor: index % 2 === 0 ? 'background.paper' : 'grey.50',
                    '&:hover': { bgcolor: 'action.hover' }
                  }}
                >
                  <TableCell>
                    <TextField
                      type="date"
                      value={period.startDate}
                      onChange={(e) => updatePeriod(period.id, { startDate: e.target.value })}
                      size="small"
                      sx={{ width: 130 }}
                      InputProps={{ sx: { fontSize: '0.875rem' } }}
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      type="date"
                      value={period.endDate}
                      onChange={(e) => updatePeriod(period.id, { endDate: e.target.value })}
                      size="small"
                      sx={{ width: 130 }}
                      InputProps={{ sx: { fontSize: '0.875rem' } }}
                    />
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: 500 }}>
                    {days}
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: 500 }}>
                    {totalFte.toFixed(2)}
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: 500 }}>
                    {percentOfYear}%
                  </TableCell>
                  <TableCell>
                    <TextField
                      value={period.baseSalaryStr || ''}
                      onChange={(e) => handleBaseSalaryChange(period.id, e.target.value)}
                      onBlur={() => handleBaseSalaryBlur(period.id)}
                      placeholder="0.00"
                      size="small"
                      sx={{ width: 110 }}
                      inputProps={{ 
                        style: { textAlign: 'right', fontSize: '0.875rem' }
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <FormControl size="small" sx={{ minWidth: 100 }}>
                      <Select
                        defaultValue="clinical"
                        sx={{ fontSize: '0.875rem' }}
                      >
                        <MenuItem value="clinical">Clinical</MenuItem>
                        <MenuItem value="admin">Admin</MenuItem>
                        <MenuItem value="research">Research</MenuItem>
                        <MenuItem value="teaching">Teaching</MenuItem>
                      </Select>
                    </FormControl>
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>
                    {formatCurrency(proratedSalary)}
                  </TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                      <IconButton
                        size="small"
                        onClick={() => duplicatePeriod(period.id)}
                        sx={{ 
                          border: 1, 
                          borderColor: 'grey.300',
                          color: 'grey.600',
                          '&:hover': { bgcolor: 'grey.50' }
                        }}
                      >
                        <CopyIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => deletePeriod(period.id)}
                        sx={{ 
                          border: 1, 
                          borderColor: 'grey.300',
                          color: 'grey.600',
                          '&:hover': { bgcolor: 'grey.50' }
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}
