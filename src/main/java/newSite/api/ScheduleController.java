package newSite.api;

// --- Ensure all necessary imports are present ---
import io.javalin.Javalin;
import io.javalin.http.Context;
import newSite.core.Course;
import newSite.core.Event;
import newSite.core.Schedule;
import newSite.core.ScheduleManager;
import newSite.core.Search;
import newSite.core.User;
import newSite.core.TimeSlot; // Make sure TimeSlot is imported
import newSite.ScheduleMeApp; // Make sure ErrorResponse (if used) is accessible

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.Objects;
import java.util.Iterator;
// --- End Imports ---


public class ScheduleController {

    // --- Inner classes (AddCourseRequest, NameRequest, CreateScheduleResponse, CustomEventRequest, RemoveEventRequest) should be here ---
    // Simple class to represent the JSON request body for adding a course
    public static class AddCourseRequest {
        public int courseCode; // Field name must match JSON key from frontend ("courseCode")
        public String subject;
        public char section;

    }

    // Simple class for create/rename requests expecting a name
    public static class NameRequest {
        public String name;
    }

    // New simple class to represent the combined response for creating a schedule
    public static class CreateScheduleResponse {
        public Schedule schedule;
        public User user; // Include the updated user object

        public CreateScheduleResponse(Schedule schedule, User user) {
            this.schedule = schedule;
            // Create a safe copy of the user object for the response, excluding sensitive info like password hash
            User publicUser = new User(user.name, ""); // Use constructor that only takes name/pass (pass empty pass)
            publicUser.idNumber = user.idNumber;
            publicUser.major = user.major;
            publicUser.year = user.year;
            publicUser.mySchedules = (user.mySchedules != null) ? new ArrayList<>(user.mySchedules) : new ArrayList<>();
            this.user = publicUser;
        }
    }

    /**
     * Represents the JSON request body for adding a custom event.
     * Fields must match the JSON keys sent from the frontend.
     */
    public static class CustomEventRequest {
        public String name;
        public String days; // e.g., "MWF"
        public String startTime; // e.g., "14:00" or "14:00:00"
        public String endTime; // e.g., "15:30" or "15:30:00"
    }

    /**
     * Represents the JSON request body for removing a generic event.
     * Requires enough information to uniquely identify the event.
     */
    public static class RemoveEventRequest {
        public String name;
        public String days;
        // Send time as integer seconds from frontend for easier matching
        public int startTimeSeconds;
        public int endTimeSeconds;
    }
    // --- End Inner Classes ---


    public static void registerEndpoints(Javalin app, ScheduleManager scheduleManager) {
        // --- Endpoints for the CURRENTLY ACTIVE schedule ---
        app.get("/api/schedule/current", ctx -> getCurrentSchedule(ctx, scheduleManager));
        // POST endpoint for adding a course (handler logic will be updated)
        app.post("/api/schedule/current/add", ctx -> addCourseToCurrentSchedule(ctx, scheduleManager));
        app.post("/api/schedule/current/add-custom", ctx -> addCustomEventToCurrentSchedule(ctx, scheduleManager));
        app.delete("/api/schedule/current/remove/{courseCode}", ctx -> removeCourseFromCurrentSchedule(ctx, scheduleManager));
        app.post("/api/schedule/current/remove-event", ctx -> removeEventFromCurrentSchedule(ctx, scheduleManager));
        // --- Endpoints for MANAGING saved schedules ---
        app.get("/api/schedules", ctx -> listSavedSchedules(ctx, scheduleManager));
        app.put("/api/schedules/load/{scheduleName}", ctx -> loadSchedule(ctx, scheduleManager));
        app.post("/api/schedules/save", ctx -> saveCurrentSchedule(ctx, scheduleManager));
        app.post("/api/schedules/new", ctx -> createNewSchedule(ctx, scheduleManager));
        app.delete("/api/schedules/{scheduleName}", ctx -> deleteSchedule(ctx, scheduleManager));
    }


