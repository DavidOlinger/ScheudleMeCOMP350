import newSite.core.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

public class SearchDayTimeTester {
    private Search search;
    private Course course1, course2, course3;

    @BeforeEach
    void setUp() {
        search = new Search();
        search.filter = new Filter();

        // Create test courses with different times and days
        TimeSlot morning = new TimeSlot("08:00:00", "09:30:00");
        TimeSlot afternoon = new TimeSlot("14:00:00", "15:30:00");
        TimeSlot evening = new TimeSlot("18:00:00", "19:30:00");

        course1 = new Course("Math 101", morning, "MWF",
                new Professor("Dr. Smith"), 101, "Fall", "Room 101", 'A', "MATH", 3);
        course2 = new Course("Physics 201", afternoon, "TR",
                new Professor("Dr. Jones"), 201, "Fall", "Room 102", 'A', "PHYS", 3);
        course3 = new Course("Chemistry 301", evening, "MW",
                new Professor("Dr. Brown"), 301, "Fall", "Room 103", 'A', "CHEM", 3);

        // Add courses to database
        search.courseDatabase.add(course1);
        search.courseDatabase.add(course2);
        search.courseDatabase.add(course3);
    }

    @Test
    void testMorningTimeFilter() {
        search.ModifyTimeFilter(new TimeSlot("08:00:00", "12:00:00"));
        System.out.println("Time range filter: " + search.filter.timeRange);

        search.SearchQ("");
        assertEquals(1, search.filteredResultsList.size());
        assertTrue(search.filteredResultsList.contains(course1));
    }

    @Test
    void testMWFDayFilter() {
        search.ModifyDayFilter("MWF");
        System.out.println("Day range filter: " + search.filter.dayRange);

        search.SearchQ("");
        assertEquals(2, search.filteredResultsList.size()); //should show any classes that fall on an M, W, OR on an F
        assertTrue(search.filteredResultsList.contains(course1));
    }

    @Test
    void testCombinedDayTimeFilter() {
        // Test afternoon classes on TR
        search.ModifyTimeFilter(new TimeSlot("13:00:00", "16:00:00"));
        System.out.println("Time range filter: " + search.filter.timeRange);
        search.ModifyDayFilter("TR");
        System.out.println("Day range filter: " + search.filter.dayRange);
        search.SearchQ("");
        assertEquals(1, search.filteredResultsList.size());
        assertTrue(search.filteredResultsList.contains(course2));
    }


    @Test
    void testInvalidDayFilter() {
        search.ModifyDayFilter("XYZ");  // Invalid days
        System.out.println("Day range filter: " + search.filter.dayRange);
        search.SearchQ("");
        assertEquals(3, search.filteredResultsList.size()); // No courses should be filtered out since dayRange is empty
    }


    @Test
    void testEveningClassesOnMW() {
        search.ModifyTimeFilter(new TimeSlot("17:00:00", "20:00:00"));
        System.out.println("Time range filter: " + search.filter.timeRange);
        search.ModifyDayFilter("MW");
        System.out.println("Day range filter: " + search.filter.dayRange);
        search.SearchQ("");
        assertEquals(1, search.filteredResultsList.size());
        assertTrue(search.filteredResultsList.contains(course3));
    }
}