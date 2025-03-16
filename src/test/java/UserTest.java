import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import java.io.File;
import java.util.HashSet;

import static org.junit.jupiter.api.Assertions.*;

class UserTest {
    private User user;

    @BeforeEach
    void setUp() {
        // Initialize a User before each test
        user = new User("testUser", "password"); // Initialize the user object
        System.out.println("Initialized User: " + user.name);
    }

    @Test
    void testSaveSchedule_Success() {
        System.out.println("Running testSaveSchedule_Success...");

        // Create a schedule
        Schedule schedule = new Schedule();
        schedule.name = "TestSchedule";
        schedule.events = new HashSet<>();
        System.out.println("Created schedule: " + schedule.name);

        // Save the schedule
        user.saveSchedule(schedule);
        System.out.println("Attempted to save schedule to: users/testUser/schedules/TestSchedule.json");

        // Check that the schedule was saved and added to the user's list
        assertTrue(user.mySchedules.contains("users/testUser/schedules/TestSchedule.json"),
                "Schedule file path should be in user's mySchedules list.");
        assertTrue(new File("users/testUser/schedules/TestSchedule.json").exists(),
                "Schedule file should exist on disk.");
        System.out.println("Schedule saved successfully.");
    }

    @Test
    void testSaveSchedule_Failure_NullSchedule() {
        System.out.println("Running testSaveSchedule_Failure_NullSchedule...");

        // Attempt to save a null schedule
        user.saveSchedule(null);
        System.out.println("Attempted to save null schedule.");

        // Check that no changes were made
        assertTrue(user.mySchedules.isEmpty(),
                "User's mySchedules list should remain unchanged.");
        System.out.println("Null schedule was not saved, as expected.");
    }

    @Test
    void testLoadFile_Success() {
        System.out.println("Running testLoadFile_Success...");

        // Create and save a schedule
        Schedule schedule = new Schedule();
        schedule.name = "TestSchedule";
        schedule.events = new HashSet<>();
        user.saveSchedule(schedule);
        System.out.println("Saved schedule: " + schedule.name);

        // Load the schedule
        Schedule loadedSchedule = user.loadFile("TestSchedule");
        System.out.println("Attempted to load schedule: TestSchedule");

        // Check that the schedule was loaded correctly
        assertNotNull(loadedSchedule, "Loaded schedule should not be null.");
        assertEquals("TestSchedule", loadedSchedule.name,
                "Loaded schedule name should match the original.");
        System.out.println("Schedule loaded successfully.");
    }

    @Test
    void testLoadFile_Failure_InvalidFile() {
        System.out.println("Running testLoadFile_Failure_InvalidFile...");

        // Attempt to load a non-existent schedule
        Schedule loadedSchedule = user.loadFile("NonExistentSchedule");
        System.out.println("Attempted to load non-existent schedule: NonExistentSchedule");

        // Check that the schedule was not loaded
        assertNull(loadedSchedule, "Loading a non-existent schedule should return null.");
        System.out.println("Non-existent schedule was not loaded, as expected.");
    }

    @Test
    void testRenameSchedule_Success() {
        System.out.println("Running testRenameSchedule_Success...");

        // Create and save a schedule
        Schedule schedule = new Schedule();
        schedule.name = "OldSchedule";
        schedule.events = new HashSet<>();
        user.saveSchedule(schedule);
        System.out.println("Saved schedule: " + schedule.name);

        // Rename the schedule
        user.RenameSchedule("OldSchedule", "NewSchedule");
        System.out.println("Attempted to rename schedule from OldSchedule to NewSchedule.");

        // Check that the schedule was renamed
        assertTrue(user.mySchedules.contains("users/testUser/schedules/NewSchedule.json"),
                "New schedule file path should be in user's mySchedules list.");
        assertFalse(user.mySchedules.contains("users/testUser/schedules/OldSchedule.json"),
                "Old schedule file path should not be in user's mySchedules list.");
        System.out.println("Schedule renamed successfully.");
    }

    @Test
    void testRenameSchedule_Failure_InvalidName() {
        System.out.println("Running testRenameSchedule_Failure_InvalidName...");

        // Attempt to rename a non-existent schedule
        user.RenameSchedule("NonExistentSchedule", "NewSchedule");
        System.out.println("Attempted to rename non-existent schedule: NonExistentSchedule");

        // Check that no changes were made
        assertFalse(user.mySchedules.contains("users/testUser/schedules/NewSchedule.json"),
                "Renaming a non-existent schedule should not create a new file.");
        System.out.println("Non-existent schedule was not renamed, as expected.");
    }

    @Test
    void testCheckPassword_Success() {
        System.out.println("Running testCheckPassword_Success...");

        // Check password with valid input
        boolean passwordMatch = user.checkPassword("password");
        assertTrue(passwordMatch, "Password should match.");
        System.out.println("Password check succeeded.");
    }

    @Test
    void testCheckPassword_Failure_InvalidPassword() {
        System.out.println("Running testCheckPassword_Failure_InvalidPassword...");

        // Check password with invalid input
        boolean passwordMatch = user.checkPassword("wrongPassword");
        assertFalse(passwordMatch, "Password should not match.");
        System.out.println("Password check failed, as expected.");
    }

    @Test
    void testSaveUserData_Success() {
        System.out.println("Running testSaveUserData_Success...");

        // Save user data
        user.saveUserData();
        File userFile = new File("users/testUser.json");
        assertTrue(userFile.exists(), "User data file should exist.");
        System.out.println("User data saved successfully.");
    }

    @Test
    void testLoadUserData_Success() {
        System.out.println("Running testLoadUserData_Success...");

        // Save user data first
        user.saveUserData();

        // Load user data
        User loadedUser = User.loadUserData("testUser");
        assertNotNull(loadedUser, "Loaded user should not be null.");
        assertEquals("testUser", loadedUser.name, "Loaded user name should match.");
        System.out.println("User data loaded successfully.");
    }

    @Test
    void testLoadUserData_Failure_InvalidUser() {
        System.out.println("Running testLoadUserData_Failure_InvalidUser...");

        // Attempt to load non-existent user data
        User loadedUser = User.loadUserData("nonExistentUser");
        assertNull(loadedUser, "Loading non-existent user should return null.");
        System.out.println("Non-existent user data was not loaded, as expected.");
    }
}