    // --- Handler Methods ---
    // Ensure all handler methods referenced above are defined in this class
    // (getCurrentSchedule, addCourseToCurrentSchedule, addCustomEventToCurrentSchedule,
    // removeCourseFromCurrentSchedule, removeEventFromCurrentSchedule, listSavedSchedules,
    // loadSchedule, saveCurrentSchedule, createNewSchedule, deleteSchedule)

    // Example handler (ensure all others exist)
    private static void getCurrentSchedule(Context ctx, ScheduleManager scheduleManager) {
        //
        if (scheduleManager.user == null) {
            ctx.status(401).json(new ScheduleMeApp.ErrorResponse("Unauthorized", "No user session found"));
            return;
        }
        Schedule current = ScheduleManager.getCurrentSchedule();
        if (current != null) {
            System.out.println("getCurrentSchedule: Returning active schedule '" + current.name + "' for user " + scheduleManager.user.name);
            ctx.json(current);
        } else {
            System.out.println("getCurrentSchedule: No active schedule loaded for user " + scheduleManager.user.name);
            ctx.status(404).json(new ScheduleMeApp.ErrorResponse("Not Found", "No active schedule loaded")); // Keep 404 specific
        }
    }

    /**
     * Handles POST requests to add a specific course section to the current schedule.
     * Uses subject, courseCode, and section from the request body
     * to uniquely identify the course.
     *
     * @param ctx             The Javalin context object.
     * @param scheduleManager The shared schedule manager instance.
     */
    private static void addCourseToCurrentSchedule(Context ctx, ScheduleManager scheduleManager) {
        System.out.println(">>> ENTERED addCourseToCurrentSchedule handler (v3 - with section)");

        // Check user and active schedule
        if (scheduleManager.user == null) { /* ... (error handling) ... */
            System.out.println("addCourseToCurrentSchedule: Denied - User not logged in");
            ctx.status(401).json(new ScheduleMeApp.ErrorResponse("Unauthorized", "User not logged in"));
            return;
        }
        if (ScheduleManager.getCurrentSchedule() == null) { /* ... (error handling) ... */
            System.out.println("addCourseToCurrentSchedule: Denied - No active schedule");
            ctx.status(400).json(new ScheduleMeApp.ErrorResponse("Bad Request", "No active schedule to add course to"));
            return;
        }
        // Check if the course database is available
        if (scheduleManager.currentSearch == null || scheduleManager.currentSearch.courseDatabase == null) { /* ... (error handling) ... */
            System.err.println("FATAL ERROR in addCourseToCurrentSchedule: ScheduleManager's Search or Course Database is null!");
            ctx.status(500).json(new ScheduleMeApp.ErrorResponse("Server Configuration Error", "Course database not available to ScheduleManager"));
            return;
        }

        try {
            // Parse the request body using the updated AddCourseRequest class
            AddCourseRequest request = ctx.bodyAsClass(AddCourseRequest.class);

            // --- Validate required fields ---
            if (request.subject == null || request.subject.trim().isEmpty() ||
                    request.courseCode <= 0 ||
                    // Basic validation for section (assuming it's a letter or digit)
                    !Character.isLetterOrDigit(request.section))
            {
                ctx.status(400).json(new ScheduleMeApp.ErrorResponse("Bad Request", "Missing or invalid required fields (subject, courseCode, section)"));
                return;
            }

            String subjectToAdd = request.subject.trim().toUpperCase(); // Normalize subject
            int courseCodeToAdd = request.courseCode;
            char sectionToAdd = Character.toUpperCase(request.section); // Normalize section

            System.out.println("addCourseToCurrentSchedule: Received request to add course: Subject=" + subjectToAdd + ", Code=" + courseCodeToAdd + ", Section=" + sectionToAdd);

            // --- Find the specific course in the database ---
            // Use stream().filter() to match on subject, courseCode, AND section
            Course courseToAdd = scheduleManager.currentSearch.courseDatabase.stream()
                    .filter(c -> c != null &&
                            subjectToAdd.equals(c.subject) && // Match subject
                            c.courseCode == courseCodeToAdd && // Match course code
                            sectionToAdd == c.section // Match section
                    )
                    .findFirst() // Find the first (and supposedly only) match
                    // Throw exception if no matching course section is found
                    .orElseThrow(() -> new NoSuchElementException(
                            "Course with Subject=" + subjectToAdd + ", Code=" + courseCodeToAdd + ", Section=" + sectionToAdd + " not found in database"
                    ));

            System.out.println("addCourseToCurrentSchedule: Found specific course section: " + courseToAdd.name + " [" + courseToAdd.section + "]. Attempting to add...");

            // --- Add the found course to the schedule using ScheduleManager ---
            boolean conflict = scheduleManager.addEvent(courseToAdd); // addEvent handles conflict checking and history

            if (conflict) {
                // Conflict detected by scheduleManager.addEvent()
                System.out.println("addCourseToCurrentSchedule: Conflict detected for course: " + subjectToAdd + " " + courseCodeToAdd + " [" + sectionToAdd + "]");
                ctx.status(409).json(new ScheduleMeApp.ErrorResponse("Conflict", "Course " + subjectToAdd + " " + courseCodeToAdd + " [" + sectionToAdd + "] conflicts with an existing schedule event."));
            } else {
                // Course added successfully
                System.out.println("addCourseToCurrentSchedule: Course " + subjectToAdd + " " + courseCodeToAdd + " [" + sectionToAdd + "] added successfully.");
                // Return the updated schedule
                ctx.status(200).json(ScheduleManager.getCurrentSchedule());
            }

        } catch (NoSuchElementException e) {
            // Handle case where the specific course section wasn't found
            System.err.println("addCourseToCurrentSchedule error: " + e.getMessage());
            ctx.status(404).json(new ScheduleMeApp.ErrorResponse("Not Found", e.getMessage()));
        } catch (com.google.gson.JsonSyntaxException | io.javalin.http.BadRequestResponse e) {
            // Handle errors parsing the request body
            System.err.println("addCourseToCurrentSchedule error - Invalid JSON or request body: " + e.getMessage());
            ctx.status(400).json(new ScheduleMeApp.ErrorResponse("Bad Request", "Invalid request body format. Expected JSON with subject, courseCode, and section."));
        } catch (Exception e) {
            // Catch any other unexpected errors
            System.err.println("addCourseToCurrentSchedule unexpected error: " + e.getMessage());
            e.printStackTrace();
            ctx.status(500).json(new ScheduleMeApp.ErrorResponse("Server Error", "Failed to add course due to an unexpected error."));
        }
    }

