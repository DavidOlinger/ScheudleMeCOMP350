import java.util.Scanner;

public class Main {

//public courseDatabase

    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        ScheduleManager scheduleManager = new ScheduleManager();
        scheduleManager.user = new User("Bob");
        System.out.println(scheduleManager.user);
        System.out.println("\n\n");
        System.out.println("Welcome to Course Scheduler!");
        System.out.println("1. Load an existing schedule");
        System.out.println("2. Create a new schedule");
        System.out.print("Please select an option (1-2): ");

        int choice;
        try {
            choice = Integer.parseInt(scanner.nextLine());
        } catch (NumberFormatException e) {
            System.out.println("Invalid input. Defaulting to creating a new schedule.");
            choice = 2;
        }

        if (choice == 1) {
            System.out.println("Loading functionality not implemented yet.");
            System.out.print("Please enter the name of the schedule to load: ");
            String scheduleName = scanner.nextLine();
            scheduleManager.loadSchedule(scheduleName);
        } else if (choice == 2) {
            System.out.print("Please enter a name for your new schedule: ");
            String scheduleName = scanner.nextLine();
            scheduleManager.newSchedule(scheduleName);
            System.out.println("New schedule '" + scheduleName + "' created successfully!");
        } else {
            System.out.println("Invalid choice. Exiting program.");
        }

        scanner.close();
    }

    public static void run() {
        //runs the thing
    }


}
