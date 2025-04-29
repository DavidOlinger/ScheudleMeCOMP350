// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import CssBaseline from '@mui/material/CssBaseline';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

// Import Custom Drag Layer
import CustomDragLayer from './components/CustomDragLayer'; // Adjust path if needed

import ProfilePage from './pages/ProfilePage';
import MainPage from './pages/MainPage';
import LoginPage from './pages/LoginPage';
import NotFoundPage from './pages/NotFoundPage';
import { AuthProvider } from './context/AuthContext';
import { ScheduleProvider } from './context/ScheduleContext';

function App() {
  return (
      <>
        <CssBaseline />
        <DndProvider backend={HTML5Backend}>
            <Router>
              <AuthProvider>
                <ScheduleProvider>
                  {/* Main Application Routes */}
                  <Routes>
                    <Route path="/" element={<LoginPage />} />
                    <Route path="/editor" element={<MainPage />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/profile" element={<ProfilePage />} />
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

export default App;