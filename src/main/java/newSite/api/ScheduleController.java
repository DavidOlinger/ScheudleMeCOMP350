package newSite.api;

// --- Imports ---
import io.javalin.Javalin;
import io.javalin.http.Context;
import io.javalin.http.NotFoundResponse;
import io.javalin.http.BadRequestResponse;
import io.javalin.http.ConflictResponse;
import io.javalin.http.InternalServerErrorResponse;

import com.google.firebase.auth.FirebaseToken;
import com.google.gson.JsonSyntaxException;

import newSite.core.*;
import newSite.ScheduleMeApp;

// **** ADDED Imports ****
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
// **** END ADDED Imports ****

import java.util.*;
import java.util.stream.Collectors;
// --- End Imports ---

public class ScheduleController {

    // --- Inner classes remain the same ---
    public static class AddCourseRequest { public int courseCode; public String subject; public char section; }
    public static class NameRequest { public String name; }
    public static class CreateScheduleResponse {
        public Schedule schedule;
        public User user;
        public CreateScheduleResponse(Schedule schedule, User user) {
            this.schedule = schedule;
            User publicUser = new User(); // Use default constructor
            publicUser.firebaseUid = user.firebaseUid;
            publicUser.name = user.name;
            publicUser.email = user.email;
            publicUser.idNumber = user.idNumber;
            publicUser.major = user.major;
            publicUser.year = user.year;
            publicUser.mySchedules = (user.mySchedules != null) ? new ArrayList<>(user.mySchedules) : new ArrayList<>();
            this.user = publicUser;
        }
    }
    public static class CustomEventRequest { public String name; public String days; public String startTime; public String endTime; }
    public static class RemoveEventRequest { public String name; public String days; public int startTimeSeconds; public int endTimeSeconds; }
    // --- End Inner Classes ---


    public static void registerEndpoints(Javalin app, ScheduleManager scheduleManager) {
        // Register endpoints - ensure method names match handler definitions below
        app.get("/api/schedule/current", ctx -> getCurrentSchedule(ctx, scheduleManager));
        app.post("/api/schedule/current/add", ctx -> addCourseToCurrentSchedule(ctx, scheduleManager));
        app.post("/api/schedule/current/add-custom", ctx -> addCustomEventToCurrentSchedule(ctx, scheduleManager)); // Ensure this method exists
        app.delete("/api/schedule/current/remove/{courseCode}", ctx -> removeCourseFromCurrentSchedule(ctx, scheduleManager)); // Ensure this method exists
        app.post("/api/schedule/current/remove-event", ctx -> removeEventFromCurrentSchedule(ctx, scheduleManager)); // Ensure this method exists
        app.post("/api/schedule/current/undo", ctx -> undoLastAction(ctx, scheduleManager));
        app.post("/api/schedule/current/redo", ctx -> redoLastAction(ctx, scheduleManager));
        app.get("/api/schedules", ctx -> listSavedSchedules(ctx, scheduleManager));
        app.put("/api/schedules/load/{scheduleName}", ctx -> loadSchedule(ctx, scheduleManager));
        app.post("/api/schedules/save", ctx -> saveCurrentSchedule(ctx, scheduleManager));
        app.post("/api/schedules/new", ctx -> createNewSchedule(ctx, scheduleManager));
        app.delete("/api/schedules/{scheduleName}", ctx -> deleteSchedule(ctx, scheduleManager));
    }

    // --- Helper method to get User from Context ---
    private static User loadUserFromContext(Context ctx) {
        FirebaseToken decodedToken = ctx.attribute("firebase_token");
        if (decodedToken == null) throw new InternalServerErrorResponse("Authentication token missing in context.");
        String uid = decodedToken.getUid();
        if (uid == null || uid.isBlank()) throw new InternalServerErrorResponse("Firebase UID missing from token.");

        User user = User.loadUserByFirebaseUid(uid);
        if (user == null) {
            System.err.println("Controller Error: User profile data not found for UID: " + uid + " on path: " + ctx.path() + ". User profile must exist for schedule operations.");
            throw new NotFoundResponse("User profile data not found. Cannot perform schedule operation.");
        }
        return user;
    }

