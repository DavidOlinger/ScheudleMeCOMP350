import React, { createContext, useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
// ** NEW IMPORTS **
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth as firebaseAuth } from '../firebaseConfig'; // Import Firebase auth instance

// Create the context
const AuthContext = createContext(null);

/**
 * AuthProvider Component
 * Wraps the application and provides authentication state based on Firebase Auth.
 */
export const AuthProvider = ({ children }) => {
  // Store the Firebase User object OR null
  const [currentUser, setCurrentUser] = useState(null);
  // Keep loading state until initial auth check is done
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // ** NEW: Listener for Firebase Auth State Changes **
  useEffect(() => {
    // onAuthStateChanged returns an unsubscribe function
    const unsubscribe = onAuthStateChanged(firebaseAuth, (user) => {
      console.log("Auth State Changed. Firebase user:", user ? user.uid : null);
      if (user) {
        // User is signed in.
        // You might want to fetch additional app-specific user data from
        // your backend here using user.uid or user.getIdToken()
        // For now, just set the Firebase user object.
        setCurrentUser(user);
        // Navigate to the main app page after login
        navigate('/editor'); // Or your desired main route
      } else {
        // User is signed out.
        setCurrentUser(null);
        // Navigate to the login page after logout
        navigate('/'); // Assuming login page is the root
      }
      // Initial auth check is complete
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => {
        console.log("Unsubscribing Auth listener");
        unsubscribe();
    }
    // Run only once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array ensures this runs once on mount

  // ** REWRITTEN: Logout function uses Firebase **
  const logout = async () => {
    setLoading(true); // Indicate loading state during logout
    console.log("AuthContext: Logging out user via Firebase.");
    try {
      await signOut(firebaseAuth);
      // onAuthStateChanged listener above will handle setting currentUser to null
      // and navigating to '/'.
      console.log("Firebase signOut successful.");
    } catch (error) {
      console.error("Firebase signOut error:", error);
      // Still set loading false even if signOut fails (though unlikely)
      setLoading(false);
    }
    // setLoading(false) will be handled by the onAuthStateChanged listener completing
  };

  // ** RE-EVALUATED: updateCurrentUser **
  // This function's role changes. It can't directly update the Firebase User object.
  // If you need to refresh *application-specific* data associated with the user
  // (like 'mySchedules' fetched from YOUR backend), you might keep this, but
  // it would likely trigger a re-fetch from your backend using the currentUser.uid,
  // and update separate state, not the Firebase currentUser object itself.
  // For now, let's comment it out unless you have a specific need for it.
  /*
  const updateCurrentUser = (updatedUserData) => {
      console.log("AuthContext: Updating application-specific user data:", updatedUserData);
      // Implement logic here if needed - perhaps store additional profile data
      // fetched from your backend in a separate state variable?
  };
  */

  // Value provided by the context
  const value = {
    currentUser, // This will be the Firebase User object or null
    loading,     // Indicates if initial auth check is ongoing
    logout,      // Firebase logout function
    // login function is removed - handled by onAuthStateChanged
    // updateCurrentUser, // Add back if needed for app-specific data
  };

  // Don't render children until the initial auth check is complete
  return (
     <AuthContext.Provider value={value}>
       {!loading && children}
     </AuthContext.Provider>
  );
};

// useAuth Hook remains the same
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};