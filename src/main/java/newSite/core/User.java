package newSite.core;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;

import java.io.File;
import java.io.FileReader;
import java.io.FileWriter;
import java.io.IOException;
import java.util.ArrayList;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;

public class User {
    public String name;
    public int idNumber;
    public String major;
    public int year;
    public ArrayList<String> mySchedules; // List of file paths

    private String passwordHash; // Hashed password

    public User(String name, String password) {
        this.name = name;
        this.idNumber = 12345;
        this.major = "Undeclared";
        this.year = 1;
        this.mySchedules = new ArrayList<>();

        this.passwordHash = hashPassword(password); // Hash the password
    }

    public User(String name, int idNumber, String major, int year, String password) {
        this.name = name;
        this.idNumber = idNumber;
        this.major = major;
        this.year = year;
        this.mySchedules = new ArrayList<>();

        this.passwordHash = hashPassword(password); // Hash the password
    }


    @Override
    public String toString(){
        StringBuilder sb = new StringBuilder();
        sb.append("newSite.core.User info:\n");
        sb.append("Name: ").append(name).append("\n");
        sb.append("ID: ").append(idNumber).append("\n");
        sb.append("Major: ").append(major).append("\n");
        sb.append("Year: ").append(year).append("\n");
        return sb.toString();
    }




    /******************************* NEW CODE *******************************/
    /**
     * Saves a schedule to a file in the user's directory.
     *
     * @param schedule The schedule to save.
     */
    /**
     * Saves a schedule to a file in the user's directory and updates the user data.
     *
     * @param schedule The schedule to save.
     */
    public void saveSchedule(Schedule schedule) {
        if (schedule == null) {
            System.out.println("Error: newSite.core.Schedule is null.");
            return;
        }

        // Create the user's schedules directory if it doesn't exist
        File userSchedulesDir = new File("users/" + this.name + "/schedules");
        if (!userSchedulesDir.exists()) {
            userSchedulesDir.mkdirs();
            System.out.println("Created user schedules directory: " + userSchedulesDir.getPath());
        }

        // Define the file path for the schedule
        String fileName = "users/" + this.name + "/schedules/" + schedule.name + ".json";

        // Create a Gson instance with pretty printing for readability
        Gson gson = new GsonBuilder().setPrettyPrinting().create();

        try (FileWriter writer = new FileWriter(fileName)) {
            // Convert the schedule object to JSON and write it to the file
            gson.toJson(schedule, writer);
            System.out.println("newSite.core.Schedule saved to " + fileName);

            // Add the file path to the user's list if it's not already there
            if (!mySchedules.contains(fileName)) {
                mySchedules.add(fileName);
                System.out.println("Added schedule file path to mySchedules.");
            }

            // Save the user data to persist the updated mySchedules list
            this.saveUserData();
            System.out.println("newSite.core.User data updated with new schedule information.");

        } catch (IOException e) {
            System.out.println("Error saving schedule: " + e.getMessage());
        }
    }





    /**
     * Deletes a schedule from the user's directory.
     *
     * @param scheduleName The name of the schedule to delete.
     */
    public void deleteSchedule(String scheduleName) {
        // Define the file path for the schedule
        String filePath = "users/" + name + "/schedules/" + scheduleName + ".json";

        // Check if the schedule exists in the user's list
        if (!mySchedules.contains(filePath)) {
            System.out.println("Error: newSite.core.Schedule not found in user's list: " + scheduleName);
            return;
        }

        // Delete the schedule file
        File scheduleFile = new File(filePath);
        if (scheduleFile.delete()) {
            System.out.println("Deleted schedule file: " + filePath);
        } else {
            System.out.println("Error: Unable to delete schedule file: " + filePath);
            return; // Exit if the file couldn't be deleted
        }

        // Remove the file path from the user's list
        mySchedules.remove(filePath);
        System.out.println("Removed schedule from user's list: " + scheduleName);
    }




