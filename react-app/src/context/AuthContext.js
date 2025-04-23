// src/context/AuthContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// Create the context
const AuthContext = createContext(null);

/**
 * AuthProvider Component
 * Wraps the application and provides authentication state (currentUser)
 * and functions (login, logout) to its children.
 */
export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(false); // Optional: manage loading state
  const navigate = useNavigate();

  // Function to handle user login
  // It receives user data (likely from the API response)
  const login = (userData) => {
    console.log("AuthContext: Setting current user:", userData);
    // Basic validation: ensure we have at least a name
    if (userData && userData.name) {
        setCurrentUser(userData);
        // Navigate to the main page after successful login
        navigate('/');
    } else {
        console.error("AuthContext: Invalid user data received for login.", userData);
        // Handle error state if necessary
    }
  };

  // Function to handle user logout
  const logout = async () => {
    setLoading(true);
    console.log("AuthContext: Logging out user.");
    // ***** START OF BACKEND INTERACTION *****
    try {
        // Call the backend logout endpoint
        const response = await fetch('http://localhost:7070/api/auth/logout', { method: 'POST' });
        if (!response.ok) {
            // Handle potential errors during backend logout if needed
            console.error("Backend logout failed:", response.status);
        }
    } catch (error) {
        console.error("Error calling backend logout:", error);
    }
    // ***** END OF BACKEND INTERACTION *****

    // Clear the user state regardless of backend success for frontend responsiveness
    setCurrentUser(null);
    setLoading(false);
    // Navigate to the login page after logout
    navigate('/login');
  };

  // Value provided by the context
  const value = {
    currentUser,
    loading, // Optional: expose loading state
    login,
    logout,
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
