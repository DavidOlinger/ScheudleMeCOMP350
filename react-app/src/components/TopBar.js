// src/components/TopBar.js
import React from 'react';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
// Removed Button import as we only use IconButton now for user actions
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton'; // Keep IconButton
import Tooltip from '@mui/material/Tooltip';
import SmartToyOutlinedIcon from '@mui/icons-material/SmartToyOutlined';
import AccountCircleOutlinedIcon from '@mui/icons-material/AccountCircleOutlined';
import LogoutIcon from '@mui/icons-material/Logout';
import { Link as RouterLink } from 'react-router-dom'; // Keep RouterLink for title and profile

// Import the useAuth hook
import { useAuth } from '../context/AuthContext';

/**
 * TopBar Component (Revised Again)
 * Renders the main application navigation bar with a blue background.
 * - AI Chat, Profile, and Logout buttons are now IconButtons with Tooltips.
 * - Profile button uses the exact code snippet provided by the user, linking
 * internally to the React '/profile' route via RouterLink.
 */
const TopBar = ({ toggleAiChat, isAiChatOpen }) => {
    const { currentUser, loading: authLoading, logout } = useAuth();

    const handleLogout = () => {
        console.log("Logout button clicked");
        logout();
    };

    return (
        <AppBar position="static" color="primary">
            <Toolbar variant="dense">
                {/* Application Title - Link to internal editor page */}
                <Typography variant="h6" component="div" sx={{ fontWeight: 'medium' }}>
                    <RouterLink to="/editor" style={{ textDecoration: 'none', color: 'inherit' }}>
                        ScheduleMe
                    </RouterLink>
                </Typography>

                {/* Spacer */}
                <Box sx={{ flexGrow: 1 }} />

                {/* User Info and Actions */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    {authLoading && <Typography variant="body2" color="inherit" sx={{ mr: 2 }}>Loading...</Typography>}

                    {currentUser ? (
                        <>
                            {/* AI Chat Button - IconButton */}
                            <Tooltip title="AI Assistant">
                                <IconButton
                                    color="inherit"
                                    onClick={toggleAiChat}
                                    sx={{
                                        bgcolor: isAiChatOpen ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
                                        '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.1)' }
                                    }}
                                >
                                    <SmartToyOutlinedIcon />
                                </IconButton>
                            </Tooltip>

                            {/* Profile Button - Using user's exact snippet, adapted for IconButton */}
                            <Tooltip title="View Profile">
                                <IconButton
                                    color="inherit"
                                    component={RouterLink} // Use RouterLink for navigation
                                    to="/profile"         // Link to the internal profile route
                                    sx={{
                                        '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.1)' } // Hover effect
                                        // Removed mr: 1 from original snippet as gap is handled by parent Box
                                    }}
                                >
                                    <AccountCircleOutlinedIcon /> {/* Display only the icon */}
                                </IconButton>
                            </Tooltip>

                            {/* Logout Button - IconButton */}
                            <Tooltip title="Logout">
                                 <IconButton
                                    color="inherit"
                                    onClick={handleLogout}
                                    sx={{
                                        '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.1)' }
                                    }}
                                >
                                    <LogoutIcon /> {/* Display only the icon */}
                                </IconButton>
                            </Tooltip>
                        </>
                    ) : (
                        <>
                            {!authLoading && (
                                <Typography variant="body2" color="inherit" sx={{ mr: 1 }}>
                                    Guest
                                </Typography>
                            )}
                        </>
                    )}
                </Box>
            </Toolbar>
        </AppBar>
    );
};

export default TopBar;