// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'; // Import Navigate
import CssBaseline from '@mui/material/CssBaseline';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

// Import Custom Drag Layer
import CustomDragLayer from './components/CustomDragLayer'; // Adjust path if needed

// Import Pages
import ProfilePage from './pages/ProfilePage';
import MainPage from './pages/MainPage'; // Schedule Editor
import LoginPage from './pages/LoginPage';
import NotFoundPage from './pages/NotFoundPage';
import ScheduleManagementPage from './pages/ScheduleManagementPage'; // ***** NEW IMPORT *****

// Import Context Providers
import { AuthProvider, useAuth } from './context/AuthContext'; // Import useAuth
import { ScheduleProvider } from './context/ScheduleContext';

/**
 * ProtectedRoute Component
 * Wrapper to protect routes that require authentication.
 */
function ProtectedRoute({ children }) {
  const { currentUser } = useAuth();
  // If user is not logged in, redirect them to the login page
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }
  // If logged in, render the requested component
  return children;
}

/**
 * App Component (Main Router Setup)
 */
function App() {
  return (
      <>
        <CssBaseline />
        {/* Wrap with DndProvider for drag and drop */}
        <DndProvider backend={HTML5Backend}>
            <Router>
              {/* AuthProvider wraps everything that needs auth context */}
              <AuthProvider>
                {/* ScheduleProvider wraps routes that need schedule context */}
                <ScheduleProvider>
                  {/* Main Application Routes */}
                  <Routes>
                    {/* Public Routes */}
                    <Route path="/login" element={<LoginPage />} />
                    {/* Root path redirects to login if not authenticated, or manage-schedules if authenticated */}
                    <Route path="/" element={
                        <AuthRedirector>
                           <LoginPage /> {/* Fallback if needed, but AuthRedirector handles logic */}
                        </AuthRedirector>
                     } />

                    {/* Protected Routes (Require Login) */}
                    {/* ***** START OF CHANGES ***** */}
                    <Route path="/manage-schedules" element={
                      <ProtectedRoute> <ScheduleManagementPage /> </ProtectedRoute>
                    } />
                    <Route path="/editor" element={
                      <ProtectedRoute> <MainPage /> </ProtectedRoute>
                    } />
                    <Route path="/profile" element={
                      <ProtectedRoute> <ProfilePage /> </ProtectedRoute>
                    } />
                     {/* ***** END OF CHANGES ***** */}

                    {/* Catch-all 404 Route */}
                    <Route path="*" element={<NotFoundPage />} />
                  </Routes>

                  {/* Render the Custom Drag Layer here */}
                  {/* It needs to be within DndProvider but outside specific routes */}
                  {/* so it can display above everything */}
                  <CustomDragLayer />

                </ScheduleProvider>
              </AuthProvider>
            </Router>
        </DndProvider>
      </>
  );
}

/**
 * AuthRedirector Component
 * Helper component to handle redirection logic at the root path.
 */
function AuthRedirector({ children }) {
    const { currentUser } = useAuth();

    if (currentUser) {
        // If user is logged in, redirect from root to the schedule management page
        return <Navigate to="/manage-schedules" replace />;
    }
    // If user is not logged in, render the children (which is LoginPage in this setup)
    return children;
}


export default App;