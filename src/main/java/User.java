import java.util.ArrayList;

public class User {
    public String name;
    public int idNumber;
    public String major;
    public int year;
    public ArrayList<Schedule> mySchedules;


    public User(String name) {
        // Create a user with dummy data
        this.name = name;
        this.idNumber = 12345;
        this.major = "Undeclared";
        this.year = 1;
        this.mySchedules = new ArrayList<>();
    }

    public User(String name, int idNumber, String major, int year) {
        // Create a user with custom values
        this.name = name;
        this.idNumber = idNumber;
        this.major = major;
        this.year = year;
        this.mySchedules = new ArrayList<>();
    }


    @Override
    public String toString(){
        StringBuilder sb = new StringBuilder();
        sb.append("User info:\n");
        sb.append("Name: ").append(name).append("\n");
        sb.append("ID: ").append(idNumber).append("\n");
        sb.append("Major: ").append(major).append("\n");
        sb.append("Year: ").append(year).append("\n");
        return sb.toString();
    }

    public void SaveSchedule(Schedule s) {
        // Save a schedule
    }

    public void DeleteSchedule(Schedule s) {
        // Delete a schedule
    }

    //rename a schedule in the list myschedules
    public void RenameSchedule(String oldName, String newName) {
        //find the schedule in the list
        for (Schedule schedule : mySchedules) {
            if (schedule.name.equals(oldName)) {
                schedule.name = newName;
                System.out.println("Schedule name changed to " + newName);
                return;
            }
        }
        //if the schedule is not found, print an error message
        System.out.println("Error: Schedule not found.");

    }
}