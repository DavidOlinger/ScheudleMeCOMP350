import com.google.gson.Gson;
import com.google.gson.GsonBuilder;

import java.io.FileReader;
import java.io.IOException;
import java.util.HashSet;
import java.util.Set;
import java.util.Stack;

public class ScheduleManager {
    public User user;
    public Stack<Schedule> editHistory;
    public Stack<Schedule> undoneHistory;
    public static Schedule currentSchedule;
    public Search currentSearch;
    public CalendarView calendarView;

    public ScheduleManager() {
        this.editHistory = new Stack<>();
        this.undoneHistory = new Stack<>();
        this.calendarView = new CalendarView();
    }

    public static Schedule getCurrentSchedule() {
        return currentSchedule;
    }

    /**
     * Initializes the undo/redo history after loading a schedule or creating a new one.
     * This ensures we have a clean state to start with.
     */
    public void initializeUndoRedoAfterLoad() {
        // Clear any existing history
        if (editHistory == null) {
            editHistory = new Stack<>();
        } else {
            editHistory.clear();
        }

        if (undoneHistory == null) {
            undoneHistory = new Stack<>();
        } else {
            undoneHistory.clear();
        }

        // If we have a current schedule, create an initial snapshot
        if (currentSchedule != null) {
            // Create a deep copy of the current schedule as the initial state
            Schedule initialState = new Schedule();
            initialState.name = currentSchedule.name;
            initialState.events = new HashSet<>(currentSchedule.events);
            editHistory.push(initialState);
        }
    }

    /**
     * Loads a schedule from a file in the user's directory.
     *
     * @param scheduleName The name of the schedule to load.
     * @return The loaded Schedule object, or null if the file doesn't exist or an error occurs.
     */
    public Schedule loadSchedule(String scheduleName) {
        // Define the file path for the schedule
        String filePath = "users/" + user.name + "/schedules/" + scheduleName + ".json";

        // Check if the schedule exists in the user's list
        if (!user.mySchedules.contains(filePath)) {
            System.out.println("Error: Schedule not found in user's list: " + scheduleName);
            return null;
        }

        try (FileReader reader = new FileReader(filePath)) {
            // Create a Gson instance with a custom deserializer for Event objects
            Gson gson = new GsonBuilder()
                    .registerTypeAdapter(Event.class, new EventDeserializer())
                    .create();

            // Deserialize the JSON file into a Schedule object
            Schedule loadedSchedule = gson.fromJson(reader, Schedule.class);
            // System.out.println("Schedule loaded from " + filePath);

            // Set as current schedule
            currentSchedule = loadedSchedule;

            // Debug info
            if (loadedSchedule != null && loadedSchedule.events != null) {
                //System.out.println("Loaded schedule with " + loadedSchedule.events.size() + " events");
                for (Event event : loadedSchedule.events) {
                    if (event != null) {
                        //System.out.println("Loaded event: " + event.getClass().getName());
                    }
                }
            } else {
                System.out.println("Warning: Loaded schedule is empty or null");
                // Initialize empty schedule if needed
                if (loadedSchedule.events == null) {
                    loadedSchedule.events = new HashSet<>();
                }
            }

            return loadedSchedule;
        } catch (IOException e) {
            System.out.println("Error loading schedule file: " + e.getMessage());
            return null;
        } catch (Exception e) {
            System.out.println("Unexpected error loading schedule: " + e.getMessage());
            e.printStackTrace();
            return null;
        }
    }

    /**
     * Creates a new schedule, saves it to a file, and sets it as the current schedule.
     *
     * @param name The name of the new schedule.
     */
    public void newSchedule(String name) {
        if (user == null) {
            System.out.println("Error: No user is logged in.");
            return;
        }

        // Create a new Schedule object
        Schedule newSchedule = new Schedule();
        newSchedule.name = name;
        newSchedule.events = new HashSet<>();

        // Save the new schedule to a file
        user.saveSchedule(newSchedule);

        // Add the file path to the user's list of schedules
        String filePath = "users/" + user.name + "/schedules/" + name + ".json";
        if (!user.mySchedules.contains(filePath)) {
            user.mySchedules.add(filePath);
        }

        // Set the new schedule as the current schedule
        currentSchedule = newSchedule;
        System.out.println("New schedule '" + name + "' created and saved.");
    }

