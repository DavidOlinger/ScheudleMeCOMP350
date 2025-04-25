// src/pages/MainPage.js
import React from 'react';
// ***** START OF MODIFICATIONS *****
import { useState } from 'react'; // Import useState hook
import Button from '@mui/material/Button'; // Import Button component
import AddIcon from '@mui/icons-material/Add'; // Optional: Import Add icon
// ***** END OF MODIFICATIONS *****
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper'; // Used for visual separation of panes

// Import the overall layout component
import Layout from '../components/Layout';

// Import components for search, schedule view, and controls
import SearchBar from '../components/SearchBar';
import ScheduleView from '../components/ScheduleView';
// ***** START OF MODIFICATIONS *****
import CustomEventForm from '../components/CustomEventForm'; // Import the new form component
import { useSchedule } from '../context/ScheduleContext'; // Import the schedule context hook
// ***** END OF MODIFICATIONS *****
import ScheduleControlPanel from '../components/ScheduleControlPanel';

// Define the width for the sidebar
const SIDEBAR_WIDTH = 600; // Adjust this value as needed (in pixels)

/**
 * MainPage Component (Updated)
 * Represents the main view using a fixed-width sidebar layout.
 * - Left Sidebar: Contains course search, custom event creation, and schedule management controls.
 * - Main Content: Displays the weekly schedule view.
 */
function MainPage() {
  // ***** START OF NEW CODE *****
  // State to control the visibility of the custom event dialog
  const [isCustomEventFormOpen, setIsCustomEventFormOpen] = useState(false);
  // Get the necessary function and state from the ScheduleContext
  const { addCustomEvent, isAddingCustom, customEventError } = useSchedule();

  // Handler to open the custom event form dialog
  const handleOpenCustomEventForm = () => {
    setIsCustomEventFormOpen(true);
  };

  // Handler to close the custom event form dialog
  const handleCloseCustomEventForm = () => {
    setIsCustomEventFormOpen(false);
  };

  // Handler to process the submission from the CustomEventForm
  const handleAddCustomEvent = async (eventData) => {
    console.log("Submitting custom event:", eventData);
    // Call the addCustomEvent function from the context
    const success = await addCustomEvent(eventData);
    // If the event was added successfully (context function returns true), close the dialog
    if (success) {
        handleCloseCustomEventForm();
    }
    // If there was an error, the 'customEventError' state from context will be updated,
    // and the CustomEventForm component will display it.
  };
  // ***** END OF NEW CODE *****

  return (
    // Use the Layout component (which now provides padding)
    <Layout>
      {/* Use Flexbox for the main two-column layout */}
      {/* Attempt to make the main content area fill the viewport height below the TopBar */}
      <Box sx={{
          display: 'flex',
          gap: 3,
          // Calculate height: 100vh (viewport height) - TopBar height (approx 64px) - Layout padding (24px top + 24px bottom = 48px)
          // Adjust 64px if your TopBar height is different.
          height: 'calc(100vh - 64px - 48px)',
          overflow: 'hidden' // Prevent this container from scrolling
         }}
      >

        {/* --- Left Sidebar --- */}
        <Box
          sx={{
            width: SIDEBAR_WIDTH,
            flexShrink: 0, // Prevent sidebar from shrinking
            display: 'flex', // Use flexbox for children arrangement
            flexDirection: 'column', // Stack children vertically
            height: '100%', // Make sidebar take full height of the flex container
          }}
        >
           {/* Use Paper for background and elevation */}
           {/* Apply overflowY: 'auto' ONLY to the Paper to allow scrolling *within* the sidebar */}
           <Paper
             elevation={2}
             sx={{
               p: 2, // Padding inside the sidebar paper
               display: 'flex',
               flexDirection: 'column',
               gap: 3, // Space between SearchBar/Button and ControlPanel
               flexGrow: 1, // Allow paper to grow vertically
               overflowY: 'auto', // Allow scrolling *within* the sidebar if needed
               // Add position relative so Popper can calculate width correctly if needed
               position: 'relative'
             }}
           >
             {/* Search Bar Area - Stays at the top */}
             {/* SearchBar component itself will handle the results overlay */}
             <Box>
                <SearchBar />
                {/* ***** START OF NEW CODE ***** */}
                {/* Add Button below SearchBar to trigger the custom event dialog */}
                 <Button
                    variant="outlined" // Style as desired
                    startIcon={<AddIcon />} // Optional icon
                    onClick={handleOpenCustomEventForm} // Call handler to open dialog
                    fullWidth // Make button span the width
                    sx={{ mt: 1 }} // Add margin for spacing
                    // Optionally disable if another schedule operation is loading
                    disabled={isAddingCustom}
                 >
                    Create Custom Event
                 </Button>
                {/* ***** END OF NEW CODE ***** */}
             </Box>

             {/* Schedule Load/Create Controls Area */}
             {/* This will be potentially overlaid by search results */}
             {/* flexGrow allows this section to take remaining space if needed, pushing footer down */}
             <Box sx={{ flexGrow: 1 }}>
                <ScheduleControlPanel />
             </Box>
           </Paper>
        </Box>

        {/* --- Main Content Area (Schedule View) --- */}
        <Box
          sx={{
            flexGrow: 1, // Takes up remaining horizontal space
            height: '100%', // Take full height
            overflow: 'hidden' // Prevent this Box from scrolling
          }}
        >
           {/* Paper provides background. Allow scrolling *within* the schedule paper */}
           <Paper elevation={2} sx={{ p: 2, height: '100%', overflow: 'auto' }}>
             {/* Box inside Paper ensures content starts correctly */}
             <Box sx={{ minHeight: 500 }}> {/* Ensure schedule has min height */}
               <ScheduleView />
             </Box>
           </Paper>
        </Box>

      </Box>

      {/* ***** START OF NEW CODE ***** */}
      {/* Render the CustomEventForm Dialog */}
      {/* It's placed outside the main layout flexbox to overlay correctly */}
      <CustomEventForm
          open={isCustomEventFormOpen} // Control visibility with state
          onClose={handleCloseCustomEventForm} // Pass the close handler
          onSubmit={handleAddCustomEvent} // Pass the submit handler
          isLoading={isAddingCustom} // Pass the specific loading state from context
          error={customEventError} // Pass the specific error state from context
      />
      {/* ***** END OF NEW CODE ***** */}
    </Layout>
  );
}

export default MainPage;