    private static void addCustomEventToCurrentSchedule(Context ctx, ScheduleManager scheduleManager) {
        // ... (implementation from previous step) ...
        System.out.println(">>> ENTERED addCustomEventToCurrentSchedule handler");

        // Check if user is logged in
        if (scheduleManager.user == null) {
            System.out.println("addCustomEventToCurrentSchedule: Denied - User not logged in");
            ctx.status(401).json(new ScheduleMeApp.ErrorResponse("Unauthorized", "User not logged in"));
            return;
        }
        // Check if a schedule is active
        if (ScheduleManager.getCurrentSchedule() == null) {
            System.out.println("addCustomEventToCurrentSchedule: Denied - No active schedule");
            ctx.status(400).json(new ScheduleMeApp.ErrorResponse("Bad Request", "No active schedule to add event to"));
            return;
        }

        try {
            // Parse the request body into our CustomEventRequest object
            CustomEventRequest request = ctx.bodyAsClass(CustomEventRequest.class);

            // --- Input Validation ---
            if (request.name == null || request.name.trim().isEmpty() ||
                    request.days == null || request.days.trim().isEmpty() ||
                    request.startTime == null || request.startTime.isEmpty() ||
                    request.endTime == null || request.endTime.isEmpty()) {
                ctx.status(400).json(new ScheduleMeApp.ErrorResponse("Bad Request", "Missing required fields (name, days, startTime, endTime)"));
                return;
            }

            String eventName = request.name.trim();
            // Clean days string (allow only MTWRF) and ensure it's not empty after cleaning
            String eventDays = request.days.trim().replaceAll("[^MTWRF]", "");
            if (eventDays.isEmpty()) {
                ctx.status(400).json(new ScheduleMeApp.ErrorResponse("Bad Request", "Invalid days provided. Use M, T, W, R, F."));
                return;
            }

            System.out.println("addCustomEventToCurrentSchedule: Received request for event: " + eventName);

            // --- Create TimeSlot ---
            // Append seconds ":00" if the frontend sends "HH:MM"
            String startWithSeconds = request.startTime.contains(":") && request.startTime.length() == 5 ? request.startTime + ":00" : request.startTime;
            String endWithSeconds = request.endTime.contains(":") && request.endTime.length() == 5 ? request.endTime + ":00" : request.endTime;

            TimeSlot timeSlot;
            try {
                // Basic format validation before creating TimeSlot
                if (!startWithSeconds.matches("\\d{2}:\\d{2}:\\d{2}") || !endWithSeconds.matches("\\d{2}:\\d{2}:\\d{2}")) {
                    throw new IllegalArgumentException("Invalid time format. Expected HH:MM or HH:MM:SS.");
                }
                timeSlot = new TimeSlot(startWithSeconds, endWithSeconds); // TimeSlot constructor parses HH:MM:SS
                // Check if start time is actually before end time
                if (timeSlot.startTime >= timeSlot.endTime) {
                    throw new IllegalArgumentException("Start time must be before end time.");
                }
            } catch (IllegalArgumentException | ArrayIndexOutOfBoundsException | NullPointerException timeEx) {
                // Catch errors from TimeSlot constructor or validation
                System.err.println("addCustomEventToCurrentSchedule error - Invalid time: " + timeEx.getMessage());
                ctx.status(400).json(new ScheduleMeApp.ErrorResponse("Bad Request", "Invalid time data: " + timeEx.getMessage()));
                return;
            }


            // --- Create Event object ---
            Event customEvent = new Event(eventName, eventDays, timeSlot);

            System.out.println("addCustomEventToCurrentSchedule: Created Event: " + customEvent + ". Attempting to add...");

            // --- Add event using ScheduleManager (checks for conflicts) ---
            boolean conflict = scheduleManager.addEvent(customEvent); // Use the existing addEvent logic

            if (conflict) {
                // If addEvent returns true, it means there was a conflict
                System.out.println("addCustomEventToCurrentSchedule: Conflict detected for event: " + eventName);
                ctx.status(409).json(new ScheduleMeApp.ErrorResponse("Conflict", "Event '" + eventName + "' conflicts with an existing schedule event."));
            } else {
                // If addEvent returns false, it was added successfully
                System.out.println("addCustomEventToCurrentSchedule: Event '" + eventName + "' added successfully.");
                // Return the updated schedule as confirmation
                ctx.status(200).json(ScheduleManager.getCurrentSchedule());
            }

        } catch (com.google.gson.JsonSyntaxException | io.javalin.http.BadRequestResponse e) {
            // Handle errors during JSON parsing or if request body is malformed
            System.err.println("addCustomEventToCurrentSchedule error - Invalid JSON or request body: " + e.getMessage());
            ctx.status(400).json(new ScheduleMeApp.ErrorResponse("Bad Request", "Invalid request body format. Expected JSON with name, days, startTime, endTime."));
        } catch (Exception e) {
            // Catch any other unexpected errors during processing
            System.err.println("addCustomEventToCurrentSchedule unexpected error: " + e.getMessage());
            e.printStackTrace();
            ctx.status(500).json(new ScheduleMeApp.ErrorResponse("Server Error", "Failed to add custom event due to an unexpected error."));
        }
    }

