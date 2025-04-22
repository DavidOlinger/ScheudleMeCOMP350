// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Import MUI components for baseline styling and theming (optional but recommended)
import CssBaseline from '@mui/material/CssBaseline';
// import { ThemeProvider, createTheme } from '@mui/material/styles'; // Uncomment if you want custom theme

// Import your page components
import MainPage from './pages/MainPage';
import LoginPage from './pages/LoginPage';
import NotFoundPage from './pages/NotFoundPage';
// import SavedSchedulesPage from './pages/SavedSchedulesPage'; // Example for a future page

/**
 * App Component
 * The root component of the React application.
 * Sets up global providers (like Router, ThemeProvider) and defines the
 * application's routes, mapping URL paths to specific page components.
 */
function App() {
  // Optional: Define a custom MUI theme
  // const theme = createTheme({
  //   palette: {
  //     primary: {
  //       main: '#1976d2', // Example primary color
  //     },
  //     // Add other theme customizations here
  //   },
  // });

  return (
    // Optional: Wrap with ThemeProvider if using a custom theme
    // <ThemeProvider theme={theme}>
      <> {/* Use Fragment or a div as the top-level wrapper if not using ThemeProvider */}
        {/* CssBaseline kickstarts an elegant, consistent, and simple baseline to build upon. */}
        {/* It normalizes styles across browsers. */}
        <CssBaseline />

        {/* BrowserRouter enables routing capabilities for the application. */}
        <Router>
          {/* Routes component acts as a container for all individual Route definitions. */}
          <Routes>
            {/*
             * Route definition:
             * - 'path' specifies the URL path.
             * - 'element' specifies the React component to render when the path matches.
             * This route renders MainPage when the user visits the root URL ('/').
             */}
            <Route path="/" element={<MainPage />} />

            {/* Route for the login page */}
            <Route path="/login" element={<LoginPage />} />

            {/*
             * Example of how you would add another route for a different page:
             * <Route path="/saved-schedules" element={<SavedSchedulesPage />} />
             */}



            {/*catch-all route for 404 Not Found page*/}
            <Route path="*" element={<NotFoundPage />} />

          </Routes>
        </Router>
      </>
    // </ThemeProvider> // Closing tag for ThemeProvider if used
  );
}

// Export the App component so it can be rendered by src/index.js
export default App;
