package newSite.core;

import java.util.HashSet;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.Stream;

// Import LevenshteinDistance from Apache Commons Text
import org.apache.commons.text.similarity.LevenshteinDistance;


public class Search {
    public Filter filter;
    public Set<Course> filteredResultsList;
    public Set<Course> courseDatabase;

    // Levenshtein distance threshold (adjust as needed)
    private static final int FUZZY_THRESHOLD_SHORT = 1; // Max edits for short tokens/words (e.g., <= 4 chars)
    private static final int FUZZY_THRESHOLD_LONG = 2;  // Max edits for longer tokens/words

    // Instance of LevenshteinDistance
    private static final LevenshteinDistance levenshteinDistance = new LevenshteinDistance();


    public Search(){
        this.filteredResultsList = new HashSet<>();
        this.courseDatabase = new HashSet<>();
        if (this.filter == null) {
            this.filter = new Filter();
        }
    }


    /**
     * Searches for courses that match the user's query using keyword and fuzzy matching.
     *
     * @param query The search query entered by the user.
     * @return The set of courses that match the query and active filters.
     */
    public Set<Course> searchQuery(String query) {
        if (courseDatabase == null || courseDatabase.isEmpty()) {
            System.err.println("Search warning: courseDatabase is null or empty.");
            return new HashSet<>();
        }
        if (query == null || query.trim().isEmpty()) {
            return filterCourses(new HashSet<>(courseDatabase));
        }

        String[] tokens = query.trim().toLowerCase().split("\\s+");
        Set<Course> currentResults = new HashSet<>(courseDatabase);

        for (String token : tokens) {
            if (token.isEmpty()) continue;

            final String currentToken = token;
            currentResults = currentResults.stream()
                    .filter(course -> matchesTokenFuzzy(course, currentToken))
                    .collect(Collectors.toSet());

            if (currentResults.isEmpty()) {
                break;
            }
        }

        this.filteredResultsList = filterCourses(currentResults);
        return this.filteredResultsList;
    }

    /**
     * Filters a set of courses based on the active time and day filters.
     * @param coursesToFilter The set of courses to filter.
     * @return A new set containing only the courses that match the filters.
     */
    private Set<Course> filterCourses(Set<Course> coursesToFilter) {
        if (coursesToFilter == null || coursesToFilter.isEmpty()) {
            return new HashSet<>();
        }
        if (this.filter == null) {
            System.err.println("Search warning: Filter object is null in filterCourses.");
            return coursesToFilter;
        }

        Stream<Course> courseStream = coursesToFilter.stream();

        // Apply Time Filter
        if (filter.timeRange != null) {
            courseStream = courseStream.filter(this::isWithinTimeRange);
        }

        // Apply Day Filter
        if (filter.dayRange != null && !filter.dayRange.isEmpty()) {
            courseStream = courseStream.filter(this::isWithinDayRange);
        }

        return courseStream.collect(Collectors.toSet());
    }


    /**
     * Checks if a course matches the given token using fuzzy matching (Levenshtein distance).
     * Now checks course name and professor name word by word.
     *
     * @param course The course to check.
     * @param token  The lowercase search token.
     * @return True if the course matches the token within the threshold, false otherwise.
     */
    private boolean matchesTokenFuzzy(Course course, String token) {
        if (course == null || token == null || token.isEmpty()) {
            return false;
        }

        // 1. Check Course Code (Exact Match Only)
        if (String.valueOf(course.courseCode).equals(token)) {
            return true;
        }

        // 2. Check other fields using Levenshtein distance
        int baseThreshold = (token.length() < 5) ? FUZZY_THRESHOLD_SHORT : FUZZY_THRESHOLD_LONG;

        // Check Subject (allow fuzzy match)
        if (course.subject != null && levenshteinDistance.apply(token, course.subject.toLowerCase()) <= baseThreshold) {
            return true;
        }

        // Check Course Name WORD BY WORD
        if (course.name != null) {
            // Split by space or common punctuation that might separate words in titles
            String[] nameWords = course.name.toLowerCase().split("[\\s\\p{Punct}]+");
            for (String word : nameWords) {
                if (word.isEmpty()) continue;
                int wordThreshold = (Math.min(token.length(), word.length()) < 5) ? FUZZY_THRESHOLD_SHORT : FUZZY_THRESHOLD_LONG;
                if (levenshteinDistance.apply(token, word) <= wordThreshold) {
                    return true; // Match found if any word is close enough
                }
            }
        }

        // ***** START OF CHANGE: Check Professor Name PART BY PART *****
        if (course.professor != null && course.professor.name != null) {
            // Split professor name by common delimiters (space, comma, period)
            // This handles "Lastname, Firstname M." and "Firstname M. Lastname" etc.
            String[] nameParts = course.professor.name.toLowerCase().split("[\\s,.]+");
            for (String part : nameParts) {
                if (part.isEmpty()) continue;
                // Determine threshold based on the shorter of token or name part
                int partThreshold = (Math.min(token.length(), part.length()) < 5) ? FUZZY_THRESHOLD_SHORT : FUZZY_THRESHOLD_LONG;
                if (levenshteinDistance.apply(token, part) <= partThreshold) {
                    return true; // Match found if token is close to *any part* of the name
                }
            }
        }
        // ***** END OF CHANGE *****

        // Simple contains check for location/semester
        if (course.location != null && course.location.toLowerCase().contains(token)) {
            return true;
        }
        if (course.semester != null && course.semester.toLowerCase().contains(token)) {
            return true;
        }


        return false; // No match found
    }

    // --- Stub Methods ---
    public void displaySearchResults(String query, Set<Course> results) {
        System.out.println("STUB METHOD CALLED: displaySearchResults for query: \"" + query + "\" with " + (results != null ? results.size() : 0) + " results.");
    }
    public void SearchQ(String query) {
        System.out.println("STUB METHOD CALLED: SearchQ for query: \"" + query + "\"");
    }

    // --- Filter Methods ---
    private boolean isWithinTimeRange(Course course) {
        return course != null && course.time != null && filter.timeRange != null &&
                (course.time.startTime >= filter.timeRange.startTime && course.time.endTime <= filter.timeRange.endTime);
    }
    private boolean isWithinDayRange(Course course) {
        if (course == null || course.days == null || course.days.isEmpty() || filter.dayRange == null || filter.dayRange.isEmpty()) {
            return false;
        }
        for (char courseDay : course.days.toCharArray()) {
            if (filter.dayRange.indexOf(courseDay) != -1) {
                return true;
            }
        }
        return false;
    }
    public void ModifyTimeFilter(TimeSlot ts) {
        if (filter == null) filter = new Filter();
        filter.timeRange = ts;
    }
    public void ModifyDayFilter(String days) {
        if (filter == null) filter = new Filter();
        if (days != null) {
            filter.dayRange = days.replaceAll("[^MTWRF]", "");
            if (filter.dayRange.isEmpty()) {
                filter.dayRange = null;
            }
        } else {
            filter.dayRange = null;
        }
    }
    public void ResetFilters() {
        if (filter != null) {
            filter.timeRange = null;
            filter.dayRange = null;
        } else {
            filter = new Filter();
        }
    }
}