import React from 'react';
import { 
  Button, 
  TextField, 
  Paper, 
  Box, 
  Typography, 
  Grid, 
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent
} from '@mui/material';
import { 
  Add as AddIcon, 
  Delete as DeleteIcon 
} from '@mui/icons-material';
import { formatCurrency, parseCurrency } from '../lib/format';
import { titleCase } from '../lib/keys';
import { DerivedItem } from '../lib/proration';

interface IncentivesEditorProps {
  derivedItems: DerivedItem[];
  componentKeys: string[];
  onDerivedItemsChange: (items: DerivedItem[]) => void;
}

export function IncentivesEditor({
  derivedItems,
  componentKeys,
  onDerivedItemsChange,
}: IncentivesEditorProps) {
  const addDerivedItem = () => {
    const newItem: DerivedItem = {
      id: crypto.randomUUID(),
      name: '',
      sourceComponent: componentKeys[0] || '',
      percentOfSource: 0,
    };
    onDerivedItemsChange([...derivedItems, newItem]);
  };

  const updateDerivedItem = (id: string, updates: Partial<DerivedItem>) => {
    onDerivedItemsChange(
      derivedItems.map((item) =>
        item.id === id ? { ...item, ...updates } : item
      )
    );
  };

  const deleteDerivedItem = (id: string) => {
    onDerivedItemsChange(derivedItems.filter((item) => item.id !== id));
  };

  return (
    <Paper elevation={2}>
      {/* Header */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', bgcolor: 'grey.50', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6" fontWeight="semibold">
          Additional Incentives
        </Typography>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />}
          onClick={addDerivedItem}
          size="small"
        >
          Add Incentive
        </Button>
      </Box>

      {/* Content */}
      <Box sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {derivedItems.map((item, index) => (
            <Box 
              key={item.id} 
              sx={{ 
                p: 2, 
                border: 1, 
                borderColor: 'divider', 
                borderRadius: 1,
                bgcolor: index % 2 === 0 ? 'background.paper' : 'grey.50',
                '&:hover': { boxShadow: 1 }
              }}
            >
              <Grid container spacing={2} alignItems="flex-end">
                <Grid item xs={12} sm={6} lg={2}>
                  <TextField
                    label="Name"
                    value={item.name}
                    onChange={(e) => updateDerivedItem(item.id, { name: e.target.value })}
                    placeholder="e.g., PSQ"
                    size="small"
                    fullWidth
                    InputProps={{ sx: { fontSize: '0.875rem' } }}
                    InputLabelProps={{ sx: { fontSize: '0.75rem' } }}
                  />
                </Grid>
                
                <Grid item xs={12} sm={6} lg={2}>
                  <FormControl size="small" fullWidth>
                    <InputLabel sx={{ fontSize: '0.75rem' }}>Source Component</InputLabel>
                    <Select
                      value={item.sourceComponent}
                      label="Source Component"
                      onChange={(e: SelectChangeEvent) => updateDerivedItem(item.id, { sourceComponent: e.target.value })}
                      sx={{ fontSize: '0.875rem' }}
                    >
                      {componentKeys.map((key) => (
                        <MenuItem key={key} value={key}>
                          {titleCase(key)}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} sm={6} lg={2}>
                  <TextField
                    label="Percent"
                    type="number"
                    inputProps={{ step: 0.1, min: 0 }}
                    value={item.percentOfSource}
                    onChange={(e) => updateDerivedItem(item.id, { percentOfSource: parseFloat(e.target.value) || 0 })}
                    placeholder="5.0"
                    size="small"
                    fullWidth
                    InputProps={{ sx: { fontSize: '0.875rem' } }}
                    InputLabelProps={{ sx: { fontSize: '0.75rem' } }}
                  />
                </Grid>
                
                <Grid item xs={12} sm={6} lg={2}>
                  <TextField
                    label="Floor (Optional)"
                    type="number"
                    inputProps={{ step: 1000, min: 0 }}
                    value={item.floor || ''}
                    onChange={(e) => {
                      const value = e.target.value ? parseFloat(e.target.value) : undefined;
                      updateDerivedItem(item.id, { floor: value });
                    }}
                    placeholder="0"
                    size="small"
                    fullWidth
                    InputProps={{ sx: { fontSize: '0.875rem' } }}
                    InputLabelProps={{ sx: { fontSize: '0.75rem' } }}
                  />
                </Grid>
                
                <Grid item xs={12} sm={6} lg={2}>
                  <TextField
                    label="Cap (Optional)"
                    type="number"
                    inputProps={{ step: 1000, min: 0 }}
                    value={item.cap || ''}
                    onChange={(e) => {
                      const value = e.target.value ? parseFloat(e.target.value) : undefined;
                      updateDerivedItem(item.id, { cap: value });
                    }}
                    placeholder="0"
                    size="small"
                    fullWidth
                    InputProps={{ sx: { fontSize: '0.875rem' } }}
                    InputLabelProps={{ sx: { fontSize: '0.75rem' } }}
                  />
                </Grid>
                
                <Grid item xs={12} sm={6} lg={2}>
                  <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                    <IconButton
                      size="small"
                      onClick={() => deleteDerivedItem(item.id)}
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
                </Grid>
              </Grid>
            </Box>
          ))}
          
          {derivedItems.length === 0 && (
            <Box 
              sx={{ 
                textAlign: 'center', 
                color: 'text.secondary', 
                py: 6, 
                fontSize: '0.875rem',
                bgcolor: 'background.paper',
                borderRadius: 1,
                border: 2,
                borderStyle: 'dashed',
                borderColor: 'grey.300'
              }}
            >
              No additional incentives configured. Click "Add Incentive" to get started.
            </Box>
          )}
        </Box>
      </Box>
    </Paper>
  );
}