    // ========================================================================
    // === Handlers operating on the STATIC current schedule (Unsafe)       ===
    // ========================================================================

    /** WARNING: Returns globally static schedule. */
    private static void getCurrentSchedule(Context ctx, ScheduleManager scheduleManager) {
        User currentUser = loadUserFromContext(ctx);
        Schedule staticCurrent = ScheduleManager.getCurrentSchedule();
        if (staticCurrent != null) {
            System.out.println("[User UID: " + currentUser.firebaseUid + "] WARNING: Returning STATIC current schedule: '" + staticCurrent.name + "'");
            ctx.json(staticCurrent);
        } else {
            throw new NotFoundResponse("No schedule currently loaded (globally)");
        }
    }

    /** WARNING: Adds course to globally static schedule. */
    private static void addCourseToCurrentSchedule(Context ctx, ScheduleManager scheduleManager) {
        User currentUser = loadUserFromContext(ctx);
        System.out.println("[User UID: " + currentUser.firebaseUid + "] WARNING: Adding course to STATIC current schedule.");
        if (ScheduleManager.currentSchedule == null) { throw new BadRequestResponse("No active schedule (globally)"); }
        if (scheduleManager.currentSearch == null || scheduleManager.currentSearch.courseDatabase == null) { throw new InternalServerErrorResponse("Course database not available"); }

        try {
            AddCourseRequest request = ctx.bodyAsClass(AddCourseRequest.class);
            if (request.subject == null || request.courseCode <= 0 || !Character.isLetterOrDigit(request.section)) { throw new BadRequestResponse("Missing/invalid fields"); }
            String subject = request.subject.trim().toUpperCase();
            char section = Character.toUpperCase(request.section);

            Course courseToAdd = scheduleManager.currentSearch.courseDatabase.stream()
                    .filter(c -> c != null && subject.equals(c.subject) && c.courseCode == request.courseCode && section == c.section)
                    .findFirst()
                    .orElseThrow(() -> new NotFoundResponse("Course section not found"));

            boolean conflict = scheduleManager.addEvent(courseToAdd); // Modifies STATIC schedule

            if (conflict) { throw new ConflictResponse("Course conflicts (static schedule)."); }
            else { ctx.status(200).json(ScheduleManager.getCurrentSchedule()); }

        } catch (JsonSyntaxException e) { throw new BadRequestResponse("Invalid JSON format."); }
        catch (BadRequestResponse | ConflictResponse | NotFoundResponse e) { throw e; }
        catch (Exception e) {
            System.err.println("[User UID: " + currentUser.firebaseUid + "] Add course (static) error: " + e.getMessage()); e.printStackTrace();
            throw new InternalServerErrorResponse("Unexpected error adding course.");
        }
    }

    // **** ENSURED Method Definition Exists ****
    /** WARNING: Adds custom event to globally static schedule. */
    private static void addCustomEventToCurrentSchedule(Context ctx, ScheduleManager scheduleManager) {
        User currentUser = loadUserFromContext(ctx);
        System.out.println("[User UID: " + currentUser.firebaseUid + "] WARNING: Adding custom event to STATIC current schedule.");

        if (ScheduleManager.currentSchedule == null) { throw new BadRequestResponse("No active schedule (globally)"); }

        try {
            CustomEventRequest request = ctx.bodyAsClass(CustomEventRequest.class);
            if (request.name == null || request.name.trim().isEmpty() || request.days == null || request.startTime == null || request.endTime == null) { throw new BadRequestResponse("Missing fields"); }
            String eventName = request.name.trim();
            String eventDays = request.days.trim().replaceAll("[^MTWRF]", "");
            if (eventDays.isEmpty()) { throw new BadRequestResponse("Invalid days"); }

            TimeSlot timeSlot;
            try {
                String startWithSeconds = request.startTime.contains(":") && request.startTime.length() == 5 ? request.startTime + ":00" : request.startTime;
                String endWithSeconds = request.endTime.contains(":") && request.endTime.length() == 5 ? request.endTime + ":00" : request.endTime;
                if (!startWithSeconds.matches("\\d{2}:\\d{2}:\\d{2}") || !endWithSeconds.matches("\\d{2}:\\d{2}:\\d{2}")) { throw new IllegalArgumentException("Invalid time format."); }
                timeSlot = new TimeSlot(startWithSeconds, endWithSeconds);
                if (timeSlot.startTime >= timeSlot.endTime) { throw new IllegalArgumentException("Start time must be before end time."); }
            } catch (Exception timeEx) { throw new BadRequestResponse("Invalid time data: " + timeEx.getMessage()); }

            Event customEvent = new Event(eventName, eventDays, timeSlot);

            boolean conflict = scheduleManager.addEvent(customEvent); // Modifies STATIC schedule

            if (conflict) { throw new ConflictResponse("Event conflicts (static schedule)."); }
            else { ctx.status(200).json(ScheduleManager.getCurrentSchedule()); }

        } catch (JsonSyntaxException e) { throw new BadRequestResponse("Invalid JSON format."); }
        catch (BadRequestResponse | ConflictResponse e) { throw e; }
        catch (Exception e) {
            System.err.println("[User UID: " + currentUser.firebaseUid + "] Add custom event (static) error: " + e.getMessage()); e.printStackTrace();
            throw new InternalServerErrorResponse("Unexpected error adding custom event.");
        }
    }

