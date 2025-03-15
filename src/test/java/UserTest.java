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
        user = new User("TestUser");
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
        System.out.println("Attempted to save schedule to: schedules/TestSchedule.json");

        // Check that the schedule was saved and added to the user's list
        assertTrue(user.mySchedules.contains("schedules/TestSchedule.json"),
                "Schedule file path should be in user's mySchedules list.");
        assertTrue(new File("schedules/TestSchedule.json").exists(),
                "Schedule file should exist on disk.");
        System.out.println("Schedule saved successfully.");
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
        assertTrue(user.mySchedules.contains("schedules/NewSchedule.json"),
                "New schedule file path should be in user's mySchedules list.");
        assertFalse(user.mySchedules.contains("schedules/OldSchedule.json"),
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
        assertFalse(user.mySchedules.contains("schedules/NewSchedule.json"),
                "Renaming a non-existent schedule should not create a new file.");
        System.out.println("Non-existent schedule was not renamed, as expected.");
    }
}