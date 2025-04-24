// src/pages/LoginPage.js
import React, { useState } from 'react';
// Import the useAuth hook
import { useAuth } from '../context/AuthContext';

// Import MUI components for the form layout and elements
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

// Import the shared Layout component
import Layout from '../components/Layout';

/**
 * LoginPage Component
 * Provides a user interface for logging into the application or registering a new account.
 */
function LoginPage() {
  // Get the login function from the AuthContext
  const auth = useAuth();

  // State variables for form inputs
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState(''); // For registration
  const [isRegisterMode, setIsRegisterMode] = useState(false); // Toggle between Login and Register
  const [registerSuccess, setRegisterSuccess] = useState(null); // Message on successful registration

  // State variables for handling login/registration process feedback
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Toggles between Login and Register modes, clearing errors and inputs.
   */
  const toggleMode = (event) => {
      event.preventDefault(); // Prevent default link behavior
      setIsRegisterMode(!isRegisterMode);
      // Clear fields and errors when switching modes
      setUsername('');
      setPassword('');
      setConfirmPassword('');
      setError(null);
      setRegisterSuccess(null);
  };

  /**
   * Handles the submission of the login or registration form.
   * @param {React.FormEvent<HTMLFormElement>} event - The form submission event.
   */
  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);
    setRegisterSuccess(null);

    const currentUsername = username.trim(); // Use consistent trimmed username
    const currentPassword = password; // Use raw password

    // --- Registration Mode ---
    if (isRegisterMode) {
        if (currentPassword !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }
        if (!currentUsername || !currentPassword) {
            setError("Username and password cannot be empty.");
            return;
        }

        setIsLoading(true);
        console.log('Attempting registration with:', { username: currentUsername });

        try {
            // 1. Call Create User API
            const registerApiUrl = `http://localhost:7070/api/users?username=${encodeURIComponent(currentUsername)}&password=${encodeURIComponent(currentPassword)}`;
            const registerResponse = await fetch(registerApiUrl, { method: 'POST' });

            if (!registerResponse.ok) {
                const errorData = await registerResponse.json().catch(() => ({ message: `Registration failed. Status: ${registerResponse.status}` }));
                throw new Error(errorData.error || errorData.message || `Registration failed. Status: ${registerResponse.status}`);
            }

            const successData = await registerResponse.json();
            console.log('Registration successful:', successData);
            setRegisterSuccess(`Account '${currentUsername}' created! Logging you in...`); // Update message

            // ***** START OF NEW CODE *****
            // 2. Automatically attempt login after successful registration
            console.log('Attempting auto-login for new user:', currentUsername);
            try {
                const loginApiUrl = `http://localhost:7070/api/auth/login?username=${encodeURIComponent(currentUsername)}&password=${encodeURIComponent(currentPassword)}`;
                const loginResponse = await fetch(loginApiUrl, { method: 'POST' });

                if (!loginResponse.ok) {
                    // Handle login failure after registration (should be rare if registration succeeded)
                    const loginErrorData = await loginResponse.json().catch(() => ({ message: `Auto-login failed. Status: ${loginResponse.status}` }));
                    throw new Error(loginErrorData.error || loginErrorData.message || `Auto-login failed. Status: ${loginResponse.status}`);
                }

                const userData = await loginResponse.json();
                console.log('Auto-login successful, user data received:', userData);
                auth.login(userData); // Call context login to set user and navigate

                // No need to clear form here, navigation will happen

            } catch (loginErr) {
                 // If auto-login fails, show error but inform user account was created
                 console.error("Auto-login after registration failed:", loginErr);
                 setError(`Account created, but auto-login failed: ${loginErr.message}. Please log in manually.`);
                 setIsRegisterMode(false); // Switch to login mode so they can try
                 // Clear form fields for manual login attempt
                 setUsername('');
                 setPassword('');
                 setConfirmPassword('');
            }
            // ***** END OF NEW CODE *****

        } catch (regErr) {
             console.error("Registration API call failed:", regErr);
             setError(regErr.message || "An error occurred during registration.");
        } finally {
            // Only set loading false if auto-login didn't navigate away
            // Navigation might happen before this runs if login is fast
            setIsLoading(false);
        }

    // --- Login Mode ---
    } else {
        if (!currentUsername || !currentPassword) {
            setError("Username and password cannot be empty.");
            return;
        }
        setIsLoading(true);
        console.log('Attempting login with:', { username: currentUsername });
        try {
            const apiUrl = `http://localhost:7070/api/auth/login?username=${encodeURIComponent(currentUsername)}&password=${encodeURIComponent(currentPassword)}`;
            const response = await fetch(apiUrl, { method: 'POST' });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: `Login failed. Status: ${response.status}` }));
                throw new Error(errorData.error || errorData.message || `Login failed. Status: ${response.status}`);
            }

            const userData = await response.json();
            console.log('Login successful, user data received:', userData);
            auth.login(userData); // Call context login

        } catch (err) {
            console.error("Login API call failed:", err);
            setError(err.message || "An error occurred during login.");
        } finally {
            setIsLoading(false);
        }
    }
  };

  return (
    <Layout>
      <Container component="main" maxWidth="xs">
        <Paper elevation={3} sx={{ marginTop: 8, padding: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Avatar sx={{ m: 1, bgcolor: isRegisterMode ? 'success.main' : 'secondary.main' }}>
            {isRegisterMode ? <PersonAddAlt1Icon /> : <LockOutlinedIcon />}
          </Avatar>
          <Typography component="h1" variant="h5">
            {isRegisterMode ? 'Sign Up' : 'Sign In'}
          </Typography>

          {error && (
            <Alert severity="error" sx={{ width: '100%', mt: 2 }}>
              {error}
            </Alert>
          )}
          {registerSuccess && !error && (
             <Alert severity="success" sx={{ width: '100%', mt: 2 }}>
              {registerSuccess}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1, width: '100%' }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="username"
              label="Username"
              name="username"
              autoComplete="username"
              autoFocus
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={isLoading}
            />
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
