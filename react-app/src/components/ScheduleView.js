// src/components/ScheduleView.js
import React from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';

// Import hooks
import { useAuth } from '../context/AuthContext';
import { useSchedule } from '../context/ScheduleContext';

// --- Constants for Calendar Layout ---
const DAYS = ['M', 'T', 'W', 'R', 'F'];
const START_HOUR = 8; // 8 AM
const END_HOUR = 22; // 10 PM (Display up to 9 PM slot)
const HOUR_HEIGHT_PX = 60; // Height of one hour slot in pixels
const TOTAL_HOURS = END_HOUR - START_HOUR;
// ***** START OF NEW CODE *****
const HEADER_HEIGHT_PX = 30; // Define header height as a constant
// ***** END OF NEW CODE *****


/**
 * Helper function to convert seconds since midnight to a pixel offset from the top.
 * @param {number} seconds - Seconds since midnight.
 * @returns {number} Pixel offset from the top of the schedule grid body.
 */
const timeToYPosition = (seconds) => {
  if (typeof seconds !== 'number' || isNaN(seconds)) return 0;
  const hour = seconds / 3600; // e.g., 9.5 for 9:30
  const relativeHour = hour - START_HOUR; // e.g., 9.5 - 8 = 1.5
  // ***** START OF CHANGE *****
  // Ensure the calculation is correct and doesn't produce negative offsets for times >= START_HOUR
  const calculatedPosition = Math.max(0, relativeHour * HOUR_HEIGHT_PX);
  // console.log(`timeToYPosition: ${seconds}s -> ${hour}hr -> ${relativeHour}relHr -> ${calculatedPosition}px`); // Debug log
  return calculatedPosition;
  // ***** END OF CHANGE *****
};

/**
 * Helper function to calculate the height of an event based on its duration.
 * @param {number} startTimeSeconds - Start time in seconds since midnight.
 * @param {number} endTimeSeconds - End time in seconds since midnight.
 * @returns {number} Height in pixels.
 */
const durationToHeight = (startTimeSeconds, endTimeSeconds) => {
  if (typeof startTimeSeconds !== 'number' || isNaN(startTimeSeconds) ||
      typeof endTimeSeconds !== 'number' || isNaN(endTimeSeconds)) return 0;
  const durationSeconds = endTimeSeconds - startTimeSeconds;
  if (durationSeconds <= 0) return 0;
  const durationHours = durationSeconds / 3600;
  // Subtracting 1px to leave a small gap
  return Math.max(1, durationHours * HOUR_HEIGHT_PX - 1);
};

/**
 * Helper function to format seconds since midnight into HH:MM AM/PM format.
 * @param {number} seconds - Seconds since midnight.
 * @returns {string} Formatted time string.
 */
const formatTime = (seconds) => {
    if (typeof seconds !== 'number' || isNaN(seconds)) return 'N/A';
    const totalMinutes = Math.floor(seconds / 60);
    const hours24 = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
    const ampm = hours24 >= 12 ? 'PM' : 'AM';
    return `${hours12}:${minutes.toString().padStart(2, '0')} ${ampm}`;
};


/**
 * ScheduleView Component
 * Displays the current user's schedule in a weekly calendar grid format.
 */
