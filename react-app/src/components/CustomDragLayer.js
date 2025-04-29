// src/components/CustomDragLayer.js
import React from 'react';
import { useDragLayer } from 'react-dnd';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import { ItemTypes } from '../dndConstants'; // Import from shared constants

// Helper function (same as in SearchBar/ScheduleView - ideally move to a shared utils file)
const formatTime = (seconds) => {
    if (typeof seconds !== 'number' || isNaN(seconds)) return 'N/A';
    const totalMinutes = Math.floor(seconds / 60);
    const hours24 = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
    const ampm = hours24 >= 12 ? 'PM' : 'AM';
    return `${hours12}:${minutes.toString().padStart(2, '0')} ${ampm}`;
};


// Styles for the layer itself
const layerStyles = {
  position: 'fixed',
  pointerEvents: 'none', // Let clicks pass through
  zIndex: 10000, // Ensure it's on top
  left: 0,
  top: 0,
  width: '100%',
  height: '100%',
};

// Styles for the preview item
const itemStyles = {
    // Match the appearance of your list item reasonably
    padding: '4px 8px',
    backgroundColor: 'rgba(230, 230, 230, 0.9)', // Semi-transparent background
    borderRadius: '4px',
    boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
    display: 'inline-block', // Fit content width
    maxWidth: '300px', // Prevent it becoming too wide
};

function getItemStyles(initialOffset, currentOffset) {
  if (!initialOffset || !currentOffset) {
    return { display: 'none' }; // Hide if no offset yet
  }
  let { x, y } = currentOffset;
  // Apply the transform to position the preview
  const transform = `translate(${x}px, ${y}px)`;
  return {
    transform,
    WebkitTransform: transform, // Browser prefixes
  };
}

const CustomDragLayer = () => {
  // useDragLayer hook monitors drag state
  const { itemType, isDragging, item, initialOffset, currentOffset } = useDragLayer(
    (monitor) => ({
      item: monitor.getItem(),
      itemType: monitor.getItemType(),
      initialOffset: monitor.getInitialSourceClientOffset(),
      currentOffset: monitor.getSourceClientOffset(),
      isDragging: monitor.isDragging(),
    }),
  );

  // Function to render the preview based on item type
  function renderItem() {
    switch (itemType) {
      case ItemTypes.COURSE:
        // Render a simplified preview for the course
        if (!item || !item.course) return null;
        const course = item.course;
        return (
          <Paper elevation={3} sx={itemStyles}>
             <Typography variant="body2" sx={{ fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {`${course.subject} ${course.courseCode} - ${course.name}`}
             </Typography>
             <Typography variant="caption" sx={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }}>
                 {`Sec: ${course.section || 'N/A'} | Days: ${course.days || 'N/A'} | ${course.time?.startTime ? `${formatTime(course.time.startTime)} - ${formatTime(course.time.endTime)}` : 'N/A'}`}
             </Typography>
          </Paper>
        );
      default:
        return null; // Don't render anything for other types
    }
  }

  // Don't render anything if not dragging
  if (!isDragging) {
    return null;
  }

  // Render the layer and the positioned item inside
  return (
    <Box sx={layerStyles}>
      <Box sx={getItemStyles(initialOffset, currentOffset)}>
        {renderItem()}
      </Box>
    </Box>
  );
};

export default CustomDragLayer;