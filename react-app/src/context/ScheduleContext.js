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
  const { currentUser } = useAuth(); // Get user status from AuthContext

  const [scheduleData, setScheduleData] = useState(null); // Holds the { name: '...', events: [...] } object
  const [isLoading, setIsLoading] = useState(false); // General loading for fetch/add/remove
  const [error, setError] = useState(null); // General error for fetch/add/remove
  const [saveStatus, setSaveStatus] = useState({ saving: false, error: null, success: false });
  const [controlError, setControlError] = useState(null); // Specific errors for load/create actions
  const [isControlLoading, setIsControlLoading] = useState(false); // Specific loading for load/create


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

      // ***** START OF CHANGE *****
      // Helper function to parse JSON or throw detailed error
      const parseJsonResponse = async (response) => {
          const text = await response.text(); // Get raw text first
          try {
              return JSON.parse(text); // Try to parse as JSON
          } catch (e) {
              console.error("Failed to parse JSON response. Raw text:", text);
              // Throw a more informative error
              throw new Error(`Expected JSON, but received non-JSON response. Status: ${response.status}. Response body starts with: ${text.substring(0, 100)}`);
          }
      };
      // ***** END OF CHANGE *****

      if (!response.ok) {
        // ***** START OF CHANGE *****
        // Try to parse error JSON, but handle non-JSON responses gracefully
        let errorData;
        try {
            errorData = await parseJsonResponse(response);
        } catch (parseError) {
            // If parsing failed (e.g., received HTML), use the parsing error message
             throw parseError;
        }
        // ***** END OF CHANGE *****

        if (response.status === 404) {
          console.log("ScheduleContext: No active schedule found on backend (404). Triggering select/create state.");
          setScheduleData({ name: 'No Schedule Loaded', events: [] });
          setError(null);
        } else {
          throw new Error(errorData.error || errorData.message || `HTTP error! Status: ${response.status}`);
        }
      } else {
        // ***** START OF CHANGE *****
        // Use the helper for successful responses too
        const data = await parseJsonResponse(response);
        // ***** END OF CHANGE *****
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

      // ***** START OF CHANGE *****
      // Re-use the JSON parsing helper
       const parseJsonResponse = async (response) => {
          const text = await response.text();
          try { return JSON.parse(text); }
          catch (e) {
              console.error("Failed to parse JSON response. Raw text:", text);
              throw new Error(`Expected JSON, but received non-JSON response. Status: ${response.status}. Response body starts with: ${text.substring(0, 100)}`);
          }
      };

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
      // ***** END OF CHANGE *****

      console.log("ScheduleContext: Course added, updated schedule received:", updatedSchedule);
      setScheduleData({ ...updatedSchedule, events: Array.isArray(updatedSchedule.events) ? updatedSchedule.events : [] });
      setError(null);

    } catch (err) {
      console.error("ScheduleContext: Failed to add course:", err);
      setError(err.message || "Could not add course.");
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

        // ***** START OF CHANGE *****
        const parseJsonResponse = async (response) => { /* ... same helper as above ... */
            const text = await response.text();
            try { return JSON.parse(text); }
            catch (e) {
                console.error("Failed to parse JSON response. Raw text:", text);
                throw new Error(`Expected JSON, but received non-JSON response. Status: ${response.status}. Response body starts with: ${text.substring(0, 100)}`);
            }
        };

        if (!response.ok) {
            let errorData;
            try { errorData = await parseJsonResponse(response); }
            catch (parseError) { throw parseError; }
            throw new Error(errorData.error || errorData.message || `HTTP error! Status: ${response.status}`);
        }

        const updatedSchedule = await parseJsonResponse(response);
        // ***** END OF CHANGE *****

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

        // ***** START OF CHANGE *****
         const parseJsonResponse = async (response) => { /* ... same helper as above ... */
            const text = await response.text();
            try { return JSON.parse(text); }
            catch (e) {
                console.error("Failed to parse JSON response. Raw text:", text);
                throw new Error(`Expected JSON, but received non-JSON response. Status: ${response.status}. Response body starts with: ${text.substring(0, 100)}`);
            }
        };

        if (!response.ok) {
            let errorData;
            try { errorData = await parseJsonResponse(response); }
            catch (parseError) { throw parseError; }
            throw new Error(errorData.error || errorData.message || `HTTP error! Status: ${response.status}`);
        }

        const result = await parseJsonResponse(response);
        // ***** END OF CHANGE *****

      console.log("ScheduleContext: Save successful:", result.message);
      setSaveStatus({ saving: false, error: null, success: true });
      setTimeout(() => setSaveStatus(prev => ({ ...prev, success: false })), 3000);
    } catch (err) {
      console.error("ScheduleContext: Failed to save schedule:", err);
      setSaveStatus({ saving: false, error: err.message || "Could not save schedule.", success: false });
    }
  };

  // Load schedule - Apply similar robust JSON parsing
  const loadSchedule = async (scheduleName) => {
     if (!currentUser) { /* ... */ return; }
     if (!scheduleName || !scheduleName.trim()) { /* ... */ return; }
     if (isLoading || saveStatus.saving || isControlLoading) { /* ... */ return; }
    console.log("ScheduleContext: Attempting to load schedule:", scheduleName);
    setIsControlLoading(true);
    setControlError(null);
    setError(null);
    setSaveStatus({ saving: false, error: null, success: false });

    try {
      const apiUrl = `http://localhost:7070/api/schedules/load/${encodeURIComponent(scheduleName.trim())}`;
      const response = await fetch(apiUrl, { method: 'PUT' });

        // ***** START OF CHANGE *****
         const parseJsonResponse = async (response) => { /* ... same helper as above ... */
            const text = await response.text();
            try { return JSON.parse(text); }
            catch (e) {
                console.error("Failed to parse JSON response. Raw text:", text);
                throw new Error(`Expected JSON, but received non-JSON response. Status: ${response.status}. Response body starts with: ${text.substring(0, 100)}`);
            }
        };

        if (!response.ok) {
            let errorData;
            try { errorData = await parseJsonResponse(response); }
            catch (parseError) { throw parseError; }
            throw new Error(errorData.error || errorData.message || `HTTP error! Status: ${response.status}`);
        }

        const loadedData = await parseJsonResponse(response);
        // ***** END OF CHANGE *****

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

  // Create new schedule - Apply similar robust JSON parsing
  const createNewSchedule = async (scheduleName) => {
     if (!currentUser) { /* ... */ return; }
     if (!scheduleName || !scheduleName.trim()) { /* ... */ return; }
     if (isLoading || saveStatus.saving || isControlLoading) { /* ... */ return; }
    console.log("ScheduleContext: Attempting to create schedule:", scheduleName);
    setIsControlLoading(true);
    setControlError(null);
    setError(null);
    setSaveStatus({ saving: false, error: null, success: false });

    try {
        const apiUrl = 'http://localhost:7070/api/schedules/new';
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: scheduleName.trim() })
        });

        // ***** START OF CHANGE *****
         const parseJsonResponse = async (response) => { /* ... same helper as above ... */
            const text = await response.text();
            try { return JSON.parse(text); }
            catch (e) {
                console.error("Failed to parse JSON response. Raw text:", text);
                throw new Error(`Expected JSON, but received non-JSON response. Status: ${response.status}. Response body starts with: ${text.substring(0, 100)}`);
            }
        };

         if (!response.ok) {
            let errorData;
            try { errorData = await parseJsonResponse(response); }
            catch (parseError) { throw parseError; }

             if (response.status === 409) {
                 throw new Error(errorData.error || errorData.message || "A schedule with this name already exists.");
             } else {
                throw new Error(errorData.error || errorData.message || `HTTP error! Status: ${response.status}`);
             }
        }

        const newData = await parseJsonResponse(response);
        // ***** END OF CHANGE *****

        console.log("ScheduleContext: New schedule created successfully:", newData);
        setScheduleData({ ...newData, events: Array.isArray(newData.events) ? newData.events : [] });
        setControlError(null);

    } catch (err) {
        console.error("ScheduleContext: Failed to create schedule:", err);
        setControlError(err.message || "Could not create the new schedule.");
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
