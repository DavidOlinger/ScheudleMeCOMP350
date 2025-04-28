// src/components/AiChatInterface.js
import React, { useState, useRef, useEffect, useCallback } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import SendIcon from '@mui/icons-material/Send';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import { useTheme } from '@mui/material/styles'; // Import useTheme hook

/**
 * AiChatInterface Component (Styling Updated)
 * Provides a simple chat UI to interact with the AI backend.
 * Styling refined for a cleaner, minimalistic look.
 */
function AiChatInterface({ open, onClose }) {
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState([]); // { sender: 'user'/'ai', text: '...', sources?: [] }
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const messagesEndRef = useRef(null); // To auto-scroll
    const theme = useTheme(); // Access theme for consistent colors/spacing

    // Auto-scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Clear messages when component visibility changes (optional)
    useEffect(() => {
        if (!open) {
            // Clear state if needed when closed
        }
    }, [open]);

    const handleInputChange = (event) => {
        setInput(event.target.value);
    };

    const handleSend = useCallback(async () => {
        // ... (fetch logic remains the same) ...
         if (!input.trim() || isLoading) return;

        const userMessage = { sender: 'user', text: input.trim() };
        setMessages((prev) => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);
        setError(null);

        try {
          const response = await fetch('/api/ai/ask', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ question: userMessage.text }),
          });

          let responseData;
          let responseText = '';
          try {
              responseText = await response.text();
              responseData = JSON.parse(responseText);
          } catch (parseError) {
              console.error("Failed to parse AI response as JSON:", parseError);
              responseData = { error: "Invalid Response", message: `Received non-JSON response (status ${response.status}): ${responseText.substring(0, 100)}...` };
              if (!response.ok) {
                 const errorTitle = responseData.error || `HTTP Error ${response.status}`;
                 const errorMessage = responseData.message || responseText || "Could not retrieve AI response.";
                 throw new Error(`${errorTitle}: ${errorMessage}`);
              } else {
                 throw new Error(`Received unexpected response format from AI service (Status ${response.status}).`);
              }
          }

          if (!response.ok) {
            const errorTitle = responseData?.error || `HTTP Error ${response.status}`;
            const errorMessage = responseData?.message || "Could not retrieve AI response.";
            throw new Error(`${errorTitle}: ${errorMessage}`);
          }

          const aiMessage = {
            sender: 'ai',
            text: responseData.answer || "AI did not provide an answer.",
            sources: responseData.sources || [],
          };
          setMessages((prev) => [...prev, aiMessage]);

        } catch (err) {
          console.error("Error contacting AI service:", err);
          setError(err.message || "Failed to get response from AI service.");
          setMessages((prev) => [...prev, { sender: 'ai', text: `Error: ${err.message}`, isError: true }]);
        } finally {
          setIsLoading(false);
        }
    }, [input, isLoading]);

    const handleKeyPress = (event) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            handleSend();
        }
    };

    if (!open) return null;

    return (
        // Main container using Paper
        <Paper
            elevation={6} // Slightly more elevation
            sx={{
                position: 'fixed',
                bottom: 20,
                right: 20,
                width: 360, // Slightly wider
                height: 500, // Slightly taller
                zIndex: 1300,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                borderRadius: theme.shape.borderRadius * 2, // Softer corners for the container
                bgcolor: 'background.paper', // Use theme background
            }}
        >
            {/* Header */}
            <Box
                sx={{
                    p: 1.5, // Slightly more padding
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderBottom: 1,
                    borderColor: theme.palette.divider, // Use theme divider color
                    bgcolor: theme.palette.grey[100], // Subtle background for header
                    flexShrink: 0,
                }}
            >
                <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
                    AI Assistant
                </Typography>
                <IconButton size="small" onClick={onClose} title="Close Chat">
                    <CloseIcon />
                </IconButton>
            </Box>

            {/* Message List */}
            <List
                sx={{
                    flexGrow: 1,
                    overflowY: 'auto',
                    p: 2, // More padding around messages
                    bgcolor: theme.palette.grey[50], // Very light grey background for contrast
                    // Custom scrollbar styling (optional, can be browser-specific)
                    '&::-webkit-scrollbar': { width: '6px' },
                    '&::-webkit-scrollbar-track': { background: theme.palette.grey[200] },
                    '&::-webkit-scrollbar-thumb': { background: theme.palette.grey[400], borderRadius: '3px' },
                    '&::-webkit-scrollbar-thumb:hover': { background: theme.palette.grey[500] },
                }}
            >
                {messages.map((msg, index) => (
                    <ListItem
                        key={index}
                        sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                            mb: 1.5, // More space between messages
                            p: 0, // Remove default ListItem padding
                        }}
                    >
                        <Paper
                            elevation={1} // Keep elevation low for bubbles
                            sx={{
                                p: 1.5, // Slightly more padding inside bubbles
                                borderRadius: theme.shape.borderRadius * 1.5, // Slightly rounder bubbles
                                // Softer background colors using theme shades
                                bgcolor: msg.sender === 'user'
                                    ? theme.palette.primary.main // Darker user bubble for contrast
                                    : (msg.isError ? theme.palette.error.light : theme.palette.grey[200]), // Lighter grey for AI
                                color: msg.sender === 'user'
                                    ? theme.palette.primary.contrastText // White text on primary
                                    : (msg.isError ? theme.palette.error.contrastText : theme.palette.text.primary), // Default text color for AI
                                maxWidth: '85%',
                                wordWrap: 'break-word',
                                whiteSpace: 'pre-wrap',
                            }}
                        >
                            <Typography variant="body2">{msg.text}</Typography>
                            {/* Optional: Sources styling (keep minimal) */}
                             {/* {msg.sender === 'ai' && msg.sources && msg.sources.length > 0 && (
                                <Box sx={{ mt: 1, fontSize: '0.7rem', opacity: 0.7, color: theme.palette.text.secondary }}>
                                    Sources: {msg.sources.map(s => s.metadata?.source || 'Unknown').join(', ')}
                                </Box>
                            )} */}
                        </Paper>
                    </ListItem>
                ))}
                {/* Loading indicator */}
                 {isLoading && (
                    <ListItem sx={{ justifyContent: 'center', p: 1 }}>
                        <CircularProgress size={24} />
                    </ListItem>
                 )}
                 {/* Empty div to scroll to */}
                 <div ref={messagesEndRef} />
            </List>

            {/* Error Display */}
            {error && <Alert severity="error" sx={{ m: 1, flexShrink: 0 }} variant="outlined">{error}</Alert>}

            {/* Input Area */}
            <Box
                sx={{
                    display: 'flex',
                    p: 1.5, // Match header padding
                    borderTop: 1,
                    borderColor: theme.palette.divider, // Use theme divider
                    bgcolor: theme.palette.grey[100], // Match header background
                    flexShrink: 0,
                }}
            >
                <TextField
                    placeholder="Ask a question..." // Use placeholder
                    variant="outlined" // Standard outlined look
                    size="small"
                    fullWidth
                    multiline
                    maxRows={3}
                    value={input}
                    onChange={handleInputChange}
                    onKeyPress={handleKeyPress}
                    disabled={isLoading}
                    sx={{
                        mr: 1,
                        '& .MuiOutlinedInput-root': { // Style inner input area
                           borderRadius: theme.shape.borderRadius * 1.5,
                           bgcolor: theme.palette.background.paper, // White background for input
                           '& fieldset': { // Border styling
                               // borderColor: theme.palette.grey[300], // Lighter border
                           },
                           '&:hover fieldset': {
                               // borderColor: theme.palette.primary.main,
                           },
                           '&.Mui-focused fieldset': {
                               // borderColor: theme.palette.primary.main,
                           },
                         },
                    }}
                    InputLabelProps={{ shrink: false }} // Hide label visually if using placeholder
                />
                <Button
                    variant="contained"
                    onClick={handleSend}
                    disabled={isLoading || !input.trim()}
                    sx={{ borderRadius: theme.shape.borderRadius * 1.5, height: 'fit-content', alignSelf: 'center' }} // Match input border radius
                >
                    {isLoading ? <CircularProgress size={24} color="inherit" /> : <SendIcon />}
                </Button>
            </Box>
        </Paper>
    );
}

export default AiChatInterface;