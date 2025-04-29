// src/context/AuthContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// Create the context
const AuthContext = createContext(null);

/**
 * AuthProvider Component
 * Wraps the application and provides authentication state (currentUser)
 * and functions (login, logout, updateCurrentUser) to its children.
 */
export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(false); // Optional: manage loading state
  const navigate = useNavigate();

  // Function to handle user login
  const login = (userData) => {
    console.log("AuthContext: Setting current user:", userData);
    if (userData && userData.name) {
        // Ensure mySchedules is always an array, even if null/undefined from backend
        const userWithEnsuredSchedules = {
            ...userData,
            mySchedules: Array.isArray(userData.mySchedules) ? userData.mySchedules : []
        };
        setCurrentUser(userWithEnsuredSchedules);
        // ***** START OF CHANGE *****
        // Navigate to the new schedule management page after successful login
        navigate('/manage-schedules');
        // ***** END OF CHANGE *****
    } else {
        console.error("AuthContext: Invalid user data received for login.", userData);
        setCurrentUser(null); // Ensure user is null if data is invalid
    }
  };

  // Function to handle user logout
  const logout = async () => {
    setLoading(true);
    console.log("AuthContext: Logging out user.");
    try {
        const response = await fetch('http://localhost:7070/api/auth/logout', { method: 'POST' });
        if (!response.ok) {
            console.error("Backend logout failed:", response.status);
            // Optionally handle backend logout failure differently if needed
        }
    } catch (error) {
        console.error("Error calling backend logout:", error);
        // Handle network errors, etc.
    } finally {
        // Always clear user state and navigate regardless of backend success/failure
        setCurrentUser(null);
        setLoading(false);
        // Navigate to the login page (now the root '/') after logout
        navigate('/');
    }
  };

  /**
   * Updates the current user state with new data.
   * Used by other contexts (like ScheduleContext) when backend actions
   * modify user data (e.g., adding/deleting schedules).
   * @param {object} updatedUserData - The updated user object (should include mySchedules).
   */
  const updateCurrentUser = (updatedUserData) => {
      console.log("AuthContext: Updating current user data:", updatedUserData);
      if (updatedUserData && updatedUserData.name) {
           // Ensure mySchedules is always an array
          const userWithEnsuredSchedules = {
              ...updatedUserData,
              mySchedules: Array.isArray(updatedUserData.mySchedules) ? updatedUserData.mySchedules : []
          };
          setCurrentUser(userWithEnsuredSchedules);
      } else {
          console.warn("AuthContext: Attempted to update user with invalid data.", updatedUserData);
      }
  };

  // Value provided by the context
  const value = {
    currentUser,
    loading,
    login,
    logout,
    updateCurrentUser, // Expose the new function
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/**
 * useAuth Hook
 * Custom hook to easily consume the AuthContext in functional components.
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};