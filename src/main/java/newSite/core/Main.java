package newSite.core;

import com.google.gson.Gson;
// **** Keep GsonBuilder if loadCourseDatabase needs specific config ****
// import com.google.gson.GsonBuilder;
// **** Keep JsonSyntaxException if needed for specific error handling ****
import com.google.gson.JsonSyntaxException;

import java.io.FileReader;
import java.io.IOException; // Keep for FileReader
import java.util.*; // Keep for List, Set, HashSet

public class Main {

    // Keep courseDatabase field ONLY if getCourseDatabase() is actually used elsewhere.
    // If ScheduleMeApp just calls loadCourseDatabase and stores the result itself,
    // this static field might also be unnecessary. Let's keep it for now assuming it might be used.
    private static Set<Course> courseDatabase;

    // --- Inner helper classes for JSON deserialization ---
    private static class CourseList {
        List<CourseData> classes;
    }

    private static class CourseData {
        int credits;
        List<String> faculty;
        // boolean is_lab; // Keep only fields actively used in loadCourseDatabase
        // boolean is_open;
        String location;
        String name;
        int number;
        // int open_seats;
        String section;
        String semester;
        String subject;
        List<TimeSlotData> times;
        // int total_seats;
    }

    private static class TimeSlotData {
        String day;
        String start_time;
        String end_time;
    }
    // --- End Inner classes ---


    /**
     * Reads the course JSON file and converts it into a Set of Course objects.
     * This method is used by ScheduleMeApp to initialize course data.
     *
     * @param filePath Path to the JSON file (e.g., "data_wolfe.json").
     * @return A Set of Course objects, potentially empty if loading fails.
     */
    public static Set<Course> loadCourseDatabase(String filePath) {
        // Use local variable instead of static field unless static field is needed externally
        Set<Course> loadedCourses = new HashSet<>();
        // Use plain Gson unless specific configuration (like EventDeserializer) is needed here
        Gson gson = new Gson();

        System.out.println("Attempting to load course database from: " + filePath);

        try (FileReader reader = new FileReader(filePath)) {
            CourseList courseList = gson.fromJson(reader, CourseList.class);

            if (courseList == null || courseList.classes == null) {
                System.err.println("Error: Course JSON file is empty or malformed: " + filePath);
                return loadedCourses; // Return empty set
            }

            System.out.println("Found " + courseList.classes.size() + " potential course entries in JSON.");

            for (CourseData courseData : courseList.classes) {
                try { // Add inner try-catch to handle errors for a single course entry
                    // --- Data Validation & Transformation ---
                    if (courseData.faculty == null || courseData.faculty.isEmpty() || courseData.faculty.get(0) == null) {
                        System.out.println("Warning: Skipping course due to missing faculty: " + courseData.subject + " " + courseData.number);
                        continue;
                    }
                    Professor professor = new Professor(courseData.faculty.get(0)); // Assuming first is primary

                    if (courseData.times == null || courseData.times.isEmpty()) {
                        System.out.println("Warning: Skipping course due to missing time slots: " + courseData.subject + " " + courseData.number + " " + courseData.section);
                        continue; // Skip courses without times
                    }

                    // Process TimeSlots and Days together
                    Set<TimeSlot> timeSlots = new HashSet<>();
                    StringBuilder daysBuilder = new StringBuilder();
                    Set<Character> uniqueDays = new HashSet<>(); // To build unique days string like "MWF"

                    for (TimeSlotData timeData : courseData.times) {
                        if (timeData.day == null || timeData.start_time == null || timeData.end_time == null) {
                            System.out.println("Warning: Skipping invalid time slot data for course: " + courseData.subject + " " + courseData.number);
                            continue; // Skip invalid time slots
                        }
                        // Assume TimeSlot constructor handles format validation
                        TimeSlot timeSlot = new TimeSlot(timeData.start_time, timeData.end_time);
                        timeSlots.add(timeSlot);
                        // Add unique day characters
                        for (char dayChar : timeData.day.toCharArray()) {
                            if("MTWRF".indexOf(dayChar) != -1 && uniqueDays.add(dayChar)) { // Add if valid and not already added
                                daysBuilder.append(dayChar); // Build days string from unique day chars
                            }
                        }
                    }

                    if (timeSlots.isEmpty()) {
                        System.out.println("Warning: Skipping course after processing time slots (none valid?): " + courseData.subject + " " + courseData.number);
                        continue; // Skip if no valid time slots resulted
                    }
                    String days = daysBuilder.toString(); // Combined, unique days string
                    if (days.isEmpty()) {
                        System.out.println("Warning: Skipping course due to missing/invalid days after processing times: " + courseData.subject + " " + courseData.number);
                        continue;
                    }


                    // Validate other critical fields
                    if (courseData.name == null || courseData.subject == null || courseData.section == null || courseData.section.isEmpty()) {
                        System.out.println("Warning: Skipping course due to missing name, subject, or section.");
                        continue;
                    }

                    // --- Create Course Object ---
                    Course course = new Course(
                            courseData.name,
                            // Use the first valid TimeSlot found (or handle multiple differently if needed)
                            // Note: Original code used iterator().next() which assumes set isn't empty
                            timeSlots.iterator().next(),
                            days, // Use combined days string
                            professor,
                            courseData.number,
                            courseData.semester, // Assuming semester is present
                            courseData.location, // Assuming location is present
                            courseData.section.charAt(0), // Convert section string to char
                            courseData.subject,
                            courseData.credits
                    );

                    loadedCourses.add(course);

                } catch (Exception courseEx) {
                    // Catch errors processing a single course entry to avoid stopping the whole load
                    System.err.println("Error processing course entry: " + courseData.name + " (" + courseData.subject + " " + courseData.number + ") - " + courseEx.getMessage());
                    // Optionally print stack trace for debugging: courseEx.printStackTrace();
                }
            } // End loop through courses

        } catch (IOException e) { // Catch file reading errors
            System.err.println("Error loading course database file '" + filePath + "': " + e.getMessage());
            // Optionally print stack trace: e.printStackTrace();
        } catch (JsonSyntaxException e) { // Catch JSON parsing errors
            System.err.println("Error parsing JSON in course database file '" + filePath + "': " + e.getMessage());
            // Optionally print stack trace: e.printStackTrace();
        } catch (Exception e) { // Catch any other unexpected errors during loading
            System.err.println("Unexpected error loading course database: " + e.getMessage());
            e.printStackTrace(); // Print stack trace for unexpected errors
        }

        System.out.println("Finished loading course database. Usable courses loaded: " + loadedCourses.size());
        // Optionally assign to static field if needed externally, otherwise just return
        courseDatabase = loadedCourses;
        return loadedCourses;
    }

    /**
     * Provides access to the statically loaded course database.
     * Note: Consider if static access is truly needed or if ScheduleMeApp should hold the loaded set.
     */
    public static Set<Course> getCourseDatabase() {
        if (courseDatabase == null) {
            System.err.println("Warning: getCourseDatabase called before database was loaded.");
            return new HashSet<>(); // Return empty set to avoid null pointer
        }
        return courseDatabase;
    }

    // REMOVED: public static void main(String[] args) { ... } and all console application logic.

} // End of Main class