    /**
     * Adds an event to the current schedule.
     *
     * @param e The event to add.
     * @return true if there was a conflict, false if the event was added successfully.
     */
    public boolean addEvent(Event e) {
        if (currentSchedule == null) {
            System.out.println("Error: No schedule is currently active.");
            return true;
        }

        if (currentSchedule.events == null) {
            currentSchedule.events = new HashSet<>();
        }

        if (currentSchedule.CheckConflicts(e)) {
            System.out.println("Error: Event conflicts with existing events in the schedule.");
            return true;
        }

        saveState();
        currentSchedule.events.add(e);
        return false;
    }

    /**
     * Removes an event from the current schedule.
     *
     * @param e The event to remove.
     */
    public void remEvent(Event e) {
        if (currentSchedule == null || currentSchedule.events == null) {
            System.out.println("Error: No active schedule or empty schedule.");
            return;
        }

        saveState();
        currentSchedule.events.remove(e);
        System.out.println(e.name + " was removed from schedule.");
    }

    /**
     * Logs in a user by verifying their username and password.
     *
     * @param username The username of the user.
     * @param password The password of the user.
     * @return True if login is successful, false otherwise.
     */
    public boolean loginUser(String username, String password) {
        // Load the user's data
        user = User.loadUserData(username);

        if (user == null) {
            System.out.println("Error: User not found.");
            return false;
        }

        // Check the password
        if (user.checkPassword(password)) {
            System.out.println("User logged in successfully: " + user.name);
            return true;
        } else {
            System.out.println("Error: Incorrect password.");
            return false;
        }
    }

    /**
     * Logs out the current user by saving their data to a file.
     */
    public void logoutUser() {
        if (user != null) {
            user.saveUserData();
            System.out.println("User logged out and data saved: " + user.name);
            user = null; // Clear the user field
        } else {
            System.out.println("Error: No user is currently logged in.");
        }
    }

    /**
     * Shows the calendar view with the current schedule and search results.
     */
    public void showCalendar() {
        calendarView.setSchedule(currentSchedule);
        if (currentSearch != null) {
            calendarView.setSearchResults(currentSearch.filteredResultsList);
        }
        calendarView.display();
    }

    /**
     * Saves the current state before making changes.
     */
    private void saveState() {
        if (currentSchedule != null) {
            // Ensure stacks are initialized
            if (editHistory == null) {
                editHistory = new Stack<>();
            }
            if (undoneHistory == null) {
                undoneHistory = new Stack<>();
            }

            // Create a deep copy of the current schedule
            Schedule copy = new Schedule();
            copy.name = currentSchedule.name;
            copy.events = new HashSet<>(currentSchedule.events);
            editHistory.push(copy);
            undoneHistory.clear(); // Clear redo stack when new change is made
        }
    }

    /**
     * Undoes the last change to the schedule.
     * @return true if undo was successful, false if no changes to undo
     */
    public boolean undo() {
        // Ensure stacks are initialized
        if (editHistory == null) {
            editHistory = new Stack<>();
            System.out.println("Nothing to undo.");
            return false;
        }

        // We need at least 2 items in history (initial state + at least one change)
        if (editHistory.isEmpty() || editHistory.size() <= 1) {
            System.out.println("Nothing to undo.");
            return false;
        }

        // Ensure the undone history stack is initialized
        if (undoneHistory == null) {
            undoneHistory = new Stack<>();
        }

        if (currentSchedule != null) {
            Schedule undoneState = new Schedule();
            undoneState.name = currentSchedule.name;
            if (currentSchedule.events != null) {
                undoneState.events = new HashSet<>(currentSchedule.events);
            } else {
                undoneState.events = new HashSet<>();
            }
            undoneHistory.push(undoneState);
        }

        currentSchedule = editHistory.pop();
        System.out.println("Last change undone.");
        return true;
    }

    /**
     * Redoes the last undone change.
     * @return true if redo was successful, false if no changes to redo
     */
    public boolean redo() {
        // Ensure stacks are initialized
        if (undoneHistory == null) {
            undoneHistory = new Stack<>();
            System.out.println("Nothing to redo.");
            return false;
        }

        if (undoneHistory.isEmpty()) {
            System.out.println("Nothing to redo.");
            return false;
        }

        // Ensure the edit history stack is initialized
        if (editHistory == null) {
            editHistory = new Stack<>();
        }

        if (currentSchedule != null) {
            Schedule currentState = new Schedule();
            currentState.name = currentSchedule.name;
            if (currentSchedule.events != null) {
                currentState.events = new HashSet<>(currentSchedule.events);
            } else {
                currentState.events = new HashSet<>();
            }
            editHistory.push(currentState);
        }

        currentSchedule = undoneHistory.pop();
        System.out.println("Change redone.");
        return true;
    }
}