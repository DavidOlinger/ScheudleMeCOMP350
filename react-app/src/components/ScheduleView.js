// src/components/ScheduleView.js
import React, { useCallback } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
// Imports for moved buttons
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import UndoIcon from '@mui/icons-material/Undo';
import RedoIcon from '@mui/icons-material/Redo';
import SaveIcon from '@mui/icons-material/Save';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';


// Import hooks
import { useAuth } from '../context/AuthContext';
import { useSchedule } from '../context/ScheduleContext';

// --- Constants for Calendar Layout ---
const DAYS = ['M', 'T', 'W', 'R', 'F'];
const START_HOUR = 8; // 8 AM
const END_HOUR = 22; // 10 PM (Display up to 9 PM slot)
const HOUR_HEIGHT_PX = 60; // Height of one hour slot in pixels
const TOTAL_HOURS = END_HOUR - START_HOUR;
const HEADER_HEIGHT_PX = 30; // Define header height as a constant

// --- Helper Functions --- (Defined once, before the component)
const timeToYPosition = (seconds) => {
  if (typeof seconds !== 'number' || isNaN(seconds)) return 0;
  const hour = seconds / 3600;
  const relativeHour = hour - START_HOUR;
  const calculatedPosition = Math.max(0, relativeHour * HOUR_HEIGHT_PX);
  return calculatedPosition;
};

const durationToHeight = (startTimeSeconds, endTimeSeconds) => {
  if (typeof startTimeSeconds !== 'number' || isNaN(startTimeSeconds) ||
      typeof endTimeSeconds !== 'number' || isNaN(endTimeSeconds)) return 0;
  const durationSeconds = endTimeSeconds - startTimeSeconds;
  if (durationSeconds <= 0) return 0;
  const durationHours = durationSeconds / 3600;
  return Math.max(1, durationHours * HOUR_HEIGHT_PX - 1); // Leave 1px gap
};

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
 * ScheduleView Component (Updated)
 * Displays the current user's schedule in a weekly calendar grid format.
 * Now includes Undo, Redo, and Save buttons above the schedule grid.
 */
