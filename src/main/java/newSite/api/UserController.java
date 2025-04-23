package newSite.api;

import io.javalin.Javalin;
import io.javalin.http.Context;
import newSite.core.Schedule;
import newSite.core.ScheduleManager;
import newSite.core.User;
// Assuming ErrorResponse is accessible, e.g., defined in ScheduleMeApp or a util package
import newSite.ScheduleMeApp; // Or replace with the actual import path for ErrorResponse

import java.util.Map;
import java.util.List;
// ***** START OF NEW CODE ***** (Import ArrayList if needed, though User should handle it)
import java.util.ArrayList;
// ***** END OF NEW CODE *****
import java.util.NoSuchElementException; // Import if used in getCurrentUser or elsewhere


public class UserController {

    public static void registerEndpoints(Javalin app, ScheduleManager scheduleManager) {

        // Get current user info - Ensure this returns mySchedules
        app.get("/api/user/current", ctx -> getCurrentUser(ctx, scheduleManager));

        // User Login - Modified to REMOVE auto-load
        app.post("/api/auth/login", ctx -> loginUser(ctx, scheduleManager));

        // User Logout
        app.post("/api/auth/logout", ctx -> logoutUser(ctx, scheduleManager));

        // Create New User
        app.post("/api/users", ctx -> createUser(ctx, scheduleManager));
    }

    private static void getCurrentUser(Context ctx, ScheduleManager scheduleManager) {
        // This method is called AFTER successful login by loginUser,
        // or directly via GET /api/user/current if a session exists (TODO).
        User currentUser = scheduleManager.user; // Get the user currently stored in the shared manager

        if (currentUser != null) {
            // ***** START OF CHANGE *****
            // Create a DTO (Data Transfer Object) or clean User object for the response.
            // Ensure mySchedules is copied over.
            User publicUserInfo = new User(currentUser.name, ""); // Use constructor that only takes name/pass (pass empty pass)
            // Manually copy other non-sensitive fields if needed
            publicUserInfo.idNumber = currentUser.idNumber;
            publicUserInfo.major = currentUser.major;
            publicUserInfo.year = currentUser.year;
            // Crucially, copy the list of schedule file paths
            publicUserInfo.mySchedules = (currentUser.mySchedules != null) ? new ArrayList<>(currentUser.mySchedules) : new ArrayList<>();
            System.out.println("getCurrentUser: Sending user info for " + publicUserInfo.name + " with " + publicUserInfo.mySchedules.size() + " schedules.");
            ctx.json(publicUserInfo);
            // ***** END OF CHANGE *****
        } else {
            System.out.println("getCurrentUser: No user found in scheduleManager.");
            ctx.status(401).json(new ScheduleMeApp.ErrorResponse("Unauthorized", "No user logged in or found"));
        }
    }

    private static void loginUser(Context ctx, ScheduleManager scheduleManager) {
        try {
            String username = ctx.queryParam("username");
            String password = ctx.queryParam("password");

            if (username == null || password == null) {
                ctx.status(400).json(new ScheduleMeApp.ErrorResponse("Bad Request", "Username and password required"));
                return;
            }

            // Attempt login using ScheduleManager logic
            // This sets scheduleManager.user if successful
            boolean loggedIn = scheduleManager.loginUser(username.trim(), password);

            if (loggedIn) {
                System.out.println("User logged in via API: " + username.trim());

                // ***** START OF REMOVED CODE *****
                // --- REMOVE Auto-load first schedule ---
                // User loggedInUser = scheduleManager.user;
                // if (loggedInUser != null && loggedInUser.mySchedules != null && !loggedInUser.mySchedules.isEmpty()) {
                //    ... logic to load first schedule ...
                // } else {
                //    ... logic if no schedules ...
                // }
                // --- End of REMOVED Auto-load ---
                // ***** END OF REMOVED CODE *****

                // ***** START OF NEW CODE *****
                // Explicitly clear any potentially lingering schedule from a previous user session
                // in the static manager. The frontend will decide what to load.
                ScheduleManager.currentSchedule = null;
                // Initialize history for the new user session (empty initially)
                scheduleManager.initializeUndoRedoAfterLoad();
                System.out.println("Cleared current schedule on login for user: " + username.trim());
                // ***** END OF NEW CODE *****


                // TODO: Create a session for the user in Javalin

                // Respond with the user info (including the schedule list)
                getCurrentUser(ctx, scheduleManager); // This now sends mySchedules list

            } else {
                // loginUser prints error messages, send generic response
                ctx.status(401).json(new ScheduleMeApp.ErrorResponse("Unauthorized", "Invalid username or password"));
            }
        } catch (Exception e) {
            System.err.println("Login error: " + e.getMessage());
            e.printStackTrace();
            ctx.status(500).json(new ScheduleMeApp.ErrorResponse("Server Error", "Login failed due to an unexpected error."));
        }
    }

    private static void logoutUser(Context ctx, ScheduleManager scheduleManager) {
        System.out.println("Logout requested via API for user: " + (scheduleManager.user != null ? scheduleManager.user.name : "none"));

        // Clears scheduleManager.user and saves data
        scheduleManager.logoutUser();

        // Also clear the static current schedule on logout
        ScheduleManager.currentSchedule = null;
        // Clear history stacks as well
        if (scheduleManager.editHistory != null) scheduleManager.editHistory.clear();
        if (scheduleManager.undoneHistory != null) scheduleManager.undoneHistory.clear();
        System.out.println("Cleared current schedule and history on logout.");

        // TODO: Invalidate the actual Javalin session

        ctx.status(200).json(Map.of("message", "Logout successful"));
    }

    private static void createUser(Context ctx, ScheduleManager scheduleManager) {
        try {
            String username = ctx.queryParam("username");
            String password = ctx.queryParam("password");

            if (username == null || password == null || username.trim().isEmpty() || password.isEmpty()) {
                ctx.status(400).json(new ScheduleMeApp.ErrorResponse("Bad Request", "Username and password required"));
                return;
            }

            User existingUser = User.loadUserData(username.trim());
            if (existingUser != null) {
                ctx.status(409).json(new ScheduleMeApp.ErrorResponse("Conflict", "Username already exists"));
                return;
            }

            // User.addUser creates the user and saves their initial data (with empty schedule list)
            User newUser = User.addUser(username.trim(), password);
            if (newUser != null) {
                System.out.println("User created successfully via API: " + newUser.name);
                ctx.status(201).json(Map.of("message", "User created successfully", "username", newUser.name));
            } else {
                // This case might be redundant if loadUserData check works, but good practice
                ctx.status(500).json(new ScheduleMeApp.ErrorResponse("Server Error", "Failed to create user (maybe save error?)"));
            }

        } catch (Exception e) {
            System.err.println("User creation error: " + e.getMessage());
            e.printStackTrace();
            ctx.status(500).json(new ScheduleMeApp.ErrorResponse("Server Error", "User creation failed due to an unexpected error."));
        }
    }
}
