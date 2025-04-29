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
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import UndoIcon from '@mui/icons-material/Undo';
import RedoIcon from '@mui/icons-material/Redo';
import SaveIcon from '@mui/icons-material/Save';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

// --- React DnD Imports ---
import { useDrop } from 'react-dnd';
// --- End React DnD Imports ---

// Import hooks
import { useAuth } from '../context/AuthContext';
import { useSchedule } from '../context/ScheduleContext';

// --- Define DnD Item Type ---
// IMPORTANT: Ideally, move this to a shared constants file (e.g., src/dndConstants.js)
// and import it in both SearchBar.js and ScheduleView.js
const ItemTypes = {
  COURSE: 'course',
};
// --- End DnD Item Type ---


// --- Constants for Calendar Layout ---
const DAYS = ['M', 'T', 'W', 'R', 'F'];
const START_HOUR = 8; // 8 AM
const END_HOUR = 22; // 10 PM (Display up to 9 PM slot)
const HOUR_HEIGHT_PX = 60; // Height of one hour slot in pixels
const TOTAL_HOURS = END_HOUR - START_HOUR;
const HEADER_HEIGHT_PX = 30;

// --- Helper Functions ---
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
  return Math.max(1, durationHours * HOUR_HEIGHT_PX - 1);
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
 * ScheduleView Component (Updated for Drag-and-Drop)
 * Displays the current user's schedule in a weekly calendar grid format.
 * Includes Undo, Redo, Save buttons.
 * Acts as a drop target for courses dragged from the search results.
 */