    // **** ENSURED Method Definition Exists ****
    /** WARNING: Removes course from globally static schedule. */
    private static void removeCourseFromCurrentSchedule(Context ctx, ScheduleManager scheduleManager) {
        User currentUser = loadUserFromContext(ctx);
        System.out.println("[User UID: " + currentUser.firebaseUid + "] WARNING: Removing course from STATIC current schedule.");

        Schedule staticCurrent = ScheduleManager.currentSchedule;
        if (staticCurrent == null || staticCurrent.events == null) { throw new BadRequestResponse("No active schedule or empty schedule (globally)"); }

        try {
            int courseCodeToRemove = Integer.parseInt(ctx.pathParam("courseCode"));
            Event eventToRemove = staticCurrent.events.stream()
                    .filter(e -> e instanceof Course && ((Course) e).courseCode == courseCodeToRemove)
                    .findFirst()
                    .orElseThrow(() -> new NotFoundResponse("Course code " + courseCodeToRemove + " not found (static schedule)"));

            scheduleManager.remEvent(eventToRemove); // Modifies STATIC schedule
            System.out.println("Course removed successfully from static schedule.");
            ctx.status(200).json(ScheduleManager.getCurrentSchedule());

        } catch (NumberFormatException e) { throw new BadRequestResponse("Invalid course code format"); }
        catch (NotFoundResponse e) { throw e; }
        catch (Exception e) {
            System.err.println("[User UID: " + currentUser.firebaseUid + "] Remove course (static) error: " + e.getMessage()); e.printStackTrace();
            throw new InternalServerErrorResponse("Unexpected error removing course.");
        }
    }

    // **** ENSURED Method Definition Exists ****
    /** WARNING: Removes event from globally static schedule. */
    private static void removeEventFromCurrentSchedule(Context ctx, ScheduleManager scheduleManager) {
        User currentUser = loadUserFromContext(ctx);
        System.out.println("[User UID: " + currentUser.firebaseUid + "] WARNING: Removing event from STATIC current schedule.");

        Schedule staticCurrent = ScheduleManager.currentSchedule;
        if (staticCurrent == null || staticCurrent.events == null) { throw new BadRequestResponse("No active schedule or empty schedule (globally)"); }

        try {
            RemoveEventRequest request = ctx.bodyAsClass(RemoveEventRequest.class);
            if (request.name == null || request.name.trim().isEmpty() || request.days == null || request.startTimeSeconds < 0 || request.endTimeSeconds <= request.startTimeSeconds) { throw new BadRequestResponse("Missing/invalid fields"); }

            Event eventToRemove = null;
            Iterator<Event> iterator = staticCurrent.events.iterator(); // Iterate static schedule
            while (iterator.hasNext()) {
                Event event = iterator.next();
                if (event != null && event.time != null && Objects.equals(event.name, request.name.trim()) && Objects.equals(event.days, request.days) && event.time.startTime == request.startTimeSeconds && event.time.endTime == request.endTimeSeconds) {
                    eventToRemove = event; break;
                }
            }

            if (eventToRemove == null) { throw new NotFoundResponse("Specified event not found (static schedule)"); }

            scheduleManager.remEvent(eventToRemove); // Modifies STATIC schedule
            System.out.println("Event removed successfully from static schedule.");
            ctx.status(200).json(ScheduleManager.getCurrentSchedule());

        } catch (JsonSyntaxException e) { throw new BadRequestResponse("Invalid JSON format."); }
        catch (BadRequestResponse | NotFoundResponse e) { throw e; }
        catch (Exception e) {
            System.err.println("[User UID: " + currentUser.firebaseUid + "] Remove event (static) error: " + e.getMessage()); e.printStackTrace();
            throw new InternalServerErrorResponse("Unexpected error removing event.");
        }
    }

