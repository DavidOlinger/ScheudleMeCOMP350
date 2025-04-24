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
  const login = (userData) => {
    console.log("AuthContext: Setting current user:", userData);
    if (userData && userData.name) {
        setCurrentUser(userData);
        // ***** START OF CHANGE *****
        // Navigate to the editor page after successful login
        navigate('/editor');
        // ***** END OF CHANGE *****
    } else {
        console.error("AuthContext: Invalid user data received for login.", userData);
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
        }
    } catch (error) {
        console.error("Error calling backend logout:", error);
    }

    setCurrentUser(null);
    setLoading(false);
    // ***** START OF CHANGE *****
    // Navigate to the login page (now the root '/') after logout
    navigate('/');
    // ***** END OF CHANGE *****
  };

  // Value provided by the context
  const value = {
    currentUser,
    loading,
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
