import com.google.gson.Gson;

import java.io.FileReader;
import java.util.HashSet;
import java.util.List;
import java.util.Scanner;
import java.util.Set;

public class Main {

    // Wrapper class to represent the root JSON object
    private static class CourseList {
        List<CourseData> classes; // List of courses in the JSON
    }

    // Class to represent a single course in the JSON
    private static class CourseData {
        int credits;
        List<String> faculty;
        boolean is_lab;
        boolean is_open;
        String location;
        String name;
        int number;
        int open_seats;
        String section;
        String semester;
        String subject;
        List<TimeSlotData> times;
        int total_seats;
    }

    // Class to represent a time slot in the JSON
    private static class TimeSlotData {
        String day;
        String start_time;
        String end_time;
    }

    /**
     * Reads the JSON file and converts it into a Set of Course objects.
     *
     * @param filePath Path to the JSON file.
     * @return A Set of Course objects.
     */
    public static Set<Course> loadCourseDatabase(String filePath) {
        Set<Course> courseDatabase = new HashSet<>();
        Gson gson = new Gson();

        System.out.println("Attempting to load course database from: " + filePath);

        try (FileReader reader = new FileReader(filePath)) {
            // Step 1: Deserialize the JSON file into a CourseList object
            System.out.println("Parsing JSON file...");
            CourseList courseList = gson.fromJson(reader, CourseList.class);

            if (courseList == null || courseList.classes == null) {
                System.out.println("Error: JSON file is empty or malformed.");
                return courseDatabase;
            }

            System.out.println("Found " + courseList.classes.size() + " courses in the JSON file.");

            // Step 2: Loop through each course in the JSON and convert it to a Course object
            for (CourseData courseData : courseList.classes) {
                System.out.println("\nProcessing course: " + courseData.name);

                // Step 3: Create a Professor object (assuming the first faculty member is the primary professor)
                if (courseData.faculty == null || courseData.faculty.isEmpty()) {
                    System.out.println("Warning: No faculty listed for course: " + courseData.name);
                    continue; // Skip this course if no faculty is listed
                }
                Professor professor = new Professor(courseData.faculty.get(0));
                System.out.println("Professor: " + professor.name);

                // Step 4: Create TimeSlot objects for the course
                Set<TimeSlot> timeSlots = new HashSet<>();
                if (courseData.times != null && !courseData.times.isEmpty()) {
                    for (TimeSlotData timeData : courseData.times) {
                        System.out.println("Adding time slot: " + timeData.day + " " + timeData.start_time + "-" + timeData.end_time);
                        TimeSlot timeSlot = new TimeSlot(timeData.start_time, timeData.end_time);
                        timeSlots.add(timeSlot);
                    }
                } else {
                    System.out.println("Warning: No time slots listed for course: " + courseData.name);
                }

                // Step 5: Combine days from all time slots (e.g., "MWF" or "TR")
                StringBuilder daysBuilder = new StringBuilder();
                if (courseData.times != null) {
                    for (TimeSlotData timeData : courseData.times) {
                        daysBuilder.append(timeData.day);
                    }
                }
                String days = daysBuilder.toString();
                System.out.println("Days: " + days);

                // Step 6: Create a Course object
                if (timeSlots.isEmpty()) {
                    System.out.println("Warning: Skipping course due to missing time slots: " + courseData.name);
                    continue; // Skip this course if no time slots are available
                }

                Course course = new Course(
                        courseData.name,
                        timeSlots.iterator().next(), // Use the first time slot for simplicity
                        days,
                        professor,
                        courseData.number,
                        courseData.semester,
                        courseData.location,
                        courseData.section.charAt(0), // Convert section to char
                        courseData.subject
                );

                // Step 7: Add the course to the database
                System.out.println("Created course: " + course.name);
                courseDatabase.add(course);
            }
        } catch (Exception e) {
            System.out.println("Error loading course database: " + e.getMessage());
            e.printStackTrace();
        }

        System.out.println("\nFinished loading course database. Total courses: " + courseDatabase.size());
        return courseDatabase;
    }

    public static void main(String[] args) {
        // Path to the JSON file
        String filePath = "data_wolfe.json";

        // Step 1: Load the course database
        System.out.println("Loading course database...");
        Set<Course> courseDatabase = loadCourseDatabase(filePath);

        // Step 2: Set the course database in the Search class
        Search search = new Search();
        search.courseDatabase = courseDatabase;

        // Step 3: Test the search functionality
        System.out.println("\nRunning search tests...");

        // Test 1: Search for a course by name
        System.out.println("\nTest 1: Searching for 'PRINCIPLES OF ACCOUNTING I'...");
        search.SearchQ("PRINCIPLES OF ACCOUNTING I");

        // Test 2: Search for a course by subject
        System.out.println("\nTest 2: Searching for subject 'ACCT'...");
        search.SearchQ("ACCT");

        // Test 3: Search for a course by professor
        System.out.println("\nTest 3: Searching for professor 'Graybill'...");
        search.SearchQ("Graybill");

        // Test 4: Search for a course by time (e.g., "MWF")
        System.out.println("\nTest 4: Searching for courses on 'MWF'...");
        search.SearchQ("MWF");

        System.out.println("\nAll tests completed.");



        Scanner scanner = new Scanner(System.in);
        ScheduleManager scheduleManager = new ScheduleManager();
        scheduleManager.user = User.addUser("Bob", "password");
        scheduleManager.loginUser("Bob", "password");
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
}
