// src/components/SearchFilters.js
import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Divider from '@mui/material/Divider';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid'; // For layout

const DAYS = ['M', 'T', 'W', 'R', 'F'];

/**
 * SearchFilters Component
 * Provides UI elements for setting search filters like time range and days.
 *
 * @param {object} props
 * @param {object} props.filters - The current filter values { startTime: string, endTime: string, days: string[] }
 * @param {function} props.onFilterChange - Callback function to update filters in the parent component
 * @param {function} props.onApplyFilters - Callback function to trigger search with applied filters
 * @param {function} props.onResetFilters - Callback function to reset filters
 */
const SearchFilters = ({ filters, onFilterChange, onApplyFilters, onResetFilters }) => {

  const handleTimeChange = (event) => {
    onFilterChange({ ...filters, [event.target.name]: event.target.value });
  };

  const handleDaysChange = (event, newDays) => {
    // newDays will be an array of selected day values (e.g., ['M', 'W', 'F'])
    onFilterChange({ ...filters, days: newDays });
  };

  return (
    <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Typography variant="subtitle1" gutterBottom>
        Filter Options
      </Typography>

      {/* Time Range Filter */}
      <Box>
        <Typography variant="body2" gutterBottom sx={{ fontWeight: 'medium' }}>
          Time Range
        </Typography>
        <Grid container spacing={1} alignItems="center">
          <Grid item xs={6}>
            <TextField
              label="Start Time"
              type="time"
              name="startTime"
              value={filters.startTime || ''} // Controlled component
              onChange={handleTimeChange}
              InputLabelProps={{ shrink: true }}
              inputProps={{ step: 300 }} // 5 min steps, optional
              size="small"
              fullWidth
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              label="End Time"
              type="time"
              name="endTime"
              value={filters.endTime || ''} // Controlled component
              onChange={handleTimeChange}
              InputLabelProps={{ shrink: true }}
              inputProps={{ step: 300 }} // 5 min steps, optional
              size="small"
              fullWidth
            />
          </Grid>
        </Grid>
      </Box>

      <Divider />

      {/* Days Filter */}
      <Box>
        <Typography variant="body2" gutterBottom sx={{ fontWeight: 'medium' }}>
          Days
        </Typography>
        <ToggleButtonGroup
          value={filters.days || []} // Controlled component, ensure it's an array
          onChange={handleDaysChange}
          aria-label="Filter by days"
          size="small"
          fullWidth // Make the group take full width
          sx={{ justifyContent: 'center' }} // Center the buttons
        >
          {DAYS.map((day) => (
            <ToggleButton key={day} value={day} aria-label={day} sx={{ flexGrow: 1 }}> {/* Allow buttons to grow */}
              {day}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Box>

       <Divider />

       {/* Action Buttons */}
       <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
           <Button onClick={onResetFilters} size="small">
                Reset Filters
           </Button>
           <Button variant="contained" onClick={onApplyFilters} size="small">
                Apply & Search
           </Button>
       </Box>
    </Box>
  );
};

export default SearchFilters;