    private static void removeCourseFromCurrentSchedule(Context ctx, ScheduleManager scheduleManager) {
        // ... (implementation) ...
        if (scheduleManager.user == null) {
            ctx.status(401).json(new ScheduleMeApp.ErrorResponse("Unauthorized", "User not logged in"));
            return;
        }
        if (ScheduleManager.getCurrentSchedule() == null) {
            ctx.status(400).json(new ScheduleMeApp.ErrorResponse("Bad Request", "No active schedule to remove course from"));
            return;
        }

        try {
            int courseCodeToRemove = Integer.parseInt(ctx.pathParam("courseCode"));
            System.out.println("Received request to remove course code: " + courseCodeToRemove);
            Schedule currentSchedule = ScheduleManager.getCurrentSchedule();

            Event eventToRemove = null;
            if (currentSchedule.events != null) {
                for (Event event : currentSchedule.events) {
                    if (event instanceof Course && ((Course) event).courseCode == courseCodeToRemove) {
                        eventToRemove = event;
                        break;
                    }
                }
            }

            if (eventToRemove == null) {
                System.out.println("Course code " + courseCodeToRemove + " not found in current schedule.");
                ctx.status(404).json(new ScheduleMeApp.ErrorResponse("Not Found", "Course with code " + courseCodeToRemove + " not found in current schedule"));
                return;
            }

            System.out.println("Found course: " + eventToRemove.name + ". Attempting to remove from schedule...");
            scheduleManager.remEvent(eventToRemove);
            System.out.println("Course code " + courseCodeToRemove + " removed successfully.");
            ctx.status(200).json(ScheduleManager.getCurrentSchedule()); // Return updated schedule

        } catch (NumberFormatException e) {
            System.err.println("Remove course error - Invalid course code format: " + ctx.pathParam("courseCode"));
            ctx.status(400).json(new ScheduleMeApp.ErrorResponse("Bad Request", "Invalid course code format in URL"));
        } catch (Exception e) {
            System.err.println("Remove course unexpected error: " + e.getMessage());
            e.printStackTrace();
            ctx.status(500).json(new ScheduleMeApp.ErrorResponse("Server Error", "Failed to remove course due to an unexpected error."));
        }
    }

