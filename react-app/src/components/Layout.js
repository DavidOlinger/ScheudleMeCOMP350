// src/components/Layout.js
import React from 'react';
import Box from '@mui/material/Box';
import TopBar from './TopBar'; // Assuming TopBar.js is in the same components directory

/**
 * Layout Component (Updated)
 * Provides a consistent structure including the TopBar.
 * Passes AI chat state/toggle function down to TopBar.
 *
 * @param {object} props - Component props.
 * @param {React.ReactNode} props.children - The page-specific content to be rendered within the layout.
 * @param {boolean} props.isAiChatOpen - State indicating if the AI chat is open.
 * @param {function} props.toggleAiChat - Function to toggle the AI chat visibility.
 */
const Layout = ({ children, isAiChatOpen, toggleAiChat }) => {
    return (
        // Main wrapper for the entire page layout.
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: 'grey.100' }}>
            {/* Render the TopBar component, passing AI chat props */}
            <TopBar isAiChatOpen={isAiChatOpen} toggleAiChat={toggleAiChat} />

            {/* Main content area */}
            <Box component="main" sx={{ flexGrow: 1, width: '100%', p: 3, overflow: 'hidden' }}>
                {children}
            </Box>

            {/* Optional Footer Area */}
            {/* <Box component="footer" sx={{ ... }}>...</Box> */}
        </Box>
    );
};

export default Layout;