    /** WARNING: Performs UNDO on globally static schedule. Unsafe. */
    private static void undoLastAction(Context ctx, ScheduleManager scheduleManager) {
        User currentUser = loadUserFromContext(ctx);
        System.out.println("[User UID: " + currentUser.firebaseUid + "] WARNING: Performing UNDO on STATIC current schedule.");
        if (ScheduleManager.currentSchedule == null) { throw new BadRequestResponse("No active schedule (globally) to undo"); }
        try {
            boolean success = scheduleManager.undo();
            if (success) { ctx.status(200).json(ScheduleManager.getCurrentSchedule()); }
            else { throw new BadRequestResponse("Nothing to undo"); }
        } catch (BadRequestResponse e) { throw e; }
        catch (Exception e) {
            System.err.println("[User UID: " + currentUser.firebaseUid + "] Undo error: " + e.getMessage()); e.printStackTrace();
            throw new InternalServerErrorResponse("Undo failed.");
        }
    }

    /** WARNING: Performs REDO on globally static schedule. Unsafe. */
    private static void redoLastAction(Context ctx, ScheduleManager scheduleManager) {
        User currentUser = loadUserFromContext(ctx);
        System.out.println("[User UID: " + currentUser.firebaseUid + "] WARNING: Performing REDO on STATIC current schedule.");
        if (ScheduleManager.currentSchedule == null) { throw new BadRequestResponse("No active schedule (globally) to redo"); }
        try {
            boolean success = scheduleManager.redo();
            if (success) { ctx.status(200).json(ScheduleManager.getCurrentSchedule()); }
            else { throw new BadRequestResponse("Nothing to redo"); }
        } catch (BadRequestResponse e) { throw e; }
        catch (Exception e) {
            System.err.println("[User UID: " + currentUser.firebaseUid + "] Redo error: " + e.getMessage()); e.printStackTrace();
            throw new InternalServerErrorResponse("Redo failed.");
        }
    }


    // ========================================================================
    // === Handlers for Managing Specific Schedules (More Reliable)         ===
    // ========================================================================

    /** Lists saved schedule names for the authenticated user. */
    private static void listSavedSchedules(Context ctx, ScheduleManager scheduleManager) {
        User currentUser = loadUserFromContext(ctx);
        System.out.println("[User UID: " + currentUser.firebaseUid + "] Listing saved schedules.");
        if (currentUser.mySchedules != null) {
            List<String> scheduleNames = currentUser.mySchedules.stream()
                    // Use Path object now that it's imported
                    .map(relPath -> { try {
                        // **** FIXED: Use Path/Paths ****
                        Path p = Paths.get(relPath);
                        String filename = p.getFileName().toString();
                        return filename.substring(0, filename.lastIndexOf('.'));
                    } catch (Exception e) {
                        System.err.println("Error parsing schedule path: " + relPath + " - " + e.getMessage());
                        return null; // Skip invalid paths
                    }
                    })
                    .filter(Objects::nonNull).collect(Collectors.toList());
            ctx.json(scheduleNames);
        } else {
            ctx.json(new ArrayList<String>());
        }
    }