const ScheduleView = () => {
    const { currentUser } = useAuth();
    // Get state/functions from context for schedule display AND moved buttons
    const {
        scheduleData,
        isLoading, // General loading (affects delete icon)
        error, // General schedule error
        removeCourse,
        removeEvent,
        // State/functions for moved buttons
        undoSchedule,
        redoSchedule,
        isUndoing,
        isRedoing,
        undoRedoError, // Specific error for undo/redo
        saveSchedule,
        saveStatus     // { saving: bool, error: string|null, success: bool }
    } = useSchedule();

    // Combined handler for removing any type of event - no changes needed
    const handleRemoveEvent = useCallback(async (eventToRemove) => {
        const eventIdentifier = eventToRemove.courseCode
            ? `${eventToRemove.subject || ''} ${eventToRemove.courseCode}`
            : eventToRemove.name;
        if (!window.confirm(`Are you sure you want to remove "${eventIdentifier}"?`)) return;
        if (eventToRemove.courseCode) {
            await removeCourse(eventToRemove);
        } else {
            await removeEvent(eventToRemove);
        }
     }, [removeCourse, removeEvent]);

    // Handler for Save button click
    const handleSave = () => {
        console.log("Save button clicked");
        saveSchedule();
    };

    // Handler for Undo button click
    const handleUndoClick = () => {
        console.log("Undo clicked - calling context function");
        undoSchedule();
    };

    // Handler for Redo button click
    const handleRedoClick = () => {
        console.log("Redo clicked - calling context function");
        redoSchedule();
    };


    // --- Rendering Logic ---
    if (!currentUser) { return <Typography sx={{ m: 2, p: 2, textAlign: 'center' }}>Please log in.</Typography>; }

    if (isLoading && !scheduleData && !isUndoing && !isRedoing && !saveStatus.saving) {
        return <CircularProgress sx={{ display: 'block', margin: 'auto', mt: 4 }} />;
    }

    if (error && (!scheduleData || scheduleData.name === 'No Schedule Loaded')) {
        return <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>;
    }

    if (!scheduleData || scheduleData.name === 'No Schedule Loaded') {
        return (
            <Box sx={{ width: '100%' }}>
                <Typography variant="h6" component="div" gutterBottom>
                    Current Schedule: {scheduleData?.name || 'No Schedule Active'}
                </Typography>
                {error && <Alert severity="warning" sx={{ mb: 1 }}>Error: {error}</Alert>}
                <Typography sx={{ m: 2, p: 2, textAlign: 'center' }}>
                    {scheduleData?.name === 'No Schedule Loaded'
                        ? 'No schedule is currently loaded. Add courses or use the controls.'
                        : 'Schedule data is unavailable or empty.'}
                </Typography>
            </Box>
        );
    }

    const isActionLoading = saveStatus.saving || isUndoing || isRedoing;

    // --- Render the Calendar Grid ---
    return (
        <Box sx={{ width: '100%' }}>

            {/* Display Undo/Redo specific errors */}
            {undoRedoError && (
                <Alert severity="warning" sx={{ mb: 1 }}>
                    {undoRedoError}
                </Alert>
            )}

            {/* Header Row: Schedule Title + Action Buttons */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="h6" component="div">
                    Current Schedule: {scheduleData?.name || 'Unnamed Schedule'}
                </Typography>

                {/* Action Buttons Stack (Undo, Redo, Save) */}
                <Stack direction="row" spacing={1}>
                    <Button
                        variant="outlined"
                        size="small"
                        startIcon={<UndoIcon />}
                        onClick={handleUndoClick}
                        disabled={isActionLoading}
                    >
                        {isUndoing ? 'Undoing...' : 'Undo'}
                    </Button>
                    <Button
                        variant="outlined"
                        size="small"
                        startIcon={<RedoIcon />}
                        onClick={handleRedoClick}
                        disabled={isActionLoading}
                    >
                        {isRedoing ? 'Redoing...' : 'Redo'}
                    </Button>
                    <Tooltip title={saveStatus.error ? `Save Error: ${saveStatus.error}` : (saveStatus.success ? "Schedule Saved!" : "Save Current Schedule")}>
                        <span>
                            <Button
                                variant="outlined"
                                size="small"
                                onClick={handleSave}
                                disabled={isActionLoading || !scheduleData || scheduleData.name === 'No Schedule Loaded'}
                                startIcon={
                                    saveStatus.saving ? <CircularProgress size={20} color="inherit" /> :
                                        saveStatus.success ? <CheckCircleOutlineIcon color="success" /> :
                                            saveStatus.error ? <ErrorOutlineIcon color="error" /> :
                                                <SaveIcon />
                                }
                                color={saveStatus.error ? "error" : (saveStatus.success ? "success" : "primary")}
                            >
                                {saveStatus.saving ? 'Saving...' : (saveStatus.success ? 'Saved' : (saveStatus.error ? 'Error' : 'Save'))}
                            </Button>
                        </span>
                    </Tooltip>
                </Stack>
            </Box>

            {/* Show general non-blocking error if applicable */}
            {error && !undoRedoError && <Alert severity="warning" sx={{ mb: 1 }}>Error: {error}</Alert>}

            {/* --- Schedule Grid --- */}
            <Box sx={{ display: 'flex', border: '1px solid', borderColor: 'divider', position: 'relative', overflowX: 'auto' }}>

                {/* Time Column */}
                <Box sx={{ width: '80px', borderRight: '1px solid lightgrey', flexShrink: 0, pt: `${HEADER_HEIGHT_PX}px` }}>
                    {Array.from({ length: TOTAL_HOURS }).map((_, hourIndex) => (
                         <Typography key={hourIndex} variant="caption" component="div"
                           sx={{
                             height: `${HOUR_HEIGHT_PX}px`, textAlign: 'center', borderBottom: '1px dashed lightgrey',
                             pt: '2px', color: 'text.secondary', boxSizing: 'border-box',
                             display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
                             '&:last-child': { borderBottom: 'none' }
                           }}
                         >
                           {formatTime((START_HOUR + hourIndex) * 3600)}
                         </Typography>
                    ))}
                </Box>

                {/* Day Columns Container */}
                <Box sx={{ display: 'flex', flexGrow: 1, position: 'relative' }}>
                    {/* Day Headers */}
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

                    {/* Day Content Columns */}
                    <Box sx={{ display: 'flex', flexGrow: 1, mt: `${HEADER_HEIGHT_PX}px` }}>
                        {DAYS.map((day) => (
                            <Box key={day}
                                sx={{
                                    minWidth: '100px', flexGrow: 1,
                                    borderRight: '1px solid lightgrey', '&:last-child': { borderRight: 'none' },
                                    position: 'relative',
                                    height: `${TOTAL_HOURS * HOUR_HEIGHT_PX}px`,
                                }}
                            >
                                {/* Horizontal hour lines */}
                                {Array.from({ length: TOTAL_HOURS }).map((_, hourIndex) => (
                                    <Box key={`${day}-line-${hourIndex}`} sx={{
                                        height: `${HOUR_HEIGHT_PX}px`,
                                        borderBottom: hourIndex < TOTAL_HOURS - 1 ? '1px dashed lightgrey' : 'none',
                                        boxSizing: 'border-box',
                                    }}/>
                                ))}

                                {/* Render Events for this Day */}
                                {scheduleData?.events
                                    ?.filter(event => event?.days?.includes(day) && event?.time && typeof event.time.startTime === 'number' && typeof event.time.endTime === 'number')
                                    .map((event) => {
                                        const top = timeToYPosition(event.time.startTime);
                                        const height = durationToHeight(event.time.startTime, event.time.endTime);
                                        if (height <= 0 || top < 0) { return null; }
                                        const courseInfo = event.courseCode ? `${event.subject || ''} ${event.courseCode || ''}: ${event.name || 'Event'}` : event.name;
                                        const timeInfo = `${formatTime(event.time.startTime)} - ${formatTime(event.time.endTime)}`;
                                        const professorInfo = event.professor?.name || 'N/A';
                                        const tooltipTitle = event.courseCode ? `${courseInfo} | ${timeInfo} | Prof: ${professorInfo}` : `${courseInfo} | ${timeInfo}`;

                                        return (
                                            <Tooltip key={`${event.subject || 'custom'}-${event.courseCode || event.name}-${event.section || day}-${event.time.startTime}`} title={tooltipTitle}>
                                                <Paper elevation={2}
                                                    sx={{
                                                        position: 'absolute', top: `${top}px`, left: '2px', right: '2px', height: `${height}px`,
                                                        backgroundColor: event.courseCode ? 'primary.light' : 'secondary.light',
                                                        color: event.courseCode ? 'primary.contrastText' : 'secondary.contrastText',
                                                        p: 0.5, fontSize: '0.7rem', overflow: 'hidden', zIndex: 1,
                                                        boxSizing: 'border-box', display: 'flex', flexDirection: 'column', cursor: 'default',
                                                    }}
                                                >
                                                    {/* Event Text */}
                                                    <Typography variant="caption" component="div" sx={{ fontWeight: 'bold', lineHeight: 1.1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                        {event.courseCode ? `${event.subject || ''} ${event.courseCode || ''}` : event.name}
                                                    </Typography>
                                                    <Typography variant="caption" component="div" sx={{ lineHeight: 1.1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                        {event.courseCode ? event.name : ''}
                                                    </Typography>
                                                    {/* Delete Button */}
                                                    <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleRemoveEvent(event); }}
                                                        disabled={isLoading || isActionLoading}
                                                        sx={{
                                                            position: 'absolute', bottom: 0, right: 0,
                                                            color: event.courseCode ? 'primary.contrastText' : 'secondary.contrastText',
                                                            opacity: 0.7, p: '2px', '&:hover': { opacity: 1, backgroundColor: 'rgba(0,0,0,0.1)'}
                                                        }}
                                                        title={`Remove ${event.courseCode ? `${event.subject} ${event.courseCode}` : event.name}`}
                                                    > <DeleteOutlineIcon sx={{ fontSize: '1rem' }} /> </IconButton>
                                                </Paper>
                                            </Tooltip>
                                        );
                                    })}
                            </Box> // End Day Column Content
                        ))}
                    </Box> {/* End Day Content Columns Container */}
                </Box> {/* End Day Columns Outer Container */}
            </Box> {/* End Main Flex Container (Schedule Grid) */}
        </Box> // End Root Box
    );
};

// Removed duplicate helper function declarations from here

export default ScheduleView;