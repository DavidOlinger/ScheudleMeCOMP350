import newSite.core.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class ScheduleManagerTest {
    private ScheduleManager scheduleManager;

    @BeforeEach
    void setUp() {
        // Initialize a newSite.core.ScheduleManager before each test
        scheduleManager = new ScheduleManager();

        // Add a new user and log in
        User user = User.addUser("testUser", "password");
        scheduleManager.loginUser("testUser", "password");
        System.out.println("Initialized newSite.core.ScheduleManager and newSite.core.User.");
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
        assertTrue(scheduleManager.user.mySchedules.contains("users/testUser/schedules/TestSchedule.json"),
                "newSite.core.Schedule file path should be in user's mySchedules list.");
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
        Schedule loadedSchedule = scheduleManager.loadSchedule("TestSchedule");
        System.out.println("Attempted to load schedule: TestSchedule");

        // Check if the schedule was loaded correctly
        assertNotNull(loadedSchedule,
                "Loaded schedule should not be null.");
        assertEquals("TestSchedule", loadedSchedule.name,
                "Loaded schedule name should match the original.");
        System.out.println("newSite.core.Schedule loaded successfully.");
    }

    @Test
    void testLoadSchedule_Failure_InvalidName() {
        System.out.println("Running testLoadSchedule_Failure_InvalidName...");

        // Attempt to load a schedule that doesn't exist
        Schedule loadedSchedule = scheduleManager.loadSchedule("NonExistentSchedule");
        System.out.println("Attempted to load non-existent schedule: NonExistentSchedule");

        // Check that the schedule was not loaded
        assertNull(loadedSchedule,
                "Loading a non-existent schedule should return null.");
        System.out.println("Non-existent schedule was not loaded, as expected.");
    }

    @Test
    void testAddEvent_Success() {
        System.out.println("Running testAddEvent_Success...");

        // Create a new schedule
        scheduleManager.newSchedule("TestSchedule");

        // Create an event
        TimeSlot timeSlot = new TimeSlot("08:00:00", "09:00:00");
        Event event = new Event("Math Class", "MWF", timeSlot);

        // Add the event to the schedule
        boolean conflict = scheduleManager.addEvent(event);
        assertFalse(conflict, "newSite.core.Event should be added without conflict.");
        assertTrue(ScheduleManager.currentSchedule.events.contains(event),
                "newSite.core.Event should be in the schedule.");
        System.out.println("newSite.core.Event added successfully.");
    }

    @Test
    void testAddEvent_Failure_Conflict() {
        System.out.println("Running testAddEvent_Failure_Conflict...");

        // Create a new schedule
        scheduleManager.newSchedule("TestSchedule");

        // Create two conflicting events
        TimeSlot timeSlot1 = new TimeSlot("08:00:00", "09:00:00");
        Event event1 = new Event("Math Class", "MWF", timeSlot1);
        scheduleManager.addEvent(event1);

        TimeSlot timeSlot2 = new TimeSlot("08:30:00", "09:30:00");
        Event event2 = new Event("Science Class", "MWF", timeSlot2);

        // Attempt to add the conflicting event
        boolean conflict = scheduleManager.addEvent(event2);
        assertTrue(conflict, "newSite.core.Event should conflict with existing event.");
        assertFalse(ScheduleManager.currentSchedule.events.contains(event2),
                "Conflicting event should not be added to the schedule.");
        System.out.println("newSite.core.Event conflict detected successfully.");
    }

    @Test
    void testRemoveEvent_Success() {
        System.out.println("Running testRemoveEvent_Success...");

        // Create a new schedule
        scheduleManager.newSchedule("TestSchedule");

        // Create an event
        TimeSlot timeSlot = new TimeSlot("08:00:00", "09:00:00");
        Event event = new Event("Math Class", "MWF", timeSlot);

        // Add and then remove the event
        scheduleManager.addEvent(event);
        scheduleManager.remEvent(event);

        // Check that the event was removed
        assertFalse(ScheduleManager.currentSchedule.events.contains(event),
                "newSite.core.Event should be removed from the schedule.");
        System.out.println("newSite.core.Event removed successfully.");
    }

    @Test
    void testRemoveEvent_Failure_NonExistentEvent() {
        System.out.println("Running testRemoveEvent_Failure_NonExistentEvent...");

        // Create a new schedule
        scheduleManager.newSchedule("TestSchedule");

        // Create an event but do not add it
        TimeSlot timeSlot = new TimeSlot("08:00:00", "09:00:00");
        Event event = new Event("Math Class", "MWF", timeSlot);

        // Attempt to remove the non-existent event
        scheduleManager.remEvent(event);

        // Check that the schedule remains unchanged
        assertTrue(ScheduleManager.currentSchedule.events.isEmpty(),
                "newSite.core.Schedule should remain unchanged.");
        System.out.println("Non-existent event was not removed, as expected.");
    }

    @Test
    void testLoginUser_Success() {
        System.out.println("Running testLoginUser_Success...");

        // Log in with valid credentials
        boolean loginSuccess = scheduleManager.loginUser("testUser", "password");
        assertTrue(loginSuccess, "Login should succeed with valid credentials.");
        System.out.println("newSite.core.User logged in successfully.");
    }

    @Test
    void testLoginUser_Failure_InvalidPassword() {
        System.out.println("Running testLoginUser_Failure_InvalidPassword...");

        // Log in with invalid password
        boolean loginSuccess = scheduleManager.loginUser("testUser", "wrongPassword");
        assertFalse(loginSuccess, "Login should fail with invalid password.");
        System.out.println("Login failed with invalid password, as expected.");
    }

    @Test
    void testLoginUser_Failure_InvalidUsername() {
        System.out.println("Running testLoginUser_Failure_InvalidUsername...");

        // Log in with invalid username
        boolean loginSuccess = scheduleManager.loginUser("nonExistentUser", "password");
        assertFalse(loginSuccess, "Login should fail with invalid username.");
        System.out.println("Login failed with invalid username, as expected.");
    }

    @Test
    void testLogoutUser_Success() {
        System.out.println("Running testLogoutUser_Success...");

        // Log out the current user
        scheduleManager.logoutUser();
        assertNull(scheduleManager.user, "newSite.core.User should be null after logout.");
        System.out.println("newSite.core.User logged out successfully.");
    }
}