// src/components/CustomEventForm.js
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Box from '@mui/material/Box';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Alert from '@mui/material/Alert';

// Define the days available for selection
const DAYS = ['M', 'T', 'W', 'R', 'F'];

/**
 * CustomEventForm Component
 * A dialog form for creating a new custom event using Material UI components.
 * Takes props to control visibility (open), closing (onClose), submission (onSubmit),
 * and to reflect loading/error states from the context (isLoading, error).
 */
function CustomEventForm({ open, onClose, onSubmit, isLoading, error }) {
  // State for form fields
  const [name, setName] = useState('');
  const [days, setDays] = useState([]); // Stores selected days as an array (e.g., ['M', 'W'])
  const [startTime, setStartTime] = useState(''); // Store as "HH:MM" string from time input
  const [endTime, setEndTime] = useState('');   // Store as "HH:MM" string from time input

  // State for local form validation errors
  const [formError, setFormError] = useState('');

  // Effect to reset the form fields and errors whenever the dialog opens or closes
  useEffect(() => {
    if (!open) {
      setName('');
      setDays([]);
      setStartTime('');
      setEndTime('');
      setFormError(''); // Clear local form error when closing/opening
    }
  }, [open]); // Dependency array ensures this runs only when 'open' changes

  // Handler for the day selection toggle buttons
  const handleDaysChange = (event, newDays) => {
    setDays(newDays); // MUI ToggleButtonGroup provides the new array of selected values
  };

  // Function to validate form inputs before submission
  const validateForm = () => {
    if (!name.trim()) return "Event name is required.";
    if (days.length === 0) return "At least one day must be selected.";
    if (!startTime) return "Start time is required.";
    if (!endTime) return "End time is required.";

    // Basic time format check (HH:MM) - assumes browser's time input provides this format
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (!timeRegex.test(startTime)) return "Invalid start time format (HH:MM).";
    if (!timeRegex.test(endTime)) return "Invalid end time format (HH:MM).";

    // Basic check: start time should be before end time (lexicographical comparison works for HH:MM)
    if (startTime >= endTime) {
        return "Start time must be before end time.";
    }

    return ''; // Return empty string if no errors
  };

  // Handler for the form submission (triggered by the "Add Event" button)
  const handleSubmit = (event) => {
    event.preventDefault(); // Prevent default form submission behavior

    // Validate the form
    const validationError = validateForm();
    if (validationError) {
        setFormError(validationError); // Show validation error locally
        return; // Stop submission if validation fails
    }
    setFormError(''); // Clear previous local error if validation passes

    // Format the data for the backend API call
    const eventData = {
      name: name.trim(),
      days: days.join(''), // Join the array of days into a single string (e.g., "MWF")
      startTime: startTime, // Already in "HH:MM" format
      endTime: endTime,     // Already in "HH:MM" format
    };

    // Call the onSubmit prop function (passed from MainPage, which calls the context function)
    onSubmit(eventData);
  };

  // Render the Dialog component
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Create Custom Event</DialogTitle>
      <DialogContent>
        {/* Display global error from context (e.g., API error) if no local form error */}
        {error && !formError && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {/* Display local form validation error */}
        {formError && <Alert severity="warning" sx={{ mb: 2 }}>{formError}</Alert>}

        {/* Form element */}
        <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
          {/* Event Name Input */}
          <TextField
            autoFocus // Automatically focus this field when dialog opens
            required
            margin="dense"
            id="eventName"
            label="Event Name"
            type="text"
            fullWidth
            variant="outlined"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={isLoading} // Disable input while loading
          />

          {/* Day Selection */}
          <Box sx={{ mt: 2, mb: 1 }}>
            <Typography variant="body2" gutterBottom sx={{ fontWeight: 'medium' }}>
              Days *
            </Typography>
            <ToggleButtonGroup
              value={days} // Controlled component based on state
              onChange={handleDaysChange}
              aria-label="Select days"
              size="small"
              fullWidth // Make the group span the full width
              disabled={isLoading} // Disable while loading
              sx={{ justifyContent: 'center' }} // Center the buttons within the group
            >
              {DAYS.map((day) => (
                <ToggleButton key={day} value={day} aria-label={day} sx={{ flexGrow: 1 }}>
                  {day}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
          </Box>

          {/* Time Selection */}
          <Grid container spacing={1} sx={{ mt: 1 }}>
            <Grid item xs={6}>
              <TextField
                required
                label="Start Time"
                type="time" // Use browser's native time picker
                name="startTime"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                InputLabelProps={{ shrink: true }} // Ensure label doesn't overlap time
                inputProps={{ step: 900 }} // Optional: Set step to 15 minutes (900 seconds)
                size="small"
                fullWidth
                disabled={isLoading} // Disable while loading
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                required
                label="End Time"
                type="time"
                name="endTime"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                InputLabelProps={{ shrink: true }}
                inputProps={{ step: 900 }} // 15 min steps
                size="small"
                fullWidth
                disabled={isLoading} // Disable while loading
              />
            </Grid>
          </Grid>
        </Box>
      </DialogContent>
      {/* Dialog Action Buttons */}
      <DialogActions sx={{ padding: '16px 24px'}}>
        <Button onClick={onClose} disabled={isLoading}>Cancel</Button>
        {/* Submit Button - Text changes based on loading state */}
        <Button
            onClick={handleSubmit} // Use the internal handleSubmit which validates first
            variant="contained"
            disabled={isLoading} // Disable button while loading
        >
            {isLoading ? 'Adding...' : 'Add Event'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// PropTypes for type checking the component's props
CustomEventForm.propTypes = {
  open: PropTypes.bool.isRequired, // Dialog visibility
  onClose: PropTypes.func.isRequired, // Function to close the dialog
  onSubmit: PropTypes.func.isRequired, // Function to handle form submission
  isLoading: PropTypes.bool, // Optional: Loading state indicator
  error: PropTypes.string, // Optional: Error message string
};

// Default values for optional props
CustomEventForm.defaultProps = {
    isLoading: false,
    error: null,
};

export default CustomEventForm;
