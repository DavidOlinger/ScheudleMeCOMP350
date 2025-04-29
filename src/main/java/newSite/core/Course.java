package newSite.core;
import java.util.Objects;

public class Course extends Event {
    // public int refNumber; // json file doesn't include this
    // public ArrayList<Course> prerequisites; // json file doesn't include this
    // public String description; // json file doesn't include this

    public Professor professor;
    public int courseCode;
    public String semester;
    public String location;
    public char section; // Use char for single section letter
    public String subject;
    public int credits;

    Course(String name, TimeSlot time, String days, Professor professor, int coursecode, String semester,
           String location, char section, String subject, int credits){
        // Call the Event constructor - NOTE: Ensure Event's constructor and fields are appropriate
        super(name, days, time);
        this.professor = professor;
        this.courseCode = coursecode;
        this.semester = semester;
        this.location = location;
        this.section = section;
        this.subject = subject;
        this.credits = credits;
    }

    @Override
    public String toString() {
        // Ensure Event's toString is called correctly if it exists and is useful
        String eventStr = super.toString(); // Assuming Event has a useful toString()
        // Build course-specific string, potentially incorporating Event's string
        return String.format("%s %d-%c: %s (%s)\nProfessor: %s | Days: %s | Time: %s | Location: %s",
                subject, courseCode, section, name, semester,
                (professor != null ? professor.toString() : "N/A"),
                (days != null ? days : "N/A"),
                (time != null ? time.toString() : "N/A"),
                location);
    }

    // --- ADDED equals() and hashCode() ---

    @Override
    public boolean equals(Object o) {
        if (this == o) return true; // Same object instance
        // Check if o is null or not an instance of Course (or related Event if Event overrides equals)
        // NOTE: If Event class has its own equals/hashCode based on name/days/time,
        // you might need to call super.equals(o) here as well, depending on desired equality.
        // For now, focusing on unique course section identifiers.
        if (o == null || getClass() != o.getClass()) return false;
        // if (!super.equals(o)) return false; // Uncomment if Event equality needs checking first

        Course course = (Course) o;

        // Consider two courses equal if subject, courseCode, and section match
        return courseCode == course.courseCode &&
                section == course.section && // char comparison
                Objects.equals(subject, course.subject); // Use Objects.equals for null safety
    }

    @Override
    public int hashCode() {
        // Generate hash code based on the same fields used in equals()
        // NOTE: If super.equals() is used above, you MUST include super.hashCode() here.
        // int result = super.hashCode(); // Uncomment if Event equality is checked
        // result = 31 * result + Objects.hash(subject, courseCode, section);
        // return result;

        // For now, hash code based only on Course fields used in equals:
        return Objects.hash(subject, courseCode, section);
    }
    // --- END Added equals() and hashCode() ---
}
