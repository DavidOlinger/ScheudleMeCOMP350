import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import java.util.HashSet;
import static org.junit.jupiter.api.Assertions.*;

class ScheduleManagerTest {
    private ScheduleManager scheduleManager;
    private User user;

    @BeforeEach
    void setUp() {
        // Initialize a ScheduleManager and User before each test
        scheduleManager = new ScheduleManager();
        user = new User("TestUser");
        scheduleManager.user = user;
        System.out.println("Initialized ScheduleManager and User.");
    }

    @Test
    void testNewSchedule_Success() {
        System.out.println("Running testNewSchedule_Success...");

        // Test creating a new schedule
        scheduleManager.newSchedule("TestSchedule");
        System.out.println("Created new schedule: TestSchedule");

        // Check if the schedule was created and set as the current schedule
        assertNotNull(ScheduleManager.currentSchedule,
                "Current schedule should not be null.");
        assertEquals("TestSchedule", ScheduleManager.currentSchedule.name,
                "Current schedule name should match the created schedule.");
        assertTrue(user.mySchedules.contains("schedules/TestSchedule.json"),
                "Schedule file path should be in user's mySchedules list.");
        System.out.println("New schedule created successfully.");
    }

    @Test
    void testNewSchedule_Failure_DuplicateName() {
        System.out.println("Running testNewSchedule_Failure_DuplicateName...");

        // Test creating a schedule with a duplicate name
        scheduleManager.newSchedule("TestSchedule");
        System.out.println("Created first schedule: TestSchedule");

        // Attempt to create another schedule with the same name
        scheduleManager.newSchedule("TestSchedule");
        System.out.println("Attempted to create duplicate schedule: TestSchedule");

        // Check that the current schedule is still the original one
        assertEquals("TestSchedule", ScheduleManager.currentSchedule.name,
                "Current schedule name should still be TestSchedule.");
        System.out.println("Duplicate schedule was not created, as expected.");
    }

    @Test
    void testLoadSchedule_Success() {
        System.out.println("Running testLoadSchedule_Success...");

        // Create and save a schedule
        scheduleManager.newSchedule("TestSchedule");
        System.out.println("Created and saved schedule: TestSchedule");

        // Load the schedule
        scheduleManager.loadSchedule("TestSchedule");
        System.out.println("Attempted to load schedule: TestSchedule");

        // Check if the schedule was loaded correctly
        assertNotNull(ScheduleManager.currentSchedule,
                "Current schedule should not be null.");
        assertEquals("TestSchedule", ScheduleManager.currentSchedule.name,
                "Current schedule name should match the loaded schedule.");
        System.out.println("Schedule loaded successfully.");
    }

    @Test
    void testLoadSchedule_Failure_InvalidName() {
        System.out.println("Running testLoadSchedule_Failure_InvalidName...");

        // Attempt to load a schedule that doesn't exist
        scheduleManager.loadSchedule("NonExistentSchedule");
        System.out.println("Attempted to load non-existent schedule: NonExistentSchedule");

        // Check that the current schedule is still null
        assertNull(ScheduleManager.currentSchedule,
                "Current schedule should still be null.");
        System.out.println("Non-existent schedule was not loaded, as expected.");
    }
}