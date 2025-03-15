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





    /**
     * Loads a schedule from a file and sets it as the current schedule.
     *
     * @param scheduleName The name of the schedule to load.
     */
    public void loadSchedule(String scheduleName) {
        // Check if the schedule exists in the user's list
        String filePath = "schedules/" + scheduleName + ".json";
        if (!user.mySchedules.contains(filePath)) {
            System.out.println("Error: Schedule not found in user's list.");
            return;
        }

        // Load the schedule from the file using the user's loadFile method
        Schedule loadedSchedule = user.loadFile(scheduleName);
        if (loadedSchedule == null) {
            System.out.println("Error: Unable to load schedule.");
            return;
        }

        // Set the loaded schedule as the current schedule
        currentSchedule = loadedSchedule;
        System.out.println("Schedule '" + scheduleName + "' loaded successfully.");
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
        // Create a new Schedule object
        Schedule newSchedule = new Schedule();
        newSchedule.name = name;
        newSchedule.events = new HashSet<>();

        // Save the new schedule to a file
        user.saveSchedule(newSchedule);

        // Add the file path to the user's list of schedules
        String filePath = "schedules/" + name + ".json";
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


}
