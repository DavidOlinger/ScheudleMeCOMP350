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

// ***** START OF NEW CODE *****
// Import the AuthProvider
import { AuthProvider } from './context/AuthContext';
// ***** END OF NEW CODE *****

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
          {/* ***** START OF NEW CODE ***** */}
          {/* Wrap the Routes with AuthProvider to make auth state available */}
          <AuthProvider>
          {/* ***** END OF NEW CODE ***** */}

            {/* Routes component acts as a container for all individual Route definitions. */}
            <Routes>
              {/*
               * Route definition:
               * - 'path' specifies the URL path.
               * - 'element' specifies the React component to render when the path matches.
               * This route renders MainPage when the user visits the root URL ('/').
               * TODO: Consider making this a protected route later.
               */}
              <Route path="/" element={<MainPage />} />

              {/* Route for the login page */}
              {/* Make login the default landing page if no user is logged in?
                  For now, keeping '/' as main, '/login' explicit.
                  You could swap these or add redirect logic later.
              */}
              <Route path="/login" element={<LoginPage />} />

              {/*
               * Example of how you would add another route for a different page:
               * <Route path="/saved-schedules" element={<SavedSchedulesPage />} />
               */}



              {/*catch-all route for 404 Not Found page*/}
              <Route path="*" element={<NotFoundPage />} />

            </Routes>

          {/* ***** START OF NEW CODE ***** */}
          </AuthProvider>
          {/* ***** END OF NEW CODE ***** */}
        </Router>
      </>
    // </ThemeProvider> // Closing tag for ThemeProvider if used
  );
}

// Export the App component so it can be rendered by src/index.js
export default App;
