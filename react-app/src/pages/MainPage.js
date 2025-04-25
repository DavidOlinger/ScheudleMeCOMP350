// src/pages/MainPage.js
import React from 'react';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper'; // Used for visual separation of panes

// Import the overall layout component
import Layout from '../components/Layout';

// Import components for search, schedule view, and controls
import SearchBar from '../components/SearchBar';
import ScheduleView from '../components/ScheduleView';
// ***** START OF NEW CODE *****
import ScheduleControlPanel from '../components/ScheduleControlPanel';
// ***** END OF NEW CODE *****

/**
 * MainPage Component
 * Represents the main view of the schedule builder application.
 * Uses a two-pane layout:
 * - Left pane (smaller): Contains course search and schedule management controls.
 * - Right pane (larger): Displays the weekly schedule view.
 */
function MainPage() {
  return (
    // Wrap the entire page content within the Layout component
    <Layout>
      <Grid container spacing={3}>

        {/* --- Left Pane (Search & Controls) --- */}
        <Grid item xs={12} md={4} lg={3}> {/* Adjusted grid size slightly */}
           <Paper elevation={2} sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 3, height: '100%' }}> {/* Use flex column and gap */}
             {/* Search Bar Area */}
             <Box>
                <SearchBar />
             </Box>

             {/* ***** START OF NEW CODE ***** */}
             {/* Schedule Load/Create Controls Area */}
             <Box>
                <ScheduleControlPanel />
             </Box>
             {/* ***** END OF NEW CODE ***** */}
           </Paper>
        </Grid>

        {/* --- Right Pane (Schedule View) --- */}
        <Grid item xs={12} md={8} lg={9}> {/* Adjusted grid size slightly */}
           <Paper elevation={2} sx={{ p: 2, height: '100%' }}>
             <Box sx={{ minHeight: 500 }}> {/* Increased min height */}
               {/* ScheduleView now reads directly from ScheduleContext */}
               <ScheduleView />
             </Box>
           </Paper>
        </Grid>

      </Grid>
    </Layout>
  );
}

// Export the component for use in App.js (or your routing setup)
export default MainPage;
