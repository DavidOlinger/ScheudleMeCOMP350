package newSite.api;

import io.javalin.Javalin;
import io.javalin.http.Context;
import newSite.core.Course;
import newSite.core.Search;
import java.util.Set;
// Assuming ErrorResponse is accessible
import newSite.ScheduleMeApp;

public class CourseController {

    public static void registerEndpoints(Javalin app, Search search) {

        // Search for courses based on a query
        app.get("/api/courses/search", ctx -> searchCourses(ctx, search));

        // You could add other endpoints like:
        // app.get("/api/courses/{courseId}", ctx -> getCourseDetails(ctx, search));
    }

    private static void searchCourses(Context ctx, Search search) {
        String query = ctx.queryParam("query");

        if (query == null || query.trim().isEmpty()) {
            // Decide if empty query returns all courses or an error/empty list
            ctx.status(400).json(new ScheduleMeApp.ErrorResponse("Bad Request", "Search query parameter is required"));
            // Alternatively: ctx.json(search.courseDatabase); // Return all if desired
            return;
        }

        try {
            // TODO: Add filter parameters from the request (ctx.queryParam("days"), ctx.queryParam("timeStart"), etc.)
            // and apply them to search.filter before calling searchQuery
            // Example: search.ModifyDayFilter(ctx.queryParam("days"));

            Set<Course> results = search.searchQuery(query.trim()); // Use the Search class logic
            // search.displaySearchResults(query, results); // Don't display to console in API
            ctx.json(results); // Return results as JSON
        } catch (Exception e) {
            System.err.println("Course search error: " + e.getMessage());
            e.printStackTrace();
            ctx.status(500).json(new ScheduleMeApp.ErrorResponse("Server Error", "Failed to perform course search"));
        } finally {
            // Reset filters if necessary after each search? Depends on desired behavior.
            // search.ResetFilters();
        }
    }

    // Example placeholder for getting details of a single course
    /*
    private static void getCourseDetails(Context ctx, Search search) {
        try {
            int courseCode = Integer.parseInt(ctx.pathParam("courseId")); // Assuming courseCode is used as ID
            Course foundCourse = null;
            for (Course course : search.courseDatabase) {
                if (course.courseCode == courseCode) { // Adjust matching logic if needed
                    foundCourse = course;
                    break;
                }
            }

            if (foundCourse != null) {
                ctx.json(foundCourse);
            } else {
                ctx.status(404).json(new ScheduleMeApp.ErrorResponse("Not Found", "Course not found"));
            }
        } catch (NumberFormatException e) {
            ctx.status(400).json(new ScheduleMeApp.ErrorResponse("Bad Request", "Invalid course ID format"));
        } catch (Exception e) {
             System.err.println("Get course details error: " + e.getMessage());
             ctx.status(500).json(new ScheduleMeApp.ErrorResponse("Server Error", "Failed to get course details"));
        }
    }
    */
}