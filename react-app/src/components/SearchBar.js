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
import FilterListIcon from '@mui/icons-material/FilterList';
import Badge from '@mui/material/Badge';
import Paper from '@mui/material/Paper';
import Popper from '@mui/material/Popper'; // Keep Popper for Filters
import ClickAwayListener from '@mui/material/ClickAwayListener'; // Keep for Filters
import Fade from '@mui/material/Fade';
import Tooltip from '@mui/material/Tooltip';
import Divider from '@mui/material/Divider';

// --- React DnD Imports ---
import { useDrag } from 'react-dnd';
import { getEmptyImage } from 'react-dnd-html5-backend';
import { ItemTypes } from '../dndConstants';

// Import context and filters component
import { useSchedule } from '../context/ScheduleContext';
import SearchFilters from './SearchFilters';

// --- Draggable Course Item Component (Styling Adjusted) ---
// ***** START OF CHANGES in DraggableCourseItem *****
const DraggableCourseItem = ({ course, handleAddCourseClick, isScheduleLoading }) => {
  const [{ isDragging }, drag, dragPreview] = useDrag(() => ({
    type: ItemTypes.COURSE,
    item: { course },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }), [course]);

  useEffect(() => {
    dragPreview(getEmptyImage(), { captureDraggingState: true });
  }, [dragPreview]);


  return (
    <ListItem
      ref={drag}
      disablePadding // Keep padding control on ListItemButton
      divider // Keep the divider between items
      sx={{
        cursor: 'move',
        opacity: isDragging ? 0.5 : 1,
        '&:hover': { bgcolor: 'action.hover' },
        // Add some vertical padding to the ListItem itself to increase spacing
        py: 0.5, // Adjusted vertical padding (was implicitly 0)
      }}
      secondaryAction={
         <Tooltip title={`Add ${course.subject} ${course.courseCode} to schedule`}>
             <span>
               <IconButton
                 edge="end"
                 aria-label={`add ${course.name}`}
                 onClick={() => handleAddCourseClick(course)}
                 disabled={isScheduleLoading}
                 sx={{ mr: 1 }} // Keep margin
               >
                 <AddCircleOutlineIcon />
               </IconButton>
              </span>
         </Tooltip>
      }
    >
      {/* Adjust padding and text props within ListItemButton/ListItemText */}
      <ListItemButton dense sx={{ pl: 2, pr: 1, py: 1 }}> {/* Increased vertical padding */}
         <ListItemText
           primary={`${course.subject} ${course.courseCode} - ${course.name}`}
           secondary={`Sec: ${course.section || 'N/A'} | Prof: ${course.professor?.name || 'N/A'} | Days: ${course.days || 'N/A'} | Loc: ${course.location || 'N/A'} | Time: ${course.time?.startTime ? `${formatTime(course.time.startTime)} - ${formatTime(course.time.endTime)}` : 'N/A'}`}
           // Increase font sizes
           primaryTypographyProps={{
             sx: {
                fontSize: '0.95rem', // Larger primary font
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                fontWeight: 500,
                mb: 0.2 // Add a little space below primary text
             }
           }}
           secondaryTypographyProps={{
             sx: {
                fontSize: '0.8rem', // Slightly larger secondary font
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                lineHeight: 1.3 // Adjust line height if needed
             }
            }}
         />
       </ListItemButton>
    </ListItem>
  );
};
// ***** END OF CHANGES in DraggableCourseItem *****


/**
 * SearchBar Component (Updated for Integrated Results Display)
 */
