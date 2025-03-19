import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

public class CourseTest {

    private Course course;
    private Professor professor;
    private TimeSlot timeSlot;

    @BeforeEach
    public void setUp() {
        professor = new Professor("Graybill, Keith B.");
        timeSlot = new TimeSlot("15:30:00", "16:45:00");
        course = new Course("PRINCIPLES OF ACCOUNTING I", timeSlot, "TR", professor, 201, "2023_Fall", "SHAL 316", 'A', "ACCT");
    }

    @Test
    public void testConstructor() {
        assertNotNull(course);
        assertEquals("PRINCIPLES OF ACCOUNTING I", course.name);
        assertEquals("TR", course.days);
        assertEquals(timeSlot, course.time);
        assertEquals(professor, course.professor);
        assertEquals(201, course.courseCode);
        assertEquals("2023_Fall", course.semester);
        assertEquals("SHAL 316", course.location);
        assertEquals('A', course.section);
        assertEquals("ACCT", course.subject);
    }

    @Test
    public void testToString() {
        String expected = "Name: PRINCIPLES OF ACCOUNTING I\nDays: TR\nTime: 15:30:00 - 16:45:00\n" +
                "Professor: Graybill, Keith B.\nCourse Code: 201\nSemester: 2023_Fall\n" +
                "Location: SHAL 316\nSection: A\nSubject: ACCT";
        assertEquals(expected, course.toString());
    }

    @Test
    public void testGetProfessor() {
        assertEquals(professor, course.professor);
    }

    @Test
    public void testGetCourseCode() {
        assertEquals(201, course.courseCode);
    }

    @Test
    public void testGetSemester() {
        assertEquals("2023_Fall", course.semester);
    }

    @Test
    public void testGetLocation() {
        assertEquals("SHAL 316", course.location);
    }

    @Test
    public void testGetSection() {
        assertEquals('A', course.section);
    }

    @Test
    public void testGetSubject() {
        assertEquals("ACCT", course.subject);
    }

    @Test
    public void testGetTime() {
        assertEquals(timeSlot, course.time);
    }

    @Test
    public void testGetDays() {
        assertEquals("TR", course.days);
    }

    @Test
    public void testGetName() {
        assertEquals("PRINCIPLES OF ACCOUNTING I", course.name);
    }
}