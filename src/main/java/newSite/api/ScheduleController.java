package newSite.api;

import io.javalin.Javalin;
import io.javalin.http.Context;
import newSite.core.Course;
import newSite.core.Event; // Needed for adding events
import newSite.core.Schedule;
import newSite.core.ScheduleManager;
import newSite.core.Search; // Might be needed to find the course to add/remove

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.Set;
import java.util.stream.Collectors;

// Assuming ErrorResponse is accessible
import newSite.ScheduleMeApp;

public class ScheduleController {

    // Simple class to represent the JSON request body for adding a course
    public static class AddCourseRequest {
        public int courseCode; // Field name must match JSON key from frontend ("courseCode")
    }

    // Simple class for create/rename requests expecting a name
    public static class NameRequest {
        public String name;
    }


    public static void registerEndpoints(Javalin app, ScheduleManager scheduleManager) {

        // --- Endpoints for the CURRENTLY ACTIVE schedule ---
        app.get("/api/schedule/current", ctx -> getCurrentSchedule(ctx, scheduleManager));
        app.post("/api/schedule/current/add", ctx -> addCourseToCurrentSchedule(ctx, scheduleManager));
        app.delete("/api/schedule/current/remove/{courseCode}", ctx -> removeCourseFromCurrentSchedule(ctx, scheduleManager));


        // --- Endpoints for MANAGING saved schedules ---
        app.get("/api/schedules", ctx -> listSavedSchedules(ctx, scheduleManager));
        app.put("/api/schedules/load/{scheduleName}", ctx -> loadSchedule(ctx, scheduleManager));
        app.post("/api/schedules/save", ctx -> saveCurrentSchedule(ctx, scheduleManager));
        app.post("/api/schedules/new", ctx -> createNewSchedule(ctx, scheduleManager));
        app.delete("/api/schedules/{scheduleName}", ctx -> deleteSchedule(ctx, scheduleManager));

    }

    // --- Handler Methods ---

