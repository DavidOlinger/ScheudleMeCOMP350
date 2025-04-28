package newSite.core;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
// Add JsonSyntaxException import for better catch blocks
import com.google.gson.JsonSyntaxException;

import java.io.File;
import java.io.FileReader;
import java.io.FileWriter;
import java.io.IOException;
import java.nio.file.Files; // Import for potential directory check/creation robustness
import java.nio.file.Path;   // Import Path
import java.nio.file.Paths;  // Import Paths
import java.util.ArrayList;
import java.util.HashSet;
import java.util.NoSuchElementException; // Import for deleteSchedule potential exception

// Remove password-related imports if no longer needed anywhere else
// import java.nio.charset.StandardCharsets;
// import java.security.MessageDigest;
// import java.security.NoSuchAlgorithmException;

public class User {
    // --- Fields ---
    public String firebaseUid; // NEW: Primary identifier
    public String name; // Display name, can be updated
    public String email; // Store email from Firebase token
    public int idNumber; // Keep existing profile fields
    public String major;
    public int year;
    public ArrayList<String> mySchedules; // List of file paths (relative to user's UID directory)

    // REMOVED: private String passwordHash;

    // --- Constructors ---
    // Default constructor for Gson/initial creation
    public User() {
        this.mySchedules = new ArrayList<>();
        // Initialize other fields to defaults if needed
        this.name = "New User";
        this.email = "";
        this.idNumber = 0;
        this.major = "Undeclared";
        this.year = 1;
    }

    // Constructor for creating a new user from Firebase info
    public User(String firebaseUid, String email, String displayName) {
        this(); // Call default constructor first
        this.firebaseUid = firebaseUid;
        this.email = email;
        this.name = (displayName != null && !displayName.isBlank()) ? displayName : email; // Use display name or fallback to email
    }

    // REMOVED: Constructors taking password

    // --- Utility Methods ---

    // Helper to get the base directory path for the user based on UID
    private Path getUserDirectoryPath() {
        if (this.firebaseUid == null || this.firebaseUid.isBlank()) {
            throw new IllegalStateException("Cannot determine user directory: Firebase UID is not set.");
        }
        return Paths.get("users", this.firebaseUid);
    }

    // Helper to get the schedules directory path for the user
    private Path getUserSchedulesDirectoryPath() {
        return getUserDirectoryPath().resolve("schedules");
    }

    // Helper to get the full path for a specific schedule file
    private Path getScheduleFilePath(String scheduleName) {
        // Basic sanitization - replace potentially problematic characters for filenames
        String sanitizedScheduleName = scheduleName.replaceAll("[^a-zA-Z0-9_\\-\\.]", "_");
        if (sanitizedScheduleName.isEmpty()) {
            throw new IllegalArgumentException("Schedule name cannot be empty or only contain invalid characters.");
        }
        return getUserSchedulesDirectoryPath().resolve(sanitizedScheduleName + ".json");
    }

    // Helper to get the path for the main user data file
    private Path getUserDataFilePath() {
        // Using a standard name like _userdata.json inside the UID directory
        return getUserDirectoryPath().resolve("_userdata.json");
    }


    @Override
    public String toString(){
        return "User [firebaseUid=" + firebaseUid + ", name=" + name + ", email=" + email + "]";
        // Add other fields if needed
    }

    // --- Schedule Management Methods (Adapted for UID) ---

