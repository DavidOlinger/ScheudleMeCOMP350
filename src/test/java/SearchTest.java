import newSite.core.*;
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
        // Initialize the newSite.core.Search object and manually create a course database
        search = new Search();
        courseDatabase = new HashSet<>();

        // Create some professors
        Professor prof1 = new Professor("Graybill, Keith B.");
        Professor prof2 = new Professor("Shultz, Tricia Michele");

        // Create some courses and add them to the database
        courseDatabase.add(new Course("PRINCIPLES OF ACCOUNTING I",
                new TimeSlot("15:30:00", "16:45:00"), "TR",
                prof1, 201, "2023_Fall", "SHAL 316", 'A', "ACCT", 3));

        courseDatabase.add(new Course("PRINCIPLES OF ACCOUNTING I",
                new TimeSlot("10:00:00", "10:50:00"), "MWF",
                prof2, 201, "2023_Fall", "SHAL 309", 'B', "ACCT", 3));

        courseDatabase.add(new Course("INTRODUCTION TO COMPUTER SCIENCE",
                new TimeSlot("09:00:00", "10:15:00"), "MW",
                new Professor("Smith, John"), 101, "2023_Fall", "SCI 202", 'C', "CS", 3));

        // Set the course database in the newSite.core.Search object
        search.courseDatabase = courseDatabase;
    }

    @Test
    void testSearchQ_BySubject() {
        // newSite.core.Search for courses with subject "ACCT"
        search.SearchQ("ACCT");

        // Verify that the filtered results contain only ACCT courses
        assertEquals(2, search.filteredResultsList.size());
        for (Course course : search.filteredResultsList) {
            assertEquals("ACCT", course.subject);
        }
    }

    @Test
    void testSearchQ_ByCourseCode() {
        // newSite.core.Search for courses with course code 201
        search.SearchQ("201");

        // Verify that the filtered results contain only courses with code 201
        assertEquals(2, search.filteredResultsList.size());
        for (Course course : search.filteredResultsList) {
            assertEquals(201, course.courseCode);
        }
    }

    @Test
    void testSearchQ_ByProfessor() {
        // newSite.core.Search for courses taught by "Graybill"
        search.SearchQ("Graybill");

        // Verify that the filtered results contain only courses taught by Graybill
        assertEquals(1, search.filteredResultsList.size());
        for (Course course : search.filteredResultsList) {
            assertTrue(course.professor.name.contains("Graybill"));
        }
    }

    @Test
    void testSearchQ_BySemester() {
        // newSite.core.Search for courses in the "2023_Fall" semester
        search.SearchQ("2023_Fall");

        // Verify that the filtered results contain only courses in the 2023_Fall semester
        assertEquals(3, search.filteredResultsList.size());
        for (Course course : search.filteredResultsList) {
            assertEquals("2023_Fall", course.semester);
        }
    }

    @Test
    void testSearchQ_ByLocation() {
        // newSite.core.Search for courses in location "SHAL 316"
        search.SearchQ("SHAL 316");

        // Verify that the filtered results contain only courses in SHAL 316
        assertEquals(1, search.filteredResultsList.size());
        for (Course course : search.filteredResultsList) {
            assertEquals("SHAL 316", course.location);
        }
    }



    @Test
    void testSearchQ_CombinedQuery() {
        // newSite.core.Search for courses with subject "ACCT" and course code 201
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
        // newSite.core.Search for a query that matches no courses
        search.SearchQ("MATH 999");

        // Verify that no courses are found
        assertEquals(0, search.filteredResultsList.size());
    }




    @Test
    void testSearchQ_LargerCombinedQuery() {
        // newSite.core.Search for courses with subject "ACCT", course code 201, and location "SHAL 316"
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
        // newSite.core.Search for courses that meet on "M" (should match "MWF" and "MW")
        search.SearchQ("M");

        // Verify that the filtered results contain only courses that meet on "M"
        assertEquals(2, search.filteredResultsList.size());
        for (Course course : search.filteredResultsList) {
            assertTrue(course.days.contains("M"));
        }
    }

    @Test
    void testSearchWithTimeFilter() {
        // Initialize filter if not already done in setUp
        search.filter = new Filter();

        // Set time filter for afternoon classes (after 12:00)
        search.ModifyTimeFilter(new TimeSlot("12:00:00", "23:59:59"));

        // newSite.core.Search for all courses (empty string to get all courses through matching)
        search.SearchQ("");

        // Verify that only afternoon courses are in results
        assertEquals(1, search.filteredResultsList.size());
        for (Course course : search.filteredResultsList) {
            assertTrue(course.time.startTime >= 12 * 3600,
                    "newSite.core.Course should start after 12:00");
        }
    }

    @Test
    void testSearchWithSpecificTimeRangeFilter() {
        search.filter = new Filter();

        // Set time filter for morning classes between 9:00 and 11:00
        search.ModifyTimeFilter(new TimeSlot("09:00:00", "11:00:00"));

        // newSite.core.Search for all courses
        search.SearchQ("");

        // Verify that only courses within the time range are returned
        assertEquals(2, search.filteredResultsList.size());
        for (Course course : search.filteredResultsList) {
            assertTrue(course.time.startTime >= 9 * 3600,
                    "newSite.core.Course should start after or at 9:00");
            assertTrue(course.time.endTime <= 11 * 3600,
                    "newSite.core.Course should end before or at 11:00");
        }
    }

    @Test
    void testSearchQ_ByCourseName() {
        // Add a course with a specific name for testing
        courseDatabase.add(new Course("ADVANCED MANUSCRIPT DEVELOPMENT",
                new TimeSlot("14:00:00", "15:15:00"), "TR",
                new Professor("Johnson, Mary"), 301, "2023_Fall", "SHAL 310", 'A', "ENGL", 3));

        // newSite.core.Search for partial course name
        search.SearchQ("manuscript");

        // Verify that the filtered results contain the course
        assertEquals(1, search.filteredResultsList.size());
        assertTrue(search.filteredResultsList.iterator().next().name.toLowerCase()
                .contains("manuscript"));
    }

}