const SearchBar = () => {
  const scheduleContext = useSchedule();
  const addCourse = scheduleContext?.addCourse || (() => console.error("addCourse function not available from context."));
  const isScheduleLoading = scheduleContext?.isLoading || false;
  const scheduleError = scheduleContext?.error || null;

  // State for search
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);

  // State for filters
  const [filters, setFilters] = useState({ startTime: '', endTime: '', days: [] });
  const [activeFilterCount, setActiveFilterCount] = useState(0);
  const [openFilters, setOpenFilters] = useState(false);
  const filterAnchorElRef = useRef(null);

  // Effect to count active filters
  useEffect(() => {
      let count = 0;
      if (filters.startTime || filters.endTime) count++;
      if (filters.days && Array.isArray(filters.days) && filters.days.length > 0) count++;
      setActiveFilterCount(count);
  }, [filters]);


  const handleInputChange = (event) => {
    const newQuery = event.target.value;
    setQuery(newQuery);
    if (newQuery.trim() === '') {
       setResults([]);
       setHasSearched(false);
       setSearchError(null);
    }
  };

  const handleSearch = useCallback(async (applyFilters = false) => {
    if (applyFilters) setOpenFilters(false);
    if (!query.trim()) {
      setResults([]);
      setSearchError(null);
      setHasSearched(true);
      return;
    }
    setIsSearchLoading(true);
    setSearchError(null);
    setResults([]);
    setHasSearched(true);

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
      setResults([]);
    } finally {
      setIsSearchLoading(false);
    }
  }, [query, filters]);

  const handleKeyPress = useCallback((event) => {
    if (event.key === 'Enter') {
      handleSearch();
    }
  }, [handleSearch]);

  const handleAddCourseClick = (course) => {
    addCourse(course);
  };

  const handleFilterButtonClick = () => {
     setOpenFilters((prev) => !prev);
  };

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };

  const handleApplyFilters = () => {
      handleSearch(true);
  };

  const handleResetFilters = () => {
      setFilters({ startTime: '', endTime: '', days: [] });
      setOpenFilters(false);
      // Optionally trigger a new search with reset filters if query exists
      // if (query.trim()) {
      //     handleSearch(false); // Pass false as we are not applying *new* filters
      // }
  };

  const handleClickAwayFilters = (event) => {
      if (openFilters &&
          filterAnchorElRef.current && !filterAnchorElRef.current.contains(event.target)) {
        setOpenFilters(false);
     }
  };

  const overallLoading = isSearchLoading || isScheduleLoading;

  return (
    <ClickAwayListener onClickAway={handleClickAwayFilters}>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        <Typography variant="h6" component="div"> Course Search </Typography>

        {/* Input and Filter Button Row */}
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
             <TextField
                label="Search Courses (e.g., COMP 101)"
                variant="outlined"
                fullWidth
                size="small"
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
                        {isSearchLoading ? <CircularProgress size={20} /> : <SearchIcon />}
                        </IconButton>
                    </InputAdornment>
                    ),
                }}
                sx={{ flexGrow: 1 }}
             />
             <Box ref={filterAnchorElRef}>
                <Tooltip title="Filter search results">
                  <IconButton
                    aria-label="show filters"
                    onClick={handleFilterButtonClick}
                    color={openFilters ? "primary" : "default"}
                    sx={{ border: 1, borderColor: 'divider', borderRadius: 1, p: '7px' }}
                    disabled={overallLoading}
                  >
                    <Badge badgeContent={activeFilterCount} color="secondary">
                        <FilterListIcon />
                    </Badge>
                  </IconButton>
                </Tooltip>
             </Box>
        </Box>

        {/* --- Results Area --- */}
        {(hasSearched || isSearchLoading) && (
            // ***** START OF CHANGES in Results Paper *****
            <Paper elevation={2} sx={{
                mt: 1,
                p: 0,
                 // Adjust height calculation or use a fixed height
                 // Example: Aiming for roughly 6 larger items (estimate ~70px each) + padding
                maxHeight: '450px', // Fixed height example - adjust as needed
                // Or keep calc() but adjust the subtract value:
                // maxHeight: 'calc(100vh - 360px)', // Allows slightly more height than before
                minHeight: '150px', // Increased min height
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column'
            }}>
            {/* ***** END OF CHANGES in Results Paper ***** */}

                {/* Loading State */}
                {isSearchLoading && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 3, flexGrow: 1 }}>
                        <CircularProgress />
                    </Box>
                )}
                {/* Error States */}
                {searchError && !isSearchLoading && ( <Alert severity="error" sx={{ m: 1 }}>Search Error: {searchError}</Alert> )}
                {scheduleError && !isSearchLoading && ( <Alert severity="warning" sx={{ m: 1 }}>Schedule Error: {scheduleError}</Alert> )}
                {/* No Results State */}
                {hasSearched && !isSearchLoading && !searchError && results.length === 0 && (
                    <Typography variant="body2" color="text.secondary" sx={{ p: 2, textAlign: 'center', flexGrow: 1, mt: 2 }}>
                        No courses found matching your criteria.
                    </Typography>
                )}
                {/* Results List */}
                {results.length > 0 && !isSearchLoading && (
                  // Use dense={false} on List if you want more default spacing (optional)
                  <List dense={false} sx={{ p: 0 }}>
                    {results.map((course) => (
                      <DraggableCourseItem
                        key={`${course.subject}-${course.courseCode}-${course.section}`}
                        course={course}
                        handleAddCourseClick={handleAddCourseClick}
                        isScheduleLoading={isScheduleLoading}
                      />
                    ))}
                  </List>
                )}
            </Paper>
        )}
        {(hasSearched || isSearchLoading) && <Divider sx={{ my: 1 }} />}

        {/* --- Filter Popper --- */}
         <Popper
          open={openFilters}
          anchorEl={filterAnchorElRef.current}
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

// Helper to format time (no changes needed)
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