// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Import MUI components
import CssBaseline from '@mui/material/CssBaseline';

import ProfilePage from './pages/ProfilePage';

// Import your page components
import MainPage from './pages/MainPage';
import LoginPage from './pages/LoginPage';
import NotFoundPage from './pages/NotFoundPage';

// Import Providers
import { AuthProvider } from './context/AuthContext';
import { ScheduleProvider } from './context/ScheduleContext';

/**
 * App Component
 * Sets up global providers and application routes.
 */
function App() {

  return (
      <>
        <CssBaseline />
        <Router>
          <AuthProvider>
            <ScheduleProvider>
              <Routes>
                {/* LoginPage is now the default route */}
                <Route path="/" element={<LoginPage />} />
                {/* MainPage (editor) is now at /editor */}
                <Route path="/editor" element={<MainPage />} />
                {/* Explicitly keep /login route pointing to LoginPage as well? Optional. */}
                <Route path="/login" element={<LoginPage />} />

                {/* /**********************************************************************/}
                {/* /* START OF NEW CODE                                                  */}
                {/* /**********************************************************************/}
                {/* Route for the User Profile Page */}
                <Route path="/profile" element={<ProfilePage />} />
                {/* /**********************************************************************/}
                {/* /* END OF NEW CODE                                                    */}
                {/* /**********************************************************************/}


                {/* Catch-all route for 404 Not Found page */}
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </ScheduleProvider>
          </AuthProvider>
        </Router>
      </>
  );
}

export default App;
