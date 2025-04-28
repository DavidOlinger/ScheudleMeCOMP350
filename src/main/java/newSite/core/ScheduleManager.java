package newSite.core;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import java.io.FileReader;
import java.io.IOException;
import java.util.HashSet;
import java.util.Stack;

// **** REMOVE User import if User field is removed, or keep if methods need it as param ****
import newSite.core.User; // Keep for now as methods still use it temporarily

public class ScheduleManager {

    // **** REMOVE this field - It conflicts with stateless API design ****
    // public User user;
    // **** NOTE: Methods like loadSchedule/newSchedule currently REQUIRE this field ****
    // **** The controller uses a TEMPORARY, UNSAFE workaround to set it. ****
    // **** Proper fix involves changing method signatures here. ****
    public User user; // <<< Keep ONLY for the temporary workaround's sake

    // Instance history (problematic when linked to static currentSchedule)
    public Stack<Schedule> editHistory;
    public Stack<Schedule> undoneHistory;

    // **** STATIC SCHEDULE - The Core Problem for Concurrency ****
    public static Schedule currentSchedule; // <<< THIS NEEDS TO BE REMOVED/REPLACED

    // Keep search reference if controllers pass it or if needed internally
    public Search currentSearch;

    // Remove CalendarView - not used by API
    // public CalendarView calendarView;

    public ScheduleManager() {
        this.editHistory = new Stack<>();
        this.undoneHistory = new Stack<>();
        // this.calendarView = new CalendarView(); // Remove
    }

    // --- Methods operating on static currentSchedule (Unsafe for Concurrent API) ---
    public static Schedule getCurrentSchedule() { return currentSchedule; }
    public void initializeUndoRedoAfterLoad() { /* ... operates on static schedule ... */
        if (editHistory == null) editHistory = new Stack<>(); else editHistory.clear();
        if (undoneHistory == null) undoneHistory = new Stack<>(); else undoneHistory.clear();
        if (currentSchedule != null) {
            Schedule initialState = new Schedule();
            initialState.name = currentSchedule.name;
            initialState.events = new HashSet<>(currentSchedule.events);
            editHistory.push(initialState);
        }
    }
    public boolean addEvent(Event e) { /* ... operates on static schedule ... */
        if (currentSchedule == null) { System.out.println("Error: No static schedule active."); return true; }
        if (currentSchedule.events == null) { currentSchedule.events = new HashSet<>(); }
        if (currentSchedule.CheckConflicts(e)) { return true; }
        saveState(); // Uses instance history, operates on static schedule
        currentSchedule.events.add(e);
        return false;
    }
    public void remEvent(Event e) { /* ... operates on static schedule ... */
        if (currentSchedule == null || currentSchedule.events == null) { return; }
        saveState(); // Uses instance history, operates on static schedule
        currentSchedule.events.remove(e);
    }
    public boolean undo() { /* ... operates on instance history & static schedule ... */
        if (editHistory == null || editHistory.isEmpty() || editHistory.size() <= 1) { return false; }
        if (undoneHistory == null) { undoneHistory = new Stack<>(); }
        if (currentSchedule != null) {
            Schedule undoneState = new Schedule();
            undoneState.name = currentSchedule.name;
            undoneState.events = (currentSchedule.events != null) ? new HashSet<>(currentSchedule.events) : new HashSet<>();
            undoneHistory.push(undoneState);
        }
        currentSchedule = editHistory.pop(); // Modifies static schedule
        return true;
    }
    public boolean redo() { /* ... operates on instance history & static schedule ... */
        if (undoneHistory == null || undoneHistory.isEmpty()) { return false; }
        if (editHistory == null) { editHistory = new Stack<>(); }
        if (currentSchedule != null) {
            Schedule currentState = new Schedule();
            currentState.name = currentSchedule.name;
            currentState.events = (currentSchedule.events != null) ? new HashSet<>(currentSchedule.events) : new HashSet<>();
            editHistory.push(currentState);
        }
        currentSchedule = undoneHistory.pop(); // Modifies static schedule
        return true;
    }
    private void saveState() { /* ... operates on instance history & static schedule ... */
        if (currentSchedule != null) {
            if (editHistory == null) editHistory = new Stack<>();
            if (undoneHistory == null) undoneHistory = new Stack<>();
            Schedule copy = new Schedule();
            copy.name = currentSchedule.name;
            copy.events = new HashSet<>(currentSchedule.events);
            editHistory.push(copy);
            undoneHistory.clear();
        }
    }


    // --- Methods requiring temporary 'user' context (Unsafe for Concurrency) ---
    // These methods currently NEED scheduleManager.user to be set temporarily by the controller.
    // A better solution is to pass User/UID as a parameter here.

    /**
     * WARNING: Uses the instance `user` field (expected to be set temporarily by caller)
     * and sets the static `currentSchedule`. Unsafe for concurrent use.
     */
    public Schedule loadSchedule(String scheduleName) {
        if (this.user == null) { // Check if temporary user context was set
            System.err.println("Error: loadSchedule called but user context is null.");
            return null;
        }
        // Load using the User class method, which now uses UID based on the user object
        try {
            Schedule loadedSchedule = this.user.loadScheduleFile(scheduleName); // Load the specific file
            if (loadedSchedule != null) {
                currentSchedule = loadedSchedule; // <<< PROBLEM: Sets static schedule
            }
            return loadedSchedule; // Return the schedule found for this user
        } catch (Exception e) { // Catch exceptions from loadScheduleFile
            System.err.println("Error in loadSchedule for user " + this.user.firebaseUid + ", schedule " + scheduleName + ": " + e.getMessage());
            return null;
        }
    }

    /**
     * WARNING: Uses the instance `user` field (expected to be set temporarily by caller)
     * and sets the static `currentSchedule`. Unsafe for concurrent use.
     */
    public void newSchedule(String name) {
        if (this.user == null) { // Check if temporary user context was set
            System.err.println("Error: newSchedule called but user context is null.");
            return;
        }
        Schedule newSchedule = new Schedule();
        newSchedule.name = name;
        newSchedule.events = new HashSet<>();
        try {
            // User.saveSchedule now saves the schedule AND user data (mySchedules list)
            this.user.saveSchedule(newSchedule);
            currentSchedule = newSchedule; // <<< PROBLEM: Sets static schedule
            System.out.println("New schedule '" + name + "' created and saved for user UID " + this.user.firebaseUid);
        } catch (Exception e) {
            System.err.println("Error creating/saving new schedule for user UID " + this.user.firebaseUid + ": " + e.getMessage());
            // Consider re-throwing?
        }
    }

    // --- REMOVED Methods ---
    // REMOVED: loginUser method
    // REMOVED: logoutUser method
    // REMOVED: showCalendar method

}