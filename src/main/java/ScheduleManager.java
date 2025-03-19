import com.google.gson.Gson;
import com.google.gson.reflect.TypeToken;
import java.io.FileReader;
import java.io.IOException;
import java.lang.reflect.Type;

import java.util.HashSet;
import java.util.Stack;


public class ScheduleManager {


    public User user;
    private Stack<Schedule> editHistory;
    private Stack<Schedule> undoneHistory;

    public static Schedule currentSchedule;
    public Search currentSearch;


    public static Schedule getCurrentSchedule() {
        return currentSchedule;
    }

    private CalendarView calendarView;

    public ScheduleManager() {
        this.calendarView = new CalendarView();
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

        // Create a Gson instance
        Gson gson = new Gson();

        try (FileReader reader = new FileReader(filePath)) {
            // Deserialize the JSON file into a Schedule object
            Schedule loadedSchedule = gson.fromJson(reader, Schedule.class);
            System.out.println("Schedule loaded from " + filePath);
            return loadedSchedule;
        } catch (IOException e) {
            System.out.println("Error loading schedule file: " + e.getMessage());
            return null;
        }
    }


    private void getProfessorRatings() {
        // Retrieve and store professor ratings
    }

    private void retrieveCourseList() {
        // Fetch and store course list
    }

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





    public void remEvent(Event e) {
        // Remove a course from the current schedule
        currentSchedule.events.remove(e);
        System.out.println(e.name + " was removed from schedule.");
    }

    public void redo() {
        // Redo last undone action
    }

    public void undo() {
        // Undo last action
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

    public void showCalendar() {
        // Display the calendar view
        calendarView.setSchedule(currentSchedule);
        calendarView.setSearchResults(currentSearch.filteredResultsList);
        calendarView.display();
    }



}