    /**
     * Saves a schedule to a file within the user's UID-based directory.
     * Also updates the user's data file to persist the schedule list.
     *
     * @param schedule The schedule to save.
     * @throws IOException If saving the schedule or user data fails.
     * @throws IllegalStateException If firebaseUid is not set on the User object.
     */
    public void saveSchedule(Schedule schedule) throws IOException, IllegalStateException {
        if (schedule == null) {
            System.err.println("Error: Attempted to save a null schedule for user UID: " + this.firebaseUid);
            throw new IllegalArgumentException("Schedule cannot be null.");
        }
        if (schedule.name == null || schedule.name.trim().isEmpty()) {
            System.err.println("Error: Attempted to save a schedule with no name for user UID: " + this.firebaseUid);
            throw new IllegalArgumentException("Schedule name cannot be empty.");
        }

        Path userSchedulesDir = getUserSchedulesDirectoryPath();
        Path scheduleFilePath = getScheduleFilePath(schedule.name);

        // Create directories if they don't exist
        Files.createDirectories(userSchedulesDir);
        System.out.println("Ensured directory exists: " + userSchedulesDir);


        // Create Gson instance
        Gson gson = new GsonBuilder().setPrettyPrinting().create();

        // Use try-with-resources for FileWriter
        try (FileWriter writer = new FileWriter(scheduleFilePath.toFile())) {
            gson.toJson(schedule, writer);
            System.out.println("Schedule saved to " + scheduleFilePath);

            // Store relative path within the user's main directory for simplicity? Or keep full?
            // Let's store the relative path from the user's base directory.
            String relativeSchedulePath = Paths.get("schedules").resolve(scheduleFilePath.getFileName()).toString().replace("\\", "/"); // Normalize slashes


            // Add the relative file path to the user's list if not present
            if (this.mySchedules == null) { this.mySchedules = new ArrayList<>(); } // Ensure list exists
            if (!this.mySchedules.contains(relativeSchedulePath)) {
                this.mySchedules.add(relativeSchedulePath);
                System.out.println("Added schedule path '" + relativeSchedulePath + "' to mySchedules for UID: " + this.firebaseUid);
                // Persist the change immediately
                this.saveUserByFirebaseUid(); // Save user data because mySchedules changed
            } else {
                System.out.println("Schedule path '" + relativeSchedulePath + "' already in mySchedules for UID: " + this.firebaseUid);
                // Still save the schedule file itself (content might have changed)
            }
        } catch (IOException e) {
            System.err.println("Error saving schedule file '" + scheduleFilePath + "' for user UID " + this.firebaseUid + ": " + e.getMessage());
            throw e; // Re-throw to be handled by controller
        }
    }

    /**
     * Deletes a schedule file and removes its reference from the user's list.
     * Also saves the updated user data.
     *
     * @param scheduleName The name of the schedule to delete.
     * @throws IOException If deleting the file or saving user data fails.
     * @throws NoSuchElementException If the schedule is not found in the user's list.
     * @throws IllegalStateException If firebaseUid is not set on the User object.
     */
    public void deleteSchedule(String scheduleName) throws IOException, NoSuchElementException, IllegalStateException {
        Path scheduleFilePath = getScheduleFilePath(scheduleName);
        String relativeSchedulePath = Paths.get("schedules").resolve(scheduleFilePath.getFileName()).toString().replace("\\", "/");

        if (this.mySchedules == null || !this.mySchedules.contains(relativeSchedulePath)) {
            System.err.println("Error: Schedule path '" + relativeSchedulePath + "' not found in mySchedules for UID: " + this.firebaseUid);
            throw new NoSuchElementException("Schedule '" + scheduleName + "' not found in user's list.");
        }

        // Delete the schedule file
        boolean deleted = Files.deleteIfExists(scheduleFilePath);

        if (deleted) {
            System.out.println("Deleted schedule file: " + scheduleFilePath);
            // Remove the file path from the user's list
            this.mySchedules.remove(relativeSchedulePath);
            System.out.println("Removed schedule path '" + relativeSchedulePath + "' from mySchedules for UID: " + this.firebaseUid);
            // Persist the change immediately
            this.saveUserByFirebaseUid(); // Save user data because mySchedules changed
        } else {
            // This could happen if the file existed in the list but not on disk, or due to permissions
            System.err.println("Error: Unable to delete schedule file (or file didn't exist): " + scheduleFilePath);
            // Optionally remove from list anyway if file doesn't exist? Or throw error?
            // Let's throw an error for consistency.
            throw new IOException("Unable to delete schedule file: " + scheduleFilePath);
        }
    }

    /**
     * Loads a specific schedule file for this user.
     *
     * @param scheduleName The name of the schedule (without path/extension).
     * @return The loaded Schedule object.
     * @throws IOException If the file cannot be read.
     * @throws JsonSyntaxException If the file contains invalid JSON.
     * @throws NoSuchElementException If the schedule name is invalid or file doesn't exist.
     * @throws IllegalStateException If firebaseUid is not set on the User object.
     */
    public Schedule loadScheduleFile(String scheduleName) throws IOException, JsonSyntaxException, NoSuchElementException, IllegalStateException {
        Path scheduleFilePath = getScheduleFilePath(scheduleName);

        // Check if the file exists before attempting to read
        if (!Files.exists(scheduleFilePath)) {
            System.err.println("Error: Schedule file does not exist: " + scheduleFilePath + " for user UID: " + this.firebaseUid);
            throw new NoSuchElementException("Schedule file '" + scheduleName + ".json' not found.");
        }

        // Create Gson instance with Event deserializer
        Gson gson = new GsonBuilder()
                .registerTypeAdapter(Event.class, new EventDeserializer())
                .create();

        try (FileReader reader = new FileReader(scheduleFilePath.toFile())) {
            Schedule loadedSchedule = gson.fromJson(reader, Schedule.class);
            if (loadedSchedule == null) {
                // Handle case where JSON is valid but represents null
                throw new IOException("Failed to parse schedule from file: " + scheduleFilePath);
            }
            // Ensure the loaded schedule name matches the filename (consistency check)
            if (loadedSchedule.name == null || !loadedSchedule.name.equals(scheduleName)) {
                System.out.println("Warning: Loaded schedule name ('" + loadedSchedule.name + "') does not match filename ('" + scheduleName + "'). Using filename.");
                loadedSchedule.name = scheduleName; // Standardize name based on file
            }
            // Ensure events set is initialized
            if (loadedSchedule.events == null) {
                loadedSchedule.events = new HashSet<>();
            }

            System.out.println("Schedule loaded from " + scheduleFilePath + " for user UID: " + this.firebaseUid);
            return loadedSchedule;
        } catch (IOException e) {
            System.err.println("Error reading schedule file '" + scheduleFilePath + "': " + e.getMessage());
            throw e;
        } catch (JsonSyntaxException e) {
            System.err.println("Error parsing JSON in schedule file '" + scheduleFilePath + "': " + e.getMessage());
            throw e;
        }
    }

