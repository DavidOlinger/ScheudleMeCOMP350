// src/components/ScheduleView.js
import React, { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid'; // Using Grid for basic layout
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Tooltip from '@mui/material/Tooltip'; // Show details on hover
import IconButton from '@mui/material/IconButton';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'; // Icon for removing

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
    setIsLoading(true);
    setError(null);
    setScheduleData(null); // Clear previous data

    try {
      // IMPORTANT: Replace with your actual backend URL if needed
      const apiUrl = 'http://localhost:7070/api/schedule/current';
      const response = await fetch(apiUrl);

      if (!response.ok) {
         // Try to parse error response from backend
         const errorData = await response.json().catch(() => ({
             message: `HTTP error! Status: ${response.status}`
         }));
         // Handle 404 specifically - means no schedule is loaded, not necessarily an error
         if (response.status === 404) {
             setScheduleData({ name: 'No Schedule Loaded', events: [] }); // Set empty schedule
             setError(null); // Clear error for 404
         } else {
            throw new Error(errorData.message || `HTTP error! Status: ${response.status}`);
         }
      } else {
        const data = await response.json();
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

  // useEffect hook to fetch data when the component mounts
  useEffect(() => {
    fetchSchedule();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array means run once on mount

  /**
   * Placeholder function for removing a course from the schedule.
   * @param {object} course - The course object to remove.
   */
  const handleRemoveCourse = async (course) => {
    console.log("Remove course clicked (placeholder):", course);

    // Confirmation dialog
    if (!window.confirm(`Are you sure you want to remove ${course.subject} ${course.courseCode} from the schedule?`)) {
        return;
    }

    // TODO: Implement actual API call to DELETE /api/schedule/current/remove/{courseCode}
    try {
        setIsLoading(true); // Indicate activity
        setError(null);
        const apiUrl = `http://localhost:7070/api/schedule/current/remove/${course.courseCode}`;
        const response = await fetch(apiUrl, { method: 'DELETE' });

        if (!response.ok) {
             const errorData = await response.json().catch(() => ({
                message: `HTTP error! Status: ${response.status}`
            }));
            throw new Error(errorData.message || `HTTP error! Status: ${response.status}`);
        }

        // If successful, refetch the schedule to show the updated view
        await fetchSchedule(); // Refetch data after successful deletion

    } catch (err) {
         console.error("Failed to remove course:", err);
         setError(err.message || "Could not remove course.");
         setIsLoading(false); // Stop loading indicator on error
    }
    // Note: isLoading will be set to false by the fetchSchedule call if successful
  };


  // --- Rendering Logic ---

  // Display loading indicator
  if (isLoading && !scheduleData) { // Show full loading only if no data is present yet
    return <CircularProgress sx={{ display: 'block', margin: 'auto', mt: 4 }} />;
  }

  // Display error message
  if (error && !scheduleData) { // Show full error only if no data is present yet
    return <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>;
  }

  // Display message if no schedule data is loaded (and not loading/error)
  if (!scheduleData) {
      // This case should ideally be covered by loading/error/404 handling above
      // but acts as a fallback.
      return <Typography sx={{m: 2}}>No schedule data available.</Typography>;
  }

  // --- Render the Calendar Grid ---
  return (
    <Box sx={{ width: '100%' }}>
       <Typography variant="h6" component="div" gutterBottom>
         Current Schedule: {scheduleData?.name || 'Unnamed Schedule'}
       </Typography>
       {/* Display loading/error overlays if needed during updates */}
       {isLoading && <CircularProgress size={20} sx={{ position: 'absolute', top: 80, right: 20 }} />}
       {error && <Alert severity="warning" sx={{ mb: 1 }}>Error updating schedule: {error}</Alert>}

      <Box sx={{ display: 'flex', border: '1px solid grey', position: 'relative' }}>

        {/* Time Column */}
        <Box sx={{ width: '80px', borderRight: '1px solid lightgrey' }}>
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
              }}
            >
              {/* Display time label (e.g., 8:00 AM) */}
              {formatTime((START_HOUR + hourIndex) * 3600)}
            </Typography>
          ))}
        </Box>

        {/* Day Columns */}
        {DAYS.map((day) => (
          <Box
            key={day}
            sx={{
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

             {/* Render horizontal hour lines for visual reference (optional) */}
             {Array.from({ length: TOTAL_HOURS -1 }).map((_, hourIndex) => (
                <Box key={hourIndex} sx={{
                    height: `${HOUR_HEIGHT_PX}px`,
                    borderBottom: '1px dashed lightgrey',
                    boxSizing: 'border-box',
                }}/>
             ))}
              <Box sx={{ height: `${HOUR_HEIGHT_PX}px` }}/> {/* Last hour slot without bottom border */}


            {/* --- Render Events for this Day --- */}
            {scheduleData?.events
              ?.filter(event => event.days && event.days.includes(day)) // Filter events for the current day column
              .map((event) => {
                // Calculate position and height based on time
                const top = timeToYPosition(event.time.startTime);
                const height = durationToHeight(event.time.startTime, event.time.endTime);

                // Basic check for valid position/height
                if (isNaN(top) || isNaN(height) || height <= 0) {
                  console.warn("Skipping event due to invalid time/position:", event);
                  return null; // Don't render if calculations are invalid
                }

                const courseInfo = `${event.subject || ''} ${event.courseCode || ''}: ${event.name || 'Event'}`;
                const timeInfo = `${formatTime(event.time.startTime)} - ${formatTime(event.time.endTime)}`;

                return (
                  <Tooltip key={`${event.subject}-${event.courseCode}-${event.section}-${day}`} title={`${courseInfo} | ${timeInfo} | Prof: ${event.professor?.name || 'N/A'}`}>
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
                        justifyContent: 'space-between', // Push delete button down if possible
                      }}
                    >
                      <Typography variant="caption" component="div" sx={{ fontWeight: 'bold', lineHeight: 1.1 }}>
                        {event.subject || ''} {event.courseCode || ''}
                      </Typography>
                      <Typography variant="caption" component="div" sx={{ lineHeight: 1.1 }}>
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
                              top: 0,
                              right: 0,
                              color: 'primary.contrastText',
                              opacity: 0.7,
                              '&:hover': { opacity: 1, backgroundColor: 'rgba(0,0,0,0.1)'}
                          }}
                          title={`Remove ${event.subject} ${event.courseCode}`}
                       >
                           <DeleteOutlineIcon fontSize="inherit" />
                       </IconButton>
                    </Paper>
                  </Tooltip>
                );
              })}
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export default ScheduleView;
