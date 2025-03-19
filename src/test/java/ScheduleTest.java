import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

public class ScheduleTest {

    private ScheduleManager scheduleManager;

    @BeforeEach
    public void setUp() {
        scheduleManager = new ScheduleManager();

        User user = User.addUser("testUser", "password");
        scheduleManager.loginUser("testUser", "password");

        scheduleManager.user = user;
    }

    @Test
    public void testScheduleCreation() {
        System.out.println("Testing schedule creation...");
        scheduleManager.newSchedule("Test Schedule");
        Schedule currentSchedule = ScheduleManager.getCurrentSchedule();
        assertNotNull(currentSchedule, "Current schedule should not be null");
        assertEquals("Test Schedule", currentSchedule.name, "Schedule name should be 'Test Schedule'");
    }

    @Test
    public void testAddEvent() {
        System.out.println("Testing adding event...");
        scheduleManager.newSchedule("Test Schedule");
        TimeSlot timeSlot = new TimeSlot("08:00:00", "09:00:00");
        Event event = new Event("Math Class", "MWF", timeSlot);
        boolean conflict = scheduleManager.addEvent(event);
        assertFalse(conflict, "Event should be added without conflict");
        System.out.println(ScheduleManager.getCurrentSchedule());
        assertTrue(ScheduleManager.getCurrentSchedule().events.contains(event), "Event should be in the schedule");
    }

    @Test
    public void testRemoveEvent() {
        System.out.println("Testing removing event...");
        scheduleManager.newSchedule("Test Schedule");
        TimeSlot timeSlot = new TimeSlot("08:00:00", "09:00:00");
        Event event = new Event("Math Class", "MWF", timeSlot);
        scheduleManager.addEvent(event);
        System.out.println(ScheduleManager.getCurrentSchedule());
        System.out.println("\n\nREMOVING EVENT\n");
        scheduleManager.remEvent(event);
        System.out.println(ScheduleManager.getCurrentSchedule());
        assertFalse(ScheduleManager.getCurrentSchedule().events.contains(event), "Event should be removed from the schedule");
    }

    @Test
    public void testCheckConflicts() {
        System.out.println("Testing checking conflicts...");
        scheduleManager.newSchedule("Test Schedule");
        TimeSlot timeSlot1 = new TimeSlot("08:00:00", "09:00:00");
        Event event1 = new Event("Math Class", "MWF", timeSlot1);
        scheduleManager.addEvent(event1);
        System.out.println(ScheduleManager.getCurrentSchedule());

        TimeSlot timeSlot2 = new TimeSlot("08:30:00", "09:30:00");
        Event event2 = new Event("Science Class", "MWF", timeSlot2);
        boolean conflict = scheduleManager.addEvent(event2);
        System.out.println(ScheduleManager.getCurrentSchedule());
        assertTrue(conflict, "Event should conflict with existing event");
    }

    @Test
    public void testCopyRefNumbers() {
        System.out.println("Testing copyRefNumbers method...");
        scheduleManager.newSchedule("Test Schedule");
        TimeSlot timeSlot = new TimeSlot("08:00:00", "09:00:00");
        Course course1 = new Course("Math Class", timeSlot, "MWF", new Professor("Prof. A"), 101, "Fall", "Room 101", 'A', "MATH", 3);
        Course course2 = new Course("Science Class", timeSlot, "MWF", new Professor("Prof. B"), 102, "Fall", "Room 102", 'B', "SCI", 4);
        scheduleManager.addEvent(course1);
        scheduleManager.addEvent(course2);

        Schedule currentSchedule = ScheduleManager.getCurrentSchedule();
        currentSchedule.copyRefNumbers();
    }

    @Test
    public void testGetTotalCreditsConflict() {
        System.out.println("Testing getTotalCredits method...");
        scheduleManager.newSchedule("Test Schedule");
        TimeSlot timeSlot = new TimeSlot("08:00:00", "09:00:00");
        Course course1 = new Course("Math Class", timeSlot, "MWF", new Professor("Prof. A"), 101, "Fall", "Room 101", 'A', "MATH", 3);
        Course course2 = new Course("Science Class", timeSlot, "MWF", new Professor("Prof. B"), 102, "Fall", "Room 102", 'B', "SCI", 4);
        scheduleManager.addEvent(course1);
        scheduleManager.addEvent(course2);

        Schedule currentSchedule = ScheduleManager.getCurrentSchedule();
        int totalCredits = currentSchedule.getTotalCredits();
        assertEquals(3, totalCredits, "Total credits should be 3");
    }

    @Test
    public void testGetTotalCreditsNoConflict() {
        System.out.println("Testing getTotalCredits method...");
        scheduleManager.newSchedule("Test Schedule");
        TimeSlot timeSlot1 = new TimeSlot("08:00:00", "09:00:00");
        TimeSlot timeSlot2 = new TimeSlot("09:00:00", "10:00:00");
        Course course1 = new Course("Math Class", timeSlot1, "MWF", new Professor("Prof. A"), 101, "Fall", "Room 101", 'A', "MATH", 3);
        Course course2 = new Course("Science Class", timeSlot2, "MWF", new Professor("Prof. B"), 102, "Fall", "Room 102", 'B', "SCI", 4);
        scheduleManager.addEvent(course1);
        scheduleManager.addEvent(course2);

        Schedule currentSchedule = ScheduleManager.getCurrentSchedule();
        int totalCredits = currentSchedule.getTotalCredits();
        assertEquals(7, totalCredits, "Total credits should be 7");
    }


}