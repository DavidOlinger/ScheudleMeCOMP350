// src/pages/ScheduleManagementPage.js
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@mui/material/styles';
import { alpha } from '@mui/material/styles';

// MUI Components
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import TextField from '@mui/material/TextField';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Fade from '@mui/material/Fade';
import InputAdornment from '@mui/material/InputAdornment';

// Icons
import LaunchOutlinedIcon from '@mui/icons-material/LaunchOutlined';
import AddCircleOutlineOutlinedIcon from '@mui/icons-material/AddCircleOutlineOutlined';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';
import FolderOpenOutlined from '@mui/icons-material/FolderOpenOutlined';
import CreateNewFolderOutlined from '@mui/icons-material/CreateNewFolderOutlined';
import DriveFileRenameOutlineOutlinedIcon from '@mui/icons-material/DriveFileRenameOutlineOutlined';

// Context and Layout
import { useAuth } from '../context/AuthContext';
import { useSchedule } from '../context/ScheduleContext';
import Layout from '../components/Layout';

function ScheduleManagementPage() {
    const navigate = useNavigate();
    const theme = useTheme();
    const { currentUser } = useAuth();
    const {
        scheduleData,
        loadSchedule,
        createNewSchedule,
        deleteSchedule,
        isControlLoading,
        controlError,
    } = useSchedule();

    // State
    const [selectedSchedule, setSelectedSchedule] = useState('');
    const [newScheduleName, setNewScheduleName] = useState('');
    const [isConfirmDeleteDialogOpen, setIsConfirmDeleteDialogOpen] = useState(false);
    const [scheduleToDelete, setScheduleToDelete] = useState('');
    const [feedbackMessage, setFeedbackMessage] = useState({ type: '', text: '' });

    // --- Derived State & Memos ---
    const savedScheduleNames = React.useMemo(() => {
        if (!currentUser?.mySchedules) return [];
        return currentUser.mySchedules.map(filePath => {
            try { return filePath.substring(filePath.lastIndexOf('/') + 1, filePath.lastIndexOf('.')); }
            catch (e) { console.error("Error parsing schedule path:", filePath, e); return null; }
        }).filter(name => name).sort((a, b) => a.localeCompare(b));
    }, [currentUser?.mySchedules]);

    const isScheduleActive = scheduleData && scheduleData.name !== 'No Schedule Loaded';

    // --- Effects ---
    useEffect(() => {
        setSelectedSchedule('');
        setScheduleToDelete('');
    }, [savedScheduleNames]);

    useEffect(() => {
        if (feedbackMessage.text) {
            const timer = setTimeout(() => { setFeedbackMessage({ type: '', text: '' }); }, 4000);
            return () => clearTimeout(timer);
        }
    }, [feedbackMessage]);

    // --- Callbacks ---
    const handleNavigateToEditor = useCallback(() => { navigate('/editor'); }, [navigate]);

    // --- Action Handlers ---
    const handleLoadClick = async () => {
        if (selectedSchedule) {
            setFeedbackMessage({ type: '', text: '' });
            const success = await loadSchedule(selectedSchedule);
            if (success) handleNavigateToEditor();
        }
    };
    const handleCreateClick = async () => {
        if (newScheduleName.trim()) {
            setFeedbackMessage({ type: '', text: '' });
            const success = await createNewSchedule(newScheduleName.trim());
            if (success) { setNewScheduleName(''); handleNavigateToEditor(); }
        }
    };
    const handleCreateKeyPress = (event) => { if (event.key === 'Enter' && !isControlLoading && newScheduleName.trim()) handleCreateClick(); };
    const handleOpenConfirmDeleteDialog = () => { if (selectedSchedule) { setScheduleToDelete(selectedSchedule); setIsConfirmDeleteDialogOpen(true); } };
    const handleCloseConfirmDeleteDialog = () => { setIsConfirmDeleteDialogOpen(false); };
    const handleConfirmDelete = async () => {
        if (scheduleToDelete) {
            setFeedbackMessage({ type: '', text: '' });
            const success = await deleteSchedule(scheduleToDelete);
            if (success) { setFeedbackMessage({ type: 'success', text: `Schedule "${scheduleToDelete}" deleted.` }); }
        }
        handleCloseConfirmDeleteDialog();
    };

    // --- Reusable Style Definitions ---
    const commonBorderRadius = '12px';

    const buttonStyles = {
        height: 56,
        borderRadius: commonBorderRadius,
        textTransform: 'none',
        fontWeight: 600,
        fontSize: '1rem',
        transition: theme.transitions.create(['transform', 'box-shadow', 'background-color', 'opacity', 'background'], { // Added 'background' for gradient transitions
            duration: theme.transitions.duration.short,
        }),
        '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: theme.shadows[8],
        },
        '&:active': {
            transform: 'translateY(0px)',
        },
        '&.Mui-disabled': {
            // Lighter background for disabled state
            background: alpha(theme.palette.action.disabledBackground, 0.25), // Adjust alpha (e.g., 0.25) for lightness
            // Slightly lighter text color, but ensure contrast
            color: alpha(theme.palette.action.disabled, 0.6), // Adjust alpha for text lightness/contrast
            transform: 'none',
            boxShadow: 'none',
            cursor: 'not-allowed',
            backgroundImage: 'none', // Ensure no gradient when disabled
        }
    };

    const textFieldSelectStyles = {
        '& .MuiOutlinedInput-root': {
            borderRadius: commonBorderRadius,
            transition: theme.transitions.create(['box-shadow', 'border-color'], {
                duration: theme.transitions.duration.short,
            }),
             '& fieldset': {
                 borderColor: theme.palette.mode === 'dark' ? alpha(theme.palette.common.white, 0.23) : alpha(theme.palette.common.black, 0.23),
             },
             '&:hover fieldset': {
                 borderColor: theme.palette.text.primary,
             },
             '&.Mui-focused': {
                 boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.3)}`,
                 '& fieldset': {
                    borderWidth: '1px',
                    borderColor: theme.palette.primary.main,
                 }
             },
        },
        '& .MuiInputBase-input::placeholder': {
            color: theme.palette.text.secondary,
            opacity: 0.8,
        },
         '& .MuiSelect-select .MuiTypography-root': {
            color: theme.palette.text.secondary,
            opacity: 0.8,
        }
    };

    const iconColorPrimary = theme.palette.primary.main;
    const iconColorSecondary = theme.palette.secondary.main;
    const iconColorAction = alpha(theme.palette.action.active, 0.7);

    return (
        <Layout>
            <Container maxWidth="sm" sx={{ mt: { xs: 3, sm: 6 }, mb: { xs: 4, sm: 6 } }}>
                <Paper
                    elevation={0}
                    sx={{
                        p: { xs: 3, sm: 4 },
                        borderRadius: '20px',
                        transition: theme.transitions.create(['box-shadow', 'background-color'], {
                            duration: theme.transitions.duration.enteringScreen,
                        }),
                        overflow: 'hidden',
                        boxShadow: theme.shadows[8],
                        border: `1px solid ${theme.palette.divider}`,
                    }}
                >
                    {/* Title: Updated text, reduced spacing, added gradient effect */}
                    <Typography
                        variant="h4"
                        component="h1"
                        gutterBottom
                        sx={{
                            textAlign: 'center',
                            mb: 0.5, // Reduced margin bottom (was 4)
                            fontWeight: 700,
                            fontSize: { xs: '1.8rem', sm: '2.2rem' },
                            // Gradient Text Effect
                            color: theme.palette.primary.main, // Fallback color
                            background: `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.primary.dark} 90%)`,
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            // Optional: Subtle Text Shadow (Uncomment if desired)
                            // textShadow: `1px 1px 2px ${alpha(theme.palette.common.black, 0.1)}`,
                        }}
                    >
                        Manage Schedules {/* <-- Text Updated */}
                    </Typography>

                     {/* Loading Indicator */}
                    {isControlLoading && (
                         <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', my: 3, height: 56 }}>
                            <CircularProgress size={30} />
                        </Box>
                    )}

                    {/* Feedback Area */}
                    <Fade in={!!feedbackMessage.text || !!controlError} timeout={500}>
                        <Box sx={{ mb: 3, minHeight: '48px', display: 'flex', justifyContent: 'center' }}>
                            {controlError && !isControlLoading ? (
                                <Alert severity="error" variant="outlined" sx={{ width: '100%', justifyContent: 'center' }}>{controlError}</Alert>
                            ) : feedbackMessage.text && !isControlLoading ? (
                                <Alert severity={feedbackMessage.type || 'info'} variant="outlined" sx={{ width: '100%', justifyContent: 'center' }}>{feedbackMessage.text}</Alert>
                            ) : (
                                <Box />
                            )}
                        </Box>
                    </Fade>

                    {/* Main content stack */}
                    <Stack spacing={5}> {/* Keep spacing 5, title margin reduced */}

                        {/* --- Open Existing Section --- */}
                        <Box>
                             <Stack direction="row" alignItems="center" spacing={1.5} mb={2.5}>
                                <FolderOpenOutlined sx={{ color: iconColorPrimary, fontSize: '1.6rem' }} />
                                <Typography variant="h6" component="h2" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                                    Open Existing
                                </Typography>
                            </Stack>
                            {savedScheduleNames.length > 0 ? (
                                <Stack spacing={2}>
                                    <Stack direction="row" spacing={1.5} alignItems="center">
                                        <FormControl fullWidth size="medium" disabled={isControlLoading}>
                                            <Select
                                                displayEmpty
                                                id="schedule-select"
                                                value={selectedSchedule}
                                                onChange={(e) => setSelectedSchedule(e.target.value)}
                                                sx={{
                                                    ...textFieldSelectStyles,
                                                    '& .MuiSelect-select': { py: 1.8 },
                                                     '& .MuiMenuItem-root.Mui-disabled': {
                                                        opacity: 0.6,
                                                        fontStyle: 'italic',
                                                    }
                                                }}
                                                MenuProps={{
                                                    PaperProps: {
                                                        sx: {
                                                            borderRadius: '8px',
                                                            boxShadow: theme.shadows[6],
                                                            mt: 0.5,
                                                        },
                                                    },
                                                }}
                                            >
                                                <MenuItem value="" disabled>
                                                    <Typography variant="body1" component="em">Select a schedule...</Typography>
                                                </MenuItem>
                                                {savedScheduleNames.map(name => (
                                                    <MenuItem key={name} value={name} sx={{ '&:hover': { bgcolor: alpha(theme.palette.primary.light, 0.1) } }}>{name}</MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                        <Tooltip title="Delete Selected Schedule">
                                            <span>
                                                <IconButton
                                                    aria-label="Delete Selected Schedule"
                                                    color="error"
                                                    onClick={handleOpenConfirmDeleteDialog}
                                                    disabled={!selectedSchedule || isControlLoading}
                                                    size="large"
                                                    sx={{
                                                        borderRadius: commonBorderRadius,
                                                        border: `1px solid ${alpha(theme.palette.error.main, 0.3)}`,
                                                        transition: theme.transitions.create(['background-color', 'border-color'], {
                                                            duration: theme.transitions.duration.short,
                                                        }),
                                                        '&:hover': {
                                                            bgcolor: alpha(theme.palette.error.main, 0.1),
                                                            borderColor: theme.palette.error.light,
                                                        },
                                                        '&.Mui-disabled': {
                                                            borderColor: alpha(theme.palette.action.disabled, 0.2),
                                                            color: theme.palette.action.disabled,
                                                            bgcolor: 'transparent'
                                                        }
                                                    }}
                                                >
                                                    <DeleteOutlineOutlinedIcon />
                                                </IconButton>
                                            </span>
                                        </Tooltip>
                                    </Stack>
                                    <Button
                                        variant="contained"
                                        color="primary"
                                        onClick={handleLoadClick}
                                        disabled={!selectedSchedule || isControlLoading}
                                        startIcon={<LaunchOutlinedIcon />}
                                        fullWidth
                                        sx={{
                                            ...buttonStyles,
                                            background: `linear-gradient(45deg, ${theme.palette.primary.light} 30%, ${theme.palette.primary.main} 90%)`,
                                            '&:hover': {
                                                ...buttonStyles['&:hover'], // Inherit base hover transform/shadow
                                                background: `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.primary.dark} 90%)`, // Darken gradient on hover
                                                boxShadow: theme.shadows[10], // Keep or adjust hover shadow
                                            }
                                        }}
                                    >
                                        Load & Open
                                    </Button>
                                </Stack>
                            ) : (
                                <Typography variant="body1" color="text.secondary" sx={{ pl: 5.5 }}>
                                    No saved schedules found.
                                </Typography>
                            )}
                        </Box>

                        {/* Subtle Divider */}
                        <Divider sx={{ my: 1, borderStyle: 'dashed', borderColor: theme.palette.divider }} />

                        {/* --- Create New Section --- */}
                        <Box>
                             <Stack direction="row" alignItems="center" spacing={1.5} mb={2.5}>
                                <CreateNewFolderOutlined sx={{ color: iconColorSecondary, fontSize: '1.6rem' }} />
                                <Typography variant="h6" component="h2" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                                    Create New
                                </Typography>
                            </Stack>
                            <Stack spacing={2}>
                                <TextField
                                    placeholder="Enter New Schedule Name"
                                    variant="outlined"
                                    fullWidth
                                    size="medium"
                                    value={newScheduleName}
                                    onChange={(e) => setNewScheduleName(e.target.value)}
                                    onKeyPress={handleCreateKeyPress}
                                    disabled={isControlLoading}
                                    sx={textFieldSelectStyles}
                                    InputProps={{
                                        startAdornment: (
                                          <InputAdornment position="start" sx={{ mr: 0.5 }}>
                                            <DriveFileRenameOutlineOutlinedIcon sx={{ color: iconColorAction }} />
                                          </InputAdornment>
                                        ),
                                      }}
                                />
                                <Button
                                    variant="contained"
                                    color="secondary"
                                    onClick={handleCreateClick}
                                    disabled={!newScheduleName.trim() || isControlLoading}
                                    startIcon={<AddCircleOutlineOutlinedIcon />}
                                    fullWidth
                                    sx={{
                                        ...buttonStyles,
                                        background: `linear-gradient(45deg, ${theme.palette.secondary.light} 30%, ${theme.palette.secondary.main} 90%)`,
                                        '&:hover': {
                                            ...buttonStyles['&:hover'], // Inherit base hover transform/shadow
                                            background: `linear-gradient(45deg, ${theme.palette.secondary.main} 30%, ${theme.palette.secondary.dark} 90%)`, // Darken gradient
                                            boxShadow: theme.shadows[10], // Keep or adjust hover shadow
                                        },
                                    }}
                                >
                                    Create & Open
                                </Button>
                            </Stack>
                        </Box>

                         {/* Optional "Go to Current" Button */}
                        {isScheduleActive && (
                            <>
                                <Divider sx={{ pt: 1, borderStyle: 'dotted', borderColor: theme.palette.divider }} />
                                <Button
                                    variant="text"
                                    color="primary"
                                    onClick={handleNavigateToEditor}
                                    size="medium"
                                    fullWidth
                                    sx={{
                                        borderRadius: commonBorderRadius,
                                        textTransform: 'none',
                                        py: 1,
                                        fontWeight: 500,
                                         '&:hover': {
                                            bgcolor: alpha(theme.palette.primary.main, 0.08)
                                        }
                                    }}
                                >
                                    Go back to: {scheduleData?.name}
                                </Button>
                            </>
                        )}

                    </Stack>
                </Paper>
            </Container>

            {/* Confirmation Dialog */}
            <Dialog
                open={isConfirmDeleteDialogOpen}
                onClose={handleCloseConfirmDeleteDialog}
                PaperProps={{ sx: { borderRadius: '16px' } }}
            >
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', fontWeight: 600 }}>
                    <WarningAmberOutlinedIcon color="warning" sx={{ mr: 1.5 }} /> Confirm Deletion
                </DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Are you sure you want to delete the schedule{' '}
                        <strong>{`"${scheduleToDelete}"`}</strong>? This action cannot be undone.
                    </DialogContentText>
                </DialogContent>
                <DialogActions sx={{ p: 2, pb: 2.5, pt: 0 }}>
                    <Button onClick={handleCloseConfirmDeleteDialog} disabled={isControlLoading} sx={{ borderRadius: commonBorderRadius }}>Cancel</Button>
                    <Button
                        onClick={handleConfirmDelete}
                        color="error"
                        variant="contained"
                        autoFocus
                        disabled={isControlLoading}
                        startIcon={isControlLoading ? <CircularProgress size={20} color="inherit" /> : null}
                        sx={{ borderRadius: commonBorderRadius, minWidth: 100 }}
                    >
                        {isControlLoading ? 'Deleting...' : 'Delete'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Layout>
    );
}

export default ScheduleManagementPage;