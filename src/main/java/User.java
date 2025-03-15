import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.google.gson.reflect.TypeToken;

import java.io.File;
import java.io.FileReader;
import java.io.FileWriter;
import java.io.IOException;
import java.lang.reflect.Type;
import java.util.ArrayList;

public class User {
    public String name;
    public int idNumber;
    public String major;
    public int year;
    public ArrayList<String> mySchedules; // List of file paths instead of Schedule objects


    public User(String name) {
        // Create a user with dummy data
        this.name = name;
        this.idNumber = 12345;
        this.major = "Undeclared";
        this.year = 1;
        this.mySchedules = new ArrayList<>();
    }

    public User(String name, int idNumber, String major, int year) {
        // Create a user with custom values
        this.name = name;
        this.idNumber = idNumber;
        this.major = major;
        this.year = year;
        this.mySchedules = new ArrayList<>();
    }


    @Override
    public String toString(){
        StringBuilder sb = new StringBuilder();
        sb.append("User info:\n");
        sb.append("Name: ").append(name).append("\n");
        sb.append("ID: ").append(idNumber).append("\n");
        sb.append("Major: ").append(major).append("\n");
        sb.append("Year: ").append(year).append("\n");
        return sb.toString();
    }




    /**
     * Saves a schedule to a file.
     *
     * @param schedule The schedule to save.
     */
    public void saveSchedule(Schedule schedule) {
        if (schedule == null) {
            System.out.println("Error: Schedule is null.");
            return;
        }

        // Create the schedules directory if it doesn't exist
        File schedulesDir = new File("schedules");
        if (!schedulesDir.exists()) {
            schedulesDir.mkdirs(); // Create the directory and any missing parent directories
            System.out.println("Created schedules directory.");
        }

        // Warn if the schedule is empty
        if (schedule.events.isEmpty()) {
            System.out.println("Warning: The schedule '" + schedule.name + "' is empty.");
        }

        // Create a Gson instance with pretty printing for readability
        Gson gson = new GsonBuilder().setPrettyPrinting().create();

        // Define the file path where the schedule will be saved
        String fileName = "schedules/" + schedule.name + ".json";

        try (FileWriter writer = new FileWriter(fileName)) {
            // Convert the schedule object to JSON and write it to the file
            gson.toJson(schedule, writer);
            System.out.println("Schedule saved to " + fileName);

            // Add the file path to the user's list of schedules if not already present
            if (!mySchedules.contains(fileName)) {
                mySchedules.add(fileName);
                System.out.println("Added schedule file path to mySchedules.");
            }
        } catch (IOException e) {
            System.out.println("Error saving schedule: " + e.getMessage());
        }
    }






    /**
     * Loads a schedule from a file and returns it as a Schedule object.
     *
     * @param fileName The name of the file (without the path or extension).
     * @return The loaded Schedule object, or null if the file doesn't exist or an error occurs.
     */
    public Schedule loadFile(String fileName) {
        // Define the full file path
        String filePath = "schedules/" + fileName + ".json";

        // Check if the file exists
        File file = new File(filePath);
        if (!file.exists()) {
            System.out.println("Error: File does not exist: " + filePath);
            return null;
        }

        // Create a Gson instance
        Gson gson = new Gson();

        try (FileReader reader = new FileReader(filePath)) {
            // Deserialize the JSON file into a Schedule object
            Type scheduleType = new TypeToken<Schedule>() {}.getType();
            Schedule loadedSchedule = gson.fromJson(reader, scheduleType);
            System.out.println("Schedule loaded from " + filePath);
            return loadedSchedule;
        } catch (IOException e) {
            System.out.println("Error loading schedule file: " + e.getMessage());
            return null;
        }
    }






    /**
     * Renames a schedule in the user's list of schedules.
     *
     * @param oldName The current name of the schedule.
     * @param newName The new name for the schedule.
     */
    public void RenameSchedule(String oldName, String newName) {
        // Define the old and new file paths
        String oldFilePath = "schedules/" + oldName + ".json";
        String newFilePath = "schedules/" + newName + ".json";

        // Check if the old schedule file exists in the user's list
        if (!mySchedules.contains(oldFilePath)) {
            System.out.println("Error: Schedule not found in user's list: " + oldFilePath);
            return;
        }

        // Load the schedule from the old file
        Schedule schedule = loadFile(oldName);
        if (schedule == null) {
            System.out.println("Error: Unable to load schedule: " + oldFilePath);
            return;
        }

        // Rename the schedule
        schedule.name = newName;

        // Save the renamed schedule to the new file
        saveSchedule(schedule);

        // Remove the old file path from the list
        mySchedules.remove(oldFilePath);

        // Add the new file path to the list
        mySchedules.add(newFilePath);

        // Delete the old file
        File oldFile = new File(oldFilePath);
        if (oldFile.delete()) {
            System.out.println("Deleted old schedule file: " + oldFilePath);
        } else {
            System.out.println("Error: Unable to delete old schedule file: " + oldFilePath);
        }

        System.out.println("Schedule renamed from " + oldName + " to " + newName);
    }










// delete schedulen method









}