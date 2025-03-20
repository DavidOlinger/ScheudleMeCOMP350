import com.google.gson.Gson;
import com.google.gson.GsonBuilder;

import java.io.FileReader;
import java.io.IOException;
import java.util.HashSet;
import java.util.Set;
import java.util.Stack;

public class ScheduleManager {
    public User user;
    private Stack<Schedule> editHistory;
    private Stack<Schedule> undoneHistory;
    public static Schedule currentSchedule;
    public Search currentSearch;
    public CalendarView calendarView;

    public ScheduleManager() {
        this.calendarView = new CalendarView();
    }

    public static Schedule getCurrentSchedule() {
        return currentSchedule;
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
            System.out.println("Schedule loaded from " + filePath);
            
            // Set as current schedule
            currentSchedule = loadedSchedule;
            
            // Debug info
            System.out.println("Loaded schedule with " + loadedSchedule.events.size() + " events");
            for (Event event : loadedSchedule.events) {
                System.out.println("Loaded event: " + event.getClass().getName());
            }
            
            return loadedSchedule;
        } catch (IOException e) {
            System.out.println("Error loading schedule file: " + e.getMessage());
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
        if (currentSchedule.CheckConflicts(e)) {
            System.out.println("Error: Event conflicts with existing events in the schedule.");
            return true;
        } else {
            currentSchedule.events.add(e);
            return false;
        }
    }

    /**
     * Removes an event from the current schedule.
     *
     * @param e The event to remove.
     */
    public void remEvent(Event e) {
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
}