    // REMOVED: loadFile method (superseded by loadScheduleFile)
    // REMOVED: RenameSchedule method (can be implemented by load, save with new name, delete old)

    // --- Password Methods (REMOVED) ---
    // REMOVED: hashPassword method
    // REMOVED: checkPassword method

    // --- User Data Persistence (Adapted for UID) ---

    /**
     * Saves this user's data to a JSON file named after their Firebase UID.
     * @throws IOException If saving fails.
     * @throws IllegalStateException If firebaseUid is not set on the User object.
     */
    public void saveUserByFirebaseUid() throws IOException, IllegalStateException {
        Path userDataPath = getUserDataFilePath();
        Path userDir = getUserDirectoryPath();

        // Ensure base user directory exists
        Files.createDirectories(userDir);

        // Use a transient modifier for passwordHash if needed, or just don't serialize it
        Gson gson = new GsonBuilder()
                // Exclude passwordHash if it still existed
                // .excludeFieldsWithoutExposeAnnotation() // Or use annotations
                .setPrettyPrinting()
                .create();

        try (FileWriter writer = new FileWriter(userDataPath.toFile())) {
            gson.toJson(this, writer);
            System.out.println("User data saved to " + userDataPath + " for UID: " + this.firebaseUid);
        } catch (IOException e) {
            System.err.println("Error saving user data for UID " + this.firebaseUid + ": " + e.getMessage());
            throw e;
        }
    }

    /**
     * Loads user data from a file named after the Firebase UID.
     *
     * @param firebaseUid The Firebase UID of the user to load.
     * @return The loaded User object, or null if the file doesn't exist or an error occurs.
     */
    public static User loadUserByFirebaseUid(String firebaseUid) {
        if (firebaseUid == null || firebaseUid.isBlank()) {
            System.err.println("Error: Attempted to load user with null or empty Firebase UID.");
            return null;
        }
        // Construct the path based on UID
        Path userDataPath = Paths.get("users", firebaseUid, "_userdata.json");

        if (!Files.exists(userDataPath)) {
            // This is expected if the user is logging in for the first time
            System.out.println("User data file not found for UID: " + firebaseUid + " at path: " + userDataPath);
            return null;
        }

        Gson gson = new Gson(); // Simple Gson for loading user data

        try (FileReader reader = new FileReader(userDataPath.toFile())) {
            User user = gson.fromJson(reader, User.class);
            if (user != null) {
                // Ensure UID field matches if it wasn't saved previously or is different
                // (can happen during migration or if file was manually created)
                if (user.firebaseUid == null || !user.firebaseUid.equals(firebaseUid)) {
                    System.out.println("Warning: Loaded user data for UID " + firebaseUid + " had missing or mismatched UID field. Setting it now.");
                    user.firebaseUid = firebaseUid;
                }
                // Ensure schedule list is initialized
                if (user.mySchedules == null) {
                    user.mySchedules = new ArrayList<>();
                }
                System.out.println("User data loaded successfully for UID: " + firebaseUid);
            } else {
                System.err.println("Error: Failed to parse user data from file (fromJson returned null) for UID: " + firebaseUid);
            }
            return user;
        } catch (IOException e) {
            System.err.println("Error reading user data file for UID " + firebaseUid + ": " + e.getMessage());
            return null;
        } catch (JsonSyntaxException e) {
            System.err.println("Error parsing JSON in user data file for UID " + firebaseUid + ": " + e.getMessage());
            return null;
        }
    }

    // REMOVED: loadUserData(String username) method
    // REMOVED: addUser(String username, String password) method (creation logic moves to controller)

} // End of User class