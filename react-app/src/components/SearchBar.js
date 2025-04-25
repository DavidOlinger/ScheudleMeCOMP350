// src/components/SearchBar.js
import React, { useState, useRef, useCallback, useEffect } from 'react'; // Added useEffect
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import SearchIcon from '@mui/icons-material/Search';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import Paper from '@mui/material/Paper'; // For Popper content background
import Popper from '@mui/material/Popper'; // The overlay component
import ClickAwayListener from '@mui/material/ClickAwayListener'; // To close Popper on outside click
import Fade from '@mui/material/Fade'; // Optional: Add transition

// Import the useSchedule hook
// Assuming you have a ScheduleContext set up like in previous examples
// If not, you might need to pass addCourse down as a prop or adjust this.
import { useSchedule } from '../context/ScheduleContext';

/**
 * SearchBar Component (Updated)
 * Provides course search input and displays results in an overlay Popper.
 */
const SearchBar = () => {
  // Assuming useSchedule hook provides these values
  // Provide default fallback functions/values if context might not be ready
  const scheduleContext = useSchedule();
  const addCourse = scheduleContext?.addCourse || (() => console.error("addCourse function not available from context."));
  const isScheduleLoading = scheduleContext?.isLoading || false;
  const scheduleError = scheduleContext?.error || null;


  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);

  // --- Popper State ---
  const [openResults, setOpenResults] = useState(false); // Controls Popper visibility
  const anchorElRef = useRef(null); // Ref to anchor the Popper to (the TextField)
  const [popperWidth, setPopperWidth] = useState(0); // State to store anchor width

  // --- Update Popper Width ---
  useEffect(() => {
    // Function to update popper width based on anchor element
    const updateWidth = () => {
      if (anchorElRef.current) {
        setPopperWidth(anchorElRef.current.clientWidth);
      }
    };
    // Update width initially and on resize when popper is open
    if (openResults) {
        updateWidth();
        window.addEventListener('resize', updateWidth);
    } else {
         window.removeEventListener('resize', updateWidth);
    }
    // Cleanup listener
    return () => window.removeEventListener('resize', updateWidth);
  }, [openResults]); // Re-calculate width when Popper opens/closes

  // --- Event Handlers ---

  const handleInputChange = (event) => {
    setQuery(event.target.value);
    // Close results if input is cleared manually
    if (event.target.value === '') {
       setOpenResults(false);
       setResults([]);
       setHasSearched(false);
       setSearchError(null);
    }
  };

  const handleSearch = useCallback(async () => {
    if (!query.trim()) {
      setResults([]);
      setSearchError(null);
      setHasSearched(true);
      setOpenResults(false);
      return;
    }

    setIsSearchLoading(true);
    setSearchError(null);
    setResults([]);
    setHasSearched(true);
    setOpenResults(true); // Open Popper when search starts

    try {
      // Ensure your backend URL is correct
      const apiUrl = `http://localhost:7070/api/courses/search?query=${encodeURIComponent(query.trim())}`;
      const response = await fetch(apiUrl);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `HTTP error! Status: ${response.status}` }));
        throw new Error(errorData.message || `HTTP error! Status: ${response.status}`);
      }
      const data = await response.json();
      const resultsArray = Array.isArray(data) ? data : [];
      setResults(resultsArray);
      // Keep popper open even if no results, to show the message
    } catch (err) {
      console.error("Search API call failed:", err);
      setSearchError(err.message || "Failed to fetch search results.");
      setResults([]);
      setOpenResults(true); // Keep popper open to show error
    } finally {
      setIsSearchLoading(false);
    }
  }, [query]);

  const handleKeyPress = useCallback((event) => {
    if (event.key === 'Enter') {
      handleSearch();
    }
  }, [handleSearch]);

  const handleAddCourseClick = (course) => {
    console.log("SearchBar: Add course clicked:", course.courseCode);
    addCourse(course); // Call function from context (or props)
    setOpenResults(false); // Close results after adding a course
  };

  // --- Popper Control ---
  const handleFocus = () => {
    // Optionally open if there are previous results or errors?
    // For now, only open on explicit search.
  };

  const handleClickAway = (event) => {
      // Close if the click is outside the anchor element AND the popper itself
      // The check for anchorElRef.current.contains is important
      if (anchorElRef.current && !anchorElRef.current.contains(event.target)) {
         setOpenResults(false);
      }
  };

  // Determine overall loading state
  const overallLoading = isSearchLoading || isScheduleLoading;

  return (
    // ClickAwayListener wraps the input and the Popper logic
    <ClickAwayListener onClickAway={handleClickAway}>
      {/* Container Box needs position relative for Popper positioning context */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, position: 'relative' }}>
        <Typography variant="h6" component="div">
          Course Search
        </Typography>

        {/* Search Input Field - This is the anchor for the Popper */}
        <TextField
          label="Search Courses (e.g., COMP 101)"
          variant="outlined"
          fullWidth
          value={query}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          onFocus={handleFocus} // Handle focus if needed
          disabled={overallLoading}
          inputRef={anchorElRef} // Assign the ref here
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  aria-label="search courses"
                  onClick={handleSearch}
                  edge="end"
                  disabled={overallLoading || !query.trim()} // Also disable if query is empty
                >
                  {isSearchLoading ? <CircularProgress size={24} /> : <SearchIcon />}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />

        {/* Popper for displaying results overlay */}
        <Popper
          open={openResults}
          anchorEl={anchorElRef.current} // Anchor to the TextField
          placement="bottom-start" // Position below the TextField
          transition // Enable transition
          modifiers={[ // Prevent Popper from overflowing viewport
            { name: 'offset', options: { offset: [0, 4] } }, // Add small vertical offset
            { name: 'preventOverflow', options: { boundary: 'clippingParents' } },
          ]}
          style={{ zIndex: 1200 }} // Ensure Popper is above other elements
          // Set width dynamically based on the anchor element's width
          sx={{ width: popperWidth > 0 ? `${popperWidth}px` : 'auto' }}
        >
          {/* Optional Fade transition */}
          {({ TransitionProps }) => (
            <Fade {...TransitionProps} timeout={350}>
                {/* Paper provides background and elevation for the Popper content */}
                <Paper elevation={4} sx={{ mt: 0.5 }}>
                    {/* Loading Indicator inside Popper */}
                    {isSearchLoading && <CircularProgress sx={{ display: 'block', margin: '20px auto' }} />}

                    {/* Error Display inside Popper */}
                    {searchError && !isSearchLoading && (
                    <Alert severity="error" sx={{ m: 1, borderRadius: 0 }}> {/* Remove border radius for cleaner look */}
                        Search Error: {searchError}
                    </Alert>
                    )}

                    {/* Schedule Action Error Display inside Popper */}
                    {scheduleError && !isSearchLoading && (
                    <Alert severity="warning" sx={{ m: 1, borderRadius: 0 }}>
                        Schedule Error: {scheduleError}
                    </Alert>
                    )}

                    {/* Display message if no results found after searching */}
                    {hasSearched && !isSearchLoading && !searchError && results.length === 0 && (
                    <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
                        No courses found matching your query.
                    </Typography>
                    )}

                    {/* Render the list if there are results */}
                    {results.length > 0 && !isSearchLoading && (
                    <List dense sx={{ maxHeight: 300, overflow: 'auto', p: 0 }}> {/* Limit height, make scrollable, remove padding */}
                        {results.map((course) => (
                        <ListItem
                            key={`${course.subject}-${course.courseCode}-${course.section}`}
                            disablePadding
                            divider // Add divider between items
                            secondaryAction={
                            <IconButton
                                edge="end"
                                aria-label={`add ${course.name}`}
                                onClick={() => handleAddCourseClick(course)}
                                title={`Add ${course.subject} ${course.courseCode} to schedule`}
                                disabled={isScheduleLoading}
                                sx={{ mr: 1 }} // Add margin to icon button
                            >
                                <AddCircleOutlineIcon />
                            </IconButton>
                            }
                        >
                            <ListItemButton dense sx={{ pl: 2, pr: 1 }}> {/* Adjust padding */}
                            <ListItemText
                                primary={`${course.subject} ${course.courseCode} - ${course.name}`}
                                secondary={`Sec: ${course.section || 'N/A'} | Prof: ${course.professor?.name || 'N/A'} | Days: ${course.days || 'N/A'} | Loc: ${course.location || 'N/A'} | Time: ${course.time?.startTime ? `${formatTime(course.time.startTime)} - ${formatTime(course.time.endTime)}` : 'N/A'}`}
                                secondaryTypographyProps={{ sx: { fontSize: '0.75rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' } }} // Prevent wrapping
                                primaryTypographyProps={{ sx: { whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' } }} // Prevent wrapping
                            />
                            </ListItemButton>
                        </ListItem>
                        ))}
                    </List>
                    )}
                </Paper>
            </Fade>
           )}
        </Popper>
      </Box>
    </ClickAwayListener>
  );
};

// Helper to format time (ensure this is consistent)
const formatTime = (seconds) => {
    if (typeof seconds !== 'number' || isNaN(seconds)) return 'N/A';
    const totalMinutes = Math.floor(seconds / 60);
    const hours24 = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
    const ampm = hours24 >= 12 ? 'PM' : 'AM';
    return `${hours12}:${minutes.toString().padStart(2, '0')} ${ampm}`;
};


export default SearchBar;
