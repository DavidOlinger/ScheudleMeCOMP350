import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

public class TimeslotConflictTest {

    @Test
    public void testTimeSlotCreation() {
        System.out.println("Testing TimeSlot creation...");
        TimeSlot timeSlot = new TimeSlot("08:00:00", "09:00:00");
        System.out.println(timeSlot);
        assertEquals(28800, timeSlot.startTime, "Start time should be 28800 seconds (08:00:00)");
        assertEquals(32400, timeSlot.endTime, "End time should be 32400 seconds (09:00:00)");
    }

    @Test
    public void testEventCreation() {
        System.out.println("Testing Event creation...");
        TimeSlot timeSlot = new TimeSlot("10:00:00", "11:00:00");
        System.out.println("Timeslot: " + timeSlot);
        Event event = new Event("Math Class", "MWF", timeSlot);
        System.out.println(event);
        assertEquals("Math Class", event.name, "Event name should be 'Math Class'");
        assertEquals("MWF", event.days, "Event days should be 'MWF'");
        assertEquals(timeSlot, event.time, "Event time should be the provided TimeSlot");
    }

    @Test
    public void testNoConflictDifferentDays() {
        System.out.println("Testing no conflict on different days...");
        TimeSlot timeSlot1 = new TimeSlot("08:00:00", "09:00:00");
        Event event1 = new Event("Math Class", "MWF", timeSlot1);
        System.out.println(event1.quietToString());
        TimeSlot timeSlot2 = new TimeSlot("08:00:00", "09:00:00");
        Event event2 = new Event("Science Class", "TTh", timeSlot2);
        System.out.println(event2.quietToString());
        assertFalse(event1.ConflictsWith(event2), "Events on different days should not conflict");
    }

    @Test
    public void testNoConflictDifferentTimes() {
        System.out.println("Testing no conflict on different times...");
        TimeSlot timeSlot1 = new TimeSlot("08:00:00", "09:00:00");
        Event event1 = new Event("Math Class", "MWF", timeSlot1);
        System.out.println(event1.quietToString());
        TimeSlot timeSlot2 = new TimeSlot("09:00:00", "10:00:00");
        Event event2 = new Event("Science Class", "MWF", timeSlot2);
        System.out.println(event2.quietToString());
        assertFalse(event1.ConflictsWith(event2), "Events at different times should not conflict");
    }

    @Test
    public void testConflictSameTime() {
        System.out.println("Testing conflict at the same time...");
        TimeSlot timeSlot1 = new TimeSlot("08:00:00", "09:00:00");
        Event event1 = new Event("Math Class", "MWF", timeSlot1);
        System.out.println(event1.quietToString());
        TimeSlot timeSlot2 = new TimeSlot("08:00:00", "09:00:00");
        Event event2 = new Event("Science Class", "MWF", timeSlot2);
        System.out.println(event2.quietToString());
        assertTrue(event1.ConflictsWith(event2), "Events at the same time should conflict");
    }

    @Test
    public void testConflictOverlappingTimes() {
        System.out.println("Testing conflict with overlapping times...");
        TimeSlot timeSlot1 = new TimeSlot("08:00:00", "09:00:00");
        Event event1 = new Event("Math Class", "MWF", timeSlot1);
        System.out.println(event1.quietToString());
        TimeSlot timeSlot2 = new TimeSlot("08:30:00", "09:30:00");
        Event event2 = new Event("Science Class", "MWF", timeSlot2);
        System.out.println(event2.quietToString());
        assertTrue(event1.ConflictsWith(event2), "Events with overlapping times should conflict");
    }

    @Test
    public void testNoConflictAdjacentTimes() {
        System.out.println("Testing no conflict with adjacent times...");
        TimeSlot timeSlot1 = new TimeSlot("08:00:00", "09:00:00");
        Event event1 = new Event("Math Class", "MWF", timeSlot1);
        System.out.println(event1.quietToString());
        TimeSlot timeSlot2 = new TimeSlot("09:00:00", "10:00:00");
        Event event2 = new Event("Science Class", "MWF", timeSlot2);
        System.out.println(event2.quietToString());
        assertFalse(event1.ConflictsWith(event2), "Events with adjacent times should not conflict");
    }
}