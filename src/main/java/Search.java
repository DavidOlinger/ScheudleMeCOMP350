import java.util.ArrayList;
import java.util.HashSet;
import java.util.Set;


public class Search {
    //public String query; //?? why is this here
    public Filter filter;
    //public Set<Course> resultsList;
    public Set<Course> filteredResultsList;
    //private Set<Professor> professors;

    public Set<Course> courseDatabase;

    public Search(){
        //this.resultsList = new HashSet<>();
        this.filteredResultsList = new HashSet<>();
        this.courseDatabase = new HashSet<>();
    }


    /**
     * Searches for courses that match the user's query.
     *
     * @param query The search query entered by the user.
     */
    public void SearchQ(String query) {
        // Step 1: Parse the query into tokens
        String[] tokens = query.split("\\s+"); // Split by spaces

        // Step 2: Initialize the results list with all courses
        filteredResultsList = new HashSet<>(courseDatabase);

        // Step 3: Iterate over each token and filter the results
        for (String token : tokens) {
            Set<Course> matchingCourses = new HashSet<>();

            for (Course course : filteredResultsList) {
                // Check if the course matches the token in any field
                if (matchesToken(course, token)) {
                    matchingCourses.add(course);
                }
            }

            // Update the filtered results list
            filteredResultsList = matchingCourses;

            // If no matches are found, stop searching further
            if (filteredResultsList.isEmpty()) {
                break;
            }
        }

        // Step 4: Display the filtered results
        if (filteredResultsList.isEmpty()) {
            System.out.println("No courses found matching: " + query);
        } else {
            System.out.println("Courses matching '" + query + "':");
            for (Course course : filteredResultsList) {
                System.out.println(course+"\n");
            }
        }
    }

    /**
     * Checks if a course matches the given token in any field.
     *
     * @param course The course to check.
     * @param token  The search token.
     * @return True if the course matches the token, false otherwise.
     */
    private boolean matchesToken(Course course, String token) {
        // Check if the token matches any of the relevant fields
        return String.valueOf(course.courseCode).equals(token) || // Check courseCode
                course.name.contains(token) || // Check course name
                course.subject.equalsIgnoreCase(token) || // Check subject
                course.professor.name.contains(token) || // Check professor name
                course.semester.equalsIgnoreCase(token) || // Check semester
                course.location.contains(token) || // Check location
                course.days.contains(token); // Check days (use contains for partial matches)
    }

    public void ModifyTimeFilter() {
        // Modify search time filter
    }

    public void ModifyDayFilter() {
        // Modify search day filter
    }

    public void ResetFilters() {
        // Reset search filters
    }
}