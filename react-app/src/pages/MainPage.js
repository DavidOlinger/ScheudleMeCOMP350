// src/pages/MainPage.js
import React from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper'; // Used for visual separation of panes

// Import the overall layout component
import Layout from '../components/Layout';

// Import components for search, schedule view, and controls
import SearchBar from '../components/SearchBar';
import ScheduleView from '../components/ScheduleView';
import ScheduleControlPanel from '../components/ScheduleControlPanel';

// Define the width for the sidebar
const SIDEBAR_WIDTH = 600; // Adjust this value as needed (in pixels)

/**
 * MainPage Component (Updated)
 * Represents the main view using a fixed-width sidebar layout.
 * - Left Sidebar: Contains course search and schedule management controls.
 * - Main Content: Displays the weekly schedule view.
 */
function MainPage() {
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
               gap: 3, // Space between SearchBar and ControlPanel
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
    </Layout>
  );
}

export default MainPage;