    private static void removeEventFromCurrentSchedule(Context ctx, ScheduleManager scheduleManager) {
        // ... (implementation from previous step) ...
        System.out.println(">>> ENTERED removeEventFromCurrentSchedule handler");

        // Check user and active schedule
        if (scheduleManager.user == null) {
            ctx.status(401).json(new ScheduleMeApp.ErrorResponse("Unauthorized", "User not logged in"));
            return;
        }
        Schedule currentSchedule = ScheduleManager.getCurrentSchedule();
        if (currentSchedule == null || currentSchedule.events == null) {
            ctx.status(400).json(new ScheduleMeApp.ErrorResponse("Bad Request", "No active schedule to remove event from"));
            return;
        }

        try {
            // Parse request body
            RemoveEventRequest request = ctx.bodyAsClass(RemoveEventRequest.class);

            // Basic validation of request data
            if (request.name == null || request.name.trim().isEmpty() ||
                    request.days == null ) { // Allow empty days string? Maybe not. Add validation if needed.
                // Time validation (startTimeSeconds >= 0 and endTimeSeconds > startTimeSeconds)
                ctx.status(400).json(new ScheduleMeApp.ErrorResponse("Bad Request", "Missing required fields (name, days, startTimeSeconds, endTimeSeconds)"));
                return;
            }
            if (request.startTimeSeconds < 0 || request.endTimeSeconds <= request.startTimeSeconds) {
                ctx.status(400).json(new ScheduleMeApp.ErrorResponse("Bad Request", "Invalid time range provided (startTimeSeconds, endTimeSeconds)"));
                return;
            }


            System.out.println("removeEventFromCurrentSchedule: Received request to remove event: Name='" + request.name + "', Days='" + request.days + "', StartSec=" + request.startTimeSeconds + ", EndSec=" + request.endTimeSeconds);

            Event eventToRemove = null;
            // Iterate safely using an Iterator to allow removal during iteration
            Iterator<Event> iterator = currentSchedule.events.iterator();
            while (iterator.hasNext()) {
                Event event = iterator.next();
                // Check for match based on name, days, and time slot (using seconds)
                if (event != null && event.time != null &&
                        Objects.equals(event.name, request.name.trim()) && // Use Objects.equals for null safety
                        Objects.equals(event.days, request.days) &&
                        event.time.startTime == request.startTimeSeconds &&
                        event.time.endTime == request.endTimeSeconds)
                {
                    eventToRemove = event; // Found the event
                    break; // Exit loop once found
                }
            }


            if (eventToRemove != null) {
                System.out.println("removeEventFromCurrentSchedule: Found matching event. Attempting removal...");
                // Use ScheduleManager's remove method (which handles undo/redo state)
                scheduleManager.remEvent(eventToRemove);
                System.out.println("removeEventFromCurrentSchedule: Event removed successfully.");
                // Return the updated schedule
                ctx.status(200).json(ScheduleManager.getCurrentSchedule());
            } else {
                System.out.println("removeEventFromCurrentSchedule: No matching event found in the current schedule.");
                ctx.status(404).json(new ScheduleMeApp.ErrorResponse("Not Found", "Specified event not found in the current schedule"));
            }

        } catch (com.google.gson.JsonSyntaxException | io.javalin.http.BadRequestResponse e) {
            System.err.println("removeEventFromCurrentSchedule error - Invalid JSON or request body: " + e.getMessage());
            ctx.status(400).json(new ScheduleMeApp.ErrorResponse("Bad Request", "Invalid request body format."));
        } catch (Exception e) {
            System.err.println("removeEventFromCurrentSchedule unexpected error: " + e.getMessage());
            e.printStackTrace();
            ctx.status(500).json(new ScheduleMeApp.ErrorResponse("Server Error", "Failed to remove event due to an unexpected error."));
        }
    }

