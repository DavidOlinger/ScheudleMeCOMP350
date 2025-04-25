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
import Avatar from '@mui/material/Avatar';
import { styled } from '@mui/material/styles'; // For custom styling
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
// /**********************************************************************/
// /* START OF NEW CODE (Import Grid)                                  */
// /**********************************************************************/
import Grid from '@mui/material/Grid'; // Import the Grid component
// /**********************************************************************/
// /* END OF NEW CODE                                                    */
// /**********************************************************************/


// The URL of your Rails API backend (adjust if needed)
const RAILS_API_URL = 'http://localhost:3000';
// Base URL for serving files stored via Active Storage
const RAILS_STORAGE_URL = 'http://localhost:3000'; // Adjust if needed

// Visually hide the default file input
const VisuallyHiddenInput = styled('input')({
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
  height: 1,
  overflow: 'hidden',
  position: 'absolute',
  bottom: 0,
  left: 0,
  whiteSpace: 'nowrap',
  width: 1,
});


function ProfilePage() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  // State for the profile data fetched from Rails
  const [profileData, setProfileData] = useState(null);
  const [profileExists, setProfileExists] = useState(false); // Track if profile exists in Rails DB

  // State for form inputs
  const [bio, setBio] = useState('');
  const [favoriteSpot, setFavoriteSpot] = useState('');
  const [avatarFile, setAvatarFile] = useState(null); // Holds the selected File object
  const [avatarPreview, setAvatarPreview] = useState(null); // Holds the temporary preview URL or fetched URL

  // State for loading and error handling
  const [isLoading, setIsLoading] = useState(false); // Combined loading state for fetch/save
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  // --- Fetch Profile Data ---
  const fetchProfile = useCallback(async () => {
    // Reset state before fetching
    setError(null); setSuccessMessage(''); setProfileData(null); setProfileExists(false);
    setBio(''); setFavoriteSpot('');
    setAvatarFile(null); setAvatarPreview(null);

    if (!currentUser?.name) { console.log("Fetch profile skipped: No user logged in."); return; }

    setIsLoading(true);
    console.log(`Fetching profile for: ${currentUser.name}`);

    try {
      const profileUrl = `${RAILS_API_URL}/user_profiles/${encodeURIComponent(currentUser.name)}`;
      const response = await fetch(profileUrl);
      const responseText = await response.text();

      if (response.ok) {
        const data = JSON.parse(responseText);
        console.log("Profile data received:", data);
        setProfileData(data);
        setBio(data.bio || '');
        setFavoriteSpot(data.favorite_spot || '');
        setProfileExists(true); // Profile exists

        // Construct full URL for existing avatar if available
        if (data.avatar_url) {
            // url_for generates a relative path in dev, prepend the base URL
            setAvatarPreview(data.avatar_url.startsWith('http') ? data.avatar_url : `${RAILS_STORAGE_URL}${data.avatar_url}`);
        } else {
            setAvatarPreview(null); // No existing avatar
        }
      } else if (response.status === 404) {
        console.log("Profile not found for user:", currentUser.name);
        setProfileExists(false); // Profile does not exist
        setAvatarPreview(null);
      } else {
        // Handle other errors
        let errorMessage = `Failed to fetch profile. Status: ${response.status}`;
        try { const errorData = JSON.parse(responseText); errorMessage = errorData.error || JSON.stringify(errorData) || errorMessage; }
        catch (e) { console.error("Non-JSON error response text:", responseText); errorMessage = `Server returned status ${response.status}. Check Rails logs.`; }
        throw new Error(errorMessage);
      }
    } catch (err) {
      console.error("Failed to fetch profile:", err);
      setError(err.message || "Could not load profile data.");
      setProfileExists(false); setProfileData(null); setAvatarPreview(null);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser]);

  // --- Trigger Fetch on Mount ---
  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // --- Handle File Selection and Cleanup Preview ---
  const handleFileChange = (event) => {
    const file = event.target.files ? event.target.files[0] : null;
    if (file) {
      setAvatarFile(file); // Store the File object
      const previewUrl = URL.createObjectURL(file);
      setAvatarPreview(previewUrl); // Set temporary preview
    } else {
      // If user cancels file selection, reset file and revert preview
      setAvatarFile(null);
      // Revert preview to the saved avatar URL (if profileData exists), otherwise null
      const existingAvatarUrl = profileData?.avatar_url
          ? (profileData.avatar_url.startsWith('http') ? profileData.avatar_url : `${RAILS_STORAGE_URL}${profileData.avatar_url}`)
          : null;
      setAvatarPreview(existingAvatarUrl);
    }
  };

  // Cleanup object URL
  useEffect(() => {
    const currentPreview = avatarPreview;
    const isBlobUrl = currentPreview?.startsWith('blob:');
    return () => {
      if (isBlobUrl) {
        console.log("Revoking blob URL:", currentPreview);
        URL.revokeObjectURL(currentPreview);
      }
    };
  }, [avatarPreview]);


  // --- Handle Save ---
  const handleSave = async (event) => {
    event.preventDefault();
    if (!currentUser?.name) { setError("User not logged in."); return; }

    setIsLoading(true); setError(null); setSuccessMessage('');

    // Determine method and URL based on whether the profile exists in our state
    const method = profileExists ? 'PATCH' : 'POST';
    const url = profileExists
      ? `${RAILS_API_URL}/user_profiles/${encodeURIComponent(currentUser.name)}`
      : `${RAILS_API_URL}/user_profiles`;

    // Use FormData for multipart request (needed for file upload)
    const formData = new FormData();

    // Append other profile fields, correctly nested under 'user_profile' key
    formData.append('user_profile[username]', currentUser.name); // Needed for create
    formData.append('user_profile[bio]', bio);
    formData.append('user_profile[favorite_spot]', favoriteSpot);

    // Append the file *only if* a new one was selected by the user
    if (avatarFile) {
      formData.append('user_profile[avatar]', avatarFile);
    }

    console.log(`Attempting to ${method} profile with FormData at ${url}`);

    try {
      const response = await fetch(url, {
        method: method,
        // DO NOT set 'Content-Type': browser sets it correctly for FormData
        body: formData,
      });

      const responseText = await response.text();

      if (!response.ok) {
        let errorMessage = `Failed to save profile. Status: ${response.status}`;
         try {
            const errorData = JSON.parse(responseText);
            // Format Rails validation errors (key: [array of messages])
            if (response.status === 422 && typeof errorData === 'object') {
                 errorMessage = Object.entries(errorData)
                    .map(([field, messages]) => `${field} ${messages.join(', ')}`)
                    .join('; ');
            } else {
                errorMessage = errorData.error || JSON.stringify(errorData) || errorMessage;
            }
         } catch (e) {
            console.error("Non-JSON error response on save:", responseText);
            errorMessage = `Server returned status ${response.status}. Check Rails logs.`;
         }
        throw new Error(errorMessage);
      }

      // If successful:
      const savedData = JSON.parse(responseText);
      console.log("Profile saved successfully:", savedData);
      setProfileData(savedData); // Update local state with the full profile returned
      setProfileExists(true);    // CRITICAL: Ensure state knows profile exists now
      setSuccessMessage('Profile saved successfully!');
      // Update form fields from saved data
      setBio(savedData.bio || '');
      setFavoriteSpot(savedData.favorite_spot || '');
      // Update preview with the *newly saved* avatar URL from server
      if (savedData.avatar_url) {
         setAvatarPreview(savedData.avatar_url.startsWith('http') ? savedData.avatar_url : `${RAILS_STORAGE_URL}${savedData.avatar_url}`);
      } else {
         setAvatarPreview(null); // Handle case where avatar might have been removed or failed saving
      }
      setAvatarFile(null); // Clear the selected file state after successful upload

    } catch (err) {
      console.error("Failed to save profile:", err);
      setError(err.message || "Could not save profile.");
      setSuccessMessage('');
    } finally {
      setIsLoading(false);
    }
  };

  // Handler for Back Button
  const handleGoBack = () => { navigate('/editor'); };


  // --- Render Logic ---
  return (
    <Layout>
      <Container maxWidth="md">
        <Paper elevation={3} sx={{ marginTop: 4, padding: 4 }}>
          {/* Back Button */}
          <Button
              startIcon={<ArrowBackIcon />}
              onClick={handleGoBack}
              sx={{ mb: 2 }} // Add margin below the button
          >
              Back to Editor
          </Button>

          <Typography variant="h4" component="h1" gutterBottom> User Profile </Typography>

          {/* Display loading spinner */}
          {isLoading && ( <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}> <CircularProgress /> </Box> )}
          {/* Display error messages */}
          {error && !isLoading && ( <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert> )}
          {/* Display success messages */}
          {successMessage && !isLoading && !error && ( <Alert severity="success" sx={{ mb: 2 }}>{successMessage}</Alert> )}

          {/* Display profile form only when not initially loading AND user is logged in */}
          {!isLoading && currentUser && (
             <Box component="form" onSubmit={handleSave} noValidate sx={{ mt: 1 }}>
               {/* Use Grid for layout */}
               <Grid container spacing={3}> {/* Line 288 */}
                  {/* Left side for Avatar */}
                  <Grid item xs={12} sm={4} md={3} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}> {/* Line 289 */}
                      <Avatar
                          alt={currentUser.name}
                          src={avatarPreview || ''} // Show preview or existing URL
                          sx={{ width: 120, height: 120, mb: 2, fontSize: '3rem' }} // Larger avatar
                      >
                          {/* Fallback initial if no image */}
                          {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : '?'}
                      </Avatar>
                      <Button
                          component="label" // Makes the button act like a label for the hidden input
                          role={undefined}
                          variant="contained"
                          tabIndex={-1}
                          startIcon={<CloudUploadIcon />}
                          size="small"
                          disabled={isLoading}
                      >
                          Upload Avatar
                          {/* The actual file input, hidden */}
                          <VisuallyHiddenInput
                              type="file"
                              accept="image/*" // Accept only image files
                              onChange={handleFileChange}
                          />
                      </Button>
                  </Grid>

                  {/* Right side for text fields */}
                  <Grid item xs={12} sm={8} md={9}> {/* Line 323 */}
                      <TextField label="Username" fullWidth margin="normal" value={currentUser.name} InputProps={{ readOnly: true }} variant="filled" sx={{ mb: 2 }} />
                      <TextField label="Bio" fullWidth margin="normal" multiline rows={4} value={bio} onChange={(e) => setBio(e.target.value)} disabled={isLoading} />
                      <TextField label="Favorite Campus Spot" fullWidth margin="normal" value={favoriteSpot} onChange={(e) => setFavoriteSpot(e.target.value)} disabled={isLoading} />
                  </Grid>
               </Grid>

               {/* Save Button */}
               <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}> {/* Align button right */}
                   <Button type="submit" variant="contained" color="primary" disabled={isLoading} >
                     {/* Button text correctly uses the component's profileExists state */}
                     {isLoading ? 'Saving...' : (profileExists ? 'Update Profile' : 'Create Profile')}
                   </Button>
               </Box>
             </Box>
          )}

          {/* Show message if user is not logged in (and not loading) */}
          {!isLoading && !currentUser && ( <Typography sx={{ mt: 2 }}>Please log in to view your profile.</Typography> )}

        </Paper>
      </Container>
    </Layout>
  );
}

export default ProfilePage;
