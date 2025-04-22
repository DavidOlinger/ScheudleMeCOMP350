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

/**
 * SearchBar Component
 * Provides an input field to search for courses via the backend API
 * and displays the results in a list. Allows adding courses (placeholder).
 */
const SearchBar = () => {
  // State for the search input value
  const [query, setQuery] = useState('');
  // State to store the list of course results from the API
  const [results, setResults] = useState([]);
  // State to indicate if the API call is in progress
  const [isLoading, setIsLoading] = useState(false);
  // State to store any error messages during the API call
  const [error, setError] = useState(null);
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
        setError(null);
        setHasSearched(true); // Mark as searched even if empty
        return;
    }

    setIsLoading(true);
    setError(null);
    setResults([]); // Clear previous results
    setHasSearched(true); // Mark that a search attempt has been made

    try {
      // Construct the URL for the backend API endpoint
      // IMPORTANT: Replace 'http://localhost:7070' if your backend runs on a different port/domain
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
      setError(err.message || "Failed to fetch search results. Please try again.");
      setResults([]); // Clear results on error
    } finally {
      // Ensure loading indicator is turned off regardless of success or failure
      setIsLoading(false);
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
   * Placeholder function for when a user clicks the add button on a course result.
   * @param {object} course - The course object selected from the results.
   */
  const handleAddCourse = (course) => {
    console.log("Add course clicked (placeholder):", course);
    // TODO: Implement logic to add the course to the main schedule state/API
    // This might involve calling a function passed down via props from MainPage
    // or using a shared state management context/library.
    alert(`Placeholder: Add ${course.subject} ${course.courseCode} to schedule.`); // Simple feedback for now
  };


  // --- JSX Rendering ---

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
        disabled={isLoading} // Disable input while loading
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                aria-label="search courses"
                onClick={handleSearch}
                edge="end"
                disabled={isLoading} // Disable button while loading
              >
                {isLoading ? <CircularProgress size={24} /> : <SearchIcon />}
              </IconButton>
            </InputAdornment>
          ),
        }}
      />

      {/* Loading Indicator */}
      {/* {isLoading && <CircularProgress sx={{ alignSelf: 'center', my: 2 }} />} */}

      {/* Error Display */}
      {error && (
        <Alert severity="error" sx={{ mt: 1 }}>
          {error}
        </Alert>
      )}

      {/* Search Results List */}
      <Box sx={{ mt: 1 }}> {/* Add some margin top before results */}
        {/* Only show results list area if a search has been attempted */}
        {hasSearched && !isLoading && !error && (
            <Typography variant="subtitle1" gutterBottom>
                Results ({results.length})
            </Typography>
        )}

        {/* Display message if no results found after searching */}
        {hasSearched && !isLoading && !error && results.length === 0 && (
          <Typography variant="body2" color="text.secondary">
            No courses found matching your query.
          </Typography>
        )}

        {/* Render the list if there are results */}
        {results.length > 0 && !isLoading && (
          <List dense sx={{ maxHeight: 400, overflow: 'auto', bgcolor: 'background.paper' }}> {/* Make list scrollable */}
            {results.map((course) => (
              <ListItem
                key={`${course.subject}-${course.courseCode}-${course.section}`} // Create a unique key
                disablePadding
                secondaryAction={ // Action button on the right
                  <IconButton
                    edge="end"
                    aria-label={`add ${course.name}`}
                    onClick={() => handleAddCourse(course)}
                    title={`Add ${course.subject} ${course.courseCode} to schedule`}
                  >
                    <AddCircleOutlineIcon />
                  </IconButton>
                }
              >
                {/* Use ListItemButton to make the main text area potentially clickable later if needed */}
                <ListItemButton dense>
                  <ListItemText
                    primary={`${course.subject} ${course.courseCode} - ${course.name}`}
                    secondary={`Section: ${course.section} | Prof: ${course.professor?.name || 'N/A'} | Days: ${course.days || 'N/A'} | Time: ${course.time?.startTime ? `${course.time.startTime} - ${course.time.endTime}` : 'N/A'}`} // Safely access nested properties
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

export default SearchBar;