    private static void getCurrentSchedule(Context ctx, ScheduleManager scheduleManager) {
        // ... (getCurrentSchedule implementation remains the same) ...
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

    private static void addCourseToCurrentSchedule(Context ctx, ScheduleManager scheduleManager) {
        // ***** START OF NEW CODE *****
        System.out.println(">>> ENTERED addCourseToCurrentSchedule handler"); // Log entry
        // ***** END OF NEW CODE *****

        if (scheduleManager.user == null) {
            System.out.println("addCourseToCurrentSchedule: Denied - User not logged in");
            ctx.status(401).json(new ScheduleMeApp.ErrorResponse("Unauthorized", "User not logged in"));
            return;
        }
        if (ScheduleManager.getCurrentSchedule() == null) {
            System.out.println("addCourseToCurrentSchedule: Denied - No active schedule");
            ctx.status(400).json(new ScheduleMeApp.ErrorResponse("Bad Request", "No active schedule to add course to"));
            return;
        }
        if (scheduleManager.currentSearch == null || scheduleManager.currentSearch.courseDatabase == null) {
            System.err.println("FATAL ERROR in addCourseToCurrentSchedule: ScheduleManager's Search or Course Database is null!");
            ctx.status(500).json(new ScheduleMeApp.ErrorResponse("Server Configuration Error", "Course database not available to ScheduleManager"));
            return;
        }

        try {
            AddCourseRequest request = ctx.bodyAsClass(AddCourseRequest.class);
            int courseCodeToAdd = request.courseCode;
            System.out.println("addCourseToCurrentSchedule: Received request to add course code: " + courseCodeToAdd);

            Course courseToAdd = scheduleManager.currentSearch.courseDatabase.stream()
                    .filter(c -> c.courseCode == courseCodeToAdd)
                    .findFirst()
                    .orElseThrow(() -> new NoSuchElementException("Course with code " + courseCodeToAdd + " not found in database"));

            System.out.println("addCourseToCurrentSchedule: Found course: " + courseToAdd.name + ". Attempting to add to schedule...");
            boolean conflict = scheduleManager.addEvent(courseToAdd);

            if (conflict) {
                System.out.println("addCourseToCurrentSchedule: Conflict detected for course code: " + courseCodeToAdd);
                ctx.status(409).json(new ScheduleMeApp.ErrorResponse("Conflict", "Course " + courseToAdd.subject + " " + courseToAdd.courseCode + " conflicts with an existing schedule event."));
            } else {
                System.out.println("addCourseToCurrentSchedule: Course code " + courseCodeToAdd + " added successfully.");
                ctx.status(200).json(ScheduleManager.getCurrentSchedule()); // Return updated schedule
            }

        } catch (NoSuchElementException e) {
            System.err.println("addCourseToCurrentSchedule error: " + e.getMessage());
            ctx.status(404).json(new ScheduleMeApp.ErrorResponse("Not Found", e.getMessage()));
        } catch (com.google.gson.JsonSyntaxException | io.javalin.http.BadRequestResponse e) {
            System.err.println("addCourseToCurrentSchedule error - Invalid JSON or request body: " + e.getMessage());
            ctx.status(400).json(new ScheduleMeApp.ErrorResponse("Bad Request", "Invalid request body format. Expected JSON with 'courseCode'."));
        } catch (Exception e) {
            System.err.println("addCourseToCurrentSchedule unexpected error: " + e.getMessage());
            e.printStackTrace();
            ctx.status(500).json(new ScheduleMeApp.ErrorResponse("Server Error", "Failed to add course due to an unexpected error."));
        }
    }


    // removeCourseFromCurrentSchedule remains the same
    private static void removeCourseFromCurrentSchedule(Context ctx, ScheduleManager scheduleManager) {
        // ... (removeCourseFromCurrentSchedule implementation remains the same) ...
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

    // listSavedSchedules remains the same
    private static void listSavedSchedules(Context ctx, ScheduleManager scheduleManager) {
        // ... (listSavedSchedules implementation remains the same) ...
        if (scheduleManager.user == null) {
            ctx.status(401).json(new ScheduleMeApp.ErrorResponse("Unauthorized", "No user session found"));
            return;
        }
        System.out.println("Request received to list schedules for user: " + scheduleManager.user.name);

        if (scheduleManager.user.mySchedules != null) {
            List<String> scheduleNames = scheduleManager.user.mySchedules.stream()
                    .filter(filePath -> filePath != null && filePath.contains("/") && filePath.contains("."))
                    .map(filePath -> filePath.substring(filePath.lastIndexOf('/') + 1, filePath.lastIndexOf('.')))
                    .collect(Collectors.toList());
            System.out.println("Returning schedule names: " + scheduleNames);
            ctx.json(scheduleNames);
        } else {
            System.out.println("User has no saved schedules list (mySchedules is null).");
            ctx.json(new ArrayList<String>()); // Return empty list
        }
    }

    // loadSchedule remains the same
    private static void loadSchedule(Context ctx, ScheduleManager scheduleManager) {
        // ... (loadSchedule implementation remains the same) ...
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

    // saveCurrentSchedule remains the same
    private static void saveCurrentSchedule(Context ctx, ScheduleManager scheduleManager) {
        // ... (saveCurrentSchedule implementation remains the same) ...
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
            scheduleManager.user.saveSchedule(currentSchedule);
            System.out.println("Schedule '" + currentSchedule.name + "' saved successfully via API.");
            ctx.status(200).json(Map.of("message", "Schedule '" + currentSchedule.name + "' saved successfully"));
        } catch (Exception e) {
            System.err.println("Save schedule error: " + e.getMessage());
            e.printStackTrace();
            ctx.status(500).json(new ScheduleMeApp.ErrorResponse("Server Error", "Failed to save schedule"));
        }
    }

    // createNewSchedule remains the same
    private static void createNewSchedule(Context ctx, ScheduleManager scheduleManager) {
        // ... (createNewSchedule implementation remains the same) ...
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

        String potentialFilePath = "users/" + scheduleManager.user.name + "/schedules/" + trimmedName + ".json";
        if (scheduleManager.user.mySchedules == null) {
            scheduleManager.user.mySchedules = new ArrayList<>();
        }
        if (scheduleManager.user.mySchedules.contains(potentialFilePath)) {
            System.out.println("Schedule name '" + trimmedName + "' already exists.");
            ctx.status(409).json(new ScheduleMeApp.ErrorResponse("Conflict", "A schedule with this name already exists."));
            return;
        }

        try {
            scheduleManager.newSchedule(trimmedName);
            scheduleManager.initializeUndoRedoAfterLoad();

            Schedule newSchedule = ScheduleManager.getCurrentSchedule();
            if (newSchedule != null && newSchedule.name.equals(trimmedName)) {
                System.out.println("Successfully created and activated new schedule: " + trimmedName);
                ctx.status(201).json(newSchedule);
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

    // deleteSchedule remains the same
    private static void deleteSchedule(Context ctx, ScheduleManager scheduleManager) {
        // ... (deleteSchedule implementation remains the same) ...
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
            scheduleManager.user.deleteSchedule(scheduleName);

            Schedule current = ScheduleManager.getCurrentSchedule();
            if (current != null && current.name.equals(scheduleName)) {
                ScheduleManager.currentSchedule = null;
                scheduleManager.initializeUndoRedoAfterLoad();
                System.out.println("Cleared active schedule because it was deleted.");
            }
            scheduleManager.user.saveUserData();

            System.out.println("Schedule '" + scheduleName + "' deleted successfully via API.");
            ctx.status(200).json(Map.of("message", "Schedule '" + scheduleName + "' deleted successfully"));

        } catch (Exception e) {
            System.err.println("Delete schedule error: " + e.getMessage());
            e.printStackTrace();
            if (e.getMessage() != null && e.getMessage().toLowerCase().contains("not found")) {
                ctx.status(404).json(new ScheduleMeApp.ErrorResponse("Not Found", "Schedule '" + scheduleName + "' not found"));
            } else {
                ctx.status(500).json(new ScheduleMeApp.ErrorResponse("Server Error", "Failed to delete schedule"));
            }
        }
    }

}
