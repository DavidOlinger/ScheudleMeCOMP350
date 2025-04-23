// src/components/TopBar.js
import React from 'react'; // Removed useState, useEffect as we use context now
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
// ***** START OF NEW CODE *****
// Import the useAuth hook
import { useAuth } from '../context/AuthContext';
// ***** END OF NEW CODE *****

// Optional: Import an icon if you like
// import SchoolIcon from '@mui/icons-material/School';

/**
 * TopBar Component
 * Renders the main application navigation bar at the top of the screen.
 * Displays the application title, user information from AuthContext, and action buttons.
 */
const TopBar = () => {
  // --- State for User Information (Placeholder/Future Implementation) ---
  // We'll use state to hold user data eventually. For now, it's null.
  // const [currentUser, setCurrentUser] = useState(null); // Removed, using AuthContext
  // const [isLoading, setIsLoading] = useState(false); // Removed, using AuthContext
  // const [error, setError] = useState(null); // Removed, using AuthContext

  // ***** START OF NEW CODE *****
  // Get authentication state and functions from the context
  const { currentUser, loading, logout } = useAuth(); // Destructure what's needed
  // ***** END OF NEW CODE *****


  // --- Effect to Fetch User Data (Placeholder/Future Implementation) ---
  /*
  useEffect(() => {
    // This function would fetch user data from your backend API
    // Now potentially handled by a higher-level component or AuthProvider itself
  }, []);
  */

  // --- Placeholder Action Handlers ---
  // These functions will be replaced with actual logic later (e.g., calling logout API)
  const handleLogout = () => {
    console.log("Logout button clicked");
    // ***** START OF NEW CODE *****
    // Call the logout function from the context
    logout();
    // ***** END OF NEW CODE *****
    // setCurrentUser(null); // Removed, context handles state
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
          {/* ***** START OF NEW CODE ***** */}
          {/* Use loading state from context if needed */}
          {/* {loading && <Typography variant="body2" sx={{ mr: 2 }}>Loading...</Typography>} */}

          {/* Check currentUser from context */}
          {currentUser ? (
            <>
              {/* Display Welcome message if user is loaded */}
              <Typography variant="body1" sx={{ mr: 2 }}>
                {/* Use name from currentUser object */}
                Welcome, {currentUser.name || 'User'}!
              </Typography>
              {/* Settings Button (Placeholder) */}
              <Button color="inherit" onClick={handleSettings}>Settings</Button>
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
          {/* ***** END OF NEW CODE ***** */}
        </Box>
      </Toolbar>
    </AppBar>
  );
};

// Export the component for use in Layout.js
export default TopBar;
