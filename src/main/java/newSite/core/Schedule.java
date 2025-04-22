package newSite.core;

import java.util.ArrayList;
import java.util.Set;



public class Schedule {
    public String name;
    public Set<Event> events;


    public boolean CheckConflicts(Event e) {
        // Check if the event conflicts with any other event in the schedule (does not check for multiple conflicts)
        for (Event event : this.events) {
            if (event.ConflictsWith(e)) {
                System.out.println("newSite.core.Event " + e.name + " conflicts with event " + event.name); //verbose
                return true;
            }
        }
        System.out.println("newSite.core.Event " + e.name + " does not conflict with any other events"); //verbose
        return false;
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
            if (e instanceof Course course) { // Only copy ref numbers from newSite.core.Course objects
                refNumbers.add(String.valueOf(course.courseCode)); // Convert int to string
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
        sb.append("newSite.core.Schedule: ").append(this.name).append("\n");

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

    public int getTotalCredits() {
        int totalCredits = 0;
        for (Event event : this.events) {
            if (event instanceof Course course) {
                totalCredits += course.credits;
            }
        }
        return totalCredits;
    }

}
