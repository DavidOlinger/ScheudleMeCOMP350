import java.util.ArrayList;
import java.util.Set;



public class Schedule {
    public String name;
    public Set<Event> events;


    public void CheckConflicts(Event e) {
        // Check for conflicts with the given event
    }



    public void copyRefNumbers() {
        // Ensure the schedule has events (courses)
        if ((ScheduleManager.currentSchedule == null) || ScheduleManager.getCurrentSchedule().events.isEmpty()) {
            System.out.println("No courses in the schedule to copy.");
            return;
        }

        // Create an array of reference numbers
        ArrayList<String> refNumbers = new ArrayList<>();

        // Iterate through events in the schedule
        for (Event e : ScheduleManager.currentSchedule.events) {
            if (e instanceof Course) { // Only copy ref numbers from Course objects
                Course course = (Course) e;
                refNumbers.add(String.valueOf(course.refNumber)); // Convert int to string
            }
        }




        // Print each reference number on a new line
        System.out.println("Copied Reference Numbers:");
        for (String ref : refNumbers) {
            System.out.println(ref);
        }
    }






}
