// src/pages/ProfilePage.js
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';

// Import MUI components
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';


// The URL of your Rails API backend
const RAILS_API_URL = 'http://localhost:3000'; // Default Rails port

function ProfilePage() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();


  // State for the profile data fetched from Rails
  const [profileData, setProfileData] = useState(null);
  const [profileExists, setProfileExists] = useState(false);

  // State for form inputs - initialize empty
  const [bio, setBio] = useState('');
  const [profilePicUrl, setProfilePicUrl] = useState('');
  const [favoriteSpot, setFavoriteSpot] = useState('');

  // State for loading and error handling
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  // --- Fetch Profile Data ---
  const fetchProfile = useCallback(async () => {
    setError(null);
    setSuccessMessage('');
    setProfileData(null);
    setProfileExists(false); // Reset existence state before fetch
    setBio('');
    setProfilePicUrl('');
    setFavoriteSpot('');


    if (!currentUser?.name) {
      console.log("Fetch profile skipped: No user logged in.");
      return;
    }

    setIsLoading(true);
    console.log(`Fetching profile for: ${currentUser.name}`);

    try {
      const profileUrl = `${RAILS_API_URL}/user_profiles/${encodeURIComponent(currentUser.name)}`;
      const response = await fetch(profileUrl);
      const responseText = await response.text();

      if (response.ok) {
        try {
          const data = JSON.parse(responseText);
          console.log("Profile data received:", data);
          setProfileData(data);
          setBio(data.bio || '');
          setProfilePicUrl(data.profile_pic_url || '');
          setFavoriteSpot(data.favorite_spot || '');
          setProfileExists(true); // <<< Profile exists
        } catch (parseError) {
            console.error("JSON Parsing Error after OK response:", parseError);
            console.error("Response Text:", responseText);
            throw new Error("Received invalid data format from server.");
        }
      } else if (response.status === 404) {
        console.log("Profile not found for user:", currentUser.name);
        setProfileExists(false); // <<< Profile does not exist
      } else {
        let errorMessage = `Failed to fetch profile. Status: ${response.status}`;
        try {
          const errorData = JSON.parse(responseText);
          errorMessage = errorData.error || JSON.stringify(errorData) || errorMessage;
        } catch (e) {
            console.error("Non-JSON error response text:", responseText);
            if (responseText.trim().toLowerCase().startsWith("<!doctype html")) {
                errorMessage = "Received HTML page instead of JSON data. Check API URL, CORS config, or server logs.";
            } else {
                 errorMessage = `Server returned status ${response.status}. Check Rails logs.`;
            }
        }
        throw new Error(errorMessage);
      }
    } catch (err) {
      console.error("Failed to fetch profile:", err);
      setError(err.message || "Could not load profile data.");
      setProfileExists(false); // <<< Ensure profile is marked as not existing on error
      setProfileData(null);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser]);

  // --- Trigger Fetch on Mount ---
  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // --- Handle Save ---
  const handleSave = async (event) => {
    event.preventDefault();
    if (!currentUser?.name) {
      setError("User not logged in.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccessMessage('');

    // /**********************************************************************/
    // /* START OF MODIFICATION (Use local profileExists state)              */
    // /**********************************************************************/
    // Determine method and URL based on the component's state
    const method = profileExists ? 'PATCH' : 'POST';
    // /**********************************************************************/
    // /* END OF MODIFICATION                                                */
    // /**********************************************************************/
    const url = profileExists
      ? `${RAILS_API_URL}/user_profiles/${encodeURIComponent(currentUser.name)}`
      : `${RAILS_API_URL}/user_profiles`;

    const payload = {
      user_profile: {
        username: currentUser.name,
        bio: bio,
        profile_pic_url: profilePicUrl,
        favorite_spot: favoriteSpot,
      },
    };

    console.log(`Attempting to ${method} profile at ${url}`);
    console.log("Payload:", JSON.stringify(payload));

    try {
      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const responseText = await response.text();

      if (!response.ok) {
        let errorMessage = `Failed to save profile. Status: ${response.status}`;
         try {
            const errorData = JSON.parse(responseText);
            if (response.status === 422 && typeof errorData === 'object') {
                 errorMessage = Object.entries(errorData)
                    .map(([field, messages]) => `${field} ${messages.join(', ')}`)
                    .join('; ');
            } else {
                errorMessage = errorData.error || JSON.stringify(errorData) || errorMessage;
            }
         } catch (e) {
            console.error("Non-JSON error response text on save:", responseText);
            errorMessage = `Server returned status ${response.status}. Check Rails logs.`;
         }
        throw new Error(errorMessage);
      }

      // If successful:
      try {
          const savedData = JSON.parse(responseText);
          console.log("Profile saved successfully:", savedData);
          setProfileData(savedData);
          // /**********************************************************************/
          // /* START OF NEW CODE (Set profileExists to true after save)         */
          // /**********************************************************************/
          setProfileExists(true); // <<< CRITICAL: Ensure state knows profile now exists
          // /**********************************************************************/
          // /* END OF NEW CODE                                                    */
          // /**********************************************************************/
          setSuccessMessage('Profile saved successfully!');
          // Update form fields from saved data
          setBio(savedData.bio || '');
          setProfilePicUrl(savedData.profile_pic_url || '');
          setFavoriteSpot(savedData.favorite_spot || '');
      } catch (parseError) {
          console.error("JSON Parsing Error after successful save:", parseError);
          console.error("Response Text:", responseText);
          throw new Error("Received invalid data format from server after save.");
      }

    } catch (err) {
      console.error("Failed to save profile:", err);
      setError(err.message || "Could not save profile.");
      setSuccessMessage('');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoBack = () => {
    navigate('/editor');
  };


  // --- Render Logic ---
  return (
    <Layout>
      <Container maxWidth="md">
        <Paper elevation={3} sx={{ marginTop: 4, padding: 4 }}>
          <Button
              startIcon={<ArrowBackIcon />}
              onClick={handleGoBack}
              sx={{ mb: 2 }}
          >
              Back to Editor
          </Button>

          <Typography variant="h4" component="h1" gutterBottom>
            User Profile
          </Typography>

          {isLoading && (
             <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
               <CircularProgress />
             </Box>
          )}

          {error && !isLoading && (
            <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
          )}

          {successMessage && !isLoading && !error && (
            <Alert severity="success" sx={{ mb: 2 }}>{successMessage}</Alert>
          )}

          {!isLoading && currentUser && (
             <Box component="form" onSubmit={handleSave} noValidate sx={{ mt: 1 }}>
               <TextField
                 label="Username"
                 fullWidth
                 margin="normal"
                 value={currentUser.name}
                 InputProps={{
                   readOnly: true,
                 }}
                 variant="filled"
                 sx={{ mb: 2 }}
               />

               <TextField
                 label="Bio"
                 fullWidth
                 margin="normal"
                 multiline
                 rows={4}
                 value={bio}
                 onChange={(e) => setBio(e.target.value)}
                 disabled={isLoading}
               />

               <TextField
                 label="Profile Picture URL"
                 fullWidth
                 margin="normal"
                 value={profilePicUrl}
                 onChange={(e) => setProfilePicUrl(e.target.value)}
                 disabled={isLoading}
                 type="url"
               />

               <TextField
                 label="Favorite Campus Spot"
                 fullWidth
                 margin="normal"
                 value={favoriteSpot}
                 onChange={(e) => setFavoriteSpot(e.target.value)}
                 disabled={isLoading}
               />

               <Button
                 type="submit"
                 variant="contained"
                 color="primary"
                 sx={{ mt: 3 }}
                 disabled={isLoading}
               >
                 {/* Button text now correctly uses the component's profileExists state */}
                 {isLoading ? 'Saving...' : (profileExists ? 'Update Profile' : 'Create Profile')}
               </Button>
             </Box>
          )}

          {!isLoading && !currentUser && (
             <Typography sx={{ mt: 2 }}>Please log in to view your profile.</Typography>
          )}

        </Paper>
      </Container>
    </Layout>
  );
}

export default ProfilePage;
