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
        if (this.events.isEmpty()) {
            System.out.println("No courses in the schedule to copy.");
            return;
        }

        // Create an array of reference numbers
        ArrayList<String> refNumbers = new ArrayList<>();

        // Iterate through events in the schedule
        for (Event e : this.events) {
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

    @Override
    public String toString(){
        StringBuilder sb = new StringBuilder();
        sb.append("Schedule: ").append(this.name).append("\n");

        // Ensure the schedule has events (courses)
        if (this.events.isEmpty()) {
            return ("No courses in the schedule to copy.\n");
        }

        //for each event, print it's name and time.
        for (Event e : this.events) {
            sb.append(e.name).append(" - Time:").append(e.time).append("\n");
        }
        return sb.toString();
    }



}
