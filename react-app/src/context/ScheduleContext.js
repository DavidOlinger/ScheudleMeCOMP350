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
  const [isUndoing, setIsUndoing] = useState(false); // Loading for undo
  const [isRedoing, setIsRedoing] = useState(false); // Loading for redo
  const [undoRedoError, setUndoRedoError] = useState(null); // Specific error for undo/redo
  const [isSharing, setIsSharing] = useState(false); // Loading for share operation
  const [shareError, setShareError] = useState(null); // Specific error for share operation
  const [sharePath, setSharePath] = useState(null); // Store only the path part (e.g., /s/TOKEN)


  // --- Schedule Management Functions ---

  const fetchSchedule = useCallback(async () => {
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

  // ===============================================================
  // Updated addCourse function (includes section)
  // ===============================================================
  const addCourse = async (course) => {
     if (!currentUser || !scheduleData || scheduleData.name === 'No Schedule Loaded') { setError("Please load or create a schedule to add courses."); return false; }
     if (!course || !course.subject || typeof course.courseCode !== 'number' || !course.section) { setError("Cannot add course: missing subject, course code, or section."); return false; }
     if (isLoading || saveStatus.saving || isControlLoading || isAddingCustom || isUndoing || isRedoing || isSharing) { console.log("ScheduleContext: Already processing..."); return false; }

     setIsLoading(true); setError(null); setControlError(null); setSaveStatus({ saving: false, error: null, success: false }); setCustomEventError(null); setUndoRedoError(null); setShareError(null); setSharePath(null);

     try {
       const apiUrl = 'http://localhost:7070/api/schedule/current/add';
       const requestBody = {
           subject: course.subject,
           courseCode: course.courseCode,
           section: course.section
       };
       // Define response inside try block
       const response = await fetch(apiUrl, {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify(requestBody)
       });

       if (!response.ok) {
         let errorData; try { errorData = await parseJsonResponse(response); } catch (parseError) { throw parseError; }
          if (response.status === 409) {
              throw new Error(errorData.error || errorData.message || "Conflict detected. Course not added.");
          } else {
             throw new Error(errorData.error || errorData.message || `HTTP error! Status: ${response.status}`);
          }
       }
       const updatedSchedule = await parseJsonResponse(response);
       console.log("ScheduleContext: Course added, updated schedule received:", updatedSchedule);
       setScheduleData({ ...updatedSchedule, events: Array.isArray(updatedSchedule.events) ? updatedSchedule.events : [] });
       setError(null);
       return true;
     } catch (err) {
       console.error("ScheduleContext: Failed to add course:", err);
       setError(err.message || "Could not add course.");
       return false;
     } finally {
       setIsLoading(false);
     }
  };
  // ===============================================================

  const removeCourse = async (course) => {
     if (!currentUser || !scheduleData || scheduleData.name === 'No Schedule Loaded') { setError("Please load or create a schedule."); return; }
     if (typeof course.courseCode !== 'number') { setError("Invalid course data."); return; }
     if (isLoading || saveStatus.saving || isControlLoading || isAddingCustom || isUndoing || isRedoing || isSharing) { console.log("ScheduleContext: Already processing..."); return; }

     setIsLoading(true); setError(null); setControlError(null); setSaveStatus({ saving: false, error: null, success: false }); setCustomEventError(null); setUndoRedoError(null); setShareError(null); setSharePath(null);

     try {
       const apiUrl = `http://localhost:7070/api/schedule/current/remove/${course.courseCode}`;
       // Define response inside try block
       const response = await fetch(apiUrl, { method: 'DELETE' });
        if (!response.ok) {
            let errorData; try { errorData = await parseJsonResponse(response); } catch (parseError) { throw parseError; }
            throw new Error(errorData.error || errorData.message || `HTTP error! Status: ${response.status}`);
        }
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

  const removeEvent = async (eventData) => {
     if (!currentUser || !scheduleData || scheduleData.name === 'No Schedule Loaded') { setError("Please load or create a schedule."); return false; }
     if (!eventData || !eventData.name || typeof eventData.days === 'undefined' || !eventData.time || typeof eventData.time.startTime !== 'number' || typeof eventData.time.endTime !== 'number') { setError("Invalid event data."); return false; }
     if (isLoading || saveStatus.saving || isControlLoading || isAddingCustom || isUndoing || isRedoing || isSharing) { console.log("ScheduleContext: Already processing..."); return false; }

     setIsLoading(true); setError(null); setControlError(null); setSaveStatus({ saving: false, error: null, success: false }); setCustomEventError(null); setUndoRedoError(null); setShareError(null); setSharePath(null);

     try {
       const apiUrl = 'http://localhost:7070/api/schedule/current/remove-event';
       const requestBody = {
           name: eventData.name,
           days: eventData.days,
           startTimeSeconds: eventData.time.startTime,
           endTimeSeconds: eventData.time.endTime
       };
       // Define response inside try block
       const response = await fetch(apiUrl, {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify(requestBody)
       });
        if (!response.ok) {
            let errorData;
            try { errorData = await parseJsonResponse(response); } catch (parseError) { throw parseError; }
            throw new Error(errorData.error || errorData.message || `HTTP error! Status: ${response.status}`);
        }
        const updatedSchedule = await parseJsonResponse(response);
        console.log("ScheduleContext: Event removed, updated schedule received:", updatedSchedule);
        setScheduleData({ ...updatedSchedule, events: Array.isArray(updatedSchedule.events) ? updatedSchedule.events : [] });
        return true;
     } catch (err) {
         console.error("ScheduleContext: Failed to remove event:", err);
         setError(err.message || "Could not remove event.");
         return false;
     } finally {
         setIsLoading(false);
     }
   };

  const saveSchedule = async () => {
     if (!currentUser || !scheduleData || scheduleData.name === 'No Schedule Loaded') { setSaveStatus({ saving: false, error: "No active schedule to save.", success: false }); return; }
     if (isLoading || saveStatus.saving || isControlLoading || isAddingCustom || isUndoing || isRedoing || isSharing) { console.log("ScheduleContext: Already processing..."); return; }

     setSaveStatus({ saving: true, error: null, success: false }); setError(null); setControlError(null); setCustomEventError(null); setUndoRedoError(null); setShareError(null); setSharePath(null);

     try {
       const apiUrl = 'http://localhost:7070/api/schedules/save';
       // Define response inside try block
       const response = await fetch(apiUrl, { method: 'POST' });
        if (!response.ok) {
            let errorData; try { errorData = await parseJsonResponse(response); } catch (parseError) { throw parseError; }
            throw new Error(errorData.error || errorData.message || `HTTP error! Status: ${response.status}`);
        }
        const result = await parseJsonResponse(response); // Use parseJsonResponse helper
        console.log("ScheduleContext: Save successful:", result.message);
        setSaveStatus({ saving: false, error: null, success: true });
        setTimeout(() => setSaveStatus(prev => ({ ...prev, success: false })), 3000);
     } catch (err) {
       console.error("ScheduleContext: Failed to save schedule:", err);
       setSaveStatus({ saving: false, error: err.message || "Could not save schedule.", success: false });
     }
     // No finally block needed here as setSaveStatus handles loading state
   };

  const loadSchedule = async (scheduleName) => {
     if (!currentUser) { setControlError("Not logged in."); return; }
     if (!scheduleName || !scheduleName.trim()) { setControlError("Please select a schedule name."); return; }
     if (isLoading || saveStatus.saving || isControlLoading || isAddingCustom || isUndoing || isRedoing || isSharing) { console.log("ScheduleContext: Already processing..."); return; }

     setIsControlLoading(true); setControlError(null); setError(null); setSaveStatus({ saving: false, error: null, success: false }); setCustomEventError(null); setUndoRedoError(null); setShareError(null); setSharePath(null);

     try {
       const apiUrl = `http://localhost:7070/api/schedules/load/${encodeURIComponent(scheduleName.trim())}`;
       // Define response inside try block
       const response = await fetch(apiUrl, { method: 'PUT' });
        if (!response.ok) {
            let errorData; try { errorData = await parseJsonResponse(response); } catch (parseError) { throw parseError; }
            throw new Error(errorData.error || errorData.message || `HTTP error! Status: ${response.status}`);
        }
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

  const createNewSchedule = async (scheduleName) => {
     if (!currentUser) { setControlError("Not logged in."); return; }
     if (!scheduleName || !scheduleName.trim()) { setControlError("Please enter a schedule name."); return; }
     if (isLoading || saveStatus.saving || isControlLoading || isAddingCustom || isUndoing || isRedoing || isSharing) { console.log("ScheduleContext: Already processing..."); return; }

     setIsControlLoading(true); setControlError(null); setError(null); setSaveStatus({ saving: false, error: null, success: false }); setCustomEventError(null); setUndoRedoError(null); setShareError(null); setSharePath(null);

     try {
        const apiUrl = 'http://localhost:7070/api/schedules/new';
        // Define response inside try block
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: scheduleName.trim() })
        });
         if (!response.ok) {
            let errorData; try { errorData = await parseJsonResponse(response); } catch (parseError) { throw parseError; }
             if (response.status === 409) { throw new Error(errorData.error || errorData.message || "A schedule with this name already exists."); }
             else { throw new Error(errorData.error || errorData.message || `HTTP error! Status: ${response.status}`); }
        }
        // Define responseData inside try block
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

  const addCustomEvent = async (eventData) => {
     if (!currentUser || !scheduleData || scheduleData.name === 'No Schedule Loaded') { setCustomEventError("Please load or create a schedule."); return false; }
     if (isLoading || saveStatus.saving || isControlLoading || isAddingCustom || isUndoing || isRedoing || isSharing) { console.log("ScheduleContext: Already processing..."); return false; }

     setIsAddingCustom(true); setCustomEventError(null); setError(null); setControlError(null); setSaveStatus({ saving: false, error: null, success: false }); setUndoRedoError(null); setShareError(null); setSharePath(null);

     try {
       const apiUrl = 'http://localhost:7070/api/schedule/current/add-custom';
       // Define response inside try block
       const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(eventData)
       });
       if (!response.ok) {
         let errorData; try { errorData = await parseJsonResponse(response); } catch (parseError) { throw parseError; }
          if (response.status === 409) { throw new Error(errorData.error || errorData.message || "Conflict detected. Event not added."); }
          else { throw new Error(errorData.error || errorData.message || `HTTP error! Status: ${response.status}`); }
       }
       const updatedSchedule = await parseJsonResponse(response);
       console.log("ScheduleContext: Custom event added, updated schedule received:", updatedSchedule);
       setScheduleData({ ...updatedSchedule, events: Array.isArray(updatedSchedule.events) ? updatedSchedule.events : [] });
       setCustomEventError(null);
       return true;
     } catch (err) {
       console.error("ScheduleContext: Failed to add custom event:", err);
       setCustomEventError(err.message || "Could not add the custom event.");
       return false;
     } finally {
       setIsAddingCustom(false);
     }
  };

  const undoSchedule = async () => {
     if (isLoading || saveStatus.saving || isControlLoading || isAddingCustom || isUndoing || isRedoing || isSharing) { console.log("ScheduleContext: Already processing..."); return; }
     if (!currentUser || !scheduleData || scheduleData.name === 'No Schedule Loaded') { setUndoRedoError("Please load a schedule."); return; }

     setIsUndoing(true); setUndoRedoError(null); setError(null); setControlError(null); setCustomEventError(null); setShareError(null); setSharePath(null);

     try {
       const apiUrl = 'http://localhost:7070/api/schedule/current/undo';
       // Define response inside try block
       const response = await fetch(apiUrl, { method: 'POST' });

       if (!response.ok) {
         let errorData;
         try { errorData = await parseJsonResponse(response); } catch (parseError) { throw parseError; }
         throw new Error(errorData.error || errorData.message || `HTTP error! Status: ${response.status}`);
       }

       const updatedSchedule = await parseJsonResponse(response);
       console.log("ScheduleContext: Undo successful, updated schedule received:", updatedSchedule);
       setScheduleData({ ...updatedSchedule, events: Array.isArray(updatedSchedule.events) ? updatedSchedule.events : [] });

     } catch (err) {
       console.error("ScheduleContext: Failed to undo:", err);
       setUndoRedoError(err.message || "Could not perform undo.");
     } finally {
       setIsUndoing(false);
     }
  };

  const redoSchedule = async () => {
     if (isLoading || saveStatus.saving || isControlLoading || isAddingCustom || isUndoing || isRedoing || isSharing) { console.log("ScheduleContext: Already processing..."); return; }
     if (!currentUser || !scheduleData || scheduleData.name === 'No Schedule Loaded') { setUndoRedoError("Please load a schedule."); return; }

     setIsRedoing(true); setUndoRedoError(null); setError(null); setControlError(null); setCustomEventError(null); setShareError(null); setSharePath(null);

     try {
       const apiUrl = 'http://localhost:7070/api/schedule/current/redo';
       // Define response inside try block
       const response = await fetch(apiUrl, { method: 'POST' });

       if (!response.ok) {
         let errorData;
         try { errorData = await parseJsonResponse(response); } catch (parseError) { throw parseError; }
         throw new Error(errorData.error || errorData.message || `HTTP error! Status: ${response.status}`);
       }

       const updatedSchedule = await parseJsonResponse(response);
       console.log("ScheduleContext: Redo successful, updated schedule received:", updatedSchedule);
       setScheduleData({ ...updatedSchedule, events: Array.isArray(updatedSchedule.events) ? updatedSchedule.events : [] });

     } catch (err) {
       console.error("ScheduleContext: Failed to redo:", err);
       setUndoRedoError(err.message || "Could not perform redo.");
     } finally {
       setIsRedoing(false);
     }
  };

  const shareSchedule = async (scheduleName) => {
    if (isLoading || saveStatus.saving || isControlLoading || isAddingCustom || isUndoing || isRedoing || isSharing) { console.log("ScheduleContext: Already processing..."); return; }
    if (!currentUser || !scheduleName) { setShareError("Cannot share: User not logged in or no schedule name provided."); return; }

    console.log(`ScheduleContext: Initiating share for schedule: ${scheduleName}`);
    setIsSharing(true); setShareError(null); setSharePath(null);
    setError(null); setControlError(null); setCustomEventError(null); setUndoRedoError(null);

    let scheduleToShare = null;

    try {
      // Step 1: Fetch schedule content from Java API
      console.log(`ScheduleContext: Fetching content for '${scheduleName}' from Java API...`);
      const loadApiUrl = `http://localhost:7070/api/schedules/load/${encodeURIComponent(scheduleName.trim())}`;
      const loadResponse = await fetch(loadApiUrl, { method: 'PUT' }); // Define loadResponse

      if (!loadResponse.ok) {
        let errorData; try { errorData = await parseJsonResponse(loadResponse); } catch (parseError) { throw parseError; }
        throw new Error(`Failed to load schedule content: ${errorData.error || errorData.message || `HTTP ${loadResponse.status}`}`);
      }
      scheduleToShare = await parseJsonResponse(loadResponse);
      console.log(`ScheduleContext: Content for '${scheduleName}' fetched.`);

      if (!scheduleToShare || !scheduleToShare.name || typeof scheduleToShare.events === 'undefined') { throw new Error("Invalid schedule data received from Java API."); }

      // Step 2: Send content to Rails API
      console.log(`ScheduleContext: Sending content for '${scheduleName}' to Rails API...`);
      const railsApiUrl = 'http://localhost:3000/api/v1/schedules/share';
      const payload = {
        username: currentUser.name,
        schedule_name: scheduleToShare.name,
        schedule_content: JSON.stringify(scheduleToShare)
      };
      // Define shareResponse inside try block
      const shareResponse = await fetch(railsApiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });

      if (!shareResponse.ok) {
         let errorData; try { errorData = await parseJsonResponse(shareResponse); } catch (parseError) { throw parseError; }
         throw new Error(`Failed to create share link: ${errorData.error || errorData.message || `HTTP ${shareResponse.status}`}`);
      }
      const shareResult = await parseJsonResponse(shareResponse);
      if (!shareResult.share_url) { throw new Error("Rails API did not return a share URL."); }

      // Extract PATH ONLY
      const urlObject = new URL(shareResult.share_url);
      const path = urlObject.pathname;
      console.log(`ScheduleContext: Share path created: ${path}`);
      setSharePath(path); // Set path state

    } catch (err) {
      console.error("ScheduleContext: Failed to share schedule:", err);
      setShareError(err.message || "Could not share schedule.");
      setSharePath(null);
    } finally {
      setIsSharing(false);
    }
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
    sharePath,    // Export the path state
    setSharePath, // Export setter to allow clearing
    fetchSchedule,
    addCourse,
    removeCourse,
    removeEvent,
    saveSchedule,
    loadSchedule,
    createNewSchedule,
    addCustomEvent,
    undoSchedule,
    redoSchedule,
    shareSchedule // Export share function
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
