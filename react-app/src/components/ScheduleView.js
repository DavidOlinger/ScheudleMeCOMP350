// src/components/ScheduleView.js
import React, { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
// import Grid from '@mui/material/Grid'; // Grid not directly used here anymore
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Tooltip from '@mui/material/Tooltip'; // Show details on hover
import IconButton from '@mui/material/IconButton';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'; // Icon for removing

// ***** START OF NEW CODE *****
// Import the useAuth hook
import { useAuth } from '../context/AuthContext';
// ***** END OF NEW CODE *****

// --- Constants for Calendar Layout ---
const DAYS = ['M', 'T', 'W', 'R', 'F'];
const START_HOUR = 8; // 8 AM
const END_HOUR = 22; // 10 PM (Display up to 9 PM slot)
const HOUR_HEIGHT_PX = 60; // Height of one hour slot in pixels
const TOTAL_HOURS = END_HOUR - START_HOUR;

/**
 * Helper function to convert seconds since midnight to a pixel offset from the top.
 * @param {number} seconds - Seconds since midnight.
 * @returns {number} Pixel offset from the top of the schedule grid body.
 */
const timeToYPosition = (seconds) => {
  const hour = seconds / 3600;
  const relativeHour = hour - START_HOUR;
  return relativeHour * HOUR_HEIGHT_PX;
};

/**
 * Helper function to calculate the height of an event based on its duration.
 * @param {number} startTimeSeconds - Start time in seconds since midnight.
 * @param {number} endTimeSeconds - End time in seconds since midnight.
 * @returns {number} Height in pixels.
 */
const durationToHeight = (startTimeSeconds, endTimeSeconds) => {
  const durationSeconds = endTimeSeconds - startTimeSeconds;
  const durationHours = durationSeconds / 3600;
  // Subtracting 1px to leave a small gap between adjacent blocks
  return Math.max(0, durationHours * HOUR_HEIGHT_PX - 1);
};

/**
 * Helper function to format seconds since midnight into HH:MM AM/PM format.
 * @param {number} seconds - Seconds since midnight.
 * @returns {string} Formatted time string.
 */
const formatTime = (seconds) => {
    const totalMinutes = Math.floor(seconds / 60);
    const hours24 = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12; // Convert 0 to 12 for 12 AM/PM
    const ampm = hours24 >= 12 ? 'PM' : 'AM';
    return `${hours12}:${minutes.toString().padStart(2, '0')} ${ampm}`;
};


/**
 * ScheduleView Component
 * Displays the current user's schedule in a weekly calendar grid format.
 * Fetches schedule data from the backend API.
 */
const ScheduleView = () => {
  // ***** START OF NEW CODE *****
  // Get current user from auth context
  const { currentUser } = useAuth();
  // ***** END OF NEW CODE *****

  // State to store the schedule data (list of events/courses)
  const [scheduleData, setScheduleData] = useState(null); // Start as null to indicate not loaded
  // State for loading indicator
  const [isLoading, setIsLoading] = useState(false);
  // State for error messages
  const [error, setError] = useState(null);

  /**
   * Fetches the current schedule data from the backend API.
   */
  const fetchSchedule = async () => {
    // ***** START OF NEW CODE *****
    // Only fetch if a user is logged in
    if (!currentUser) {
        console.log("ScheduleView: No user logged in, skipping schedule fetch.");
        setScheduleData(null); // Ensure schedule is cleared if user logs out
        setError(null);
        setIsLoading(false);
        return;
    }
    console.log("ScheduleView: Fetching schedule for user:", currentUser.name);
    // ***** END OF NEW CODE *****

    setIsLoading(true);
    setError(null);
    // setScheduleData(null); // Keep previous data while loading for smoother UX? Or clear? Clearing for now.
    setScheduleData(null);

    try {
      // IMPORTANT: Replace with your actual backend URL if needed
      const apiUrl = 'http://localhost:7070/api/schedule/current';
      // ***** START OF BACKEND INTERACTION *****
      // Note: Backend needs to know which user's schedule to get.
      // Currently, backend relies on the shared ScheduleManager state set during login.
      // In a real app, you'd likely send an Authorization token here.
      const response = await fetch(apiUrl);
      // ***** END OF BACKEND INTERACTION *****

      if (!response.ok) {
         // Try to parse error response from backend
         const errorData = await response.json().catch(() => ({
             message: `HTTP error! Status: ${response.status}`
         }));
         // Handle 404 specifically - means no schedule is loaded, not necessarily an error
         if (response.status === 404) {
             console.log("ScheduleView: No active schedule found on backend (404).");
             // Display a message or an empty schedule representation
             setScheduleData({ name: 'No Schedule Loaded', events: [] });
             setError(null); // Clear error for 404
         } else {
            // Use error message from backend if available
            throw new Error(errorData.error || errorData.message || `HTTP error! Status: ${response.status}`);
         }
      } else {
        const data = await response.json();
        console.log("ScheduleView: Schedule data received:", data);
        // Ensure events is always an array, even if null/missing in response
        setScheduleData({ ...data, events: Array.isArray(data.events) ? data.events : [] });
      }

    } catch (err) {
      console.error("Failed to fetch schedule:", err);
      setError(err.message || "Could not load schedule data.");
      setScheduleData(null); // Clear data on error
    } finally {
      setIsLoading(false);
    }
  };

  // ***** START OF NEW CODE *****
  // useEffect hook to fetch data when the component mounts OR when the currentUser changes
  useEffect(() => {
    fetchSchedule();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]); // Add currentUser as a dependency
  // ***** END OF NEW CODE *****

  /**
   * Handles removing a course from the schedule via API call.
   * @param {object} course - The course object to remove.
   */
  const handleRemoveCourse = async (course) => {
    // ***** START OF NEW CODE *****
    // Prevent removal if no user is logged in
    if (!currentUser) {
        setError("Please log in to modify the schedule.");
        return;
    }
     // Prevent removal if data is currently loading
    if (isLoading) {
        console.log("ScheduleView: Already processing, cannot remove course now.");
        return;
    }
    // ***** END OF NEW CODE *****

    console.log("Attempting to remove course:", course);

    // Confirmation dialog
    if (!window.confirm(`Are you sure you want to remove ${course.subject} ${course.courseCode} from the schedule?`)) {
        return;
    }

    // TODO: Implement actual API call to DELETE /api/schedule/current/remove/{courseCode}
    try {
        setIsLoading(true); // Indicate activity
        setError(null);
        const apiUrl = `http://localhost:7070/api/schedule/current/remove/${course.courseCode}`;
        // ***** START OF BACKEND INTERACTION *****
        // Note: Backend needs to know which user's schedule to modify.
        // Currently relies on shared state. Real app needs auth token.
        const response = await fetch(apiUrl, { method: 'DELETE' });
        // ***** END OF BACKEND INTERACTION *****

        if (!response.ok) {
             const errorData = await response.json().catch(() => ({
                message: `HTTP error! Status: ${response.status}`
            }));
            // Use error message from backend if available
            throw new Error(errorData.error || errorData.message || `HTTP error! Status: ${response.status}`);
        }

        // If successful, refetch the schedule to show the updated view
        await fetchSchedule(); // Refetch data after successful deletion

    } catch (err) {
         console.error("Failed to remove course:", err);
         setError(err.message || "Could not remove course.");
         // Keep loading false on error, fetchSchedule will set it if it runs
         // setIsLoading(false); // Removed, fetchSchedule handles it
    }
    // Note: isLoading will be set to false by the fetchSchedule call if successful
  };


  // --- Rendering Logic ---

  // ***** START OF NEW CODE *****
  // Display message if not logged in
  if (!currentUser) {
      return <Typography sx={{m: 2, p: 2, textAlign: 'center'}}>Please log in to view your schedule.</Typography>;
  }
  // ***** END OF NEW CODE *****

  // Display loading indicator
  if (isLoading && !scheduleData) { // Show full loading only if no data is present yet
    return <CircularProgress sx={{ display: 'block', margin: 'auto', mt: 4 }} />;
  }

  // Display error message if fetching failed after login
  if (error && !scheduleData) { // Show full error only if no data is present yet
    return <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>;
  }

  // Display message if no schedule data is loaded (e.g., 404 or empty schedule)
  // and not loading/error
  if (!scheduleData || !scheduleData.events) {
      // Handle the case where scheduleData exists but events might be missing/null
      // Or if fetch resulted in the 'No Schedule Loaded' state
      return (
          <Box sx={{ width: '100%' }}>
              <Typography variant="h6" component="div" gutterBottom>
                  Current Schedule: {scheduleData?.name || 'No Schedule Active'}
              </Typography>
              <Typography sx={{m: 2, p: 2, textAlign: 'center'}}>
                  {scheduleData?.name === 'No Schedule Loaded' ? 'No schedule is currently loaded. You can create a new one or load an existing schedule.' : 'Schedule data is unavailable.'}
              </Typography>
              {/* Optionally add buttons here to "Create New" or "Load Schedule" */}
          </Box>
      );
  }

  // --- Render the Calendar Grid ---
  return (
    <Box sx={{ width: '100%' }}>
       <Typography variant="h6" component="div" gutterBottom>
         Current Schedule: {scheduleData?.name || 'Unnamed Schedule'}
       </Typography>
       {/* Display loading/error overlays if needed during updates */}
       {isLoading && <CircularProgress size={20} sx={{ position: 'absolute', top: 80, right: 20 }} />}
       {/* Display persistent error during updates */}
       {error && <Alert severity="warning" sx={{ mb: 1 }}>Error updating schedule: {error}</Alert>}

      <Box sx={{ display: 'flex', border: '1px solid grey', position: 'relative', overflowX: 'auto' }}> {/* Added overflowX */}

        {/* Time Column */}
        <Box sx={{ width: '80px', borderRight: '1px solid lightgrey', flexShrink: 0 }}> {/* Prevent shrinking */}
          <Box sx={{ height: '30px', borderBottom: '1px solid lightgrey' }} /> {/* Header spacer */}
          {Array.from({ length: TOTAL_HOURS }).map((_, hourIndex) => (
            <Typography
              key={hourIndex}
              variant="caption"
              component="div"
              sx={{
                height: `${HOUR_HEIGHT_PX}px`,
                textAlign: 'center',
                borderBottom: '1px dashed lightgrey',
                pt: '2px', // Padding top
                color: 'text.secondary',
                boxSizing: 'border-box', // Include padding/border in height
                display: 'flex', // Use flexbox for alignment
                alignItems: 'flex-start', // Align text to the top
                justifyContent: 'center', // Center text horizontally
              }}
            >
              {/* Display time label (e.g., 8:00 AM) */}
              {formatTime((START_HOUR + hourIndex) * 3600)}
            </Typography>
          ))}
        </Box>

        {/* Day Columns Container */}
        <Box sx={{ display: 'flex', flexGrow: 1 }}>
            {DAYS.map((day) => (
            <Box
                key={day}
                sx={{
                minWidth: '100px', // Minimum width for each day column
                flexGrow: 1, // Each day column takes equal width
                borderRight: '1px solid lightgrey',
                position: 'relative', // Needed for absolute positioning of events
                height: `${TOTAL_HOURS * HOUR_HEIGHT_PX}px`, // Total height of the grid body
                '&:last-child': { borderRight: 'none' }, // Remove border on the last column
                }}
            >
                {/* Header for the day */}
                <Typography
                    variant="subtitle2"
                    align="center"
                    sx={{
                        height: '30px',
                        borderBottom: '1px solid lightgrey',
                        lineHeight: '30px' // Center text vertically
                    }}
                >
                    {day} {/* Display M, T, W, R, F */}
                </Typography>

                {/* Render horizontal hour lines for visual reference */}
                {Array.from({ length: TOTAL_HOURS }).map((_, hourIndex) => ( // Render all lines
                    <Box key={hourIndex} sx={{
                        height: `${HOUR_HEIGHT_PX}px`,
                        borderBottom: hourIndex < TOTAL_HOURS - 1 ? '1px dashed lightgrey' : 'none', // No border on last line
                        boxSizing: 'border-box',
                    }}/>
                ))}
                {/* Removed extra box, loop renders all lines now */}


                {/* --- Render Events for this Day --- */}
                {scheduleData?.events // Use optional chaining
                ?.filter(event => event && event.days && event.time && event.days.includes(day)) // Add null checks for event and time
                .map((event) => {
                    // Calculate position and height based on time
                    const top = timeToYPosition(event.time.startTime);
                    const height = durationToHeight(event.time.startTime, event.time.endTime);

                    // Basic check for valid position/height
                    if (isNaN(top) || isNaN(height) || height <= 0 || top < 0) { // Added check for top < 0
                    console.warn("Skipping event due to invalid time/position:", event);
                    return null; // Don't render if calculations are invalid
                    }

                    const courseInfo = `${event.subject || ''} ${event.courseCode || ''}: ${event.name || 'Event'}`;
                    const timeInfo = `${formatTime(event.time.startTime)} - ${formatTime(event.time.endTime)}`;
                    const professorInfo = event.professor?.name || 'N/A'; // Safely access professor name

                    return (
                    <Tooltip key={`${event.subject}-${event.courseCode}-${event.section}-${day}`} title={`${courseInfo} | ${timeInfo} | Prof: ${professorInfo}`}>
                        <Paper
                        elevation={2}
                        sx={{
                            position: 'absolute',
                            top: `${top}px`, // Position from the top of the day column's body
                            left: '2px', // Small offset from the left edge
                            right: '2px', // Small offset from the right edge
                            height: `${height}px`,
                            backgroundColor: 'primary.light', // Use theme color
                            color: 'primary.contrastText',
                            p: 0.5, // Padding inside the event box
                            fontSize: '0.7rem',
                            overflow: 'hidden', // Hide overflow text
                            zIndex: 1, // Ensure events are above grid lines
                            boxSizing: 'border-box',
                            display: 'flex',
                            flexDirection: 'column',
                            // justifyContent: 'space-between', // Let content flow naturally
                            cursor: 'default', // Default cursor for the block
                        }}
                        >
                        <Typography variant="caption" component="div" sx={{ fontWeight: 'bold', lineHeight: 1.1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {event.subject || ''} {event.courseCode || ''}
                        </Typography>
                        <Typography variant="caption" component="div" sx={{ lineHeight: 1.1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {event.name || 'Event'}
                        </Typography>
                        {/* Optional: Add delete button inside the event block */}
                        <IconButton
                            size="small"
                            onClick={(e) => {
                                e.stopPropagation(); // Prevent tooltip from interfering
                                handleRemoveCourse(event);
                            }}
                            sx={{
                                position: 'absolute',
                                bottom: 0, // Position at bottom right
                                right: 0,
                                color: 'primary.contrastText',
                                opacity: 0.7,
                                p: '2px', // Smaller padding
                                '&:hover': { opacity: 1, backgroundColor: 'rgba(0,0,0,0.1)'}
                            }}
                            title={`Remove ${event.subject} ${event.courseCode}`}
                        >
                            <DeleteOutlineIcon sx={{ fontSize: '1rem' }} /> {/* Smaller icon */}
                        </IconButton>
                        </Paper>
                    </Tooltip>
                    );
                })}
            </Box>
            ))}
        </Box> {/* End Day Columns Container */}
      </Box>
    </Box>
  );
};

export default ScheduleView;
