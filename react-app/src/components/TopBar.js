// src/components/TopBar.js
import React from 'react';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import SmartToyOutlinedIcon from '@mui/icons-material/SmartToyOutlined';
import AccountCircleOutlinedIcon from '@mui/icons-material/AccountCircleOutlined';
import LogoutIcon from '@mui/icons-material/Logout';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined'; // Icon for title
import { Link as RouterLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '@mui/material/styles'; // Import useTheme

/**
 * TopBar Component (Visually Enhanced)
 * Renders the main application navigation bar with subtle gradient and icon.
 */
const TopBar = ({ toggleAiChat, isAiChatOpen }) => {
    const { currentUser, loading: authLoading, logout } = useAuth();
    const location = useLocation();
    const theme = useTheme(); // Access theme

    // Hide AI button on manage page
    const showAiButton = location.pathname !== '/manage-schedules';

    const handleLogout = () => {
        logout();
    };

    return (
        // Apply gradient background using sx prop
        <AppBar
            position="static"
            elevation={2} // Subtle shadow
            sx={{
                // Subtle gradient using theme colors
                background: `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.primary.dark} 90%)`,
                // Or a simpler approach if gradient is too much:
                // bgcolor: 'primary.main'
            }}
        >
            <Toolbar variant="dense">
                {/* Application Title - Link to the new schedule management page */}
                <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
                     <CalendarMonthOutlinedIcon sx={{ mr: 1.5, color: 'primary.contrastText' }} /> {/* Added Icon */}
                    <Typography
                        variant="h6"
                        component={RouterLink} // Make Typography itself a link
                        to="/manage-schedules"
                        sx={{
                            fontWeight: 600, // Refined font weight
                            color: 'inherit', // Inherit color from AppBar
                            textDecoration: 'none', // Remove underline
                            '&:hover': {
                                // Optional: subtle hover effect
                                // opacity: 0.9,
                            }
                        }}
                    >
                        ScheduleMe
                    </Typography>
                </Box>

                {/* User Info and Actions */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    {authLoading && <Typography variant="body2" color="inherit" sx={{ mr: 2 }}>Loading...</Typography>}

                    {currentUser ? (
                        <>
                            {/* Conditionally render AI Chat Button */}
                            {showAiButton && (
                                <Tooltip title="AI Assistant">
                                    <IconButton
                                        color="inherit"
                                        onClick={toggleAiChat}
                                        sx={{
                                            bgcolor: isAiChatOpen ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
                                            transition: 'background-color 0.2s ease', // Smooth transition
                                            '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.1)' }
                                        }}
                                    >
                                        <SmartToyOutlinedIcon />
                                    </IconButton>
                                </Tooltip>
                            )}

                            {/* Profile Button */}
                            <Tooltip title="View Profile">
                                <IconButton
                                    color="inherit"
                                    component={RouterLink}
                                    to="/profile"
                                    sx={{ '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.1)' }, transition: 'background-color 0.2s ease' }}
                                >
                                    <AccountCircleOutlinedIcon />
                                </IconButton>
                            </Tooltip>

                            {/* Logout Button */}
                            <Tooltip title="Logout">
                                 <IconButton
                                    color="inherit"
                                    onClick={handleLogout}
                                    sx={{ '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.1)' }, transition: 'background-color 0.2s ease' }}
                                >
                                    <LogoutIcon />
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