const ScheduleView = () => {
    const { currentUser } = useAuth();
    // Get ALL necessary functions from context
    const {
        scheduleData,
        isLoading,
        error,
        addCourse, // Need addCourse for the drop handler
        removeCourse,
        removeEvent,
        undoSchedule,
        redoSchedule,
        isUndoing,
        isRedoing,
        undoRedoError,
        saveSchedule,
        saveStatus
    } = useSchedule();

    // --- Drop Target Setup ---
    const [{ canDrop, isOver }, drop] = useDrop(() => ({
        // Specify which item types this drop target accepts
        accept: ItemTypes.COURSE,
        // Define what happens when an item is dropped
        drop: (item, monitor) => {
            // 'item' contains the data passed from useDrag (which we set as { course })
            if (item.course) {
                console.log(`Dropped course onto schedule: ${item.course.subject} ${item.course.courseCode}`);
                addCourse(item.course); // Call the context function to add the course
            } else {
                console.error("Dropped item did not contain course data:", item);
            }
            // Return value can be used by the drag source's end() handler if needed
            return { droppedOn: 'scheduleGrid' };
        },
        // Define props collected from the monitor (provides drag state info)
        collect: (monitor) => ({
            isOver: !!monitor.isOver(),      // Is an accepted item currently hovering over this target?
            canDrop: !!monitor.canDrop(),    // Can this target accept the currently dragged item?
        }),
    }), [addCourse]); // Include addCourse in dependencies
    // --- End Drop Target Setup ---


    // Callback for removing events remains the same
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

    // Handlers for Undo/Redo/Save remain the same
    const handleSave = () => { saveSchedule(); };
    const handleUndoClick = () => { undoSchedule(); };
    const handleRedoClick = () => { redoSchedule(); };

    // --- Determine Drop Target Background for Visual Feedback ---
    const getDropTargetBgColor = () => {
        if (isOver && canDrop) {
            return 'action.hover'; // Highlight when a valid item is hovering
        }
        return 'transparent'; // Default background
    };

    // --- Rendering Logic ---
    if (!currentUser) { return <Typography sx={{ m: 2, p: 2, textAlign: 'center' }}>Please log in.</Typography>; }

    // ... (Loading, error, no schedule states remain the same) ...
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
                 {/* Make this area droppable even when empty */}
                 <Paper ref={drop} sx={{ p: 2, textAlign: 'center', minHeight: 200, bgcolor: getDropTargetBgColor(), border: canDrop ? '2px dashed' : '1px solid', borderColor: isOver && canDrop ? 'primary.main' : 'divider', transition: 'background-color 0.2s ease-in-out, border-color 0.2s ease-in-out', }}>
                    <Typography sx={{ m: 2 }}>
                        No schedule is currently loaded. Add courses or use the controls.
                        <br/> (Drop courses here to start a schedule)
                    </Typography>
                </Paper>
             </Box>
         );
    }


    const isActionLoading = saveStatus.saving || isUndoing || isRedoing;

    // --- Render the Calendar Grid ---
    return (
        <Box sx={{ width: '100%' }}>

            {/* ... (Undo/Redo/Save button area remains the same) ... */}
             {undoRedoError && <Alert severity="warning" sx={{ mb: 1 }}>{undoRedoError}</Alert>}
             <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                 <Typography variant="h6" component="div">
                     Current Schedule: {scheduleData?.name || 'Unnamed Schedule'}
                 </Typography>
                 <Stack direction="row" spacing={1}>
                     {/* Undo/Redo/Save Buttons */}
                     <Button variant="outlined" size="small" startIcon={<UndoIcon />} onClick={handleUndoClick} disabled={isActionLoading} > {isUndoing ? 'Undoing...' : 'Undo'} </Button>
                     <Button variant="outlined" size="small" startIcon={<RedoIcon />} onClick={handleRedoClick} disabled={isActionLoading} > {isRedoing ? 'Redoing...' : 'Redo'} </Button>
                     <Tooltip title={saveStatus.error ? `Save Error: ${saveStatus.error}` : (saveStatus.success ? "Schedule Saved!" : "Save Current Schedule")}>
                         <span> <Button variant="outlined" size="small" onClick={handleSave} disabled={isActionLoading || !scheduleData || scheduleData.name === 'No Schedule Loaded'} startIcon={ saveStatus.saving ? <CircularProgress size={20} color="inherit" /> : saveStatus.success ? <CheckCircleOutlineIcon color="success" /> : saveStatus.error ? <ErrorOutlineIcon color="error" /> : <SaveIcon /> } color={saveStatus.error ? "error" : (saveStatus.success ? "success" : "primary")} > {saveStatus.saving ? 'Saving...' : (saveStatus.success ? 'Saved' : (saveStatus.error ? 'Error' : 'Save'))} </Button> </span>
                    </Tooltip>
                 </Stack>
             </Box>
             {error && !undoRedoError && <Alert severity="warning" sx={{ mb: 1 }}>Error: {error}</Alert>}


            {/* --- Schedule Grid - Apply drop ref to the main container --- */}
            {/* Added ref={drop} and styling based on isOver/canDrop */}
            <Paper
                ref={drop} // Attach the drop target ref here
                elevation={2}
                sx={{
                    p: 0, // Remove padding if grid goes edge-to-edge
                    height: '100%',
                    overflow: 'auto',
                    position: 'relative', // Needed for absolute positioning of events/headers
                    // Visual feedback for drop target:
                    border: canDrop ? '2px dashed' : '1px solid', // Dashed border when draggable is over
                    borderColor: isOver && canDrop ? 'primary.main' : 'divider', // Highlight border color
                    backgroundColor: getDropTargetBgColor(), // Use function for background
                    transition: 'background-color 0.2s ease-in-out, border-color 0.2s ease-in-out', // Smooth transition
                }}
            >
                <Box sx={{ display: 'flex', /* border: '1px solid', borderColor: 'divider', */ position: 'relative', overflowX: 'auto' }}>

                    {/* Time Column */}
                    <Box sx={{ width: '80px', borderRight: '1px solid lightgrey', flexShrink: 0, pt: `${HEADER_HEIGHT_PX}px` }}>
                         {Array.from({ length: TOTAL_HOURS }).map((_, hourIndex) => (
                             <Typography key={hourIndex} variant="caption" component="div" sx={{ height: `${HOUR_HEIGHT_PX}px`, textAlign: 'center', borderBottom: '1px dashed lightgrey', pt: '2px', color: 'text.secondary', boxSizing: 'border-box', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', '&:last-child': { borderBottom: 'none' } }} >
                               {formatTime((START_HOUR + hourIndex) * 3600)}
                             </Typography>
                        ))}
                    </Box>

                    {/* Day Columns Container */}
                    <Box sx={{ display: 'flex', flexGrow: 1, position: 'relative' }}>
                        {/* Day Headers */}
                        <Box sx={{ display: 'flex', position: 'absolute', top: 0, left: 0, right: 0, height: `${HEADER_HEIGHT_PX}px`, borderBottom: '1px solid grey', zIndex: 2, backgroundColor: 'inherit' /* Inherit paper bg */ }}>
                             {DAYS.map((day) => ( <Typography key={`${day}-header`} variant="subtitle2" align="center" sx={{ minWidth: '100px', flexGrow: 1, lineHeight: `${HEADER_HEIGHT_PX}px`, borderRight: '1px solid lightgrey', '&:last-child': { borderRight: 'none' } }} > {day} </Typography> ))}
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
                                     {Array.from({ length: TOTAL_HOURS }).map((_, hourIndex) => ( <Box key={`${day}-line-${hourIndex}`} sx={{ height: `${HOUR_HEIGHT_PX}px`, borderBottom: hourIndex < TOTAL_HOURS - 1 ? '1px dashed lightgrey' : 'none', boxSizing: 'border-box' }}/> ))}

                                    {/* Render Events for this Day */}
                                    {scheduleData?.events
                                        ?.filter(event => event?.days?.includes(day) && event?.time && typeof event.time.startTime === 'number' && typeof event.time.endTime === 'number')
                                        .map((event) => {
                                            // ... (Event rendering logic remains the same) ...
                                             const top = timeToYPosition(event.time.startTime);
                                             const height = durationToHeight(event.time.startTime, event.time.endTime);
                                             if (height <= 0 || top < 0) { return null; }
                                             const courseInfo = event.courseCode ? `${event.subject || ''} ${event.courseCode || ''}: ${event.name || 'Event'}` : event.name;
                                             const timeInfo = `${formatTime(event.time.startTime)} - ${formatTime(event.time.endTime)}`;
                                             const professorInfo = event.professor?.name || 'N/A';
                                             const tooltipTitle = event.courseCode ? `${courseInfo} | ${timeInfo} | Prof: ${professorInfo}` : `${courseInfo} | ${timeInfo}`;

                                             return (
                                                 <Tooltip key={`${event.subject || 'custom'}-${event.courseCode || event.name}-${event.section || day}-${event.time.startTime}`} title={tooltipTitle}>
                                                     <Paper elevation={2} sx={{ position: 'absolute', top: `${top}px`, left: '2px', right: '2px', height: `${height}px`, backgroundColor: event.courseCode ? 'primary.light' : 'secondary.light', color: event.courseCode ? 'primary.contrastText' : 'secondary.contrastText', p: 0.5, fontSize: '0.7rem', overflow: 'hidden', zIndex: 1, boxSizing: 'border-box', display: 'flex', flexDirection: 'column', cursor: 'default', }} >
                                                         <Typography variant="caption" component="div" sx={{ fontWeight: 'bold', lineHeight: 1.1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}> {event.courseCode ? `${event.subject || ''} ${event.courseCode || ''}` : event.name} </Typography>
                                                         <Typography variant="caption" component="div" sx={{ lineHeight: 1.1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}> {event.courseCode ? event.name : ''} </Typography>
                                                         <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleRemoveEvent(event); }} disabled={isLoading || isActionLoading} sx={{ position: 'absolute', bottom: 0, right: 0, color: event.courseCode ? 'primary.contrastText' : 'secondary.contrastText', opacity: 0.7, p: '2px', '&:hover': { opacity: 1, backgroundColor: 'rgba(0,0,0,0.1)'} }} title={`Remove ${event.courseCode ? `${event.subject} ${event.courseCode}` : event.name}`} > <DeleteOutlineIcon sx={{ fontSize: '1rem' }} /> </IconButton>
                                                     </Paper>
                                                 </Tooltip>
                                             );
                                        })}
                                </Box>
                            ))}
                        </Box>
                    </Box>
                </Box>
            </Paper> {/* End Main Drop Target Paper */}
        </Box>
    );
};

export default ScheduleView;