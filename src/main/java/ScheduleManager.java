import java.util.HashSet;
import java.util.Stack;


public class ScheduleManager {


    public User user;
    private Stack<Schedule> editHistory;
    private Stack<Schedule> undoneHistory;

    public static Schedule currentSchedule;
    public Search currentSearch;


    public static Schedule getCurrentSchedule() {
        return currentSchedule;
    }


    public void loadSchedule(String name) {

        if (user == null) {
            System.out.println("Error: No user is logged in.");
            return;
        }

        // Search for the schedule in user's saved schedules
        for (Schedule schedule : user.mySchedules) {
            if (schedule.name.equals(name)) {
                currentSchedule = schedule;
                System.out.println("Loaded schedule. ");
                System.out.println(currentSchedule); //uses new toString
                return;
            }
        }

        // Failed to find
        System.out.println("Error: No saved schedule found with name '" + name + "'.");

    }

    private void getProfessorRatings() {
        // Retrieve and store professor ratings
    }

    private void retrieveCourseList() {
        // Fetch and store course list
    }

    public boolean addEvent(Event e) {
        if (currentSchedule.CheckConflicts(e)) {
            System.out.println("Error: Event conflicts with existing events in the schedule.");
            return true;
        } else {
            currentSchedule.events.add(e);
            return false;
        }
    }


    public void newSchedule(String name) {
        Schedule newSchedule = new Schedule();
        newSchedule.name = name;
        newSchedule.events = new HashSet<>();  // Assuming you want to use HashSet for events

        currentSchedule = newSchedule;

        // If you want to add it to the user's schedules
        if (user != null) {
            user.mySchedules.add(newSchedule);
        }
    }

    public void remEvent(Event e) {
        // Remove a course from the current schedule
        currentSchedule.events.remove(e);
        System.out.println(e.name + " was removed from schedule.");
    }

    public void redo() {
        // Redo last undone action
    }

    public void undo() {
        // Undo last action
    }


}
