import java.util.ArrayList;
import java.util.HashSet;
import java.util.Set;


public class Search {
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
     * @return The set of courses that match the query.
     */
    public Set<Course> searchQuery(String query) {
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
                    if (filter != null && filter.timeRange != null) { // if a time range is specified
                        //if the course's time range is within the filter's time range
                        if (course.time.startTime >= filter.timeRange.startTime && course.time.endTime <= filter.timeRange.endTime) {
                            matchingCourses.add(course); //add the course
                        }
                        //otherwise don't add the course
                    } else { //if no time range specified
                        matchingCourses.add(course);
                    }
                }
            }

            // Update the filtered results list
            filteredResultsList = matchingCourses;

            // If no matches are found, stop searching further
            if (filteredResultsList.isEmpty()) {
                break;
            }
        }
        
        return filteredResultsList;
    }

    /**
     * Display the search results to the console.
     *
     * @param query The original search query.
     * @param results The set of courses that match the query.
     */
    public void displaySearchResults(String query, Set<Course> results) {
        if (results.isEmpty()) {
            System.out.println("No courses found matching: " + query);
        } else {
            System.out.println("Courses matching '" + query + "':");
            for (Course course : results) {
                System.out.println(course);
            }
        }
    }

    /**
     * Searches for courses and displays results.
     * 
     * @param query The search query entered by the user.
     */
    public void SearchQ(String query) {
        Set<Course> results = searchQuery(query);
        displaySearchResults(query, results);
    }

    /**
     * Checks if a course matches the given token in any field.
     *
     * @param course The course to check.
     * @param token  The search token.
     * @return True if the course matches the token, false otherwise.
     */
    private boolean matchesToken(Course course, String token) {
        String tokenLower = token.toLowerCase();
        return String.valueOf(course.courseCode).equals(token) || // Keep exact match for course code
                course.name.toLowerCase().contains(tokenLower) ||  // Add this line
                course.subject.toLowerCase().contains(tokenLower) ||
                course.professor.name.toLowerCase().contains(tokenLower) ||
                course.semester.toLowerCase().contains(tokenLower) ||
                course.location.toLowerCase().contains(tokenLower) ||
                course.days.toLowerCase().contains(tokenLower);
    }

    public void ModifyTimeFilter(TimeSlot ts) {
        filter.timeRange = ts;
    }

    public void ModifyDayFilter() {
        // Modify search day filter
    }

    public void ResetFilters() {
        // Reset search filters
    }
}