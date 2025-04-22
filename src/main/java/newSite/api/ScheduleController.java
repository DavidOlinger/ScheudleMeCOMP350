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
import java.util.Set;
import java.util.stream.Collectors;

// Assuming ErrorResponse is accessible
import newSite.ScheduleMeApp;

public class ScheduleController {

    public static void registerEndpoints(Javalin app, ScheduleManager scheduleManager) {

        // --- Endpoints for the CURRENTLY ACTIVE schedule ---

        // Get the current active schedule for the logged-in user
        // TODO: Needs proper user session handling
        app.get("/api/schedule/current", ctx -> getCurrentSchedule(ctx, scheduleManager));

        // Add a course (by ID/code) to the current schedule
        // TODO: Needs proper user session handling
        app.post("/api/schedule/current/add", ctx -> addCourseToCurrentSchedule(ctx, scheduleManager));

        // Remove a course (by ID/code) from the current schedule
        // TODO: Needs proper user session handling
        app.delete("/api/schedule/current/remove/{courseCode}", ctx -> removeCourseFromCurrentSchedule(ctx, scheduleManager));


        // --- Endpoints for MANAGING saved schedules ---

        // List all saved schedules for the logged-in user
        // TODO: Needs proper user session handling
        app.get("/api/schedules", ctx -> listSavedSchedules(ctx, scheduleManager));

        // Load a specific saved schedule, making it the current one
        // TODO: Needs proper user session handling
        app.put("/api/schedules/load/{scheduleName}", ctx -> loadSchedule(ctx, scheduleManager));

        // Save the current schedule (either creating new or updating existing)
        // TODO: Needs proper user session handling
        app.post("/api/schedules/save", ctx -> saveCurrentSchedule(ctx, scheduleManager));

        // Create a new, empty schedule and make it current
        // TODO: Needs proper user session handling
        app.post("/api/schedules/new", ctx -> createNewSchedule(ctx, scheduleManager));

        // Delete a saved schedule
        // TODO: Needs proper user session handling
        app.delete("/api/schedules/{scheduleName}", ctx -> deleteSchedule(ctx, scheduleManager));

        // Maybe add endpoints for rename, undo, redo later
        // app.put("/api/schedule/current/undo", ctx -> undoChange(ctx, scheduleManager));
        // app.put("/api/schedule/current/redo", ctx -> redoChange(ctx, scheduleManager));

    }

    // --- Handler Methods ---

    private static void getCurrentSchedule(Context ctx, ScheduleManager scheduleManager) {
        // Needs user context from session
        if (scheduleManager.user == null) {
            ctx.status(401).json(new ScheduleMeApp.ErrorResponse("Unauthorized", "No user session found"));
            return;
        }
        Schedule current = ScheduleManager.getCurrentSchedule(); // Get static current schedule
        if (current != null) {
            ctx.json(current);
        } else {
            // No schedule actively loaded for this user (maybe just logged in)
            ctx.status(404).json(new ScheduleMeApp.ErrorResponse("Not Found", "No active schedule loaded"));
        }
    }

    private static void addCourseToCurrentSchedule(Context ctx, ScheduleManager scheduleManager) {
        // Needs user context from session
        if (scheduleManager.user == null || ScheduleManager.getCurrentSchedule() == null) {
            ctx.status(401).json(new ScheduleMeApp.ErrorResponse("Unauthorized", "No user or active schedule"));
            return;
        }

        try {
            // Assume the request body contains the course code/ID to add
            // We need a simple class or Map to represent the request body structure
            Map<String, Integer> request = ctx.bodyAsClass(Map.class); // Expecting {"courseCode": 12345}
            int courseCodeToAdd = request.get("courseCode");

            // Find the course in the database (using the search instance linked in ScheduleManager)
            Course courseToAdd = null;
            if (scheduleManager.currentSearch != null && scheduleManager.currentSearch.courseDatabase != null) {
                courseToAdd = scheduleManager.currentSearch.courseDatabase.stream()
                        .filter(c -> c.courseCode == courseCodeToAdd)
                        .findFirst()
                        .orElse(null);
            }


            if (courseToAdd == null) {
                ctx.status(404).json(new ScheduleMeApp.ErrorResponse("Not Found", "Course with code " + courseCodeToAdd + " not found"));
                return;
            }

            // Use ScheduleManager to add the event (it handles conflicts and history)
            boolean conflict = scheduleManager.addEvent(courseToAdd); // addEvent returns true if conflict

            if (conflict) {
                ctx.status(409).json(new ScheduleMeApp.ErrorResponse("Conflict", "Course conflicts with existing schedule event"));
            } else {
                ctx.status(200).json(ScheduleManager.getCurrentSchedule()); // Return updated schedule
            }

        } catch (Exception e) {
            System.err.println("Add course error: " + e.getMessage());
            e.printStackTrace();
            ctx.status(500).json(new ScheduleMeApp.ErrorResponse("Server Error", "Failed to add course"));
        }
    }

