import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.AfterEach;
import java.io.File;
import java.util.HashSet;
import java.util.Set;

public class CalendarViewTest {
    private Search search;
    private ScheduleManager scheduleManager;
    private CalendarView calendarView;
    private Set<Course> courseDatabase;

    @BeforeEach
    void setUp() {
        // Initialize components
        search = new Search();
        scheduleManager = new ScheduleManager();
        calendarView = new CalendarView();
        courseDatabase = new HashSet<>();

        // Create test courses
        Course course1 = new Course(
                "PRINCIPLES OF ACCOUNTING I",    // name
                new TimeSlot("15:30:00", "16:45:00"), // time
                "TR",                           // days
                new Professor("Graybill, Keith B."), // professor
                201,                           // courseCode
                "2023_Fall",                   // semester
                "SHAL 316",                    // location
                'A',                          // section
                "ACCT",                        // subject
                3
        );

        Course course2 = new Course(
                "INTRODUCTION TO COMPUTER SCIENCE",
                new TimeSlot("09:00:00", "10:15:00"),
                "MW",
                new Professor("Smith, John"),
                101,
                "2023_Fall",
                "SCI 202",
                'C',
                "CS",
                3
        );

        // Add courses to database
        courseDatabase.add(course1);
        courseDatabase.add(course2);
        search.courseDatabase = courseDatabase;

        // Create and initialize test user
        User testUser = new User("testUser", "testPassword");
        testUser.saveUserData(); // This will create the user file

        // Login test user
        scheduleManager.loginUser("testUser", "testPassword");

        // Create new schedule
        scheduleManager.newSchedule("Test Schedule");

        // Add one course to current schedule
        scheduleManager.addEvent(course1);

        // Connect components
        calendarView.setSchedule(scheduleManager.getCurrentSchedule());
        search.setCalendarView(calendarView);
    }

    @AfterEach
    void tearDown() {
        // Clean up test user data
        File userFile = new File("users/testUser.json");
        if (userFile.exists()) {
            userFile.delete();
        }
        File userDir = new File("users/testUser");
        if (userDir.exists()) {
            for (File file : userDir.listFiles()) {
                file.delete();
            }
            userDir.delete();
        }
    }

    @Test
    void testConcurrentDisplay() {
        // Display initial view with just the schedule
        System.out.println("Initial Calendar View (Schedule only):");
        calendarView.display();

        // Perform search and verify concurrent display
        System.out.println("\nCalendar View after searching for CS courses:");
        search.SearchQ("CS");
    }

    @Test
    void testMultipleCoursesOverlap() {
        // Search for all courses in the database
        System.out.println("Calendar View showing all courses:");
        search.SearchQ("2023_Fall");
    }
}