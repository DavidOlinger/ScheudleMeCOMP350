package newSite.api;

import io.javalin.Javalin;
import io.javalin.http.Context;
import newSite.core.Course;
import newSite.core.Filter; // Import Filter class
import newSite.core.Search;
import newSite.core.TimeSlot; // Import TimeSlot class
import java.util.Set;
// Assuming ErrorResponse is accessible
import newSite.ScheduleMeApp;

public class CourseController {

    public static void registerEndpoints(Javalin app, Search search) {
        // Search for courses based on a query and optional filters
        app.get("/api/courses/search", ctx -> searchCourses(ctx, search));
    }

    private static void searchCourses(Context ctx, Search search) {
        String query = ctx.queryParam("query");

        if (query == null || query.trim().isEmpty()) {
            ctx.status(400).json(new ScheduleMeApp.ErrorResponse("Bad Request", "Search query parameter is required"));
            return;
        }

        // --- Read Filter Parameters ---
        String startTimeStr = ctx.queryParam("startTime"); // e.g., "09:00"
        String endTimeStr = ctx.queryParam("endTime");   // e.g., "17:30"
        String daysStr = ctx.queryParam("days");         // e.g., "MWF"

        // --- Apply Filters to Search Object ---
        // Ensure the filter object exists
        if (search.filter == null) {
            search.filter = new Filter();
        }

        // Reset previous filters before applying new ones for this request
        search.ResetFilters(); // Clear timeRange and dayRange

        // Apply Time Filter if both start and end are provided
        if (startTimeStr != null && !startTimeStr.isEmpty() && endTimeStr != null && !endTimeStr.isEmpty()) {
            try {
                // Append seconds ":00" if not present, as TimeSlot constructor expects it
                String startWithSeconds = startTimeStr.contains(":") && startTimeStr.length() == 5 ? startTimeStr + ":00" : startTimeStr;
                String endWithSeconds = endTimeStr.contains(":") && endTimeStr.length() == 5 ? endTimeStr + ":00" : endTimeStr;

                // Validate time format roughly (HH:MM:SS) - more robust validation could be added
                if (startWithSeconds.matches("\\d{2}:\\d{2}:\\d{2}") && endWithSeconds.matches("\\d{2}:\\d{2}:\\d{2}")) {
                    TimeSlot timeFilterSlot = new TimeSlot(startWithSeconds, endWithSeconds);
                    // Only apply if start time is before end time
                    if (timeFilterSlot.startTime < timeFilterSlot.endTime) {
                        search.ModifyTimeFilter(timeFilterSlot);
                        System.out.println("Applied Time Filter: " + timeFilterSlot); // Logging
                    } else {
                        System.out.println("Ignoring invalid time range filter (start >= end): " + startTimeStr + " - " + endTimeStr);
                    }
                } else {
                    System.out.println("Ignoring invalid time format filter: " + startTimeStr + " - " + endTimeStr);
                }

            } catch (Exception e) {
                // Log error if time parsing fails, but don't block the search
                System.err.println("Error parsing time filter: " + e.getMessage() + " for " + startTimeStr + "/" + endTimeStr);
                search.filter.timeRange = null; // Ensure it's reset if parsing fails
            }
        } else {
            search.filter.timeRange = null; // Ensure time filter is null if not fully provided
        }

        // Apply Days Filter if provided
        if (daysStr != null && !daysStr.isEmpty()) {
            search.ModifyDayFilter(daysStr); // This method already handles cleaning the string
            System.out.println("Applied Days Filter: " + search.filter.dayRange); // Logging
        } else {
            search.filter.dayRange = null; // Ensure day filter is null if not provided
        }


        // --- Perform Search ---
        try {
            Set<Course> results = search.searchQuery(query.trim()); // Use the Search class logic with applied filters
            ctx.json(results); // Return results as JSON
        } catch (Exception e) {
            System.err.println("Course search error: " + e.getMessage());
            e.printStackTrace();
            ctx.status(500).json(new ScheduleMeApp.ErrorResponse("Server Error", "Failed to perform course search"));
        }
        // Note: ResetFilters() was moved *before* applying new filters for this request.
    }
}
