// src/context/ScheduleContext.js
import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext'; // Need auth context to know if user is logged in

// Create the context
const ScheduleContext = createContext(null);

/**
 * ScheduleProvider Component
 * Manages the state of the currently active schedule (fetching, adding, removing, saving, loading, creating).
 */
export const ScheduleProvider = ({ children }) => {
  const { currentUser, updateCurrentUser } = useAuth(); // Get user status and update function

  const [scheduleData, setScheduleData] = useState(null); // Holds the { name: '...', events: [...] } object
  const [isLoading, setIsLoading] = useState(false); // General loading for fetch/add/remove
  const [error, setError] = useState(null); // General error for fetch/add/remove
  const [saveStatus, setSaveStatus] = useState({ saving: false, error: null, success: false });
  const [controlError, setControlError] = useState(null); // Specific errors for load/create actions
  const [isControlLoading, setIsControlLoading] = useState(false); // Specific loading for load/create


  // Helper function to parse JSON or throw detailed error
  const parseJsonResponse = async (response) => {
      const text = await response.text(); // Get raw text first
      try {
          if (!text) { // Handle empty response body
              // Decide how to handle empty responses - maybe return null or a specific object
              // For now, let's throw an error for unexpected empty bodies
              throw new Error(`Received empty response body. Status: ${response.status}`);
          }
          return JSON.parse(text); // Try to parse as JSON
      } catch (e) {
          console.error("Failed to parse JSON response. Raw text:", text);
          // Throw a more informative error
          throw new Error(`Expected JSON, but received non-JSON response. Status: ${response.status}. Response body starts with: ${text.substring(0, 100)}`);
      }
  };


  // Function to fetch the currently active schedule from the backend
  const fetchSchedule = useCallback(async () => {
    if (!currentUser) {
      console.log("ScheduleContext: No user, clearing schedule.");
      setScheduleData(null);
      setError(null);
      setIsLoading(false);
      setControlError(null);
      setIsControlLoading(false);
      return;
    }

    console.log("ScheduleContext: Fetching current schedule...");
    setIsLoading(true);
    setError(null);
    setControlError(null);
    setSaveStatus({ saving: false, error: null, success: false });

    try {
      const apiUrl = 'http://localhost:7070/api/schedule/current';
      const response = await fetch(apiUrl);

      if (!response.ok) {
        let errorData;
        try {
            errorData = await parseJsonResponse(response);
        } catch (parseError) {
             throw parseError;
        }

        if (response.status === 404) {
          console.log("ScheduleContext: No active schedule found on backend (404). Triggering select/create state.");
          setScheduleData({ name: 'No Schedule Loaded', events: [] }); // Set specific state for no schedule
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
      setScheduleData(null); // Clear data on error
    } finally {
      setIsLoading(false);
    }
  }, [currentUser]); // Refetch when user changes

  // Effect to fetch schedule when currentUser changes (login/logout)
  useEffect(() => {
    fetchSchedule();
  }, [fetchSchedule]);

  // --- Course Add/Remove Functions ---
  const addCourse = async (course) => {
     if (!currentUser || !scheduleData || scheduleData.name === 'No Schedule Loaded') {
      setError("Please load or create a schedule to add courses.");
      return;
    }
     if (isLoading || saveStatus.saving || isControlLoading) {
        console.log("ScheduleContext: Already processing, cannot add course now.");
        return;
    }
    console.log("ScheduleContext: Attempting to add course:", course.courseCode);
    setIsLoading(true);
    setError(null);
    setControlError(null);
    setSaveStatus({ saving: false, error: null, success: false });

    try {
      const apiUrl = 'http://localhost:7070/api/schedule/current/add';
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ courseCode: course.courseCode }),
      });

      if (!response.ok) {
        let errorData;
        try { errorData = await parseJsonResponse(response); }
        catch (parseError) { throw parseError; }

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

    } catch (err) {
      console.error("ScheduleContext: Failed to add course:", err);
      setError(err.message || "Could not add course.");
      // Optionally refetch schedule on error? Or just show error.
      // fetchSchedule();
    } finally {
      setIsLoading(false);
    }
  };

  // Remove course - Apply similar robust JSON parsing
  const removeCourse = async (course) => {
    if (!currentUser || !scheduleData || scheduleData.name === 'No Schedule Loaded') {
      setError("Please load or create a schedule to remove courses.");
      return;
    }
     if (isLoading || saveStatus.saving || isControlLoading) {
        console.log("ScheduleContext: Already processing, cannot remove course now.");
        return;
    }
    console.log("ScheduleContext: Attempting to remove course:", course.courseCode);
    setIsLoading(true);
    setError(null);
    setControlError(null);
    setSaveStatus({ saving: false, error: null, success: false });

     try {
       const apiUrl = `http://localhost:7070/api/schedule/current/remove/${course.courseCode}`;
       const response = await fetch(apiUrl, { method: 'DELETE' });

        if (!response.ok) {
            let errorData;
            try { errorData = await parseJsonResponse(response); }
            catch (parseError) { throw parseError; }
            throw new Error(errorData.error || errorData.message || `HTTP error! Status: ${response.status}`);
        }

        const updatedSchedule = await parseJsonResponse(response);

        console.log("ScheduleContext: Course removed, updated schedule received:", updatedSchedule);
        setScheduleData({ ...updatedSchedule, events: Array.isArray(updatedSchedule.events) ? updatedSchedule.events : [] });
        setError(null);
    } catch (err) {
         console.error("ScheduleContext: Failed to remove course:", err);
         setError(err.message || "Could not remove course.");
         // Optionally refetch schedule on error?
         // fetchSchedule();
    } finally {
        setIsLoading(false);
    }
  };

  // Save schedule - Apply similar robust JSON parsing
  const saveSchedule = async () => {
    if (!currentUser || !scheduleData || scheduleData.name === 'No Schedule Loaded') {
      setSaveStatus({ saving: false, error: "No active schedule to save.", success: false });
      return;
    }
     if (isLoading || saveStatus.saving || isControlLoading) {
        console.log("ScheduleContext: Already processing, cannot save schedule now.");
        return;
    }
    console.log("ScheduleContext: Attempting to save schedule:", scheduleData.name);
    setSaveStatus({ saving: true, error: null, success: false });
    setError(null);
    setControlError(null);

    try {
      const apiUrl = 'http://localhost:7070/api/schedules/save';
      const response = await fetch(apiUrl, { method: 'POST' });

        if (!response.ok) {
            let errorData;
            try { errorData = await parseJsonResponse(response); }
            catch (parseError) { throw parseError; }
            throw new Error(errorData.error || errorData.message || `HTTP error! Status: ${response.status}`);
        }

        const result = await parseJsonResponse(response);

      console.log("ScheduleContext: Save successful:", result.message);
      setSaveStatus({ saving: false, error: null, success: true });
      // Reset success indicator after a delay
      setTimeout(() => setSaveStatus(prev => ({ ...prev, success: false })), 3000);
    } catch (err) {
      console.error("ScheduleContext: Failed to save schedule:", err);
      setSaveStatus({ saving: false, error: err.message || "Could not save schedule.", success: false });
    }
    // No finally block needed to set saving: false, as it's done in both try/catch
  };

  // Load schedule - Apply similar robust JSON parsing
  const loadSchedule = async (scheduleName) => {
     if (!currentUser) { setControlError("Not logged in."); return; }
     if (!scheduleName || !scheduleName.trim()) { setControlError("Please select a schedule name."); return; }
     if (isLoading || saveStatus.saving || isControlLoading) { console.log("ScheduleContext: Already processing, cannot load schedule now."); return; }
    console.log("ScheduleContext: Attempting to load schedule:", scheduleName);
    setIsControlLoading(true);
    setControlError(null);
    setError(null);
    setSaveStatus({ saving: false, error: null, success: false });

    try {
      const apiUrl = `http://localhost:7070/api/schedules/load/${encodeURIComponent(scheduleName.trim())}`;
      const response = await fetch(apiUrl, { method: 'PUT' });

        if (!response.ok) {
            let errorData;
            try { errorData = await parseJsonResponse(response); }
            catch (parseError) { throw parseError; }
            throw new Error(errorData.error || errorData.message || `HTTP error! Status: ${response.status}`);
        }

        const loadedData = await parseJsonResponse(response);

      console.log("ScheduleContext: Schedule loaded successfully:", loadedData);
      setScheduleData({ ...loadedData, events: Array.isArray(loadedData.events) ? loadedData.events : [] });
      setControlError(null); // Clear control-specific error on success

    } catch (err) {
      console.error("ScheduleContext: Failed to load schedule:", err);
      setControlError(err.message || "Could not load the selected schedule.");
      // Do not clear scheduleData here, keep the previously loaded one if load fails
    } finally {
      setIsControlLoading(false);
    }
  };

  // Create new schedule - MODIFIED to update AuthContext
  const createNewSchedule = async (scheduleName) => {
     if (!currentUser) { setControlError("Not logged in."); return; }
     if (!scheduleName || !scheduleName.trim()) { setControlError("Please enter a schedule name."); return; }
     if (isLoading || saveStatus.saving || isControlLoading) { console.log("ScheduleContext: Already processing, cannot create schedule now."); return; }
    console.log("ScheduleContext: Attempting to create schedule:", scheduleName);
    setIsControlLoading(true);
    setControlError(null);
    setError(null); // Clear general errors too
    setSaveStatus({ saving: false, error: null, success: false });

    try {
        const apiUrl = 'http://localhost:7070/api/schedules/new';
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: scheduleName.trim() })
        });

         if (!response.ok) {
            let errorData;
            try { errorData = await parseJsonResponse(response); }
            catch (parseError) { throw parseError; }

             if (response.status === 409) { // Conflict (name exists)
                 throw new Error(errorData.error || errorData.message || "A schedule with this name already exists.");
             } else {
                throw new Error(errorData.error || errorData.message || `HTTP error! Status: ${response.status}`);
             }
        }

        // ***** START OF MODIFICATION *****
        // Expecting { schedule: { ... }, user: { ... } } from backend
        const responseData = await parseJsonResponse(response);
        const newSchedule = responseData.schedule;
        const updatedUser = responseData.user;

        if (!newSchedule || !updatedUser) {
            throw new Error("Invalid response received from server after creating schedule.");
        }
        // ***** END OF MODIFICATION *****

        console.log("ScheduleContext: New schedule created successfully:", newSchedule);
        console.log("ScheduleContext: Updated user data received:", updatedUser);

        // Update schedule context state
        setScheduleData({ ...newSchedule, events: Array.isArray(newSchedule.events) ? newSchedule.events : [] });
        setControlError(null); // Clear control error on success

        // ***** START OF MODIFICATION *****
        // Update auth context state with the latest user data (including the new schedule list)
        updateCurrentUser(updatedUser);
        // ***** END OF MODIFICATION *****

    } catch (err) {
        console.error("ScheduleContext: Failed to create schedule:", err);
        setControlError(err.message || "Could not create the new schedule.");
        // Don't clear scheduleData here
    } finally {
        setIsControlLoading(false);
    }
  };


  // Value provided by the context
  const value = {
    scheduleData,
    isLoading,
    error,
    saveStatus,
    isControlLoading,
    controlError,
    fetchSchedule,
    addCourse,
    removeCourse,
    saveSchedule,
    loadSchedule,
    createNewSchedule
  };

  return <ScheduleContext.Provider value={value}>{children}</ScheduleContext.Provider>;
};

/**
 * useSchedule Hook
 * Custom hook to easily consume the ScheduleContext.
 */
export const useSchedule = () => {
  const context = useContext(ScheduleContext);
  if (context === undefined) {
    throw new Error('useSchedule must be used within a ScheduleProvider');
  }
  return context;
};
