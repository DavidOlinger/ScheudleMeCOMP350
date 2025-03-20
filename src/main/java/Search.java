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
                    // should display is TRUE if the course matches all filters that are set. it ignores null filters.
                    boolean timeCheck = false; //set true if it matches a filter
                    boolean dayCheck = false; //set true if it matches a filter

                    // checking time filter
                    if (filter != null && filter.timeRange != null) { // if a time range is specified
                        //if the course's time range is within the filter's time range, return true
                        timeCheck = isWithinTimeRange(course);
                        //otherwise don't add the course (return false)
                    } else { //if no time range specified
                        timeCheck = true;
                    }

                    //checking day filter
                    // if a day range is specified that isn't empty
                    if (filter != null && filter.dayRange != null && !filter.dayRange.isEmpty()) {
                        //if the course's days are within the filter's day range, return true
                        dayCheck = isWithinDayRange(course);
                        //otherwise don't add the course (return false)

                    } else { //if no day range specified
                        dayCheck = true;
                    }

                    if (dayCheck && timeCheck) {
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
                course.location.toLowerCase().contains(tokenLower);
    }


    /**
     * Checks if a course is within the time range specified by the filter.
     * @param course The course to check.
     * @return True if the course is within the time range, false otherwise.
     */
    private boolean isWithinTimeRange(Course course) {
        return (course.time.startTime >= filter.timeRange.startTime && course.time.endTime <= filter.timeRange.endTime);
    }


    /**
     * Checks if a course is within the day range specified by the filter.
     * @param course The course to check.
     * @return True if the course is within the day range, false otherwise.
     */
    private boolean isWithinDayRange(Course course) {
        // for each day in the course's days
        for (int i = 0; i < course.days.length(); i++) {
            //if it is in the filter's day range
            if (filter.dayRange.contains(course.days.substring(i, i + 1))) {
                //the course should be displayed
                return true;
            }
        }
        //otherwise it should not be displayed
        return false;
    }


    /**
     * Modify the time filter to only include the specified time range.
     * @param ts The time range to include in the filter.
     */
    public void ModifyTimeFilter(TimeSlot ts) {
        filter.timeRange = ts;
    }


    /**
     * Modify the day filter to only include the specified days. Automatically removes all other characters than MTWRF
     * @param days The days to include in the filter.
     */
    public void ModifyDayFilter(String days) {
        // remove all characters from "days" that are not 'M', 'T', 'W', 'R', 'F'
        // and set the dayRange to the result
        filter.dayRange = days.replaceAll("[^MTWRF]", "");
    }

    public void ResetFilters() {
        filter.timeRange = null;
        filter.dayRange = null;
        //maybe more needed here
    }


}