    private static void listSavedSchedules(Context ctx, ScheduleManager scheduleManager) {
        // ... (implementation) ...
        if (scheduleManager.user == null) {
            ctx.status(401).json(new ScheduleMeApp.ErrorResponse("Unauthorized", "No user session found"));
            return;
        }
        System.out.println("Request received to list schedules for user: " + scheduleManager.user.name);

        if (scheduleManager.user.mySchedules != null) {
            // Ensure paths are valid before extracting names
            List<String> scheduleNames = scheduleManager.user.mySchedules.stream()
                    .filter(filePath -> filePath != null && filePath.contains("/") && filePath.contains("."))
                    .map(filePath -> {
                        try {
                            return filePath.substring(filePath.lastIndexOf('/') + 1, filePath.lastIndexOf('.'));
                        } catch (StringIndexOutOfBoundsException e) {
                            System.err.println("Error parsing schedule file path: " + filePath);
                            return null; // Skip invalid paths
                        }
                    })
                    .filter(name -> name != null && !name.isEmpty()) // Filter out nulls/empty names
                    .collect(Collectors.toList());
            System.out.println("Returning schedule names: " + scheduleNames);
            ctx.json(scheduleNames);
        } else {
            System.out.println("User has no saved schedules list (mySchedules is null).");
            ctx.json(new ArrayList<String>()); // Return empty list
        }
    }

