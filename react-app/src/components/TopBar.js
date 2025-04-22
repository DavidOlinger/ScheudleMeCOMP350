// src/components/TopBar.js
import React, { useState, useEffect } from 'react';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';

// Optional: Import an icon if you like
// import SchoolIcon from '@mui/icons-material/School';

/**
 * TopBar Component
 * Renders the main application navigation bar at the top of the screen.
 * Displays the application title, placeholder user information, and action buttons.
 */
const TopBar = () => {
  // --- State for User Information (Placeholder/Future Implementation) ---
  // We'll use state to hold user data eventually. For now, it's null.
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false); // To show loading state
  const [error, setError] = useState(null); // To show errors

  // --- Effect to Fetch User Data (Placeholder/Future Implementation) ---
  /*
  useEffect(() => {
    // This function would fetch user data from your backend API
    const fetchUser = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Replace with your actual API endpoint and fetch logic (using fetch or axios)
        const response = await fetch('/api/user/current'); // Example endpoint
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setCurrentUser(data); // Assuming the API returns user object { name: '...' }
      } catch (err) {
        console.error("Failed to fetch user:", err);
        setError("Could not load user info.");
        setCurrentUser(null); // Clear user on error
      } finally {
        setIsLoading(false);
      }
    };

    // fetchUser(); // Call the function - Uncomment when API is ready

  }, []); // Empty dependency array means this runs once on component mount
  */

  // --- Placeholder Action Handlers ---
  // These functions will be replaced with actual logic later (e.g., calling logout API)
  const handleLogout = () => {
    console.log("Logout button clicked (placeholder)");
    // TODO: Implement actual logout logic (call API, clear session/token, redirect)
    setCurrentUser(null); // Simulate logout for placeholder
  };

  const handleSettings = () => {
    console.log("Settings button clicked (placeholder)");
    // TODO: Implement navigation or modal display for settings
  };


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
          Schedule Builder {/* Replace with your actual app name */}
        </Typography>

        {/* This Box acts as a spacer, pushing subsequent items to the right */}
        <Box sx={{ flexGrow: 1 }} />

        {/* --- User Info and Actions --- */}
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {/* Display loading state, error, user info, or login prompt */}
          {isLoading ? (
            <Typography variant="body2" sx={{ mr: 2 }}>Loading user...</Typography>
          ) : error ? (
             <Typography variant="body2" color="error" sx={{ mr: 2 }}>{error}</Typography>
          ) : currentUser ? (
            <>
              {/* Display Welcome message if user is loaded */}
              <Typography variant="body1" sx={{ mr: 2 }}>
                Welcome, {currentUser.name || 'User'}! {/* Use fetched name or default */}
              </Typography>
              {/* Settings Button (Placeholder) */}
              <Button color="inherit" onClick={handleSettings}>Settings</Button>
              {/* Logout Button (Placeholder) */}
              <Button color="inherit" onClick={handleLogout}>Logout</Button>
            </>
          ) : (
             <>
              {/* Show if no user is loaded (e.g., needs login) */}
               <Typography variant="body1" sx={{ mr: 2 }}>
                 Guest
               </Typography>
              {/* You might show a Login button here instead */}
              {/* <Button color="inherit">Login</Button> */}
             </>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
};

// Export the component for use in Layout.js
export default TopBar;