    /** WARNING: Loads schedule AND sets the static current schedule. */
    private static void loadSchedule(Context ctx, ScheduleManager scheduleManager) {
        User currentUser = loadUserFromContext(ctx);
        String scheduleName = ctx.pathParam("scheduleName");
        if (scheduleName == null || scheduleName.trim().isEmpty()) { throw new BadRequestResponse("Schedule name required"); }
        System.out.println("[User UID: " + currentUser.firebaseUid + "] Loading schedule: '" + scheduleName + "'. WARNING: Will set STATIC current schedule.");

        User originalManagerUser = scheduleManager.user;
        try {
            scheduleManager.user = currentUser; // TEMPORARY, UNSAFE
            Schedule loadedSchedule = scheduleManager.loadSchedule(scheduleName);
            if (loadedSchedule != null) {
                scheduleManager.initializeUndoRedoAfterLoad();
                ctx.status(200).json(loadedSchedule);
            } else {
                throw new NotFoundResponse("Schedule '" + scheduleName + "' not found or failed to load.");
            }
        } catch (NotFoundResponse | BadRequestResponse e) { throw e; }
        catch (Exception e) {
            System.err.println("[User UID: " + currentUser.firebaseUid + "] Load schedule error: " + e.getMessage()); e.printStackTrace();
            throw new InternalServerErrorResponse("Unexpected error loading schedule.");
        } finally {
            scheduleManager.user = originalManagerUser; // Restore
        }
    }


    /** WARNING: Saves the globally static current schedule. */
    private static void saveCurrentSchedule(Context ctx, ScheduleManager scheduleManager) {
        User currentUser = loadUserFromContext(ctx);
        Schedule staticCurrentSchedule = ScheduleManager.getCurrentSchedule();
        if (staticCurrentSchedule == null) { throw new BadRequestResponse("No active schedule (globally) to save"); }
        System.out.println("[User UID: " + currentUser.firebaseUid + "] WARNING: Saving STATIC schedule named '" + staticCurrentSchedule.name + "'.");
        try {
            currentUser.saveSchedule(staticCurrentSchedule);
            ctx.status(200).json(Map.of("message", "Schedule '" + staticCurrentSchedule.name + "' saved successfully"));
        } catch (Exception e) { // Catch specific IOExceptions if User.saveSchedule declares them
            System.err.println("[User UID: " + currentUser.firebaseUid + "] Save static schedule error: " + e.getMessage()); e.printStackTrace();
            // **** FIXED: Check if e has getMessage() ****
            throw new InternalServerErrorResponse("Failed to save schedule: " + (e.getMessage() != null ? e.getMessage() : "Unknown error"));
        }
    }
    /**
     * Creates a new schedule for the authenticated user (using UID).
     * WARNING: This action sets the globally static ScheduleManager.currentSchedule,
     * affecting all users. It also requires temporarily setting the instance user.
     */
    private static void createNewSchedule(Context ctx, ScheduleManager scheduleManager) {
        User currentUser = loadUserFromContext(ctx); // Load user by UID

        NameRequest request;
        try { request = ctx.bodyAsClass(NameRequest.class); }
        catch (Exception e) { throw new BadRequestResponse("Invalid request body. Expected JSON with 'name'."); }

        String scheduleName = request.name;
        if (scheduleName == null || scheduleName.trim().isEmpty()) { throw new BadRequestResponse("Schedule name required"); }
        String trimmedName = scheduleName.trim();
        System.out.println("[User UID: " + currentUser.firebaseUid + "] Creating new schedule: '" + trimmedName + "'. WARNING: Will set STATIC current schedule.");

        try { // Wrap existence check and creation
            // Check for conflict using user's method that now throws NoSuchElementException if NOT found
            try {
                currentUser.loadScheduleFile(trimmedName);
                // If we get here, it exists
                throw new ConflictResponse("A schedule with this name already exists.");
            } catch (NoSuchElementException scheduleNotFound) {
                // Expected path: schedule doesn't exist, proceed.
            } catch (IOException | JsonSyntaxException | IllegalStateException checkError) {
                // Handle other errors during the check
                System.err.println("[User UID: " + currentUser.firebaseUid + "] Error checking schedule existence: " + checkError.getMessage());
                throw new InternalServerErrorResponse("Error checking existing schedule.");
            }

            // If check passes (or throws correctly handled exception), proceed with creation
            User originalManagerUser = scheduleManager.user;
            try {
                scheduleManager.user = currentUser; // TEMPORARY, UNSAFE for concurrency
                scheduleManager.newSchedule(trimmedName); // Calls original method, sets static currentSchedule
                scheduleManager.initializeUndoRedoAfterLoad(); // Operates on static schedule

                Schedule newStaticSchedule = ScheduleManager.getCurrentSchedule();

                if (newStaticSchedule != null && newStaticSchedule.name.equals(trimmedName)) {
                    // currentUser.mySchedules was updated by newSchedule, save user data to persist it
                    // ***** FIX: Call the correct method name *****
                    currentUser.saveUserByFirebaseUid(); // PERSIST mySchedules change

                    System.out.println("Successfully created schedule: " + trimmedName);
                    CreateScheduleResponse responsePayload = new CreateScheduleResponse(newStaticSchedule, currentUser);
                    ctx.status(201).json(responsePayload);
                } else {
                    System.err.println("[User UID: " + currentUser.firebaseUid + "] Error creating new schedule: static currentSchedule mismatch/null.");
                    throw new InternalServerErrorResponse("Failed to confirm new schedule creation.");
                }
            } finally {
                scheduleManager.user = originalManagerUser; // Restore
            }
        } catch (ConflictResponse e) { throw e; } // Re-throw conflict
        catch (Exception e) {
            System.err.println("[User UID: " + currentUser.firebaseUid + "] Create new schedule error: " + e.getMessage()); e.printStackTrace();
            throw new InternalServerErrorResponse("Unexpected error creating new schedule.");
        }
    }