    private static void loadSchedule(Context ctx, ScheduleManager scheduleManager) {
        // ... (implementation) ...
        if (scheduleManager.user == null) {
            ctx.status(401).json(new ScheduleMeApp.ErrorResponse("Unauthorized", "No user session found"));
            return;
        }
        String scheduleName = ctx.pathParam("scheduleName");
        if (scheduleName == null || scheduleName.trim().isEmpty()) {
            ctx.status(400).json(new ScheduleMeApp.ErrorResponse("Bad Request", "Schedule name required in URL path"));
            return;
        }
        System.out.println("Received request to load schedule: " + scheduleName + " for user " + scheduleManager.user.name);

        try {
            Schedule loadedSchedule = scheduleManager.loadSchedule(scheduleName);

            if (loadedSchedule != null) {
                scheduleManager.initializeUndoRedoAfterLoad();
                System.out.println("Successfully loaded schedule: " + scheduleName);
                ctx.status(200).json(loadedSchedule);
            } else {
                System.err.println("Failed to load schedule (loadSchedule returned null): " + scheduleName);
                ctx.status(404).json(new ScheduleMeApp.ErrorResponse("Not Found", "Schedule '" + scheduleName + "' not found or failed to load"));
            }
        } catch (Exception e) {
            System.err.println("Unexpected error during loadSchedule for '" + scheduleName + "': " + e.getMessage());
            e.printStackTrace();
            ctx.status(500).json(new ScheduleMeApp.ErrorResponse("Server Error", "Failed to load schedule due to an unexpected error."));
        }
    }

    private static void saveCurrentSchedule(Context ctx, ScheduleManager scheduleManager) {
        // ... (implementation) ...
        if (scheduleManager.user == null) {
            ctx.status(401).json(new ScheduleMeApp.ErrorResponse("Unauthorized", "User not logged in"));
            return;
        }
        if (ScheduleManager.getCurrentSchedule() == null) {
            ctx.status(400).json(new ScheduleMeApp.ErrorResponse("Bad Request", "No active schedule to save"));
            return;
        }
        Schedule currentSchedule = ScheduleManager.getCurrentSchedule();
        System.out.println("Received request to save schedule: " + currentSchedule.name + " for user " + scheduleManager.user.name);

        try {
            // User.saveSchedule now also saves the user data file to persist mySchedules list
            scheduleManager.user.saveSchedule(currentSchedule);
            System.out.println("Schedule '" + currentSchedule.name + "' saved successfully via API.");
            ctx.status(200).json(Map.of("message", "Schedule '" + currentSchedule.name + "' saved successfully"));
        } catch (Exception e) {
            System.err.println("Save schedule error: " + e.getMessage());
            e.printStackTrace();
            ctx.status(500).json(new ScheduleMeApp.ErrorResponse("Server Error", "Failed to save schedule"));
        }
    }

    private static void createNewSchedule(Context ctx, ScheduleManager scheduleManager) {
        // ... (implementation) ...
        if (scheduleManager.user == null) {
            ctx.status(401).json(new ScheduleMeApp.ErrorResponse("Unauthorized", "No user session found"));
            return;
        }

        NameRequest request;
        try {
            request = ctx.bodyAsClass(NameRequest.class);
        } catch (Exception e) {
            ctx.status(400).json(new ScheduleMeApp.ErrorResponse("Bad Request", "Invalid request body. Expected JSON with 'name'."));
            return;
        }

        String scheduleName = request.name;

        if (scheduleName == null || scheduleName.trim().isEmpty()) {
            ctx.status(400).json(new ScheduleMeApp.ErrorResponse("Bad Request", "Schedule name is required in request body"));
            return;
        }
        String trimmedName = scheduleName.trim();
        System.out.println("Received request to create new schedule: " + trimmedName + " for user " + scheduleManager.user.name);

        // Check for existing schedule name conflict
        String potentialFilePath = "users/" + scheduleManager.user.name + "/schedules/" + trimmedName + ".json";
        if (scheduleManager.user.mySchedules == null) {
            scheduleManager.user.mySchedules = new ArrayList<>(); // Initialize if null
        }
        if (scheduleManager.user.mySchedules.contains(potentialFilePath)) {
            System.out.println("Schedule name '" + trimmedName + "' already exists.");
            ctx.status(409).json(new ScheduleMeApp.ErrorResponse("Conflict", "A schedule with this name already exists."));
            return;
        }


        try {
            // newSchedule creates, saves, adds to user list, and sets as current
            scheduleManager.newSchedule(trimmedName);
            scheduleManager.initializeUndoRedoAfterLoad(); // Initialize history for the new schedule

            Schedule newSchedule = ScheduleManager.getCurrentSchedule();

            if (newSchedule != null && newSchedule.name.equals(trimmedName)) {
                System.out.println("Successfully created and activated new schedule: " + trimmedName);
                // Create the combined response object containing the new schedule
                // and the updated user object (which includes the new schedule path)
                CreateScheduleResponse responsePayload = new CreateScheduleResponse(newSchedule, scheduleManager.user);
                ctx.status(201).json(responsePayload); // Send combined data
            } else {
                System.err.println("Error after creating new schedule: currentSchedule is not the new one or is null.");
                ctx.status(500).json(new ScheduleMeApp.ErrorResponse("Server Error", "Failed to activate new schedule after creation attempt."));
            }
        } catch (Exception e) {
            System.err.println("Unexpected error during createNewSchedule for '" + trimmedName + "': " + e.getMessage());
            e.printStackTrace();
            ctx.status(500).json(new ScheduleMeApp.ErrorResponse("Server Error", "Failed to create new schedule due to an unexpected error."));
        }
    }