    /**
     * Loads a schedule from a file and returns it as a newSite.core.Schedule object.
     *
     * @param fileName The name of the file (without the path or extension).
     * @return The loaded newSite.core.Schedule object, or null if the file doesn't exist or an error occurs.
     */
    public Schedule loadFile(String fileName) {
        // Define the full file path
        String filePath = "users/" + name + "/schedules/" + fileName + ".json";

        // Check if the file exists
        File file = new File(filePath);
        if (!file.exists()) {
            System.out.println("Error: File does not exist: " + filePath);
            return null;
        }

        // Create a Gson instance
        Gson gson = new Gson();

        try (FileReader reader = new FileReader(filePath)) {
            // Deserialize the JSON file into a newSite.core.Schedule object
            Schedule loadedSchedule = gson.fromJson(reader, Schedule.class);
            System.out.println("newSite.core.Schedule loaded from " + filePath);
            return loadedSchedule;
        } catch (IOException e) {
            System.out.println("Error loading schedule file: " + e.getMessage());
            return null;
        }
    }
    /******************************* END NEW CODE ***************************/




    /**
     * Renames a schedule in the user's list of schedules.
     *
     * @param oldName The current name of the schedule.
     * @param newName The new name for the schedule.
     */
    public void RenameSchedule(String oldName, String newName) {
        // Define the old and new file paths
        String oldFilePath = "users/" + this.name + "/schedules/" + oldName + ".json";
        String newFilePath = "users/" + this.name + "/schedules/" + newName + ".json";

        // Check if the old schedule file exists in the user's list
        if (!mySchedules.contains(oldFilePath)) {
            System.out.println("Error: newSite.core.Schedule not found in user's list: " + oldFilePath);
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

        System.out.println("newSite.core.Schedule renamed from " + oldName + " to " + newName);
    }











    /**
     * Hashes a password using SHA-256.
     *
     * @param password The password to hash.
     * @return The hashed password as a hexadecimal string.
     */
    private String hashPassword(String password) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hashBytes = digest.digest(password.getBytes(StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder();
            for (byte b : hashBytes) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (NoSuchAlgorithmException e) {
            System.out.println("Error: Hashing algorithm not found.");
            return null;
        }
    }





    /**
     * Checks if a provided password matches the stored hash.
     *
     * @param password The password to check.
     * @return True if the password matches, false otherwise.
     */
    public boolean checkPassword(String password) {
        String inputHash = hashPassword(password);
        return inputHash != null && inputHash.equals(passwordHash);
    }
    /******************************* END NEW CODE ***************************/





    /**
     * Saves the user's data to a file.
     */
    public void saveUserData() {
        // Create a Gson instance with pretty printing for readability
        Gson gson = new GsonBuilder().setPrettyPrinting().create();

        // Define the file path for the user's data
        String fileName = "users/" + name + ".json";

        // Create the users directory if it doesn't exist
        File usersDir = new File("users");
        if (!usersDir.exists()) {
            usersDir.mkdirs();
            System.out.println("Created users directory.");
        }

        try (FileWriter writer = new FileWriter(fileName)) {
            // Convert the user object to JSON and write it to the file
            gson.toJson(this, writer);
            System.out.println("newSite.core.User data saved to " + fileName);
        } catch (IOException e) {
            System.out.println("Error saving user data: " + e.getMessage());
        }
    }




    /**
     * Loads a user's data from a file.
     *
     * @param username The name of the user to load.
     * @return The loaded newSite.core.User object, or null if the file doesn't exist or an error occurs.
     */
    public static User loadUserData(String username) {
        // Define the file path for the user's data
        String fileName = "users/" + username + ".json";

        // Create a Gson instance
        Gson gson = new Gson();

        try (FileReader reader = new FileReader(fileName)) {
            // Deserialize the JSON file into a newSite.core.User object
            User user = gson.fromJson(reader, User.class);
            //System.out.println("newSite.core.User data loaded from " + fileName);
            return user;
        } catch (IOException e) {
            System.out.println("Error loading user data: " + e.getMessage());
            return null;
        }
    }





    /**
     * Creates a new user and saves their data to a file.
     *
     * @param username The username for the new user.
     * @param password The password for the new user.
     * @return The created newSite.core.User object, or null if the user already exists.
     */
    public static User addUser(String username, String password) {
        // Check if the user already exists
        User existingUser = User.loadUserData(username);
        if (existingUser != null) {
            System.out.println("newSite.core.User already exists. Returning existing user.");
            return existingUser;
        }

        // Create a new user
        User newUser = new User(username, password);

        // Save the user's data
        newUser.saveUserData();
        System.out.println("New user created: " + username);

        return newUser;
    }





}