const ScheduleView = () => {
  const { currentUser } = useAuth();
  const { scheduleData, isLoading, error, removeCourse } = useSchedule();

  const handleRemoveCourse = async (course) => {
    if (!window.confirm(`Are you sure you want to remove ${course.subject} ${course.courseCode}?`)) return;
    await removeCourse(course);
  };

  // --- Rendering Logic ---
  if (!currentUser) { return <Typography sx={{m: 2, p: 2, textAlign: 'center'}}>Please log in.</Typography>; }
  if (isLoading && !scheduleData) { return <CircularProgress sx={{ display: 'block', margin: 'auto', mt: 4 }} />; }
  if (error && (!scheduleData || scheduleData.name === 'No Schedule Loaded')) { return <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>; }

  if (!scheduleData || scheduleData.name === 'No Schedule Loaded') {
      return (
          <Box sx={{ width: '100%' }}>
              <Typography variant="h6" component="div" gutterBottom>
                  Current Schedule: {scheduleData?.name || 'No Schedule Active'}
              </Typography>
               {error && <Alert severity="warning" sx={{ mb: 1 }}>Error: {error}</Alert>}
              <Typography sx={{m: 2, p: 2, textAlign: 'center'}}>
                  {scheduleData?.name === 'No Schedule Loaded'
                    ? 'No schedule is currently loaded. Add courses or use the controls.'
                    : 'Schedule data is unavailable or empty.'}
              </Typography>
          </Box>
      );
  }

  // --- Render the Calendar Grid ---
  return (
    <Box sx={{ width: '100%' }}>
       <Typography variant="h6" component="div" gutterBottom>
         Current Schedule: {scheduleData?.name || 'Unnamed Schedule'}
       </Typography>
       {isLoading && <CircularProgress size={20} sx={{ position: 'absolute', top: 80, right: 20, zIndex: 10 }} />}
       {error && <Alert severity="warning" sx={{ mb: 1 }}>Error: {error}</Alert>}

      <Box sx={{ display: 'flex', border: '1px solid', borderColor: 'divider', position: 'relative', overflowX: 'auto' }}>

        {/* Time Column */}
        <Box sx={{ width: '80px', borderRight: '1px solid lightgrey', flexShrink: 0, pt: `${HEADER_HEIGHT_PX}px` }}> {/* Add padding top */}
          {/* Removed Header spacer Box */}
          {Array.from({ length: TOTAL_HOURS }).map((_, hourIndex) => (
            <Typography key={hourIndex} variant="caption" component="div"
              sx={{
                height: `${HOUR_HEIGHT_PX}px`, textAlign: 'center', borderBottom: '1px dashed lightgrey',
                pt: '2px', color: 'text.secondary', boxSizing: 'border-box',
                display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
                '&:last-child': { borderBottom: 'none' } // Remove border on last time slot
              }}
            >
              {formatTime((START_HOUR + hourIndex) * 3600)}
            </Typography>
          ))}
        </Box>

        {/* Day Columns Container */}
        <Box sx={{ display: 'flex', flexGrow: 1, position: 'relative' }}> {/* Add position relative here */}
            {/* Render Day Headers Separately */}
            <Box sx={{ display: 'flex', position: 'absolute', top: 0, left: 0, right: 0, height: `${HEADER_HEIGHT_PX}px`, borderBottom: '1px solid grey', zIndex: 2, backgroundColor: 'background.paper' }}>
                 {DAYS.map((day) => (
                    <Typography key={`${day}-header`} variant="subtitle2" align="center"
                        sx={{
                            minWidth: '100px', flexGrow: 1, lineHeight: `${HEADER_HEIGHT_PX}px`,
                            borderRight: '1px solid lightgrey', '&:last-child': { borderRight: 'none' }
                        }}
                    > {day} </Typography>
                 ))}
            </Box>

            {/* Render Day Content Columns */}
            <Box sx={{ display: 'flex', flexGrow: 1, mt: `${HEADER_HEIGHT_PX}px` }}> {/* Add margin top */}
                {DAYS.map((day) => (
                <Box key={day}
                    sx={{
                    minWidth: '100px', flexGrow: 1,
                    borderRight: '1px solid lightgrey', '&:last-child': { borderRight: 'none' },
                    position: 'relative', // Relative for positioning events and grid lines
                    height: `${TOTAL_HOURS * HOUR_HEIGHT_PX}px`,
                    }}
                >
                    {/* Render horizontal hour lines for visual reference WITHIN each day column */}
                    {Array.from({ length: TOTAL_HOURS }).map((_, hourIndex) => (
                        <Box key={`${day}-line-${hourIndex}`} sx={{
                            height: `${HOUR_HEIGHT_PX}px`,
                            borderBottom: hourIndex < TOTAL_HOURS - 1 ? '1px dashed lightgrey' : 'none',
                            boxSizing: 'border-box',
                        }}/>
                    ))}

                    {/* --- Render Events for this Day --- */}
                    {scheduleData?.events
                    ?.filter(event => event?.days?.includes(day) && event?.time && typeof event.time.startTime === 'number' && typeof event.time.endTime === 'number')
                    .map((event) => {
                        const top = timeToYPosition(event.time.startTime);
                        const height = durationToHeight(event.time.startTime, event.time.endTime);

                        if (height <= 0 || top < 0) { return null; } // Skip invalid events

                        const courseInfo = `${event.subject || ''} ${event.courseCode || ''}: ${event.name || 'Event'}`;
                        const timeInfo = `${formatTime(event.time.startTime)} - ${formatTime(event.time.endTime)}`;
                        const professorInfo = event.professor?.name || 'N/A';

                        return (
                        <Tooltip key={`${event.subject}-${event.courseCode}-${event.section}-${day}`} title={`${courseInfo} | ${timeInfo} | Prof: ${professorInfo}`}>
                            <Paper elevation={2}
                            sx={{
                                position: 'absolute',
                                // ***** START OF CHANGE *****
                                // Top position is correct relative to the start of the day column's content area
                                top: `${top}px`,
                                // ***** END OF CHANGE *****
                                left: '2px', right: '2px', height: `${height}px`,
                                backgroundColor: 'primary.light', color: 'primary.contrastText',
                                p: 0.5, fontSize: '0.7rem', overflow: 'hidden', zIndex: 1,
                                boxSizing: 'border-box', display: 'flex', flexDirection: 'column', cursor: 'default',
                            }}
                            >
                            <Typography variant="caption" component="div" sx={{ fontWeight: 'bold', lineHeight: 1.1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {event.subject || ''} {event.courseCode || ''}
                            </Typography>
                            <Typography variant="caption" component="div" sx={{ lineHeight: 1.1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {event.name || 'Event'}
                            </Typography>
                            <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleRemoveCourse(event); }}
                                sx={{
                                    position: 'absolute', bottom: 0, right: 0, color: 'primary.contrastText',
                                    opacity: 0.7, p: '2px', '&:hover': { opacity: 1, backgroundColor: 'rgba(0,0,0,0.1)'}
                                }}
                                title={`Remove ${event.subject} ${event.courseCode}`}
                            > <DeleteOutlineIcon sx={{ fontSize: '1rem' }} /> </IconButton>
                            </Paper>
                        </Tooltip>
                        );
                    })}
                </Box> // End Day Column Content
                ))}
            </Box> {/* End Day Content Columns Container */}
        </Box> {/* End Day Columns Outer Container */}
      </Box> {/* End Main Flex Container */}
    </Box> // End Root Box
  );
};

export default ScheduleView;
