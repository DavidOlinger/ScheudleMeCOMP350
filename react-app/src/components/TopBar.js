// src/components/TopBar.js
import React from 'react'; // Removed useState, useEffect as we use context now
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress'; // For save indicator
import SaveIcon from '@mui/icons-material/Save'; // Import Save icon
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'; // Import Check icon
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline'; // Import Error icon
import Tooltip from '@mui/material/Tooltip'; // To show save status message

// Import the useAuth hook
import { useAuth } from '../context/AuthContext';
// ***** START OF NEW CODE *****
// Import the useSchedule hook
import { useSchedule } from '../context/ScheduleContext';
// ***** END OF NEW CODE *****


// Optional: Import an icon if you like
// import SchoolIcon from '@mui/icons-material/School';

/**
 * TopBar Component
 * Renders the main application navigation bar at the top of the screen.
 * Displays the application title, user information from AuthContext, and action buttons.
 */
const TopBar = () => {
  // Get authentication state and functions from the context
  const { currentUser, loading: authLoading, logout } = useAuth(); // Destructure what's needed
  // ***** START OF NEW CODE *****
  // Get schedule context for saving
  const { saveSchedule, saveStatus, scheduleData } = useSchedule();
  // ***** END OF NEW CODE *****


  // --- Action Handlers ---
  const handleLogout = () => {
    console.log("Logout button clicked");
    // Call the logout function from the context
    logout();
  };

  const handleSettings = () => {
    console.log("Settings button clicked (placeholder)");
    // TODO: Implement navigation or modal display for settings
  };

  // ***** START OF NEW CODE *****
  const handleSave = () => {
      console.log("Save button clicked");
      saveSchedule(); // Call save function from context
  };
  // ***** END OF NEW CODE *****


  return (
    // AppBar provides the main bar structure.
    // position="static" means it stays at the top and doesn't fix during scroll.
    <AppBar position="static">
      {/* Toolbar helps arrange items horizontally with standard padding. */}
      <Toolbar>
        {/* Optional: Add an icon before the title */}
        {/* <SchoolIcon sx={{ mr: 2 }} /> */}

        {/* Application Title */}
        <Typography variant="h6" component="div" sx={{ mr: 2 }}>
          ScheduleMe {/* Replace with your actual app name */}
        </Typography>

        {/* This Box acts as a spacer, pushing subsequent items to the right */}
        <Box sx={{ flexGrow: 1 }} />

        {/* --- User Info and Actions --- */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}> {/* Added gap */}
          {/* Display loading state, error, user info, or login prompt */}
          {authLoading && <Typography variant="body2" sx={{ mr: 2 }}>Loading...</Typography>}

          {currentUser ? (
            <>
              {/* Display Welcome message if user is loaded */}
              <Typography variant="body1" sx={{ mr: 1 }}> {/* Reduced margin */}
                Welcome, {currentUser.name || 'User'}!
              </Typography>

              {/* ***** START OF NEW CODE ***** */}
              {/* Save Button */}
              <Tooltip title={saveStatus.error ? `Save Error: ${saveStatus.error}` : (saveStatus.success ? "Schedule Saved!" : "Save Current Schedule")}>
                {/* Wrap button in span for tooltip when disabled */}
                <span>
                    <Button
                        color="inherit"
                        variant="outlined" // Make it stand out slightly
                        onClick={handleSave}
                        disabled={saveStatus.saving || !scheduleData || scheduleData.name === 'No Schedule Loaded'} // Disable while saving or if no schedule
                        startIcon={
                            saveStatus.saving ? <CircularProgress size={20} color="inherit" /> :
                            saveStatus.success ? <CheckCircleOutlineIcon color="success"/> :
                            saveStatus.error ? <ErrorOutlineIcon color="error"/> :
                            <SaveIcon />
                        }
                        sx={{
                            mr: 1, // Reduced margin
                            borderColor: 'rgba(255, 255, 255, 0.5)', // Lighter border
                            '&:hover': {
                                borderColor: 'rgba(255, 255, 255, 0.8)',
                                bgcolor: 'rgba(255, 255, 255, 0.1)'
                            }
                        }}
                    >
                        {saveStatus.saving ? 'Saving...' : (saveStatus.success ? 'Saved' : (saveStatus.error ? 'Error' : 'Save'))}
                    </Button>
                 </span>
              </Tooltip>
              {/* ***** END OF NEW CODE ***** */}

              {/* Settings Button (Placeholder) */}
              {/* <Button color="inherit" onClick={handleSettings}>Settings</Button> */}
              {/* Logout Button - Uses handleLogout which calls context logout */}
              <Button color="inherit" onClick={handleLogout}>Logout</Button>
            </>
          ) : (
             <>
              {/* Show if no user is loaded (e.g., needs login) */}
               <Typography variant="body1" sx={{ mr: 2 }}>
                 Guest
               </Typography>
              {/* You might show a Login button here instead, linking to /login */}
              {/* <Button color="inherit" component={Link} to="/login">Login</Button> */}
             </>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
};

// Export the component for use in Layout.js
export default TopBar;