    private static void deleteSchedule(Context ctx, ScheduleManager scheduleManager) {
        // ... (implementation) ...
        if (scheduleManager.user == null) {
            ctx.status(401).json(new ScheduleMeApp.ErrorResponse("Unauthorized", "No user session found"));
            return;
        }
        String scheduleName = ctx.pathParam("scheduleName");
        if (scheduleName == null || scheduleName.trim().isEmpty()) {
            ctx.status(400).json(new ScheduleMeApp.ErrorResponse("Bad Request", "Schedule name required in URL path"));
            return;
        }
        System.out.println("Received request to delete schedule: " + scheduleName + " for user " + scheduleManager.user.name);

        try {
            // user.deleteSchedule removes the file and the entry from mySchedules list
            scheduleManager.user.deleteSchedule(scheduleName);

            // If the deleted schedule was the active one, clear it
            Schedule current = ScheduleManager.getCurrentSchedule();
            if (current != null && current.name.equals(scheduleName)) {
                ScheduleManager.currentSchedule = null;
                scheduleManager.initializeUndoRedoAfterLoad(); // Reset history
                System.out.println("Cleared active schedule because it was deleted.");
            }

            // Save the user data to persist the removal from mySchedules list
            scheduleManager.user.saveUserData();

            System.out.println("Schedule '" + scheduleName + "' deleted successfully via API.");
            // Return the updated user object (with the reduced schedule list)
            // Create a safe copy for the response
            User publicUser = new User(scheduleManager.user.name, "");
            publicUser.idNumber = scheduleManager.user.idNumber;
            publicUser.major = scheduleManager.user.major;
            publicUser.year = scheduleManager.user.year;
            publicUser.mySchedules = (scheduleManager.user.mySchedules != null) ? new ArrayList<>(scheduleManager.user.mySchedules) : new ArrayList<>();

            ctx.status(200).json(Map.of(
                    "message", "Schedule '" + scheduleName + "' deleted successfully",
                    "user", publicUser // Send updated user data
            ));

        } catch (Exception e) {
            System.err.println("Delete schedule error: " + e.getMessage());
            e.printStackTrace();
            // Attempt to provide a more specific error if possible
            if (e.getMessage() != null && e.getMessage().toLowerCase().contains("not found")) {
                ctx.status(404).json(new ScheduleMeApp.ErrorResponse("Not Found", "Schedule '" + scheduleName + "' not found"));
            } else if (e.getMessage() != null && e.getMessage().toLowerCase().contains("unable to delete")) {
                ctx.status(500).json(new ScheduleMeApp.ErrorResponse("Server Error", "Failed to delete schedule file on server."));
            } else {
                ctx.status(500).json(new ScheduleMeApp.ErrorResponse("Server Error", "Failed to delete schedule due to an unexpected error."));
            }
        }
    }

    // --- End Handler Methods ---

} // End of ScheduleController class
