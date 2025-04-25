// src/components/SearchBar.js
import React, { useState, useRef, useCallback, useEffect } from 'react';
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
import FilterListIcon from '@mui/icons-material/FilterList'; // Icon for filter button
import Badge from '@mui/material/Badge'; // To show if filters are active
import Paper from '@mui/material/Paper';
import Popper from '@mui/material/Popper';
import ClickAwayListener from '@mui/material/ClickAwayListener';
import Fade from '@mui/material/Fade';

// Import the useSchedule hook
// Assuming you have a ScheduleContext set up like in previous examples
// If not, you might need to pass addCourse down as a prop or adjust this.
import { useSchedule } from '../context/ScheduleContext';
// Import the new Filters component
import SearchFilters from './SearchFilters'; // Assuming SearchFilters.js is in the same directory

/**
 * SearchBar Component (Updated)
 * Provides course search input, filter options, and displays results in an overlay Popper.
 */
const SearchBar = () => {
  // Assuming useSchedule hook provides these values
  // Provide default fallback functions/values if context might not be ready
  const scheduleContext = useSchedule();
  // Use default functions if context is not available to prevent errors
  const addCourse = scheduleContext?.addCourse || (() => console.error("addCourse function not available from context."));
  const isScheduleLoading = scheduleContext?.isLoading || false;
  const scheduleError = scheduleContext?.error || null;


  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);

  // --- Filter State ---
  const [filters, setFilters] = useState({
      startTime: '', // e.g., "09:00"
      endTime: '',   // e.g., "17:30"
      days: [],      // e.g., ['M', 'W', 'F']
  });
  const [activeFilterCount, setActiveFilterCount] = useState(0);

  // --- Popper State (Results) ---
  const [openResults, setOpenResults] = useState(false);
  const searchAnchorElRef = useRef(null); // Anchor for results popper (TextField's wrapper div)
  const [resultsPopperWidth, setResultsPopperWidth] = useState(0);

  // --- Popper State (Filters) ---
  const [openFilters, setOpenFilters] = useState(false);
  const filterAnchorElRef = useRef(null); // Anchor for filter popper (Filter Button's container)

  // --- Update Popper Widths ---
  useEffect(() => {
    const updateResultsWidth = () => {
      // Anchor is the div wrapping the TextField now
      if (searchAnchorElRef.current) setResultsPopperWidth(searchAnchorElRef.current.clientWidth);
    };
    if (openResults) {
        updateResultsWidth();
        window.addEventListener('resize', updateResultsWidth);
    } else {
         window.removeEventListener('resize', updateResultsWidth);
    }
    return () => window.removeEventListener('resize', updateResultsWidth);
  }, [openResults]);

  // --- Calculate Active Filter Count ---
  useEffect(() => {
      let count = 0;
      // Check if time range is partially or fully set
      if (filters.startTime || filters.endTime) count++;
      // Check if any days are selected
      if (filters.days && filters.days.length > 0) count++;
      setActiveFilterCount(count);
  }, [filters]);

  // --- Event Handlers ---

  const handleInputChange = (event) => {
    setQuery(event.target.value);
    if (event.target.value === '') {
       setOpenResults(false); setResults([]); setHasSearched(false); setSearchError(null);
    }
  };

  // --- Modified Search Handler ---
  const handleSearch = useCallback(async (applyFilters = false) => {
    // Close filter popper if applying filters from it
    if (applyFilters) {
        setOpenFilters(false);
    }

    // Basic query validation
    if (!query.trim()) {
      setResults([]); setSearchError(null); setHasSearched(true); setOpenResults(false);
      return;
    }

    setIsSearchLoading(true);
    setSearchError(null);
    setResults([]);
    setHasSearched(true);
    setOpenResults(true); // Open results popper

    // --- Build API URL with Filters ---
    let apiUrl = `http://localhost:7070/api/courses/search?query=${encodeURIComponent(query.trim())}`;
    // Add filters only if they have valid values
    if (filters.startTime) apiUrl += `&startTime=${encodeURIComponent(filters.startTime)}`;
    if (filters.endTime) apiUrl += `&endTime=${encodeURIComponent(filters.endTime)}`;
    // Ensure filters.days is an array before joining
    if (filters.days && Array.isArray(filters.days) && filters.days.length > 0) {
        apiUrl += `&days=${encodeURIComponent(filters.days.join(''))}`; // Join days array into string "MWF"
    }

    console.log("Searching with URL:", apiUrl); // Log the URL for debugging

    try {
      const response = await fetch(apiUrl);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `HTTP error! Status: ${response.status}` }));
        throw new Error(errorData.message || `HTTP error! Status: ${response.status}`);
      }
      const data = await response.json();
      setResults(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Search API call failed:", err);
      setSearchError(err.message || "Failed to fetch search results.");
      setResults([]);
      setOpenResults(true); // Keep open to show error
    } finally {
      setIsSearchLoading(false);
    }
  // Only include query and filters in dependencies
  }, [query, filters]); // Include filters here so search uses the latest values

  const handleKeyPress = useCallback((event) => {
    if (event.key === 'Enter') {
      handleSearch(); // Trigger search without explicitly applying filters from the filter popper
    }
  }, [handleSearch]);

  const handleAddCourseClick = (course) => {
    addCourse(course);
    setOpenResults(false);
  };

  // --- Filter Popper Control ---
  const handleFilterButtonClick = () => {
    setOpenFilters((prev) => !prev); // Toggle filter popper
    setOpenResults(false); // Close results when opening filters
  };

  const handleFilterChange = (newFilters) => {
      setFilters(newFilters);
  };

  const handleApplyFilters = () => {
      handleSearch(true); // Pass true to indicate filters are being applied
  };

  const handleResetFilters = () => {
      setFilters({ startTime: '', endTime: '', days: [] });
      // Optionally trigger a search immediately after resetting?
      // handleSearch(true); // Or maybe just close the popper
      setOpenFilters(false);
  };

  // --- Click Away Handlers ---
  // Combined handler to close either popper if clicking outside relevant areas
  const handleClickAway = (event) => {
      // Close results if click is outside search input and filter button
      if (openResults &&
          searchAnchorElRef.current && !searchAnchorElRef.current.contains(event.target) &&
          filterAnchorElRef.current && !filterAnchorElRef.current.contains(event.target))
      {
         // We also need to ensure the click wasn't inside the results popper itself
         // This check is complex without direct popper ref. We add stopPropagation
         // to the Paper components inside the Poppers instead.
         setOpenResults(false);
      }
      // Close filters if click is outside filter button
       if (openFilters &&
           filterAnchorElRef.current && !filterAnchorElRef.current.contains(event.target)) {
         // Same complexity applies for checking clicks inside the filter popper
         setOpenFilters(false);
      }
  };


  const overallLoading = isSearchLoading || isScheduleLoading;

  return (
    // Use a single ClickAwayListener for the whole search area
    <ClickAwayListener onClickAway={handleClickAway}>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, position: 'relative' }}>
        <Typography variant="h6" component="div">
          Course Search
        </Typography>

        <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
            {/* Wrap TextField in a div to attach the ref for Popper anchor */}
             <div style={{ flexGrow: 1 }} ref={searchAnchorElRef}>
                <TextField
                    label="Search Courses (e.g., COMP 101)"
                    variant="outlined"
                    fullWidth
                    value={query}
                    onChange={handleInputChange}
                    onKeyPress={handleKeyPress}
                    disabled={overallLoading}
                    // inputRef is for the input element itself, not the wrapper
                    InputProps={{
                        endAdornment: (
                        <InputAdornment position="end">
                            <IconButton
                            aria-label="search courses"
                            onClick={() => handleSearch()} // Search without explicit filter apply
                            edge="end"
                            disabled={overallLoading || !query.trim()}
                            >
                            {isSearchLoading ? <CircularProgress size={24} /> : <SearchIcon />}
                            </IconButton>
                        </InputAdornment>
                        ),
                    }}
                />
             </div>

            {/* Filter Button - Anchor for filter popper */}
            {/* This Box acts as the anchor and wrapper for the listener */}
            <Box ref={filterAnchorElRef}>
                <IconButton
                    aria-label="show filters"
                    onClick={handleFilterButtonClick}
                    // ref is now on the Box wrapper
                    color={openFilters ? "primary" : "default"} // Indicate if open
                    sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, p: '9px' }} // Match TextField height roughly
                >
                    <Badge badgeContent={activeFilterCount} color="secondary">
                        <FilterListIcon />
                    </Badge>
                </IconButton>
            </Box>
        </Box>


        {/* --- Results Popper --- */}
        <Popper
          open={openResults}
          anchorEl={searchAnchorElRef.current} // Use the div wrapper ref
          placement="bottom-start"
          transition
          disablePortal // Keep Popper within the sidebar's stacking context if needed
          modifiers={[ { name: 'offset', options: { offset: [0, 4] } }, { name: 'preventOverflow', options: { boundary: 'clippingParents' } }]}
          style={{ zIndex: 1200 }} // Ensure Popper is above other elements
          sx={{ width: resultsPopperWidth > 0 ? `${resultsPopperWidth}px` : 'auto' }}
        >
          {({ TransitionProps }) => (
            <Fade {...TransitionProps} timeout={350}>
              {/* Added onClick={(e) => e.stopPropagation()} to Paper to prevent ClickAwayListener from closing when clicking inside */}
              <Paper elevation={4} sx={{ mt: 0.5 }} onClick={(e) => e.stopPropagation()}>
                {isSearchLoading && <CircularProgress sx={{ display: 'block', margin: '20px auto' }} />}
                {searchError && !isSearchLoading && <Alert severity="error" sx={{ m: 1, borderRadius: 0 }}>Search Error: {searchError}</Alert>}
                {scheduleError && !isSearchLoading && <Alert severity="warning" sx={{ m: 1, borderRadius: 0 }}>Schedule Error: {scheduleError}</Alert>}
                {hasSearched && !isSearchLoading && !searchError && results.length === 0 && <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>No courses found matching your query.</Typography>}
                {results.length > 0 && !isSearchLoading && (
                  <List dense sx={{ maxHeight: 300, overflow: 'auto', p: 0 }}>
                    {results.map((course) => (
                      <ListItem key={`${course.subject}-${course.courseCode}-${course.section}`} disablePadding divider
                        secondaryAction={
                          <IconButton edge="end" aria-label={`add ${course.name}`} onClick={() => handleAddCourseClick(course)} title={`Add ${course.subject} ${course.courseCode} to schedule`} disabled={isScheduleLoading} sx={{ mr: 1 }}>
                            <AddCircleOutlineIcon />
                          </IconButton>
                        }
                      >
                        <ListItemButton dense sx={{ pl: 2, pr: 1 }}>
                          <ListItemText
                            primary={`${course.subject} ${course.courseCode} - ${course.name}`}
                            secondary={`Sec: ${course.section || 'N/A'} | Prof: ${course.professor?.name || 'N/A'} | Days: ${course.days || 'N/A'} | Loc: ${course.location || 'N/A'} | Time: ${course.time?.startTime ? `${formatTime(course.time.startTime)} - ${formatTime(course.time.endTime)}` : 'N/A'}`}
                            secondaryTypographyProps={{ sx: { fontSize: '0.75rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' } }}
                            primaryTypographyProps={{ sx: { whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' } }}
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

        {/* --- Filter Popper --- */}
         <Popper
          open={openFilters}
          anchorEl={filterAnchorElRef.current} // Anchor to the filter button's container
          placement="bottom-end" // Position below and to the right
          transition
          disablePortal // Keep Popper within the sidebar's stacking context
          modifiers={[ { name: 'offset', options: { offset: [0, 4] } } ]} // Add small vertical offset
          style={{ zIndex: 1250 }} // Ensure filters are above results if they overlap
        >
          {({ TransitionProps }) => (
            <Fade {...TransitionProps} timeout={350}>
              {/* Added onClick={(e) => e.stopPropagation()} to Paper */}
              <Paper elevation={6} sx={{ mt: 0.5 }} onClick={(e) => e.stopPropagation()}>
                 <SearchFilters
                    filters={filters}
                    onFilterChange={handleFilterChange}
                    onApplyFilters={handleApplyFilters}
                    onResetFilters={handleResetFilters}
                 />
              </Paper>
            </Fade>
           )}
        </Popper>

      </Box>
    </ClickAwayListener> // Close outer ClickAwayListener
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
