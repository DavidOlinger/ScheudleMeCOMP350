// src/context/ScheduleContext.js
import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext'; // Need auth context to know if user is logged in

// Helper function to parse JSON responses (ensure this exists and handles errors)
const parseJsonResponse = async (response) => {
    const text = await response.text(); // Get raw text first
    try {
        if (!text) {
            if (response.ok) return { success: true, message: "Operation successful (empty response)." };
            throw new Error(`Received empty response body. Status: ${response.status}`);
        }
        return JSON.parse(text); // Try to parse as JSON
    } catch (e) {
        console.error("Failed to parse JSON response. Raw text:", text);
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
  const [controlError, setControlError] = useState(null); // Specific error for load/create/delete
  const [isControlLoading, setIsControlLoading] = useState(false); // Specific loading for load/create/delete
  const [isAddingCustom, setIsAddingCustom] = useState(false); // Specific loading for custom event add
  const [customEventError, setCustomEventError] = useState(null); // Specific error for custom event add
  const [isUndoing, setIsUndoing] = useState(false); // Loading for undo
  const [isRedoing, setIsRedoing] = useState(false); // Loading for redo
  const [undoRedoError, setUndoRedoError] = useState(null); // Specific error for undo/redo
  const [isSharing, setIsSharing] = useState(false); // Loading for share operation
  const [shareError, setShareError] = useState(null); // Specific error for share operation
  const [sharePath, setSharePath] = useState(null); // Store only the path part (e.g., /s/TOKEN)


  // --- Schedule Management Functions ---

  const fetchSchedule = useCallback(async () => {
    // ... (fetchSchedule implementation - no changes needed)
    if (!currentUser) {
      console.log("ScheduleContext: No user, clearing schedule.");
      setScheduleData(null);
      setError(null); setIsLoading(false); setControlError(null); setIsControlLoading(false); setCustomEventError(null); setIsAddingCustom(false);
      setIsUndoing(false); setIsRedoing(false); setUndoRedoError(null);
      setIsSharing(false); setShareError(null); setSharePath(null); // Clear share path
      return;
    }
    console.log("ScheduleContext: Fetching current schedule...");
    setIsLoading(true); setError(null); setControlError(null); setSaveStatus({ saving: false, error: null, success: false }); setCustomEventError(null);
    setUndoRedoError(null);
    setShareError(null); setSharePath(null); // Clear share path

    try {
      const apiUrl = 'http://localhost:7070/api/schedule/current';
      const response = await fetch(apiUrl); // Define response here
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

  // ... (addCourse, removeCourse, removeEvent, saveSchedule - no changes needed)
  const addCourse = async (course) => {
     if (!currentUser || !scheduleData || scheduleData.name === 'No Schedule Loaded') { setError("Please load or create a schedule to add courses."); return false; }
     if (!course || !course.subject || typeof course.courseCode !== 'number' || !course.section) { setError("Cannot add course: missing subject, course code, or section."); return false; }
     if (isLoading || saveStatus.saving || isControlLoading || isAddingCustom || isUndoing || isRedoing || isSharing) { console.log("ScheduleContext: Already processing..."); return false; }
     setIsLoading(true); setError(null); setControlError(null); setSaveStatus({ saving: false, error: null, success: false }); setCustomEventError(null); setUndoRedoError(null); setShareError(null); setSharePath(null);
     try {
       const apiUrl = 'http://localhost:7070/api/schedule/current/add';
       const requestBody = { subject: course.subject, courseCode: course.courseCode, section: course.section };
       const response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(requestBody) });
       if (!response.ok) {
         let errorData; try { errorData = await parseJsonResponse(response); } catch (parseError) { throw parseError; }
          if (response.status === 409) { throw new Error(errorData.error || errorData.message || "Conflict detected. Course not added."); } else { throw new Error(errorData.error || errorData.message || `HTTP error! Status: ${response.status}`); }
       }
       const updatedSchedule = await parseJsonResponse(response);
       setScheduleData({ ...updatedSchedule, events: Array.isArray(updatedSchedule.events) ? updatedSchedule.events : [] });
       setError(null);
       return true; // Signal success
     } catch (err) { setError(err.message || "Could not add course."); return false; } finally { setIsLoading(false); }
  };
  const removeCourse = async (course) => {
     if (!currentUser || !scheduleData || scheduleData.name === 'No Schedule Loaded') { setError("Please load or create a schedule."); return false; }
     if (typeof course.courseCode !== 'number') { setError("Invalid course data."); return false; }
     if (isLoading || saveStatus.saving || isControlLoading || isAddingCustom || isUndoing || isRedoing || isSharing) { console.log("ScheduleContext: Already processing..."); return false; }
     setIsLoading(true); setError(null); setControlError(null); setSaveStatus({ saving: false, error: null, success: false }); setCustomEventError(null); setUndoRedoError(null); setShareError(null); setSharePath(null);
     try {
       const apiUrl = `http://localhost:7070/api/schedule/current/remove/${course.courseCode}`;
       const response = await fetch(apiUrl, { method: 'DELETE' });
        if (!response.ok) { let errorData; try { errorData = await parseJsonResponse(response); } catch (parseError) { throw parseError; } throw new Error(errorData.error || errorData.message || `HTTP error! Status: ${response.status}`); }
        const updatedSchedule = await parseJsonResponse(response);
        setScheduleData({ ...updatedSchedule, events: Array.isArray(updatedSchedule.events) ? updatedSchedule.events : [] });
        setError(null);
        return true; // Signal success
    } catch (err) { setError(err.message || "Could not remove course."); return false; } finally { setIsLoading(false); }
   };
  const removeEvent = async (eventData) => {
     if (!currentUser || !scheduleData || scheduleData.name === 'No Schedule Loaded') { setError("Please load or create a schedule."); return false; }
     if (!eventData || !eventData.name || typeof eventData.days === 'undefined' || !eventData.time || typeof eventData.time.startTime !== 'number' || typeof eventData.time.endTime !== 'number') { setError("Invalid event data."); return false; }
     if (isLoading || saveStatus.saving || isControlLoading || isAddingCustom || isUndoing || isRedoing || isSharing) { console.log("ScheduleContext: Already processing..."); return false; }
     setIsLoading(true); setError(null); setControlError(null); setSaveStatus({ saving: false, error: null, success: false }); setCustomEventError(null); setUndoRedoError(null); setShareError(null); setSharePath(null);
     try {
       const apiUrl = 'http://localhost:7070/api/schedule/current/remove-event';
       const requestBody = { name: eventData.name, days: eventData.days, startTimeSeconds: eventData.time.startTime, endTimeSeconds: eventData.time.endTime };
       const response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(requestBody) });
        if (!response.ok) { let errorData; try { errorData = await parseJsonResponse(response); } catch (parseError) { throw parseError; } throw new Error(errorData.error || errorData.message || `HTTP error! Status: ${response.status}`); }
        const updatedSchedule = await parseJsonResponse(response);
        setScheduleData({ ...updatedSchedule, events: Array.isArray(updatedSchedule.events) ? updatedSchedule.events : [] });
        return true; // Signal success
     } catch (err) { setError(err.message || "Could not remove event."); return false; } finally { setIsLoading(false); }
   };
  const saveSchedule = async () => {
     if (!currentUser || !scheduleData || scheduleData.name === 'No Schedule Loaded') { setSaveStatus({ saving: false, error: "No active schedule to save.", success: false }); return false; }
     if (isLoading || saveStatus.saving || isControlLoading || isAddingCustom || isUndoing || isRedoing || isSharing) { console.log("ScheduleContext: Already processing..."); return false; }
     setSaveStatus({ saving: true, error: null, success: false }); setError(null); setControlError(null); setCustomEventError(null); setUndoRedoError(null); setShareError(null); setSharePath(null);
     try {
       const apiUrl = 'http://localhost:7070/api/schedules/save';
       const response = await fetch(apiUrl, { method: 'POST' });
        if (!response.ok) { let errorData; try { errorData = await parseJsonResponse(response); } catch (parseError) { throw parseError; } throw new Error(errorData.error || errorData.message || `HTTP error! Status: ${response.status}`); }
        const result = await parseJsonResponse(response);
        setSaveStatus({ saving: false, error: null, success: true });
        setTimeout(() => setSaveStatus(prev => ({ ...prev, success: false })), 3000);
        return true; // Signal success
     } catch (err) { setSaveStatus({ saving: false, error: err.message || "Could not save schedule.", success: false }); return false; }
   };


  const loadSchedule = async (scheduleName) => {
     // ... (loadSchedule implementation - returns boolean)
     if (!currentUser) { setControlError("Not logged in."); return false; }
     if (!scheduleName || !scheduleName.trim()) { setControlError("Please select a schedule name."); return false; }
     if (isLoading || saveStatus.saving || isControlLoading || isAddingCustom || isUndoing || isRedoing || isSharing) { console.log("ScheduleContext: Already processing..."); return false; }
     setIsControlLoading(true); setControlError(null); setError(null); setSaveStatus({ saving: false, error: null, success: false }); setCustomEventError(null); setUndoRedoError(null); setShareError(null); setSharePath(null);
     try {
       const apiUrl = `http://localhost:7070/api/schedules/load/${encodeURIComponent(scheduleName.trim())}`;
       const response = await fetch(apiUrl, { method: 'PUT' });
        if (!response.ok) { let errorData; try { errorData = await parseJsonResponse(response); } catch (parseError) { throw parseError; } throw new Error(errorData.error || errorData.message || `HTTP error! Status: ${response.status}`); }
        const loadedData = await parseJsonResponse(response);
        setScheduleData({ ...loadedData, events: Array.isArray(loadedData.events) ? loadedData.events : [] });
        setControlError(null);
        return true; // Signal success
     } catch (err) { setControlError(err.message || "Could not load the selected schedule."); return false; } finally { setIsControlLoading(false); }
  };

  const createNewSchedule = async (scheduleName) => {
     // ... (createNewSchedule implementation - returns boolean)
    if (!currentUser) { setControlError("Not logged in."); return false; }
    if (!scheduleName || !scheduleName.trim()) { setControlError("Please enter a schedule name."); return false; }
    if (isLoading || saveStatus.saving || isControlLoading || isAddingCustom || isUndoing || isRedoing || isSharing) { console.log("ScheduleContext: Already processing..."); return false; }
    setIsControlLoading(true); setControlError(null); setError(null); setSaveStatus({ saving: false, error: null, success: false }); setCustomEventError(null); setUndoRedoError(null); setShareError(null); setSharePath(null);
    try {
       const apiUrl = 'http://localhost:7070/api/schedules/new';
       const response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: scheduleName.trim() }) });
        if (!response.ok) { let errorData; try { errorData = await parseJsonResponse(response); } catch (parseError) { throw parseError; } if (response.status === 409) { throw new Error(errorData.error || errorData.message || "A schedule with this name already exists."); } else { throw new Error(errorData.error || errorData.message || `HTTP error! Status: ${response.status}`); } }
       const responseData = await parseJsonResponse(response);
       const newSchedule = responseData.schedule;
       const updatedUser = responseData.user;
       if (!newSchedule || !updatedUser) { throw new Error("Invalid response received from server after creating schedule."); }
       setScheduleData({ ...newSchedule, events: Array.isArray(newSchedule.events) ? newSchedule.events : [] });
       setControlError(null);
       updateCurrentUser(updatedUser); // Update user in AuthContext
       return true; // Signal success
    } catch (err) { setControlError(err.message || "Could not create the new schedule."); return false; } finally { setIsControlLoading(false); }
  };

    // ===============================================================
    // Delete Schedule - New Function
    // ===============================================================
    const deleteSchedule = async (scheduleName) => {
        if (!currentUser) { setControlError("Not logged in."); return false; }
        if (!scheduleName || !scheduleName.trim()) { setControlError("Please select a schedule name to delete."); return false; }
        if (isLoading || saveStatus.saving || isControlLoading || isAddingCustom || isUndoing || isRedoing || isSharing) { console.log("ScheduleContext: Already processing..."); return false; }

        setIsControlLoading(true); setControlError(null); setError(null); setSaveStatus({ saving: false, error: null, success: false }); setCustomEventError(null); setUndoRedoError(null); setShareError(null); setSharePath(null);

        try {
            const apiUrl = `http://localhost:7070/api/schedules/${encodeURIComponent(scheduleName.trim())}`;
            const response = await fetch(apiUrl, { method: 'DELETE' });

            if (!response.ok) {
                let errorData; try { errorData = await parseJsonResponse(response); } catch (parseError) { throw parseError; }
                throw new Error(errorData.error || errorData.message || `HTTP error! Status: ${response.status}`);
            }

            const result = await parseJsonResponse(response); // Contains message and updated user

            // Update AuthContext with the user data returned from the backend
            if (result.user) {
                 updateCurrentUser(result.user);
                 console.log("ScheduleContext: User context updated after delete.");
            } else {
                console.warn("ScheduleContext: Delete response did not contain updated user data.");
                // Optionally re-fetch user data here if needed
            }


            // Clear current schedule if it was the one deleted
            if (scheduleData && scheduleData.name === scheduleName.trim()) {
                setScheduleData({ name: 'No Schedule Loaded', events: [] }); // Reset to initial state
                console.log("ScheduleContext: Cleared active schedule as it was deleted.");
            }

            setControlError(null);
            console.log("ScheduleContext: Schedule deleted successfully:", scheduleName.trim());
            return true; // Signal success

        } catch (err) {
            console.error("ScheduleContext: Failed to delete schedule:", err);
            setControlError(err.message || "Could not delete the selected schedule.");
            return false; // Signal failure
        } finally {
            setIsControlLoading(false);
        }
    };
    // ===============================================================


  // ... (addCustomEvent, undoSchedule, redoSchedule, shareSchedule - no changes needed)
  const addCustomEvent = async (eventData) => {
     if (!currentUser || !scheduleData || scheduleData.name === 'No Schedule Loaded') { setCustomEventError("Please load or create a schedule."); return false; }
     if (isLoading || saveStatus.saving || isControlLoading || isAddingCustom || isUndoing || isRedoing || isSharing) { console.log("ScheduleContext: Already processing..."); return false; }
     setIsAddingCustom(true); setCustomEventError(null); setError(null); setControlError(null); setSaveStatus({ saving: false, error: null, success: false }); setUndoRedoError(null); setShareError(null); setSharePath(null);
     try {
       const apiUrl = 'http://localhost:7070/api/schedule/current/add-custom';
       const response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(eventData) });
       if (!response.ok) { let errorData; try { errorData = await parseJsonResponse(response); } catch (parseError) { throw parseError; } if (response.status === 409) { throw new Error(errorData.error || errorData.message || "Conflict detected. Event not added."); } else { throw new Error(errorData.error || errorData.message || `HTTP error! Status: ${response.status}`); } }
       const updatedSchedule = await parseJsonResponse(response);
       setScheduleData({ ...updatedSchedule, events: Array.isArray(updatedSchedule.events) ? updatedSchedule.events : [] });
       setCustomEventError(null);
       return true; // Signal success
     } catch (err) { setCustomEventError(err.message || "Could not add the custom event."); return false; } finally { setIsAddingCustom(false); }
  };
  const undoSchedule = async () => {
     if (isLoading || saveStatus.saving || isControlLoading || isAddingCustom || isUndoing || isRedoing || isSharing) { console.log("ScheduleContext: Already processing..."); return false; }
     if (!currentUser || !scheduleData || scheduleData.name === 'No Schedule Loaded') { setUndoRedoError("Please load a schedule."); return false; }
     setIsUndoing(true); setUndoRedoError(null); setError(null); setControlError(null); setCustomEventError(null); setShareError(null); setSharePath(null);
     try {
       const apiUrl = 'http://localhost:7070/api/schedule/current/undo';
       const response = await fetch(apiUrl, { method: 'POST' });
       if (!response.ok) { let errorData; try { errorData = await parseJsonResponse(response); } catch (parseError) { throw parseError; } throw new Error(errorData.error || errorData.message || `HTTP error! Status: ${response.status}`); }
       const updatedSchedule = await parseJsonResponse(response);
       setScheduleData({ ...updatedSchedule, events: Array.isArray(updatedSchedule.events) ? updatedSchedule.events : [] });
        return true; // Signal success
     } catch (err) { setUndoRedoError(err.message || "Could not perform undo."); return false; } finally { setIsUndoing(false); }
  };
  const redoSchedule = async () => {
     if (isLoading || saveStatus.saving || isControlLoading || isAddingCustom || isUndoing || isRedoing || isSharing) { console.log("ScheduleContext: Already processing..."); return false; }
     if (!currentUser || !scheduleData || scheduleData.name === 'No Schedule Loaded') { setUndoRedoError("Please load a schedule."); return false; }
     setIsRedoing(true); setUndoRedoError(null); setError(null); setControlError(null); setCustomEventError(null); setShareError(null); setSharePath(null);
     try {
       const apiUrl = 'http://localhost:7070/api/schedule/current/redo';
       const response = await fetch(apiUrl, { method: 'POST' });
       if (!response.ok) { let errorData; try { errorData = await parseJsonResponse(response); } catch (parseError) { throw parseError; } throw new Error(errorData.error || errorData.message || `HTTP error! Status: ${response.status}`); }
       const updatedSchedule = await parseJsonResponse(response);
       setScheduleData({ ...updatedSchedule, events: Array.isArray(updatedSchedule.events) ? updatedSchedule.events : [] });
        return true; // Signal success
     } catch (err) { setUndoRedoError(err.message || "Could not perform redo."); return false; } finally { setIsRedoing(false); }
  };
  const shareSchedule = async (scheduleName) => {
    if (isLoading || saveStatus.saving || isControlLoading || isAddingCustom || isUndoing || isRedoing || isSharing) { console.log("ScheduleContext: Already processing..."); return; }
    if (!currentUser || !scheduleName) { setShareError("Cannot share: User not logged in or no schedule name provided."); return; }
    setIsSharing(true); setShareError(null); setSharePath(null); setError(null); setControlError(null); setCustomEventError(null); setUndoRedoError(null);
    let scheduleToShare = null;
    try {
      const loadApiUrl = `http://localhost:7070/api/schedules/load/${encodeURIComponent(scheduleName.trim())}`;
      const loadResponse = await fetch(loadApiUrl, { method: 'PUT' });
      if (!loadResponse.ok) { let errorData; try { errorData = await parseJsonResponse(loadResponse); } catch (parseError) { throw parseError; } throw new Error(`Failed to load schedule content: ${errorData.error || errorData.message || `HTTP ${loadResponse.status}`}`); }
      scheduleToShare = await parseJsonResponse(loadResponse);
      if (!scheduleToShare || !scheduleToShare.name || typeof scheduleToShare.events === 'undefined') { throw new Error("Invalid schedule data received from Java API."); }
      const railsApiUrl = 'http://localhost:3000/api/v1/schedules/share';
      const payload = { username: currentUser.name, schedule_name: scheduleToShare.name, schedule_content: JSON.stringify(scheduleToShare) };
      const shareResponse = await fetch(railsApiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!shareResponse.ok) { let errorData; try { errorData = await parseJsonResponse(shareResponse); } catch (parseError) { throw parseError; } throw new Error(`Failed to create share link: ${errorData.error || errorData.message || `HTTP ${shareResponse.status}`}`); }
      const shareResult = await parseJsonResponse(shareResponse);
      if (!shareResult.share_url) { throw new Error("Rails API did not return a share URL."); }
      const urlObject = new URL(shareResult.share_url);
      const path = urlObject.pathname;
      setSharePath(path); // Set path state
    } catch (err) { setShareError(err.message || "Could not share schedule."); setSharePath(null); } finally { setIsSharing(false); }
  };


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
    isUndoing,
    isRedoing,
    undoRedoError,
    isSharing,
    shareError,
    sharePath,
    setSharePath,
    fetchSchedule,
    addCourse,
    removeCourse,
    removeEvent,
    saveSchedule,
    loadSchedule,
    createNewSchedule,
    deleteSchedule, // ***** EXPORT deleteSchedule *****
    addCustomEvent,
    undoSchedule,
    redoSchedule,
    shareSchedule
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