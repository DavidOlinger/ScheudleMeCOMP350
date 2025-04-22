// src/components/Layout.js
import React from 'react';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';

// Import the TopBar component.
// Note: We haven't created TopBar.js yet, but we include the import
// statement here so it's ready when TopBar is implemented.
import TopBar from './TopBar'; // Assuming TopBar.js is in the same components directory

/**
 * Layout Component
 * Provides a consistent structure for pages within the application.
 * It includes the main navigation bar (TopBar) and renders the
 * specific content of each page passed as `children`.
 *
 * @param {object} props - Component props.
 * @param {React.ReactNode} props.children - The page-specific content to be rendered within the layout.
 */
const Layout = ({ children }) => {
  return (
    // Use a Box component as the main wrapper for the entire page layout.
    // sx prop allows for custom styling using Material UI's system properties.
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Render the TopBar component at the top of every page that uses this layout. */}
      <TopBar />

      {/*
       * Render the main content area of the page.
       * We use a Container component from MUI here.
       * - It centers the content horizontally.
       * - It applies a max-width based on the screen size (can be configured).
       * - It provides some default padding.
       * The `component="main"` prop makes this semantically the main content area.
       * The `sx` prop adds some top padding (pt: padding-top) to separate content from the TopBar.
       */}
      <Container component="main" sx={{ mt: 4, mb: 4, flexGrow: 1 }}>
        {/*
         * This is where the specific content of each page will be rendered.
         * React automatically passes the content nested inside the <Layout> tags
         * (in components like MainPage.js) via the `children` prop.
         */}
        {children}
      </Container>

      {/*
       * Optional Footer Area (Example)
       * You could add a footer component here if needed in the future.
       * <Box component="footer" sx={{ p: 2, mt: 'auto', backgroundColor: 'grey.200' }}>
       * <Typography variant="body2" color="text.secondary" align="center">
       * {'© '} {new Date().getFullYear()} Schedule App
       * </Typography>
       * </Box>
       */}
    </Box>
  );
};

// Export the Layout component so it can be imported and used in other files (like App.js or page components).
export default Layout;
