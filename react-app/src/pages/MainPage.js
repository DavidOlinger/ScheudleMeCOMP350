// src/pages/MainPage.js
import React, { useState } from 'react';
import Button from '@mui/material/Button';
import AddIcon from '@mui/icons-material/Add';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';

// Import components
import Layout from '../components/Layout';
import SearchBar from '../components/SearchBar'; // Will include results area now
import ScheduleView from '../components/ScheduleView';
import CustomEventForm from '../components/CustomEventForm';
// ***** REMOVED IMPORT: ScheduleControlPanel *****
// import ScheduleControlPanel from '../components/ScheduleControlPanel';
import AiChatInterface from '../components/AiChatInterface'; // Keep AI Interface import

// Import hooks
import { useSchedule } from '../context/ScheduleContext';

// Define the width for the sidebar
const SIDEBAR_WIDTH = 600; // Adjust this value as needed (in pixels)

/**
 * MainPage Component (Updated for New Layout)
 * Represents the main schedule editing view.
 * - ScheduleControlPanel is removed from the sidebar.
 * - SearchBar component now handles displaying results within the sidebar.
 */
function MainPage() {
    // State for dialog/panel visibility
    const [isCustomEventFormOpen, setIsCustomEventFormOpen] = useState(false);
    const [isAiChatOpen, setIsAiChatOpen] = useState(false); // Keep state for AI Interface

    // Get necessary functions and state from the ScheduleContext
    const { addCustomEvent, isAddingCustom, customEventError } = useSchedule();

    // Handler to open the custom event form dialog
    const handleOpenCustomEventForm = () => setIsCustomEventFormOpen(true);
    // Handler to close the custom event form dialog
    const handleCloseCustomEventForm = () => setIsCustomEventFormOpen(false);
    // Handler to toggle AI Chat visibility
    const toggleAiChat = () => setIsAiChatOpen((prev) => !prev);

    // Handler to process the submission from the CustomEventForm
    const handleAddCustomEvent = async (eventData) => {
        console.log("Submitting custom event:", eventData);
        const success = await addCustomEvent(eventData);
        if (success) {
            handleCloseCustomEventForm();
        }
    };

    return (
        // Pass AI chat state and toggle function to Layout
        <Layout isAiChatOpen={isAiChatOpen} toggleAiChat={toggleAiChat}>
            {/* Main two-column layout using Flexbox */}
            <Box sx={{
                display: 'flex',
                gap: 3,
                // Adjust height based on TopBar height (assuming 64px) + main padding (24px*2=48px)
                // Make sure this calculation accurately reflects your Layout's padding and TopBar height
                height: 'calc(100vh - 64px - 48px)',
                overflow: 'hidden' // Prevent main Box from scrolling
            }}
            >
                {/* --- Left Sidebar --- */}
                <Box
                    sx={{
                        width: SIDEBAR_WIDTH,
                        flexShrink: 0, // Prevent sidebar from shrinking
                        display: 'flex',
                        flexDirection: 'column',
                        height: '100%', // Take full height of the parent Box
                    }}
                >
                    {/* Sidebar content wrapper with internal scroll */}
                    <Paper
                        elevation={2}
                        sx={{
                            p: 2, // Padding inside the sidebar paper
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 2, // Space between elements inside the sidebar
                            flexGrow: 1, // Allow paper to grow vertically
                            overflowY: 'auto', // Enable vertical scroll *within* the sidebar Paper
                            position: 'relative' // Needed for potential absolute positioning within
                        }}
                    >
                        {/* Search Bar & Results Area (SearchBar component now includes results) */}
                        <SearchBar />

                        {/* Custom Event Button Area */}
                        <Box>
                             {/* Moved Button below SearchBar */}
                            <Button
                                variant="outlined"
                                startIcon={<AddIcon />}
                                onClick={handleOpenCustomEventForm}
                                fullWidth
                                sx={{ mt: 1 }} // Margin top to space from search results
                                disabled={isAddingCustom}
                            >
                                Create Custom Event
                            </Button>
                        </Box>

                        {/* ***** REMOVED Schedule Load/Create Controls Area ***** */}
                        {/* <Box sx={{ flexGrow: 1 }}> */}
                        {/* <ScheduleControlPanel /> */}
                        {/* </Box> */}

                    </Paper>
                </Box>

                {/* --- Main Content Area (Schedule View) --- */}
                <Box
                    sx={{
                        flexGrow: 1, // Takes remaining width
                        height: '100%', // Takes full height of parent Box
                        overflow: 'hidden' // Prevent this Box from scrolling
                    }}
                >
                    {/* Schedule view wrapper Paper */}
                    {/* ScheduleView itself should handle internal scrolling if needed */}
                    <Paper elevation={2} sx={{ p: 2, height: '100%', overflow: 'auto' }}>
                        {/* ScheduleView now contains Undo/Redo/Save */}
                        <ScheduleView />
                    </Paper>
                </Box>

            </Box> {/* End Main Flex Container */}

            {/* Render the CustomEventForm Dialog */}
            <CustomEventForm
                open={isCustomEventFormOpen}
                onClose={handleCloseCustomEventForm}
                onSubmit={handleAddCustomEvent}
                isLoading={isAddingCustom}
                error={customEventError}
            />

            {/* Render the AI Chat Interface */}
            <AiChatInterface
                open={isAiChatOpen}
                onClose={() => setIsAiChatOpen(false)}
            />
        </Layout>
    );
}

export default MainPage;