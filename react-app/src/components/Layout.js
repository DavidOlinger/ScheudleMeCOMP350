// src/components/Layout.js
import React from 'react';
import Box from '@mui/material/Box';
// Removed Container import
import TopBar from './TopBar'; // Assuming TopBar.js is in the same components directory

/**
 * Layout Component (Updated)
 * Provides a consistent structure including the TopBar.
 * The main content area now fills the available width by default,
 * allowing child pages like MainPage to define their own padding and max-width.
 *
 * @param {object} props - Component props.
 * @param {React.ReactNode} props.children - The page-specific content to be rendered within the layout.
 */
const Layout = ({ children }) => {
  return (
    // Main wrapper for the entire page layout.
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: 'grey.100' }}> {/* Added background color */}
      {/* Render the TopBar component */}
      <TopBar />

      {/*
       * Render the main content area.
       * Removed the Container wrapper. Child components (like MainPage)
       * are now responsible for their own padding and width constraints.
       * flexGrow: 1 ensures this Box takes up remaining vertical space.
       * Added padding (p: 3) directly here.
       */}
      <Box component="main" sx={{ flexGrow: 1, width: '100%', p: 3, overflow: 'hidden' }}> {/* Added padding and overflow hidden */}
        {children}
      </Box>

      {/* Optional Footer Area */}
      {/* <Box component="footer" sx={{ ... }}>...</Box> */}
    </Box>
  );
};

export default Layout;