    private static void removeCourseFromCurrentSchedule(Context ctx, ScheduleManager scheduleManager) {
        // Needs user context from session
        if (scheduleManager.user == null || ScheduleManager.getCurrentSchedule() == null) {
            ctx.status(401).json(new ScheduleMeApp.ErrorResponse("Unauthorized", "No user or active schedule"));
            return;
        }

        try {
            int courseCodeToRemove = Integer.parseInt(ctx.pathParam("courseCode"));
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
                ctx.status(404).json(new ScheduleMeApp.ErrorResponse("Not Found", "Course with code " + courseCodeToRemove + " not found in current schedule"));
                return;
            }

            scheduleManager.remEvent(eventToRemove); // Use ScheduleManager to handle history
            ctx.status(200).json(ScheduleManager.getCurrentSchedule()); // Return updated schedule

        } catch (NumberFormatException e) {
            ctx.status(400).json(new ScheduleMeApp.ErrorResponse("Bad Request", "Invalid course code format in URL"));
        } catch (Exception e) {
            System.err.println("Remove course error: " + e.getMessage());
            e.printStackTrace();
            ctx.status(500).json(new ScheduleMeApp.ErrorResponse("Server Error", "Failed to remove course"));
        }
    }

    private static void listSavedSchedules(Context ctx, ScheduleManager scheduleManager) {
        // Needs user context from session
        if (scheduleManager.user == null) {
            ctx.status(401).json(new ScheduleMeApp.ErrorResponse("Unauthorized", "No user session found"));
            return;
        }

        // Extract just the names from the file paths stored in user.mySchedules
        if (scheduleManager.user.mySchedules != null) {
            List<String> scheduleNames = scheduleManager.user.mySchedules.stream()
                    .map(filePath -> filePath.substring(filePath.lastIndexOf('/') + 1, filePath.lastIndexOf('.')))
                    .collect(Collectors.toList());
            ctx.json(scheduleNames);
        } else {
            ctx.json(new ArrayList<String>()); // Return empty list
        }
    }

    private static void loadSchedule(Context ctx, ScheduleManager scheduleManager) {
        // Needs user context from session
        if (scheduleManager.user == null) {
            ctx.status(401).json(new ScheduleMeApp.ErrorResponse("Unauthorized", "No user session found"));
            return;
        }
        String scheduleName = ctx.pathParam("scheduleName");

        Schedule loadedSchedule = scheduleManager.loadSchedule(scheduleName); // This sets currentSchedule

        if (loadedSchedule != null) {
            scheduleManager.initializeUndoRedoAfterLoad(); // Reset history
            ctx.status(200).json(loadedSchedule);
        } else {
            ctx.status(404).json(new ScheduleMeApp.ErrorResponse("Not Found", "Schedule '" + scheduleName + "' not found or failed to load"));
        }
    }

    private static void saveCurrentSchedule(Context ctx, ScheduleManager scheduleManager) {
        // Needs user context from session
        if (scheduleManager.user == null || ScheduleManager.getCurrentSchedule() == null) {
            ctx.status(401).json(new ScheduleMeApp.ErrorResponse("Unauthorized", "No user or active schedule"));
            return;
        }
        Schedule currentSchedule = ScheduleManager.getCurrentSchedule();

        try {
            // User class handles saving the schedule file and updating user's list
            scheduleManager.user.saveSchedule(currentSchedule);
            ctx.status(200).json(Map.of("message", "Schedule '" + currentSchedule.name + "' saved successfully"));
        } catch (Exception e) {
            System.err.println("Save schedule error: " + e.getMessage());
            e.printStackTrace();
            ctx.status(500).json(new ScheduleMeApp.ErrorResponse("Server Error", "Failed to save schedule"));
        }
    }

    private static void createNewSchedule(Context ctx, ScheduleManager scheduleManager) {
        // Needs user context from session
        if (scheduleManager.user == null) {
            ctx.status(401).json(new ScheduleMeApp.ErrorResponse("Unauthorized", "No user session found"));
            return;
        }

        // Expect schedule name in request body, e.g., {"name": "New Fall Schedule"}
        Map<String, String> request = ctx.bodyAsClass(Map.class);
        String scheduleName = request.get("name");

        if (scheduleName == null || scheduleName.trim().isEmpty()) {
            ctx.status(400).json(new ScheduleMeApp.ErrorResponse("Bad Request", "Schedule name is required"));
            return;
        }

        // Check if schedule name already exists? User.saveSchedule might just overwrite.
        // Consider adding logic here or in ScheduleManager/User to prevent overwriting without confirmation.

        scheduleManager.newSchedule(scheduleName.trim()); // Creates, saves, and sets as current
        scheduleManager.initializeUndoRedoAfterLoad(); // Reset history for the new schedule

        Schedule newSchedule = ScheduleManager.getCurrentSchedule();
        if (newSchedule != null && newSchedule.name.equals(scheduleName.trim())) {
            ctx.status(201).json(newSchedule); // Return the newly created schedule
        } else {
            // This shouldn't happen if newSchedule worked correctly
            ctx.status(500).json(new ScheduleMeApp.ErrorResponse("Server Error", "Failed to create or retrieve new schedule"));
        }
    }


    private static void deleteSchedule(Context ctx, ScheduleManager scheduleManager) {
        // Needs user context from session
        if (scheduleManager.user == null) {
            ctx.status(401).json(new ScheduleMeApp.ErrorResponse("Unauthorized", "No user session found"));
            return;
        }
        String scheduleName = ctx.pathParam("scheduleName");

        try {
            // User class handles deleting the file and removing from list
            scheduleManager.user.deleteSchedule(scheduleName);

            // If the deleted schedule was the current one, clear it
            Schedule current = ScheduleManager.getCurrentSchedule();
            if (current != null && current.name.equals(scheduleName)) {
                ScheduleManager.currentSchedule = null; // Clear the static current schedule
                scheduleManager.initializeUndoRedoAfterLoad(); // Clear history too
            }
            // Save user data to persist the removal from mySchedules list
            scheduleManager.user.saveUserData();


            ctx.status(200).json(Map.of("message", "Schedule '" + scheduleName + "' deleted successfully"));
        } catch (Exception e) { // Catch potential errors during file deletion or list removal
            System.err.println("Delete schedule error: " + e.getMessage());
            e.printStackTrace();
            // Check if the error was simply "not found" vs. actual deletion failure
            if (e.getMessage() != null && e.getMessage().contains("not found")) { // Adjust based on actual error message from deleteSchedule
                ctx.status(404).json(new ScheduleMeApp.ErrorResponse("Not Found", "Schedule '" + scheduleName + "' not found"));
            } else {
                ctx.status(500).json(new ScheduleMeApp.ErrorResponse("Server Error", "Failed to delete schedule"));
            }
        }
    }

    // Optional Undo/Redo handlers
    /*
    private static void undoChange(Context ctx, ScheduleManager scheduleManager) {
         if (scheduleManager.user == null || ScheduleManager.getCurrentSchedule() == null) {
             ctx.status(401).json(new ScheduleMeApp.ErrorResponse("Unauthorized", "No user or active schedule"));
             return;
         }
        boolean success = scheduleManager.undo();
        if (success) {
            ctx.json(ScheduleManager.getCurrentSchedule());
        } else {
            ctx.status(400).json(new ScheduleMeApp.ErrorResponse("Bad Request", "Nothing to undo"));
        }
    }

    private static void redoChange(Context ctx, ScheduleManager scheduleManager) {
         if (scheduleManager.user == null || ScheduleManager.getCurrentSchedule() == null) {
             ctx.status(401).json(new ScheduleMeApp.ErrorResponse("Unauthorized", "No user or active schedule"));
             return;
         }
        boolean success = scheduleManager.redo();
        if (success) {
            ctx.json(ScheduleManager.getCurrentSchedule());
        } else {
            ctx.status(400).json(new ScheduleMeApp.ErrorResponse("Bad Request", "Nothing to redo"));
        }
    }
    */
}