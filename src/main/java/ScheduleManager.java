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


    public void LoadSchedule(String name) {

        if (user == null) {
            System.out.println("Error: No user is logged in.");
            return;
        }

        // Search for the schedule in user's saved schedules
        for (Schedule schedule : user.mySchedules) {
            if (schedule.name.equals(name)) {
                currentSchedule = schedule;
                System.out.println("Loaded schedule: " + name);

                // once someone adds the schedule thing, we could print out the schedule stuff
                return;

            }
        }

        // Failed to find
        System.out.println("Error: No saved schedule found with name '" + name + "'.");

    }

    private void GetProfessorRatings() {
        // Retrieve and store professor ratings
    }

    private void RetrieveCourseList() {
        // Fetch and store course list
    }

    public boolean CreateEvent(Event e) {
        // Attempt to create an event in the current schedule
        return true; // Placeholder
    }

    public boolean AddCourse(Course c) {
        // Add a course to the current schedule
        return true; // Placeholder
    }

    public void NewSchedule(String name) {
        // Create a new schedule with the given name
    }

    public void RemCourse(Course c) {
        // Remove a course from the schedule
    }

    public void Redo() {
        // Redo last undone action
    }

    public void Undo() {
        // Undo last action
    }


}
