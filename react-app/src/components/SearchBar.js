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
// Keep AddCircleOutlineIcon for now as fallback/alternative to DnD
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import FilterListIcon from '@mui/icons-material/FilterList';
import Badge from '@mui/material/Badge';
import Paper from '@mui/material/Paper';
import Popper from '@mui/material/Popper';
import ClickAwayListener from '@mui/material/ClickAwayListener';
import Fade from '@mui/material/Fade';
import Tooltip from '@mui/material/Tooltip'; // Added for Add button tooltip

// --- React DnD Imports ---
import { useDrag } from 'react-dnd';
import { getEmptyImage } from 'react-dnd-html5-backend'; // Import helper to hide default preview
// --- End React DnD Imports ---
import { ItemTypes } from '../dndConstants'; // Import from shared constants


import { useSchedule } from '../context/ScheduleContext';
import SearchFilters from './SearchFilters';

// --- Draggable Course Item Component ---
const DraggableCourseItem = ({ course, handleAddCourseClick, isScheduleLoading }) => {
  // Get dragPreview from useDrag
  const [{ isDragging }, drag, dragPreview] = useDrag(() => ({ // <-- Add dragPreview here
    type: ItemTypes.COURSE,
    item: { course },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }), [course]);

  // --- Add useEffect to hide default preview ---
  useEffect(() => {
    // Connect an empty image to the drag preview
    // This prevents the browser from generating its own snapshot
    dragPreview(getEmptyImage(), { captureDraggingState: true });
  }, [dragPreview]); // Dependency array ensures this runs once on mount
  // --- End useEffect ---


  return (
    <ListItem
      ref={drag} // Apply the drag source ref here
      // ... (rest of ListItem props and sx remain the same) ...
      disablePadding
      divider
      sx={{
        cursor: 'move',
        opacity: isDragging ? 0.5 : 1,
        '&:hover': { bgcolor: 'action.hover' },
      }}
      secondaryAction={
         <Tooltip title={`Add ${course.subject} ${course.courseCode} to schedule`}>
             <span>
               <IconButton
                 edge="end"
                 aria-label={`add ${course.name}`}
                 onClick={() => handleAddCourseClick(course)}
                 disabled={isScheduleLoading}
                 sx={{ mr: 1 }}
               >
                 <AddCircleOutlineIcon />
               </IconButton>
              </span>
         </Tooltip>
      }
    >
      {/* ... (ListItemButton and ListItemText remain the same) ... */}
      <ListItemButton dense sx={{ pl: 2, pr: 1, py: 0.5 }}>
         <ListItemText
           primary={`${course.subject} ${course.courseCode} - ${course.name}`}
           secondary={`Sec: ${course.section || 'N/A'} | Prof: ${course.professor?.name || 'N/A'} | Days: ${course.days || 'N/A'} | Loc: ${course.location || 'N/A'} | Time: ${course.time?.startTime ? `${formatTime(course.time.startTime)} - ${formatTime(course.time.endTime)}` : 'N/A'}`}
           secondaryTypographyProps={{ sx: { fontSize: '0.75rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' } }}
           primaryTypographyProps={{ sx: { fontSize: '0.85rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: 500 } }}
         />
       </ListItemButton>
    </ListItem>
  );
};


/**
 * SearchBar Component (Updated for Draggable Items)
 */
const SearchBar = () => {
  const scheduleContext = useSchedule();
  const addCourse = scheduleContext?.addCourse || (() => console.error("addCourse function not available from context."));
  const isScheduleLoading = scheduleContext?.isLoading || false;
  const scheduleError = scheduleContext?.error || null;

  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);

  const [filters, setFilters] = useState({ startTime: '', endTime: '', days: [] });
  const [activeFilterCount, setActiveFilterCount] = useState(0);

  const [openResults, setOpenResults] = useState(false);
  const searchAnchorElRef = useRef(null);
  const [resultsPopperWidth, setResultsPopperWidth] = useState(0);

  const [openFilters, setOpenFilters] = useState(false);
  const filterAnchorElRef = useRef(null);

  useEffect(() => {
    // ... (popper width logic remains the same) ...
    const updateResultsWidth = () => {
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

  useEffect(() => {
    // ... (active filter count logic remains the same) ...
      let count = 0;
      if (filters.startTime || filters.endTime) count++;
      if (filters.days && Array.isArray(filters.days) && filters.days.length > 0) count++;
      setActiveFilterCount(count);
  }, [filters]);


  const handleInputChange = (event) => {
    // ... (logic remains the same) ...
    setQuery(event.target.value);
    if (event.target.value === '') {
       setOpenResults(false); setResults([]); setHasSearched(false); setSearchError(null);
    }
  };

  const handleSearch = useCallback(async (applyFilters = false) => {
    // ... (API call logic remains the same) ...
    if (applyFilters) setOpenFilters(false);
    if (!query.trim()) {
      setResults([]); setSearchError(null); setHasSearched(true); setOpenResults(false);
      return;
    }
    setIsSearchLoading(true); setSearchError(null); setResults([]); setHasSearched(true); setOpenResults(true);

    let apiUrl = `/api/courses/search?query=${encodeURIComponent(query.trim())}`;
    if (filters.startTime) apiUrl += `&startTime=${encodeURIComponent(filters.startTime)}`;
    if (filters.endTime) apiUrl += `&endTime=${encodeURIComponent(filters.endTime)}`;
    if (filters.days && Array.isArray(filters.days) && filters.days.length > 0) {
        apiUrl += `&days=${encodeURIComponent(filters.days.join(''))}`;
    }
    console.log("Searching with URL:", apiUrl);
    try {
      const response = await fetch(apiUrl);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `HTTP error! Status: ${response.status}` }));
        throw new Error(errorData.error || errorData.message || `HTTP error! Status: ${response.status}`);
      }
      const data = await response.json();
      setResults(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Search API call failed:", err);
      setSearchError(err.message || "Failed to fetch search results.");
      setResults([]); setOpenResults(true);
    } finally {
      setIsSearchLoading(false);
    }
  }, [query, filters]);

  const handleKeyPress = useCallback((event) => {
    // ... (logic remains the same) ...
    if (event.key === 'Enter') {
      handleSearch();
    }
  }, [handleSearch]);

  const handleAddCourseClick = (course) => {
    // ... (logic remains the same, still used by the add button) ...
    addCourse(course);
    // Maybe close results after adding?
    // setOpenResults(false);
  };

  const handleFilterButtonClick = () => {
    // ... (logic remains the same) ...
     setOpenFilters((prev) => !prev);
     setOpenResults(false);
  };

  const handleFilterChange = (newFilters) => {
    // ... (logic remains the same) ...
    setFilters(newFilters);
  };

  const handleApplyFilters = () => {
    // ... (logic remains the same) ...
      handleSearch(true);
  };

  const handleResetFilters = () => {
    // ... (logic remains the same) ...
      setFilters({ startTime: '', endTime: '', days: [] });
      setOpenFilters(false);
  };

  const handleClickAway = (event) => {
    // ... (logic remains the same) ...
     if (openResults &&
         searchAnchorElRef.current && !searchAnchorElRef.current.contains(event.target) &&
         filterAnchorElRef.current && !filterAnchorElRef.current.contains(event.target))
     {
        setOpenResults(false);
     }
      if (openFilters &&
          filterAnchorElRef.current && !filterAnchorElRef.current.contains(event.target)) {
        setOpenFilters(false);
     }
  };

  const overallLoading = isSearchLoading || isScheduleLoading;

  return (
    <ClickAwayListener onClickAway={handleClickAway}>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, position: 'relative' }}>
        <Typography variant="h6" component="div"> Course Search </Typography>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
             <div style={{ flexGrow: 1 }} ref={searchAnchorElRef}>
                <TextField
                    // ... (TextField props remain the same) ...
                    label="Search Courses (e.g., COMP 101)"
                    variant="outlined"
                    fullWidth
                    value={query}
                    onChange={handleInputChange}
                    onKeyPress={handleKeyPress}
                    disabled={overallLoading}
                    InputProps={{
                        endAdornment: (
                        <InputAdornment position="end">
                            <IconButton
                            aria-label="search courses"
                            onClick={() => handleSearch()}
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
            <Box ref={filterAnchorElRef}>
                <IconButton
                    // ... (Filter IconButton props remain the same) ...
                     aria-label="show filters"
                    onClick={handleFilterButtonClick}
                    color={openFilters ? "primary" : "default"}
                    sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, p: '9px' }}
                >
                    <Badge badgeContent={activeFilterCount} color="secondary">
                        <FilterListIcon />
                    </Badge>
                </IconButton>
            </Box>
        </Box>

        {/* Results Popper */}
        <Popper
          open={openResults}
          anchorEl={searchAnchorElRef.current}
          // ... (Popper props remain the same) ...
          placement="bottom-start"
          transition
          disablePortal
          modifiers={[ { name: 'offset', options: { offset: [0, 4] } }, { name: 'preventOverflow', options: { boundary: 'clippingParents' } }]}
          style={{ zIndex: 1200 }}
          sx={{ width: resultsPopperWidth > 0 ? `${resultsPopperWidth}px` : 'auto' }}
        >
          {({ TransitionProps }) => (
            <Fade {...TransitionProps} timeout={350}>
              <Paper elevation={4} sx={{ mt: 0.5 }} onClick={(e) => e.stopPropagation()}>
                {/* --- Render Loading/Error/Empty states --- */}
                {isSearchLoading && <CircularProgress sx={{ display: 'block', margin: '20px auto' }} />}
                {searchError && !isSearchLoading && <Alert severity="error" sx={{ m: 1, borderRadius: 0 }}>Search Error: {searchError}</Alert>}
                {scheduleError && !isSearchLoading && <Alert severity="warning" sx={{ m: 1, borderRadius: 0 }}>Schedule Error: {scheduleError}</Alert>}
                {hasSearched && !isSearchLoading && !searchError && results.length === 0 && <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>No courses found.</Typography>}

                {/* --- Render Draggable Results List --- */}
                {results.length > 0 && !isSearchLoading && (
                  <List dense sx={{ maxHeight: 300, overflow: 'auto', p: 0 }}>
                    {results.map((course) => (
                      // Use the new DraggableCourseItem component
                      <DraggableCourseItem
                        key={`${course.subject}-${course.courseCode}-${course.section}`}
                        course={course}
                        handleAddCourseClick={handleAddCourseClick} // Pass handler for the button
                        isScheduleLoading={isScheduleLoading}
                      />
                    ))}
                  </List>
                )}
              </Paper>
            </Fade>
          )}
        </Popper>

        {/* Filter Popper */}
         <Popper
          open={openFilters}
          anchorEl={filterAnchorElRef.current}
          // ... (Filter Popper props remain the same) ...
          placement="bottom-end"
          transition
          disablePortal
          modifiers={[ { name: 'offset', options: { offset: [0, 4] } } ]}
          style={{ zIndex: 1250 }}
        >
          {({ TransitionProps }) => (
            <Fade {...TransitionProps} timeout={350}>
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
    </ClickAwayListener>
  );
};

// Helper to format time (ensure this is consistent)
const formatTime = (seconds) => {
    // ... (formatTime logic remains the same) ...
    if (typeof seconds !== 'number' || isNaN(seconds)) return 'N/A';
    const totalMinutes = Math.floor(seconds / 60);
    const hours24 = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
    const ampm = hours24 >= 12 ? 'PM' : 'AM';
    return `${hours12}:${minutes.toString().padStart(2, '0')} ${ampm}`;
};


export default SearchBar;