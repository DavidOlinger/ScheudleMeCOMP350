// src/pages/LoginPage.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // Hook for navigation after login

// Import MUI components for the form layout and elements
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Link from '@mui/material/Link'; // For potential "Forgot password?" or "Sign Up" links
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined'; // Icon for the avatar
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import Paper from '@mui/material/Paper'; // To give the form a distinct background
import Alert from '@mui/material/Alert'; // To display login errors

// Import the shared Layout component
import Layout from '../components/Layout';

/**
 * LoginPage Component
 * Provides a user interface for logging into the application.
 */
function LoginPage() {
  // Hook to programmatically navigate the user (e.g., after successful login)
  const navigate = useNavigate();

  // State variables for form inputs
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // State variables for handling login process feedback
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Handles the submission of the login form.
   * @param {React.FormEvent<HTMLFormElement>} event - The form submission event.
   */
  const handleSubmit = async (event) => {
    event.preventDefault(); // Prevent default browser form submission
    setError(null); // Clear previous errors
    setIsLoading(true);

    console.log('Attempting login with:', { username, password });

    // --- Placeholder for API Call ---
    try {
      // Construct the URL for the backend login endpoint
      // IMPORTANT: Use your actual backend URL
      const apiUrl = `http://localhost:7070/api/auth/login?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`;

      // Your backend currently uses query parameters for login based on UserController
      // If you change backend to expect JSON body, adjust fetch options accordingly:
      // const response = await fetch('http://localhost:7070/api/auth/login', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ username, password })
      // });

      const response = await fetch(apiUrl, { method: 'POST' }); // Using POST as defined in UserController

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ // Try to parse error
             message: `Login failed. Status: ${response.status}`
        }));
        throw new Error(errorData.message || `Login failed. Status: ${response.status}`);
      }

      // Assuming successful login returns user data or a success message
      const data = await response.json();
      console.log('Login successful:', data);

      // TODO: Handle successful login:
      // 1. Store user session/token (if applicable)
      // 2. Update global user state (e.g., using Context or state management library)
      // 3. Navigate the user to the main page or dashboard
      navigate('/'); // Navigate to the main page ('/') after successful login

    } catch (err) {
      console.error("Login API call failed:", err);
      setError(err.message || "An error occurred during login.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    // Use the Layout component to get the TopBar and consistent structure
    <Layout>
      {/* Container centers the content horizontally and applies max width */}
      <Container component="main" maxWidth="xs"> {/* 'xs' makes the container narrow, suitable for a login form */}
        {/* Paper provides a distinct background and elevation for the form */}
        <Paper elevation={3} sx={{ marginTop: 8, padding: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {/* Avatar with a lock icon */}
          <Avatar sx={{ m: 1, bgcolor: 'secondary.main' }}>
            <LockOutlinedIcon />
          </Avatar>
          <Typography component="h1" variant="h5">
            Sign in
          </Typography>

          {/* Display login errors */}
          {error && (
            <Alert severity="error" sx={{ width: '100%', mt: 2 }}>
              {error}
            </Alert>
          )}

          {/* Form element */}
          <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1, width: '100%' }}>
            {/* Username Input */}
            <TextField
              margin="normal"
              required // Basic HTML5 validation
              fullWidth
              id="username"
              label="Username"
              name="username"
              autoComplete="username" // Helps browser autofill
              autoFocus // Focus this field when the page loads
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={isLoading} // Disable while loading
            />
            {/* Password Input */}
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type="password" // Hides password input
              id="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
            />
            {/* Optional: Add a "Remember me" checkbox here if needed */}
            {/* <FormControlLabel
              control={<Checkbox value="remember" color="primary" />}
              label="Remember me"
            /> */}

            {/* Submit Button */}
            <Button
              type="submit"
              fullWidth
              variant="contained" // Gives it a background color and elevation
              sx={{ mt: 3, mb: 2 }} // Margin top and bottom
              disabled={isLoading} // Disable button while login is in progress
            >
              {isLoading ? 'Signing In...' : 'Sign In'}
            </Button>

            {/* Optional Links (Forgot Password, Sign Up) */}
            <Grid container>
              <Grid item xs>
                {/* Placeholder link */}
                <Link href="#" variant="body2">
                  Forgot password?
                </Link>
              </Grid>
              <Grid item>
                {/* Placeholder link - TODO: Link to a registration page */}
                <Link href="#" variant="body2">
                  {"Don't have an account? Sign Up"}
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
