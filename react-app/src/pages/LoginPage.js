import React, { useState } from 'react';
// ** REMOVE useAuth import if login function is removed from context **
// import { useAuth } from '../context/AuthContext';

// ** NEW IMPORTS for Firebase **
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
} from "firebase/auth";
import { auth as firebaseAuth } from '../firebase'; // Import Firebase auth instance

// Import MUI components (remain the same)
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Link from '@mui/material/Link';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import PersonAddAlt1Icon from '@mui/icons-material/PersonAddAlt1';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import Paper from '@mui/material/Paper';
import Alert from '@mui/material/Alert';

// Import the shared Layout component (remains the same)
import Layout from '../components/Layout';

/**
 * LoginPage Component
 * Provides UI for Firebase Email/Password Login and Registration.
 */
function LoginPage() {
  // ** If useAuth is only needed for context methods we removed (like login), remove this **
  // const auth = useAuth(); // May not be needed directly here anymore

  // State variables - ** Renamed username to email **
  const [email, setEmail] = useState(''); // Use email for Firebase
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  // Keep isLoading and error states
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  // Remove registerSuccess - navigation handles success indication
  // const [registerSuccess, setRegisterSuccess] = useState(null);

  const toggleMode = (event) => {
      event.preventDefault();
      setIsRegisterMode(!isRegisterMode);
      // Clear fields and errors
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setError(null);
      // setRegisterSuccess(null); // Removed
  };

  /**
   * Handles form submission using Firebase Auth.
   */
  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);
    // setRegisterSuccess(null); // Removed

    const currentEmail = email.trim(); // Use email
    const currentPassword = password;

    // --- Registration Mode ---
    if (isRegisterMode) {
        if (currentPassword !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }
        if (!currentEmail || !currentPassword) {
            // Update error message
            setError("Email and password cannot be empty.");
            return;
        }

        setIsLoading(true);
        console.log('Attempting Firebase registration with:', { email: currentEmail });

        try {
            // ** NEW: Use Firebase createUserWithEmailAndPassword **
            const userCredential = await createUserWithEmailAndPassword(
                firebaseAuth,
                currentEmail,
                currentPassword
            );
            // Registration successful AND user is auto-logged in by Firebase.
            console.log('Firebase registration successful:', userCredential.user.uid);
            // No need to call context.login or manually log in.
            // The onAuthStateChanged listener in AuthContext will handle navigation.
            // You could briefly show a success message before navigation happens,
            // but often the navigation itself is sufficient feedback.
            // setRegisterSuccess("Account created successfully! Redirecting..."); // Optional

        } catch (regErr) {
             console.error("Firebase registration failed:", regErr.code, regErr.message);
             // Provide user-friendly Firebase errors
             let friendlyErrorMessage = "An error occurred during registration.";
             switch (regErr.code) {
                 case 'auth/email-already-in-use':
                     friendlyErrorMessage = "This email address is already registered.";
                     break;
                 case 'auth/invalid-email':
                     friendlyErrorMessage = "Please enter a valid email address.";
                     break;
                 case 'auth/weak-password':
                     friendlyErrorMessage = "Password is too weak. It should be at least 6 characters long.";
                     break;
                 default:
                     friendlyErrorMessage = regErr.message; // Fallback
             }
             setError(friendlyErrorMessage);
        } finally {
            setIsLoading(false); // Set loading false here
        }

    // --- Login Mode ---
    } else {
        if (!currentEmail || !currentPassword) {
            // Update error message
            setError("Email and password cannot be empty.");
            return;
        }
        setIsLoading(true);
        console.log('Attempting Firebase login with:', { email: currentEmail });
        try {
            // ** NEW: Use Firebase signInWithEmailAndPassword **
            const userCredential = await signInWithEmailAndPassword(
                firebaseAuth,
                currentEmail,
                currentPassword
            );
            // Login successful. User is logged in.
            console.log('Firebase login successful:', userCredential.user.uid);
            // No need to call context.login.
            // The onAuthStateChanged listener in AuthContext will handle navigation.

        } catch (loginErr) {
            console.error("Firebase login failed:", loginErr.code, loginErr.message);
            // Provide user-friendly Firebase errors
             let friendlyErrorMessage = "An error occurred during login.";
             switch (loginErr.code) {
                 case 'auth/user-not-found':
                 case 'auth/wrong-password':
                 // Combine these for security - don't reveal which is wrong
                     friendlyErrorMessage = "Invalid email or password.";
                     break;
                 case 'auth/invalid-email':
                     friendlyErrorMessage = "Please enter a valid email address.";
                     break;
                 case 'auth/user-disabled':
                      friendlyErrorMessage = "This account has been disabled.";
                      break;
                 case 'auth/invalid-credential': // More generic error for v9+
                      friendlyErrorMessage = "Invalid email or password.";
                      break;
                 default:
                     friendlyErrorMessage = loginErr.message; // Fallback
             }
            setError(friendlyErrorMessage);
        } finally {
            setIsLoading(false);
        }
    }
  };

  // --- JSX Structure (Mostly the same, just update labels/IDs for email) ---
  return (
    <Layout>
      <Container component="main" maxWidth="xs">
        <Paper elevation={3} sx={{ marginTop: 8, padding: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {/* Avatar and Title (same logic) */}
           <Avatar sx={{ m: 1, bgcolor: isRegisterMode ? 'success.main' : 'secondary.main' }}>
            {isRegisterMode ? <PersonAddAlt1Icon /> : <LockOutlinedIcon />}
          </Avatar>
          <Typography component="h1" variant="h5">
            {isRegisterMode ? 'Sign Up' : 'Sign In'}
          </Typography>

          {/* Error Alert (same logic) */}
          {error && (
            <Alert severity="error" sx={{ width: '100%', mt: 2 }}>
              {error}
            </Alert>
          )}
          {/* Removed registerSuccess Alert */}

          <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1, width: '100%' }}>
            {/* ** UPDATED Field for Email ** */}
            <TextField
              margin="normal"
              required
              fullWidth
              id="email" // Update ID
              label="Email Address" // Update Label
              name="email" // Update Name
              autoComplete="email" // Update autoComplete
              autoFocus
              value={email} // Bind to email state
              onChange={(e) => setEmail(e.target.value)} // Update state setter
              disabled={isLoading}
            />
            {/* Password Field (same logic, maybe update autoComplete) */}
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type="password"
              id="password"
              autoComplete={isRegisterMode ? "new-password" : "current-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
            />
            {/* Confirm Password Field (same logic) */}
            {isRegisterMode && (
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  name="confirmPassword"
                  label="Confirm Password"
                  type="password"
                  id="confirmPassword"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isLoading}
                />
            )}
            {/* Submit Button (same logic) */}
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={isLoading}
              color={isRegisterMode ? "success" : "primary"}
            >
              {isLoading ? (isRegisterMode ? 'Signing Up...' : 'Signing In...') : (isRegisterMode ? 'Sign Up' : 'Sign In')}
            </Button>
            {/* Toggle Link (same logic) */}
            <Grid container justifyContent="flex-end">
              <Grid item>
                <Link href="#" variant="body2" onClick={toggleMode}>
                  {isRegisterMode ? "Already have an account? Sign In" : "Don't have an account? Sign Up"}
                </Link>
              </Grid>
            </Grid>
          </Box>
        </Paper>
      </Container>
    </Layout>
  );
}

export default LoginPage;