    /** Deletes schedule for the authenticated user. Relatively safe. */
    private static void deleteSchedule(Context ctx, ScheduleManager scheduleManager) {
        User currentUser = loadUserFromContext(ctx);
        String scheduleName = ctx.pathParam("scheduleName");
        if (scheduleName == null || scheduleName.trim().isEmpty()) { throw new BadRequestResponse("Schedule name required"); }
        System.out.println("[User UID: " + currentUser.firebaseUid + "] Deleting schedule: '" + scheduleName + "'.");

        try {
            currentUser.deleteSchedule(scheduleName); // Throws NoSuchElementException if not found, IOException on file error

            Schedule staticCurrent = ScheduleManager.getCurrentSchedule();
            if (staticCurrent != null && staticCurrent.name.equals(scheduleName)) {
                System.out.println("WARNING: Clearing STATIC current schedule because it matched deleted name: '" + scheduleName + "'.");
                ScheduleManager.currentSchedule = null;
                if (scheduleManager.editHistory != null) scheduleManager.editHistory.clear();
                if (scheduleManager.undoneHistory != null) scheduleManager.undoneHistory.clear();
            }

            // deleteSchedule should ideally save user data itself, but we ensure it here
            // currentUser.saveUserData(); // Assuming User.deleteSchedule now saves the user data

            System.out.println("Schedule '" + scheduleName + "' deleted successfully.");
            User publicUser = new User(); // Create DTO
            publicUser.firebaseUid = currentUser.firebaseUid;
            publicUser.name = currentUser.name;
            publicUser.email = currentUser.email;
            /* copy other non-sensitive fields */
            publicUser.idNumber = currentUser.idNumber;
            publicUser.major = currentUser.major;
            publicUser.year = currentUser.year;
            publicUser.mySchedules = (currentUser.mySchedules != null) ? new ArrayList<>(currentUser.mySchedules) : new ArrayList<>();

            ctx.status(200).json(Map.of(
                    "message", "Schedule '" + scheduleName + "' deleted successfully",
                    "user", publicUser
            ));

        } catch (NoSuchElementException e) { throw new NotFoundResponse("Schedule '" + scheduleName + "' not found"); }
        // **** FIXED: Catch IOException ****
        catch (IOException e) {
            System.err.println("[User UID: " + currentUser.firebaseUid + "] Delete schedule IO error: " + e.getMessage()); e.printStackTrace();
            // **** FIXED: e is IOException, getMessage() is valid ****
            throw new InternalServerErrorResponse("Failed to delete schedule file: " + e.getMessage());
        } catch (Exception e) { // Catch other unexpected errors
            System.err.println("[User UID: " + currentUser.firebaseUid + "] Delete schedule error: " + e.getMessage()); e.printStackTrace();
            throw new InternalServerErrorResponse("Unexpected error deleting schedule.");
        }
    }

} // End of ScheduleController class