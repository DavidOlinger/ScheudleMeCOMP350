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
// Imports for Share Dialog
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import ShareIcon from '@mui/icons-material/Share';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import Link from '@mui/material/Link';
import Tooltip from '@mui/material/Tooltip';


// Import hooks to access context
import { useAuth } from '../context/AuthContext';
import { useSchedule } from '../context/ScheduleContext';

/**
 * ScheduleControlPanel Component
 * Allows users to load existing schedules or create new ones.
 * Includes functionality to share schedules via ngrok or localhost.
 */
const ScheduleControlPanel = () => {
  const { currentUser } = useAuth();
  // Get ALL necessary state/functions from context
  const {
    loadSchedule,
    createNewSchedule,
    isControlLoading, // Loading state specifically for load/create
    controlError,    // Error state specifically for load/create
    // Share related items:
    shareSchedule,
    isSharing,       // Loading state specifically for sharing
    shareError,      // Error state specifically for sharing
    sharePath,       // Path (/s/TOKEN) returned from Rails API
    setSharePath     // Function to clear the path state
  } = useSchedule();

  // Local state for this component
  const [selectedSchedule, setSelectedSchedule] = useState(''); // Currently selected schedule name in dropdown
  const [newScheduleName, setNewScheduleName] = useState('');   // Name for creating a new schedule

  // State for Share Dialog UI
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [scheduleNameToShare, setScheduleNameToShare] = useState(''); // To display in dialog title

  // State for ngrok URL input
  const [ngrokBaseUrl, setNgrokBaseUrl] = useState(''); // User-entered ngrok URL
  const [finalShareUrl, setFinalShareUrl] = useState(''); // Combined base URL + share path


  // --- Logic to get schedule names for the dropdown ---
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

  // Reset dropdown selection if the list of saved schedules changes
  useEffect(() => {
      setSelectedSchedule('');
  }, [savedScheduleNames]);

  // --- Logic to construct the final shareable URL ---
  // This effect runs whenever the sharePath (from context) or ngrokBaseUrl (local input) changes
  useEffect(() => {
    if (sharePath) { // Only proceed if we have a path from the API
      // /**********************************************************************/
      // /* START OF MODIFICATION (Default to localhost if ngrokBaseUrl empty) */
      // /**********************************************************************/
      let baseUrlToUse = 'http://localhost:3000'; // Default to localhost

      // Check if user provided an ngrok URL
      const trimmedNgrokUrl = ngrokBaseUrl.trim();
      if (trimmedNgrokUrl) {
          baseUrlToUse = trimmedNgrokUrl.replace(/\/$/, ''); // Use ngrok URL if provided (remove trailing slash)
      }
      // /**********************************************************************/
      // /* END OF MODIFICATION                                                */
      // /**********************************************************************/

      try {
        // Ensure path starts with a slash
        const cleanPath = sharePath.startsWith('/') ? sharePath : `/${sharePath}`;
        setFinalShareUrl(baseUrlToUse + cleanPath); // Combine base and path
      } catch (e) {
        console.error("Error constructing final share URL:", e);
        setFinalShareUrl(''); // Clear on error
      }
    } else {
      setFinalShareUrl(''); // Clear if path is missing
    }
  }, [sharePath, ngrokBaseUrl]); // Re-run when path or base URL changes


  // --- Event Handlers ---

  // Handler for the "Load Selected" button
  const handleLoadClick = () => {
    if (selectedSchedule) {
      console.log(`Control Panel: Requesting load for '${selectedSchedule}'`);
      loadSchedule(selectedSchedule); // Call the context function
    }
  };

  // Handler for the "Create New" button
  const handleCreateClick = () => {
    if (newScheduleName.trim()) {
      console.log(`Control Panel: Requesting creation for '${newScheduleName.trim()}'`);
      createNewSchedule(newScheduleName.trim()); // Call the context function
      setNewScheduleName(''); // Clear input after attempt
    }
  };

  // Handler for pressing Enter in the "Create New" input field
  const handleCreateKeyPress = (event) => {
      if (event.key === 'Enter') {
          handleCreateClick();
      }
  }

  // Handler for the "Share" button
  const handleShareClick = () => {
      if (selectedSchedule) {
        // /**********************************************************************/
        // /* START OF MODIFICATION (Remove ngrok URL requirement)             */
        // /**********************************************************************/
        // No longer need to check if ngrokBaseUrl is filled here
        // if (!ngrokBaseUrl.trim()) {
        //     alert("Please paste your current public ngrok base URL...");
        //     return;
        // }
        // /**********************************************************************/
        // /* END OF MODIFICATION                                                */
        // /**********************************************************************/
          setScheduleNameToShare(selectedSchedule); // Store name for the dialog title
          console.log(`Control Panel: Requesting share for '${selectedSchedule}'`);
          shareSchedule(selectedSchedule); // Call context function (which sets sharePath)
          setIsShareDialogOpen(true); // Open the dialog immediately (shows loading spinner)
      }
  };

  // Handler for closing the Share dialog
  const handleCloseShareDialog = () => {
      setIsShareDialogOpen(false);
      // Small delay before clearing path to allow dialog fade-out animation
      setTimeout(() => {
        setSharePath(null); // Clear the path from context state
        setFinalShareUrl(''); // Also clear the combined URL state
      }, 300);
  };

  // Handler for the "Copy" button inside the Share dialog
  const handleCopyToClipboard = () => {
      if (finalShareUrl) { // Copy the combined URL
          navigator.clipboard.writeText(finalShareUrl)
              .then(() => {
                  console.log('Share URL copied to clipboard!');
                  // Optional: Show a temporary confirmation message (e.g., using a Snackbar)
              })
              .catch(err => {
                  console.error('Failed to copy share URL: ', err);
                  // Optional: Show an error message
              });
      }
  };


  // --- Render Logic ---

  // Don't render controls if user is not logged in
  if (!currentUser) {
    return null;
  }

  // Determine if any background operation is loading to disable inputs/buttons
  const anyLoading = isControlLoading || isSharing;

  return (
    // Main container for the control panel section
    <Box sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1, mt: 2 }}>
      <Typography variant="h6" gutterBottom>Manage Schedules</Typography>

      {/* Display errors specific to load/create/share actions */}
      {/* Shows the first error encountered (controlError or shareError) */}
      {(controlError || shareError) && (
        <Alert severity="error" sx={{ mb: 2 }}>
            {controlError || shareError}
        </Alert>
       )}


      {/* --- Load/Share Existing Schedule Section --- */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle1" gutterBottom>
            Load / Share Existing
        </Typography>
        {/* Show dropdown and buttons only if there are saved schedules */}
        {savedScheduleNames.length > 0 ? (
          <>
            {/* Dropdown to select a schedule */}
            <FormControl fullWidth margin="normal" disabled={anyLoading} size="small">
              <InputLabel id="load-schedule-select-label">Select Schedule</InputLabel>
              <Select
                labelId="load-schedule-select-label"
                id="load-schedule-select"
                value={selectedSchedule}
                label="Select Schedule" // Match label
                onChange={(e) => setSelectedSchedule(e.target.value)}
              >
                <MenuItem value="" disabled><em>Select a schedule...</em></MenuItem>
                {/* Populate dropdown options */}
                {savedScheduleNames.map(name => (
                  <MenuItem key={name} value={name}>{name}</MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Input field for the user's current ngrok URL */}
            <TextField
                // /**********************************************************************/
                // /* START OF MODIFICATION (Update Label/Helper Text)                 */
                // /**********************************************************************/
                label="Optional Ngrok URL (for external sharing)"
                // /**********************************************************************/
                // /* END OF MODIFICATION                                                */
                // /**********************************************************************/
                variant="outlined"
                fullWidth
                margin="dense" // Use dense margin
                size="small"
                value={ngrokBaseUrl}
                onChange={(e) => setNgrokBaseUrl(e.target.value)}
                placeholder="Paste ngrok URL (e.g., https://....ngrok-free.app)"
                disabled={anyLoading} // Disable if loading
                sx={{ mb: 1 }} // Add margin below
                // /**********************************************************************/
                // /* START OF MODIFICATION (Update Label/Helper Text)                 */
                // /**********************************************************************/
                helperText="Leave blank to generate a localhost link for local testing"
                // /**********************************************************************/
                // /* END OF MODIFICATION                                                */
                // /**********************************************************************/
            />


            {/* Row containing Load and Share buttons */}
            <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                {/* Load Button */}
                <Button
                  variant="contained"
                  onClick={handleLoadClick}
                  // Disable if no schedule selected OR if any operation is loading
                  disabled={!selectedSchedule || anyLoading}
                  // Show spinner specifically when loading
                  startIcon={isControlLoading ? <CircularProgress size={20} /> : null}
                  sx={{ flexGrow: 1 }} // Make buttons share space equally
                >
                  {/* Change text based on loading state */}
                  {isControlLoading ? 'Loading...' : 'Load Selected'}
                </Button>

                {/* Share Button */}
                <Button
                  variant="outlined" // Different style for share
                  color="secondary"
                  onClick={handleShareClick}
                   // Disable if no schedule selected OR if any operation is loading
                  disabled={!selectedSchedule || anyLoading}
                   // Show spinner specifically when sharing
                  startIcon={isSharing ? <CircularProgress size={20} /> : <ShareIcon />}
                  sx={{ flexGrow: 1 }} // Make buttons share space equally
                >
                   {/* Change text based on loading state */}
                  {isSharing ? 'Sharing...' : 'Share'}
                </Button>
            </Box>
          </>
        ) : (
          // Message shown if no saved schedules exist
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            No saved schedules found. Create one below.
          </Typography>
        )}
      </Box>

      {/* Divider between sections */}
      <Divider sx={{ my: 2 }} />

      {/* --- Create New Schedule Section --- */}
      <Box>
        <Typography variant="subtitle1" gutterBottom>
            Create New Schedule
        </Typography>
        {/* Input field for new schedule name */}
        <TextField
          label="New Schedule Name"
          variant="outlined"
          fullWidth
          margin="normal"
          size="small"
          value={newScheduleName}
          onChange={(e) => setNewScheduleName(e.target.value)}
          onKeyPress={handleCreateKeyPress} // Allow Enter key submission
          disabled={anyLoading} // Disable if any operation is loading
        />
        {/* Button to create the new schedule */}
        <Button
          variant="contained"
          color="secondary"
          onClick={handleCreateClick}
          // Disable if name is empty OR if any operation is loading
          disabled={!newScheduleName.trim() || anyLoading}
          // Show spinner specifically when creating
          startIcon={isControlLoading ? <CircularProgress size={20} /> : null}
          sx={{ mt: 1 }}
          fullWidth
        >
          {/* Change text based on loading state */}
          {isControlLoading ? 'Creating...' : 'Create New'}
        </Button>
      </Box>

      {/* --- Share Dialog --- */}
      {/* This dialog appears when the Share button is clicked */}
      <Dialog
          open={isShareDialogOpen}
          onClose={handleCloseShareDialog}
          aria-labelledby="share-dialog-title"
          fullWidth // Make dialog use more width
          maxWidth="sm" // Control max width
      >
          <DialogTitle id="share-dialog-title">Share Schedule: {scheduleNameToShare}</DialogTitle>
          <DialogContent>
              {/* Show loading spinner while share operation is in progress */}
              {isSharing && <CircularProgress sx={{ display: 'block', margin: 'auto', my: 2 }} />}
              {/* Show error message if sharing failed */}
              {shareError && !isSharing && <Alert severity="error">{shareError}</Alert>}
              {/* Show the generated URL and copy button on success */}
              {finalShareUrl && !isSharing && !shareError && (
                  <>
                      <DialogContentText sx={{ mb: 2 }}>
                        {/* Update text based on whether ngrok URL was used */}
                        {ngrokBaseUrl.trim()
                          ? "Anyone with this link can view a read-only version of this schedule (link active while ngrok runs):"
                          : "Link for local testing (Rails server must be running):"
                        }
                      </DialogContentText>
                      {/* Box containing the link and copy button */}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, wordBreak: 'break-all', p: 1, border: '1px dashed grey', borderRadius: 1 }}>
                           {/* Make the URL a clickable link opening in a new tab */}
                           <Link href={finalShareUrl} target="_blank" rel="noopener noreferrer" sx={{ flexGrow: 1 }}>
                              {finalShareUrl} {/* Display the final combined URL */}
                          </Link>
                          {/* Add copy button with tooltip */}
                          <Tooltip title="Copy link">
                              <IconButton onClick={handleCopyToClipboard} size="small">
                                  <ContentCopyIcon fontSize="inherit" />
                              </IconButton>
                          </Tooltip>
                      </Box>
                  </>
              )}
          </DialogContent>
          {/* Action button to close the dialog */}
          <DialogActions>
              <Button onClick={handleCloseShareDialog}>Close</Button>
          </DialogActions>
      </Dialog>

    </Box> // End of main container Box
  );
};

export default ScheduleControlPanel;
