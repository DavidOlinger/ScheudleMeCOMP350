// src/pages/MainPage.js
import React, { useState } from 'react';
import Button from '@mui/material/Button';
import AddIcon from '@mui/icons-material/Add';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
// Removed unused imports for Stack, UndoIcon, RedoIcon, Alert if only used for moved buttons

// Import components
import Layout from '../components/Layout';
import SearchBar from '../components/SearchBar';
import ScheduleView from '../components/ScheduleView';
import CustomEventForm from '../components/CustomEventForm';
import ScheduleControlPanel from '../components/ScheduleControlPanel';
import AiChatInterface from '../components/AiChatInterface'; // Keep AI Interface import

// Import hooks
import { useSchedule } from '../context/ScheduleContext';

// Define the width for the sidebar
const SIDEBAR_WIDTH = 600; // Adjust this value as needed (in pixels)

/**
 * MainPage Component (Updated)
 * Represents the main view using a fixed-width sidebar layout.
 * - Undo/Redo/AI Chat buttons removed from sidebar.
 * - Passes AI Chat state/toggle up to Layout/TopBar.
 */
function MainPage() {
    // State for dialog/panel visibility
    const [isCustomEventFormOpen, setIsCustomEventFormOpen] = useState(false);
    const [isAiChatOpen, setIsAiChatOpen] = useState(false); // Keep state for AI Interface

    // Get necessary functions and state from the ScheduleContext
    // Removed undo/redo related state/functions if they are now fully managed in ScheduleView
    const { addCustomEvent, isAddingCustom, customEventError } = useSchedule();
    // Note: If ScheduleView needs undo/redo state passed down, keep them here.
    // Assuming ScheduleView will get them directly from context for now.


    // Handler to open the custom event form dialog
    const handleOpenCustomEventForm = () => setIsCustomEventFormOpen(true);
    // Handler to close the custom event form dialog
    const handleCloseCustomEventForm = () => setIsCustomEventFormOpen(false);
    // Handler to toggle AI Chat visibility (needed for interface)
    const toggleAiChat = () => setIsAiChatOpen((prev) => !prev);

    // Handler to process the submission from the CustomEventForm
    const handleAddCustomEvent = async (eventData) => {
        console.log("Submitting custom event:", eventData);
        const success = await addCustomEvent(eventData);
        if (success) {
            handleCloseCustomEventForm();
        }
    };

    // Removed handleUndoClick, handleRedoClick as buttons moved


    return (
        // Pass AI chat state and toggle function to Layout
        <Layout isAiChatOpen={isAiChatOpen} toggleAiChat={toggleAiChat}>
            {/* Main two-column layout using Flexbox */}
            <Box sx={{
                display: 'flex',
                gap: 3,
                height: 'calc(100vh - 64px - 48px)', // Adjust 64px if TopBar height differs
                overflow: 'hidden'
            }}
            >
                {/* --- Left Sidebar --- */}
                <Box
                    sx={{
                        width: SIDEBAR_WIDTH,
                        flexShrink: 0,
                        display: 'flex',
                        flexDirection: 'column',
                        height: '100%',
                    }}
                >
                    {/* Sidebar content wrapper with scroll */}
                    <Paper
                        elevation={2}
                        sx={{
                            p: 2,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 3,
                            flexGrow: 1,
                            overflowY: 'auto',
                            position: 'relative'
                        }}
                    >
                        {/* Undo/Redo/AI Button Area Removed */}

                        {/* Search Bar & Custom Event Button Area */}
                        <Box>
                            <SearchBar />
                            <Button
                                variant="outlined"
                                startIcon={<AddIcon />}
                                onClick={handleOpenCustomEventForm}
                                fullWidth
                                sx={{ mt: 1 }}
                                // Keep disabled logic if needed, ensure state is available
                                disabled={isAddingCustom /* || isUndoing || isRedoing */}
                            >
                                Create Custom Event
                            </Button>
                        </Box>

                        {/* Schedule Load/Create Controls Area */}
                        <Box sx={{ flexGrow: 1 }}>
                            <ScheduleControlPanel />
                        </Box>
                    </Paper>
                </Box>

                {/* --- Main Content Area (Schedule View) --- */}
                <Box
                    sx={{
                        flexGrow: 1,
                        height: '100%',
                        overflow: 'hidden'
                    }}
                >
                    {/* Schedule view wrapper with scroll */}
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