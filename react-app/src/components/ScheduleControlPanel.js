// src/components/ScheduleControlPanel.js
import React, { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';

// Import hooks to access context
import { useAuth } from '../context/AuthContext';
import { useSchedule } from '../context/ScheduleContext';

/**
 * ScheduleControlPanel Component
 * Allows users to load existing schedules or create new ones.
 */
const ScheduleControlPanel = () => {
  const { currentUser } = useAuth();
  const {
    loadSchedule,
    createNewSchedule,
    isControlLoading,
    controlError
  } = useSchedule();

  const [selectedSchedule, setSelectedSchedule] = useState('');
  const [newScheduleName, setNewScheduleName] = useState('');

  // Extract schedule names from the user's schedule list paths
  const savedScheduleNames = React.useMemo(() => {
    if (!currentUser?.mySchedules) return [];
    return currentUser.mySchedules.map(filePath => {
      try {
        // Extract name between last '/' and last '.'
        return filePath.substring(filePath.lastIndexOf('/') + 1, filePath.lastIndexOf('.'));
      } catch (e) {
        console.error("Error parsing schedule path:", filePath, e);
        return null; // Handle potential errors in path format
      }
    }).filter(name => name); // Filter out any nulls from parsing errors
  }, [currentUser?.mySchedules]);

  // Reset selection when schedule list changes
  useEffect(() => {
      setSelectedSchedule('');
  }, [savedScheduleNames]);

  const handleLoadClick = () => {
    if (selectedSchedule) {
      loadSchedule(selectedSchedule);
    }
  };

  const handleCreateClick = () => {
    if (newScheduleName.trim()) {
      createNewSchedule(newScheduleName.trim());
      setNewScheduleName(''); // Clear input after attempt
    }
  };

  const handleCreateKeyPress = (event) => {
      if (event.key === 'Enter') {
          handleCreateClick();
      }
  }

  // Don't render controls if user is not logged in
  if (!currentUser) {
    return null;
  }

  return (
    <Box sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1, mt: 2 }}>
      <Typography variant="h6" gutterBottom>Manage Schedules</Typography>

      {/* Display errors specific to load/create actions */}
      {controlError && <Alert severity="error" sx={{ mb: 2 }}>{controlError}</Alert>}

      {/* Load Existing Schedule Section - Always Rendered */}
      {/* ***** START OF CHANGE ***** */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle1" gutterBottom>
            Load Existing Schedule
        </Typography>
        {savedScheduleNames.length > 0 ? (
          // Show dropdown and button if schedules exist
          <>
            <FormControl fullWidth margin="normal" disabled={isControlLoading} size="small">
              <InputLabel id="load-schedule-select-label">Select Schedule</InputLabel>
              <Select
                labelId="load-schedule-select-label"
                id="load-schedule-select"
                value={selectedSchedule}
                label="Select Schedule" // Match label
                onChange={(e) => setSelectedSchedule(e.target.value)}
              >
                <MenuItem value="" disabled>
                  <em>Select a schedule...</em>
                </MenuItem>
                {savedScheduleNames.map(name => (
                  <MenuItem key={name} value={name}>{name}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button
              variant="contained"
              onClick={handleLoadClick}
              disabled={!selectedSchedule || isControlLoading}
              startIcon={isControlLoading ? <CircularProgress size={20} /> : null}
              sx={{ mt: 1 }}
              fullWidth
            >
              Load Selected
            </Button>
          </>
        ) : (
          // Show message if no schedules exist
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            No saved schedules found. Create one below.
          </Typography>
        )}
      </Box>
      {/* ***** END OF CHANGE ***** */}


      {/* Divider - Always show */}
      {/* ***** START OF CHANGE ***** */}
      <Divider sx={{ my: 2 }} />
      {/* ***** END OF CHANGE ***** */}


      {/* Create New Schedule Section - Always Rendered */}
      <Box>
        <Typography variant="subtitle1" gutterBottom>
            Create New Schedule
        </Typography>
        <TextField
          label="New Schedule Name"
          variant="outlined"
          fullWidth
          margin="normal"
          size="small"
          value={newScheduleName}
          onChange={(e) => setNewScheduleName(e.target.value)}
          onKeyPress={handleCreateKeyPress}
          disabled={isControlLoading}
        />
        <Button
          variant="contained"
          color="secondary"
          onClick={handleCreateClick}
          disabled={!newScheduleName.trim() || isControlLoading}
          startIcon={isControlLoading ? <CircularProgress size={20} /> : null}
          sx={{ mt: 1 }}
          fullWidth
        >
          Create New
        </Button>
      </Box>
    </Box>
  );
};

export default ScheduleControlPanel;
