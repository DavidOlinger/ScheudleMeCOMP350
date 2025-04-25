// src/context/ScheduleContext.js
import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext'; // Need auth context to know if user is logged in

// Helper function to parse JSON responses (ensure this exists and handles errors)
const parseJsonResponse = async (response) => {
    const text = await response.text(); // Get raw text first
    try {
        if (!text) {
            // Handle empty response body appropriately for your API
            // If 200 OK with empty body means success, return a success indicator
            if (response.ok) return { success: true, message: "Operation successful (empty response)." };
            // Otherwise, throw an error for unexpected empty bodies
            throw new Error(`Received empty response body. Status: ${response.status}`);
        }
        return JSON.parse(text); // Try to parse as JSON
    } catch (e) {
        console.error("Failed to parse JSON response. Raw text:", text);
        // Throw a more informative error
        throw new Error(`Expected JSON, but received non-JSON response. Status: ${response.status}. Response body starts with: ${text.substring(0, 100)}`);
    }
};


// Create the context
const ScheduleContext = createContext(null);

/**
 * ScheduleProvider Component
 * Manages the state of the currently active schedule.
 */
export const ScheduleProvider = ({ children }) => {
  const { currentUser, updateCurrentUser } = useAuth();

  // State variables...
  const [scheduleData, setScheduleData] = useState(null);
  const [isLoading, setIsLoading] = useState(false); // General loading for add/remove/fetch
  const [error, setError] = useState(null); // General error for add/remove/fetch
  const [saveStatus, setSaveStatus] = useState({ saving: false, error: null, success: false });
  const [controlError, setControlError] = useState(null); // Specific error for load/create
  const [isControlLoading, setIsControlLoading] = useState(false); // Specific loading for load/create
  const [isAddingCustom, setIsAddingCustom] = useState(false); // Specific loading for custom event add
  const [customEventError, setCustomEventError] = useState(null); // Specific error for custom event add

  // /**********************************************************************/
  // /* START OF NEW CODE                                                  */
  // /**********************************************************************/
  // State for Undo/Redo operations
  const [isUndoing, setIsUndoing] = useState(false);
  const [isRedoing, setIsRedoing] = useState(false);
  const [undoRedoError, setUndoRedoError] = useState(null);
  // Note: We don't have canUndo/canRedo state yet, as the backend doesn't provide it easily.
  // Buttons will be disabled based on loading state for now.
  // /**********************************************************************/
  // /* END OF NEW CODE                                                    */
  // /**********************************************************************/


  // --- Schedule Management Functions ---

  const fetchSchedule = useCallback(async () => { /* ... implementation from previous complete file ... */
    if (!currentUser) {
      console.log("ScheduleContext: No user, clearing schedule.");
      setScheduleData(null);
      setError(null); setIsLoading(false); setControlError(null); setIsControlLoading(false); setCustomEventError(null); setIsAddingCustom(false);
      // /**********************************************************************/
      // /* START OF NEW CODE                                                  */
      // /**********************************************************************/
      setIsUndoing(false); setIsRedoing(false); setUndoRedoError(null); // Clear undo/redo state on logout
      // /**********************************************************************/
      // /* END OF NEW CODE                                                    */
      // /**********************************************************************/
      return;
    }
    console.log("ScheduleContext: Fetching current schedule...");
    setIsLoading(true); setError(null); setControlError(null); setSaveStatus({ saving: false, error: null, success: false }); setCustomEventError(null);
    // /**********************************************************************/
    // /* START OF NEW CODE                                                  */
    // /**********************************************************************/
    setUndoRedoError(null); // Clear undo/redo error on fetch
    // /**********************************************************************/
    // /* END OF NEW CODE                                                    */
    // /**********************************************************************/

    try {
      const apiUrl = 'http://localhost:7070/api/schedule/current';
      const response = await fetch(apiUrl);
      if (!response.ok) {
        let errorData;
        try { errorData = await parseJsonResponse(response); } catch (parseError) { throw parseError; }
        if (response.status === 404) {
          console.log("ScheduleContext: No active schedule found (404).");
          setScheduleData({ name: 'No Schedule Loaded', events: [] }); // Specific state for no schedule
          setError(null);
        } else {
          throw new Error(errorData.error || errorData.message || `HTTP error! Status: ${response.status}`);
        }
      } else {
        const data = await parseJsonResponse(response);
        console.log("ScheduleContext: Active schedule data received:", data);
        setScheduleData({ ...data, events: Array.isArray(data.events) ? data.events : [] });
      }
    } catch (err) {
      console.error("ScheduleContext: Failed to fetch schedule:", err);
      setError(err.message || "Could not load schedule data.");
      setScheduleData(null);
    } finally {
      setIsLoading(false);
    }
   }, [currentUser]);

  useEffect(() => { fetchSchedule(); }, [fetchSchedule]);

  // ===============================================================
  // Updated addCourse function (includes section)
  // ===============================================================
  /**
   * Adds a specific course section to the current schedule.
   * Sends subject, courseCode, and section to the backend.
   * @param {object} course - The full course object from search results.
   * @returns {boolean} - True if successful, false otherwise.
   */
  const addCourse = async (course) => {
     // Basic checks
     if (!currentUser || !scheduleData || scheduleData.name === 'No Schedule Loaded') {
         setError("Please load or create a schedule to add courses.");
         return false;
     }
     // Validate required course properties including section
     if (!course || !course.subject || typeof course.courseCode !== 'number' || !course.section) { // Check for section
         console.error("ScheduleContext: Invalid course object passed to addCourse:", course);
         setError("Cannot add course: missing subject, course code, or section."); // Updated error message
         return false;
     }
     // Prevent concurrent operations
     // /**********************************************************************/
     // /* START OF MODIFICATION                                              */
     // /**********************************************************************/
     if (isLoading || saveStatus.saving || isControlLoading || isAddingCustom || isUndoing || isRedoing) { // Add undo/redo checks
     // /**********************************************************************/
     // /* END OF MODIFICATION                                                */
     // /**********************************************************************/
         console.log("ScheduleContext: Already processing, cannot add course now.");
         return false;
     }

    console.log("ScheduleContext: Attempting to add course:", course.subject, course.courseCode, course.section); // Log section
    // Use general loading/error states for adding courses
    setIsLoading(true);
    setError(null); setControlError(null); setSaveStatus({ saving: false, error: null, success: false }); setCustomEventError(null);
    // /**********************************************************************/
    // /* START OF NEW CODE                                                  */
    // /**********************************************************************/
    setUndoRedoError(null); // Clear undo/redo error
    // /**********************************************************************/
    // /* END OF NEW CODE                                                    */
    // /**********************************************************************/

    try {
      const apiUrl = 'http://localhost:7070/api/schedule/current/add';
      // --- Prepare request body with subject, courseCode, AND section ---
      const requestBody = {
          subject: course.subject,
          courseCode: course.courseCode,
          section: course.section // Include the section
      };
      // --- Send the updated request body ---
      const response = await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody) // Send subject, code, & section
      });

      // Handle response (conflict, other errors, success)
      if (!response.ok) {
        let errorData; try { errorData = await parseJsonResponse(response); } catch (parseError) { throw parseError; }
         if (response.status === 409) { // Conflict
             throw new Error(errorData.error || errorData.message || "Conflict detected. Course not added.");
         } else { // Other errors
            throw new Error(errorData.error || errorData.message || `HTTP error! Status: ${response.status}`);
         }
      }
      // If successful, update schedule state
      const updatedSchedule = await parseJsonResponse(response);
      console.log("ScheduleContext: Course added, updated schedule received:", updatedSchedule);
      setScheduleData({ ...updatedSchedule, events: Array.isArray(updatedSchedule.events) ? updatedSchedule.events : [] });
      setError(null); // Clear error on success
      return true; // Indicate success
    } catch (err) {
      console.error("ScheduleContext: Failed to add course:", err);
      setError(err.message || "Could not add course."); // Set general error
      return false; // Indicate failure
    } finally {
      setIsLoading(false); // Reset general loading state
    }
  };
  // ===============================================================

  const removeCourse = async (course) => { /* ... implementation from previous complete file ... */
    if (!currentUser || !scheduleData || scheduleData.name === 'No Schedule Loaded') { setError("Please load or create a schedule to remove courses."); return; }
     // /**********************************************************************/
     // /* START OF MODIFICATION                                              */
     // /**********************************************************************/
     if (isLoading || saveStatus.saving || isControlLoading || isAddingCustom || isUndoing || isRedoing) { // Add undo/redo checks
     // /**********************************************************************/
     // /* END OF MODIFICATION                                                */
     // /**********************************************************************/
        console.log("ScheduleContext: Already processing, cannot remove course now."); return;
     }
     // Ensure courseCode is valid before making the call
     if (typeof course.courseCode !== 'number') {
         console.error("ScheduleContext: Invalid course data passed to removeCourse", course);
         setError("Invalid course data provided for removal (missing courseCode).");
         return;
     }
    console.log("ScheduleContext: Attempting to remove course:", course.courseCode);
    setIsLoading(true); setError(null); setControlError(null); setSaveStatus({ saving: false, error: null, success: false }); setCustomEventError(null);
    // /**********************************************************************/
    // /* START OF NEW CODE                                                  */
    // /**********************************************************************/
    setUndoRedoError(null); // Clear undo/redo error
    // /**********************************************************************/
    // /* END OF NEW CODE                                                    */
    // /**********************************************************************/

     try {
       // Use the DELETE endpoint which expects courseCode in the URL
       const apiUrl = `http://localhost:7070/api/schedule/current/remove/${course.courseCode}`;
       const response = await fetch(apiUrl, { method: 'DELETE' });
        if (!response.ok) { let errorData; try { errorData = await parseJsonResponse(response); } catch (parseError) { throw parseError; } throw new Error(errorData.error || errorData.message || `HTTP error! Status: ${response.status}`); }
        const updatedSchedule = await parseJsonResponse(response);
        console.log("ScheduleContext: Course removed, updated schedule received:", updatedSchedule);
        setScheduleData({ ...updatedSchedule, events: Array.isArray(updatedSchedule.events) ? updatedSchedule.events : [] });
        setError(null);
    } catch (err) {
         console.error("ScheduleContext: Failed to remove course:", err);
         setError(err.message || "Could not remove course.");
    } finally {
        setIsLoading(false);
    }
   };
  const removeEvent = async (eventData) => { /* ... implementation from previous complete file ... */
    if (!currentUser || !scheduleData || scheduleData.name === 'No Schedule Loaded') {
      setError("Please load or create a schedule to remove events."); // Use general error state
      return false;
    }
    // Validate that the event object has the necessary properties for identification
    if (!eventData || !eventData.name || typeof eventData.days === 'undefined' || !eventData.time ||
        typeof eventData.time.startTime !== 'number' || typeof eventData.time.endTime !== 'number') {
       console.error("ScheduleContext: Invalid event data passed to removeEvent", eventData);
       setError("Invalid event data provided for removal.");
       return false;
    }
     // Prevent concurrent operations
     // /**********************************************************************/
     // /* START OF MODIFICATION                                              */
     // /**********************************************************************/
     if (isLoading || saveStatus.saving || isControlLoading || isAddingCustom || isUndoing || isRedoing) { // Add undo/redo checks
     // /**********************************************************************/
     // /* END OF MODIFICATION                                                */
     // /**********************************************************************/
        console.log("ScheduleContext: Already processing, cannot remove event now.");
        return false; // Indicate failure without setting error
    }

    console.log("ScheduleContext: Attempting to remove event:", eventData.name);
    setIsLoading(true); // Use general loading state for simplicity here
    // Reset all error/status states before the operation
    setError(null); setControlError(null); setSaveStatus({ saving: false, error: null, success: false }); setCustomEventError(null);
    // /**********************************************************************/
    // /* START OF NEW CODE                                                  */
    // /**********************************************************************/
    setUndoRedoError(null); // Clear undo/redo error
    // /**********************************************************************/
    // /* END OF NEW CODE                                                    */
    // /**********************************************************************/

    try {
      // Use the new POST endpoint designed for removing any event by its details
      const apiUrl = 'http://localhost:7070/api/schedule/current/remove-event';
      // Prepare the request body with the identifying details
      // The backend expects time in seconds
      const requestBody = {
          name: eventData.name,
          days: eventData.days,
          startTimeSeconds: eventData.time.startTime,
          endTimeSeconds: eventData.time.endTime
      };
      const response = await fetch(apiUrl, {
          method: 'POST', // Use POST as defined in the backend fix
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody)
      });
        // Check for HTTP errors
        if (!response.ok) {
            let errorData;
            try { errorData = await parseJsonResponse(response); } catch (parseError) { throw parseError; }
            throw new Error(errorData.error || errorData.message || `HTTP error! Status: ${response.status}`);
        }
        // If successful, parse the updated schedule from the response
        const updatedSchedule = await parseJsonResponse(response);
        console.log("ScheduleContext: Event removed, updated schedule received:", updatedSchedule);
        // Update the local state
        setScheduleData({ ...updatedSchedule, events: Array.isArray(updatedSchedule.events) ? updatedSchedule.events : [] });
        return true; // Indicate success
    } catch (err) {
         // Handle any errors during fetch or processing
         console.error("ScheduleContext: Failed to remove event:", err);
         setError(err.message || "Could not remove event."); // Use general error state
         return false; // Indicate failure
    } finally {
        setIsLoading(false); // Reset general loading state
    }
   };
  const saveSchedule = async () => { /* ... implementation from previous complete file ... */
    if (!currentUser || !scheduleData || scheduleData.name === 'No Schedule Loaded') { setSaveStatus({ saving: false, error: "No active schedule to save.", success: false }); return; }
     // /**********************************************************************/
     // /* START OF MODIFICATION                                              */
     // /**********************************************************************/
     if (isLoading || saveStatus.saving || isControlLoading || isAddingCustom || isUndoing || isRedoing) { // Add undo/redo checks
     // /**********************************************************************/
     // /* END OF MODIFICATION                                                */
     // /**********************************************************************/
        console.log("ScheduleContext: Already processing, cannot save schedule now."); return;
     }
    console.log("ScheduleContext: Attempting to save schedule:", scheduleData.name);
    setSaveStatus({ saving: true, error: null, success: false }); setError(null); setControlError(null); setCustomEventError(null);
    // /**********************************************************************/
    // /* START OF NEW CODE                                                  */
    // /**********************************************************************/
    setUndoRedoError(null); // Clear undo/redo error
    // /**********************************************************************/
    // /* END OF NEW CODE                                                    */
    // /**********************************************************************/

    try {
      const apiUrl = 'http://localhost:7070/api/schedules/save';
      const response = await fetch(apiUrl, { method: 'POST' });
        if (!response.ok) { let errorData; try { errorData = await parseJsonResponse(response); } catch (parseError) { throw parseError; } throw new Error(errorData.error || errorData.message || `HTTP error! Status: ${response.status}`); }
        const result = await parseJsonResponse(response);
      console.log("ScheduleContext: Save successful:", result.message);
      setSaveStatus({ saving: false, error: null, success: true });
      setTimeout(() => setSaveStatus(prev => ({ ...prev, success: false })), 3000);
    } catch (err) {
      console.error("ScheduleContext: Failed to save schedule:", err);
      setSaveStatus({ saving: false, error: err.message || "Could not save schedule.", success: false });
    }
   };
  const loadSchedule = async (scheduleName) => { /* ... implementation from previous complete file ... */
    if (!currentUser) { setControlError("Not logged in."); return; }
     if (!scheduleName || !scheduleName.trim()) { setControlError("Please select a schedule name."); return; }
     // /**********************************************************************/
     // /* START OF MODIFICATION                                              */
     // /**********************************************************************/
     if (isLoading || saveStatus.saving || isControlLoading || isAddingCustom || isUndoing || isRedoing) { // Add undo/redo checks
     // /**********************************************************************/
     // /* END OF MODIFICATION                                                */
     // /**********************************************************************/
        console.log("ScheduleContext: Already processing, cannot load schedule now."); return;
     }
    console.log("ScheduleContext: Attempting to load schedule:", scheduleName);
    setIsControlLoading(true); setControlError(null); setError(null); setSaveStatus({ saving: false, error: null, success: false }); setCustomEventError(null);
    // /**********************************************************************/
    // /* START OF NEW CODE                                                  */
    // /**********************************************************************/
    setUndoRedoError(null); // Clear undo/redo error
    // /**********************************************************************/
    // /* END OF NEW CODE                                                    */
    // /**********************************************************************/

    try {
      const apiUrl = `http://localhost:7070/api/schedules/load/${encodeURIComponent(scheduleName.trim())}`;
      const response = await fetch(apiUrl, { method: 'PUT' });
        if (!response.ok) { let errorData; try { errorData = await parseJsonResponse(response); } catch (parseError) { throw parseError; } throw new Error(errorData.error || errorData.message || `HTTP error! Status: ${response.status}`); }
        const loadedData = await parseJsonResponse(response);
      console.log("ScheduleContext: Schedule loaded successfully:", loadedData);
      setScheduleData({ ...loadedData, events: Array.isArray(loadedData.events) ? loadedData.events : [] });
      setControlError(null);
    } catch (err) {
      console.error("ScheduleContext: Failed to load schedule:", err);
      setControlError(err.message || "Could not load the selected schedule.");
    } finally {
      setIsControlLoading(false);
    }
   };
  const createNewSchedule = async (scheduleName) => { /* ... implementation from previous complete file ... */
    if (!currentUser) { setControlError("Not logged in."); return; }
     if (!scheduleName || !scheduleName.trim()) { setControlError("Please enter a schedule name."); return; }
     // /**********************************************************************/
     // /* START OF MODIFICATION                                              */
     // /**********************************************************************/
     if (isLoading || saveStatus.saving || isControlLoading || isAddingCustom || isUndoing || isRedoing) { // Add undo/redo checks
     // /**********************************************************************/
     // /* END OF MODIFICATION                                                */
     // /**********************************************************************/
        console.log("ScheduleContext: Already processing, cannot create schedule now."); return;
     }
    console.log("ScheduleContext: Attempting to create schedule:", scheduleName);
    setIsControlLoading(true); setControlError(null); setError(null); setSaveStatus({ saving: false, error: null, success: false }); setCustomEventError(null);
    // /**********************************************************************/
    // /* START OF NEW CODE                                                  */
    // /**********************************************************************/
    setUndoRedoError(null); // Clear undo/redo error
    // /**********************************************************************/
    // /* END OF NEW CODE                                                    */
    // /**********************************************************************/

    try {
        const apiUrl = 'http://localhost:7070/api/schedules/new';
        const response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: scheduleName.trim() }) });
         if (!response.ok) {
            let errorData; try { errorData = await parseJsonResponse(response); } catch (parseError) { throw parseError; }
             if (response.status === 409) { throw new Error(errorData.error || errorData.message || "A schedule with this name already exists."); }
             else { throw new Error(errorData.error || errorData.message || `HTTP error! Status: ${response.status}`); }
        }
        const responseData = await parseJsonResponse(response);
        const newSchedule = responseData.schedule;
        const updatedUser = responseData.user;
        if (!newSchedule || !updatedUser) { throw new Error("Invalid response received from server after creating schedule."); }
        console.log("ScheduleContext: New schedule created successfully:", newSchedule);
        console.log("ScheduleContext: Updated user data received:", updatedUser);
        setScheduleData({ ...newSchedule, events: Array.isArray(newSchedule.events) ? newSchedule.events : [] });
        setControlError(null);
        updateCurrentUser(updatedUser); // Update user in AuthContext
    } catch (err) {
        console.error("ScheduleContext: Failed to create schedule:", err);
        setControlError(err.message || "Could not create the new schedule.");
    } finally {
        setIsControlLoading(false);
    }
   };
  const addCustomEvent = async (eventData) => { /* ... implementation from previous complete file ... */
    if (!currentUser || !scheduleData || scheduleData.name === 'No Schedule Loaded') { setCustomEventError("Please load or create a schedule to add events."); return false; }
    // /**********************************************************************/
    // /* START OF MODIFICATION                                              */
    // /**********************************************************************/
    if (isLoading || saveStatus.saving || isControlLoading || isAddingCustom || isUndoing || isRedoing) { // Add undo/redo checks
    // /**********************************************************************/
    // /* END OF MODIFICATION                                                */
    // /**********************************************************************/
       console.log("ScheduleContext: Already processing, cannot add custom event now."); return false;
    }
    console.log("ScheduleContext: Attempting to add custom event:", eventData.name);
    setIsAddingCustom(true); setCustomEventError(null); setError(null); setControlError(null); setSaveStatus({ saving: false, error: null, success: false });
    // /**********************************************************************/
    // /* START OF NEW CODE                                                  */
    // /**********************************************************************/
    setUndoRedoError(null); // Clear undo/redo error
    // /**********************************************************************/
    // /* END OF NEW CODE                                                    */
    // /**********************************************************************/

    try {
      const apiUrl = 'http://localhost:7070/api/schedule/current/add-custom';
      const response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(eventData) });
      if (!response.ok) {
        let errorData; try { errorData = await parseJsonResponse(response); } catch (parseError) { throw parseError; }
         if (response.status === 409) { throw new Error(errorData.error || errorData.message || "Conflict detected. Event not added."); }
         else { throw new Error(errorData.error || errorData.message || `HTTP error! Status: ${response.status}`); }
      }
      const updatedSchedule = await parseJsonResponse(response);
      console.log("ScheduleContext: Custom event added, updated schedule received:", updatedSchedule);
      setScheduleData({ ...updatedSchedule, events: Array.isArray(updatedSchedule.events) ? updatedSchedule.events : [] });
      setCustomEventError(null);
      return true; // Indicate success
    } catch (err) {
      console.error("ScheduleContext: Failed to add custom event:", err);
      setCustomEventError(err.message || "Could not add the custom event.");
      return false; // Indicate failure
    } finally {
      setIsAddingCustom(false);
    }
   };

  // /**********************************************************************/
  // /* START OF NEW CODE                                                  */
  // /**********************************************************************/
  /**
   * Calls the backend endpoint to undo the last action.
   * Updates the schedule data on success.
   */
  const undoSchedule = async () => {
    // Prevent concurrent operations
    if (isLoading || saveStatus.saving || isControlLoading || isAddingCustom || isUndoing || isRedoing) {
        console.log("ScheduleContext: Already processing, cannot undo now.");
        return;
    }
    // Check user and active schedule
    if (!currentUser || !scheduleData || scheduleData.name === 'No Schedule Loaded') {
        setUndoRedoError("Please load a schedule to perform undo.");
        return;
    }

    console.log("ScheduleContext: Attempting to undo last action...");
    setIsUndoing(true);
    setUndoRedoError(null); // Clear previous undo/redo errors
    // Also clear other specific errors? Maybe keep general error for context?
    setError(null); setControlError(null); setCustomEventError(null);

    try {
      const apiUrl = 'http://localhost:7070/api/schedule/current/undo';
      const response = await fetch(apiUrl, { method: 'POST' });

      if (!response.ok) {
        let errorData;
        try { errorData = await parseJsonResponse(response); } catch (parseError) { throw parseError; }
        throw new Error(errorData.error || errorData.message || `HTTP error! Status: ${response.status}`);
      }

      // If successful, backend returns the updated schedule
      const updatedSchedule = await parseJsonResponse(response);
      console.log("ScheduleContext: Undo successful, updated schedule received:", updatedSchedule);
      setScheduleData({ ...updatedSchedule, events: Array.isArray(updatedSchedule.events) ? updatedSchedule.events : [] });

    } catch (err) {
      console.error("ScheduleContext: Failed to undo:", err);
      setUndoRedoError(err.message || "Could not perform undo."); // Set specific undo/redo error
    } finally {
      setIsUndoing(false);
    }
  };

  /**
   * Calls the backend endpoint to redo the last undone action.
   * Updates the schedule data on success.
   */
  const redoSchedule = async () => {
    // Prevent concurrent operations
    if (isLoading || saveStatus.saving || isControlLoading || isAddingCustom || isUndoing || isRedoing) {
        console.log("ScheduleContext: Already processing, cannot redo now.");
        return;
    }
    // Check user and active schedule
    if (!currentUser || !scheduleData || scheduleData.name === 'No Schedule Loaded') {
        setUndoRedoError("Please load a schedule to perform redo.");
        return;
    }

    console.log("ScheduleContext: Attempting to redo last action...");
    setIsRedoing(true);
    setUndoRedoError(null); // Clear previous undo/redo errors
    setError(null); setControlError(null); setCustomEventError(null);

    try {
      const apiUrl = 'http://localhost:7070/api/schedule/current/redo';
      const response = await fetch(apiUrl, { method: 'POST' });

      if (!response.ok) {
        let errorData;
        try { errorData = await parseJsonResponse(response); } catch (parseError) { throw parseError; }
        throw new Error(errorData.error || errorData.message || `HTTP error! Status: ${response.status}`);
      }

      // If successful, backend returns the updated schedule
      const updatedSchedule = await parseJsonResponse(response);
      console.log("ScheduleContext: Redo successful, updated schedule received:", updatedSchedule);
      setScheduleData({ ...updatedSchedule, events: Array.isArray(updatedSchedule.events) ? updatedSchedule.events : [] });

    } catch (err) {
      console.error("ScheduleContext: Failed to redo:", err);
      setUndoRedoError(err.message || "Could not perform redo."); // Set specific undo/redo error
    } finally {
      setIsRedoing(false);
    }
  };
  // /**********************************************************************/
  // /* END OF NEW CODE                                                    */
  // /**********************************************************************/


  // Value provided by the context provider
  const value = {
    scheduleData,
    isLoading,
    error,
    saveStatus,
    isControlLoading,
    controlError,
    isAddingCustom,
    customEventError,
    // /**********************************************************************/
    // /* START OF NEW CODE                                                  */
    // /**********************************************************************/
    isUndoing,
    isRedoing,
    undoRedoError,
    // /**********************************************************************/
    // /* END OF NEW CODE                                                    */
    // /**********************************************************************/
    fetchSchedule,
    addCourse,      // Updated addCourse (now includes section)
    removeCourse,   // Original removeCourse (by code)
    removeEvent,    // New removeEvent (by details)
    saveSchedule,
    loadSchedule,
    createNewSchedule,
    addCustomEvent,
    // /**********************************************************************/
    // /* START OF NEW CODE                                                  */
    // /**********************************************************************/
    undoSchedule,
    redoSchedule
    // /**********************************************************************/
    // /* END OF NEW CODE                                                    */
    // /**********************************************************************/
  };

  return <ScheduleContext.Provider value={value}>{children}</ScheduleContext.Provider>;
};

// useSchedule Hook
export const useSchedule = () => {
  const context = useContext(ScheduleContext);
  if (context === undefined) {
    throw new Error('useSchedule must be used within a ScheduleProvider');
  }
  return context;
};