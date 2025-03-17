import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import java.util.HashSet;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

class SearchTest {
    private Search search;
    private Set<Course> courseDatabase;

    @BeforeEach
    void setUp() {
        // Initialize the Search object and manually create a course database
        search = new Search();
        courseDatabase = new HashSet<>();

        // Create some professors
        Professor prof1 = new Professor("Graybill, Keith B.");
        Professor prof2 = new Professor("Shultz, Tricia Michele");

        // Create some courses and add them to the database
        courseDatabase.add(new Course("PRINCIPLES OF ACCOUNTING I",
                new TimeSlot("15:30:00", "16:45:00"), "TR",
                prof1, 201, "2023_Fall", "SHAL 316", 'A', "ACCT"));

        courseDatabase.add(new Course("PRINCIPLES OF ACCOUNTING I",
                new TimeSlot("10:00:00", "10:50:00"), "MWF",
                prof2, 201, "2023_Fall", "SHAL 309", 'B', "ACCT"));

        courseDatabase.add(new Course("INTRODUCTION TO COMPUTER SCIENCE",
                new TimeSlot("09:00:00", "10:15:00"), "MW",
                new Professor("Smith, John"), 101, "2023_Fall", "SCI 202", 'C', "CS"));

        // Set the course database in the Search object
        search.courseDatabase = courseDatabase;
    }

    @Test
    void testSearchQ_BySubject() {
        // Search for courses with subject "ACCT"
        search.SearchQ("ACCT");

        // Verify that the filtered results contain only ACCT courses
        assertEquals(2, search.filteredResultsList.size());
        for (Course course : search.filteredResultsList) {
            assertEquals("ACCT", course.subject);
        }
    }

    @Test
    void testSearchQ_ByCourseCode() {
        // Search for courses with course code 201
        search.SearchQ("201");

        // Verify that the filtered results contain only courses with code 201
        assertEquals(2, search.filteredResultsList.size());
        for (Course course : search.filteredResultsList) {
            assertEquals(201, course.courseCode);
        }
    }

    @Test
    void testSearchQ_ByProfessor() {
        // Search for courses taught by "Graybill"
        search.SearchQ("Graybill");

        // Verify that the filtered results contain only courses taught by Graybill
        assertEquals(1, search.filteredResultsList.size());
        for (Course course : search.filteredResultsList) {
            assertTrue(course.professor.name.contains("Graybill"));
        }
    }

    @Test
    void testSearchQ_BySemester() {
        // Search for courses in the "2023_Fall" semester
        search.SearchQ("2023_Fall");

        // Verify that the filtered results contain only courses in the 2023_Fall semester
        assertEquals(3, search.filteredResultsList.size());
        for (Course course : search.filteredResultsList) {
            assertEquals("2023_Fall", course.semester);
        }
    }

    @Test
    void testSearchQ_ByLocation() {
        // Search for courses in location "SHAL 316"
        search.SearchQ("SHAL 316");

        // Verify that the filtered results contain only courses in SHAL 316
        assertEquals(1, search.filteredResultsList.size());
        for (Course course : search.filteredResultsList) {
            assertEquals("SHAL 316", course.location);
        }
    }



    @Test
    void testSearchQ_CombinedQuery() {
        // Search for courses with subject "ACCT" and course code 201
        search.SearchQ("ACCT 201");

        // Verify that the filtered results contain only ACCT courses with code 201
        assertEquals(2, search.filteredResultsList.size());
        for (Course course : search.filteredResultsList) {
            assertEquals("ACCT", course.subject);
            assertEquals(201, course.courseCode);
        }
    }

    @Test
    void testSearchQ_NoMatches() {
        // Search for a query that matches no courses
        search.SearchQ("MATH 999");

        // Verify that no courses are found
        assertEquals(0, search.filteredResultsList.size());
    }




    @Test
    void testSearchQ_LargerCombinedQuery() {
        // Search for courses with subject "ACCT", course code 201, and location "SHAL 316"
        search.SearchQ("ACCT 201 SHAL 316");

        // Verify that the filtered results contain only the course that matches all criteria
        assertEquals(1, search.filteredResultsList.size());
        for (Course course : search.filteredResultsList) {
            assertEquals("ACCT", course.subject);
            assertEquals(201, course.courseCode);
            assertEquals("SHAL 316", course.location);
        }
    }



    @Test
    void testSearchQ_ByDays() {
        // Search for courses that meet on "M" (should match "MWF" and "MW")
        search.SearchQ("M");

        // Verify that the filtered results contain only courses that meet on "M"
        assertEquals(2, search.filteredResultsList.size());
        for (Course course : search.filteredResultsList) {
            assertTrue(course.days.contains("M"));
        }
    }


}