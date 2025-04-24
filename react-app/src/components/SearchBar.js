// src/components/SearchBar.js
import React, { useState } from 'react';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton'; // Makes list items clickable
import ListItemText from '@mui/material/ListItemText';
import CircularProgress from '@mui/material/CircularProgress'; // Loading indicator
import Alert from '@mui/material/Alert'; // Error display
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import SearchIcon from '@mui/icons-material/Search';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline'; // Icon for adding
// ***** START OF NEW CODE *****
// Import the useSchedule hook
import { useSchedule } from '../context/ScheduleContext';
// ***** END OF NEW CODE *****


/**
 * SearchBar Component
 * Provides an input field to search for courses via the backend API
 * and displays the results in a list. Allows adding courses via ScheduleContext.
 */
const SearchBar = () => {
  // ***** START OF NEW CODE *****
  // Get addCourse function and schedule context error/loading state
  const { addCourse, isLoading: isScheduleLoading, error: scheduleError } = useSchedule();
  // ***** END OF NEW CODE *****

  // State for the search input value
  const [query, setQuery] = useState('');
  // State to store the list of course results from the API
  const [results, setResults] = useState([]);
  // State to indicate if the *search* API call is in progress
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  // State to store any error messages during the *search* API call
  const [searchError, setSearchError] = useState(null);
  // State to track if a search has been performed at least once
  const [hasSearched, setHasSearched] = useState(false);

  // --- Event Handlers ---

  /**
   * Updates the query state as the user types in the TextField.
   * @param {React.ChangeEvent<HTMLInputElement>} event - The input change event.
   */
  const handleInputChange = (event) => {
    setQuery(event.target.value);
  };

  /**
   * Handles triggering the search when the search icon is clicked
   * or the Enter key is pressed.
   */
  const handleSearch = async () => {
    if (!query.trim()) {
        // Don't search if the query is empty or just whitespace
        setResults([]);
        setSearchError(null);
        setHasSearched(true); // Mark as searched even if empty
        return;
    }

    setIsSearchLoading(true); // Use dedicated loading state for search
    setSearchError(null);
    setResults([]); // Clear previous results
    setHasSearched(true); // Mark that a search attempt has been made

    try {
      // Construct the URL for the backend API endpoint
      const apiUrl = `http://localhost:7070/api/courses/search?query=${encodeURIComponent(query.trim())}`;

      const response = await fetch(apiUrl);

      if (!response.ok) {
        // Handle HTTP errors (e.g., 404, 500)
        const errorData = await response.json().catch(() => ({ // Try to parse error response
             message: `HTTP error! Status: ${response.status}`
        }));
        throw new Error(errorData.message || `HTTP error! Status: ${response.status}`);
      }

      const data = await response.json(); // Parse the JSON response body
      setResults(Array.isArray(data) ? data : []); // Ensure results is always an array

    } catch (err) {
      console.error("Search API call failed:", err);
      setSearchError(err.message || "Failed to fetch search results. Please try again.");
      setResults([]); // Clear results on error
    } finally {
      // Ensure loading indicator is turned off regardless of success or failure
      setIsSearchLoading(false);
    }
  };

  /**
   * Handles the Enter key press in the TextField to trigger a search.
   * @param {React.KeyboardEvent} event - The keyboard event.
   */
  const handleKeyPress = (event) => {
    if (event.key === 'Enter') {
      handleSearch();
    }
  };

  /**
   * Handles adding a course using the ScheduleContext function.
   * @param {object} course - The course object selected from the results.
   */
  const handleAddCourseClick = (course) => {
    console.log("SearchBar: Add course clicked:", course.courseCode);
    // ***** START OF NEW CODE *****
    // Call the addCourse function from the context
    addCourse(course);
    // Context handles API call, state update, loading, and errors
    // The ScheduleView will automatically update if the context state changes.
    // ***** END OF NEW CODE *****
    // alert(`Placeholder: Add ${course.subject} ${course.courseCode} to schedule.`); // Removed placeholder
  };


  // --- JSX Rendering ---
  // Determine overall loading state (either searching or schedule updating)
  const overallLoading = isSearchLoading || isScheduleLoading;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}> {/* Use Box for layout and spacing */}
      <Typography variant="h6" component="div">
        Course Search
      </Typography>

      {/* Search Input Field */}
      <TextField
        label="Search Courses (e.g., COMP 101, Intro Bio)"
        variant="outlined"
        fullWidth // Take up full width of its container
        value={query}
        onChange={handleInputChange}
        onKeyPress={handleKeyPress} // Trigger search on Enter key
        disabled={overallLoading} // Disable input if anything is loading
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                aria-label="search courses"
                onClick={handleSearch}
                edge="end"
                disabled={overallLoading} // Disable button if anything is loading
              >
                {/* Show spinner only for search loading */}
                {isSearchLoading ? <CircularProgress size={24} /> : <SearchIcon />}
              </IconButton>
            </InputAdornment>
          ),
        }}
      />

      {/* Loading Indicator for Schedule Actions (Add/Remove/Save) */}
      {/* This is separate from the search spinner */}
      {isScheduleLoading && <CircularProgress size={20} sx={{ alignSelf: 'center', my: 1 }} />}

      {/* Error Display for Search */}
      {searchError && (
        <Alert severity="error" sx={{ mt: 1 }}>
          Search Error: {searchError}
        </Alert>
      )}
       {/* Error Display for Schedule Actions (Add/Remove/Save) */}
       {/* Display schedule context errors here as well, as they might relate to add attempts */}
      {scheduleError && (
        <Alert severity="warning" sx={{ mt: 1 }}>
          Schedule Error: {scheduleError}
        </Alert>
      )}


      {/* Search Results List */}
      <Box sx={{ mt: 1 }}> {/* Add some margin top before results */}
        {/* Only show results list area if a search has been attempted */}
        {hasSearched && !isSearchLoading && !searchError && (
            <Typography variant="subtitle1" gutterBottom>
                Results ({results.length})
            </Typography>
        )}

        {/* Display message if no results found after searching */}
        {hasSearched && !isSearchLoading && !searchError && results.length === 0 && (
          <Typography variant="body2" color="text.secondary">
            No courses found matching your query.
          </Typography>
        )}

        {/* Render the list if there are results and search isn't loading */}
        {results.length > 0 && !isSearchLoading && (
          <List dense sx={{ maxHeight: 400, overflow: 'auto', bgcolor: 'background.paper' }}> {/* Make list scrollable */}
            {results.map((course) => (
              <ListItem
                key={`${course.subject}-${course.courseCode}-${course.section}`} // Create a unique key
                disablePadding
                secondaryAction={ // Action button on the right
                  <IconButton
                    edge="end"
                    aria-label={`add ${course.name}`}
                    // ***** START OF NEW CODE *****
                    onClick={() => handleAddCourseClick(course)} // Use the new handler
                    // ***** END OF NEW CODE *****
                    title={`Add ${course.subject} ${course.courseCode} to schedule`}
                    disabled={isScheduleLoading} // Disable add if schedule is being updated
                  >
                    {/* Show spinner in button if schedule is loading? Maybe too much. */}
                    <AddCircleOutlineIcon />
                  </IconButton>
                }
              >
                {/* Use ListItemButton to make the main text area potentially clickable later if needed */}
                <ListItemButton dense>
                  <ListItemText
                    primary={`${course.subject} ${course.courseCode} - ${course.name}`}
                    // Safely access nested properties, provide defaults
                    secondary={`Sec: ${course.section || 'N/A'} | Prof: ${course.professor?.name || 'N/A'} | Days: ${course.days || 'N/A'} | Loc: ${course.location || 'N/A'} | Time: ${course.time?.startTime ? `${formatTime(course.time.startTime)} - ${formatTime(course.time.endTime)}` : 'N/A'}`}
                    secondaryTypographyProps={{ sx: { fontSize: '0.75rem' } }} // Smaller secondary text
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        )}
      </Box>
    </Box>
  );
};

// Helper to format time (copy from ScheduleView or import from utils)
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
