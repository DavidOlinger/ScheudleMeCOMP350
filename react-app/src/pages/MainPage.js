// src/pages/MainPage.js
import React from 'react';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper'; // Used for visual separation of panes

// Import the overall layout component
import Layout from '../components/Layout';

// Import placeholder components for search and schedule view
// Note: We assume these will be created later in the components directory
import SearchBar from '../components/SearchBar';
import ScheduleView from '../components/ScheduleView';

/**
 * MainPage Component
 * Represents the main view of the schedule builder application.
 * Uses a two-pane layout:
 * - Left pane (smaller): Contains the course search functionality.
 * - Right pane (larger): Displays the weekly schedule view.
 */
function MainPage() {
  return (
    // Wrap the entire page content within the Layout component
    // This ensures the TopBar and consistent padding/structure are applied.
    <Layout>
      {/*
       * Use MUI Grid component for layout.
       * 'container' defines this as the Grid container.
       * 'spacing={2}' adds space between grid items.
       */}
      <Grid container spacing={3}> {/* Increased spacing slightly */}

        {/* --- Left Pane (Search) --- */}
        {/*
         * 'item' defines this as a Grid item.
         * 'xs={12}' makes it full-width on extra-small screens (mobile).
         * 'md={3}' makes it take up 3 out of 12 columns on medium screens and up (approx 1/4).
         */}
        <Grid item xs={12} md={3}>
           {/* Use Paper for a visually distinct background/container for the search area */}
           <Paper elevation={2} sx={{ p: 2, height: '100%' }}> {/* Added padding and height */}
             <Box sx={{ minHeight: 400 }}> {/* Ensure minimum height */}
                {/* Placeholder for SearchBar component */}
                {/* <SearchBar /> */}
                <SearchBar />
                {/* Search results would likely appear below the search input */}
             </Box>
           </Paper>
        </Grid>

        {/* --- Right Pane (Schedule View) --- */}
        {/*
         * 'item' defines this as a Grid item.
         * 'xs={12}' makes it full-width on extra-small screens.
         * 'md={9}' makes it take up 9 out of 12 columns on medium screens and up (approx 3/4).
         */}
        <Grid item xs={12} md={9}>
           {/* Use Paper for a visually distinct background/container for the schedule */}
           <Paper elevation={2} sx={{ p: 2, height: '100%' }}> {/* Added padding and height */}
             <Box sx={{ minHeight: 400 }}> {/* Ensure minimum height */}
               {/* Placeholder for ScheduleView component */}
               {/* <ScheduleView /> */}
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
