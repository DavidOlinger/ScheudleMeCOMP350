package newSite.api;

import io.javalin.Javalin;
import io.javalin.http.Context;
import newSite.core.Schedule; // ***** START OF NEW CODE ***** (Import Schedule)
import newSite.core.ScheduleManager;
import newSite.core.User;
// Assuming ErrorResponse is accessible, e.g., defined in ScheduleMeApp or a util package
import newSite.ScheduleMeApp; // Or replace with the actual import path for ErrorResponse

import java.util.Map;
// ***** START OF NEW CODE ***** (Import List)
import java.util.List;
// ***** END OF NEW CODE *****


public class UserController {

    public static void registerEndpoints(Javalin app, ScheduleManager scheduleManager) {

        // Placeholder: Get current user info
        // TODO: Implement proper session handling to identify the actual current user
        app.get("/api/user/current", ctx -> getCurrentUser(ctx, scheduleManager));

        // User Login - Modified to load first schedule
        app.post("/api/auth/login", ctx -> loginUser(ctx, scheduleManager));

        // Placeholder: User Logout
        // TODO: Implement actual session invalidation
        app.post("/api/auth/logout", ctx -> logoutUser(ctx, scheduleManager));

        // Placeholder: Create New User
        // TODO: Implement user creation logic
        app.post("/api/users", ctx -> createUser(ctx, scheduleManager));
    }

    private static void getCurrentUser(Context ctx, ScheduleManager scheduleManager) {
        // --- VERY IMPORTANT ---
        // This is a placeholder! It assumes a single, shared user in scheduleManager.
        // In a real app, you need session management to get the user associated
        // with the current request (ctx).
        User currentUser = scheduleManager.user; // Get the user currently stored in the shared manager

        if (currentUser != null) {
            // Avoid sending sensitive info like password hash
            // Create a new User object or a DTO (Data Transfer Object) for the response
            User publicUserInfo = new User(currentUser.name, currentUser.idNumber, currentUser.major, currentUser.year, ""); // Pass empty string for password to avoid hashing it again
            publicUserInfo.mySchedules = currentUser.mySchedules; // Include schedules list if needed by frontend
            ctx.json(publicUserInfo);
        } else {
            ctx.status(401).json(new ScheduleMeApp.ErrorResponse("Unauthorized", "No user logged in or found"));
        }
    }

    private static void loginUser(Context ctx, ScheduleManager scheduleManager) {
        // Placeholder implementation
        try {
            // In a real app, you'd get username/password from ctx.body() or form params
            // Using query params as per original placeholder
            String username = ctx.queryParam("username");
            String password = ctx.queryParam("password");

            if (username == null || password == null) {
                ctx.status(400).json(new ScheduleMeApp.ErrorResponse("Bad Request", "Username and password required"));
                return;
            }

            // Attempt login using ScheduleManager logic (which uses User.loadUserData and checkPassword)
            // This sets scheduleManager.user if successful
            boolean loggedIn = scheduleManager.loginUser(username, password);

            if (loggedIn) {
                System.out.println("User logged in via API: " + username);

                // ***** START OF NEW CODE *****
                // --- Auto-load first schedule ---
                User loggedInUser = scheduleManager.user; // Get the user object set by loginUser
                if (loggedInUser != null && loggedInUser.mySchedules != null && !loggedInUser.mySchedules.isEmpty()) {
                    try {
                        String firstSchedulePath = loggedInUser.mySchedules.get(0);
                        // Extract schedule name from path (e.g., "users/testuser/schedules/MyFallSchedule.json" -> "MyFallSchedule")
                        String scheduleName = firstSchedulePath.substring(
                                firstSchedulePath.lastIndexOf('/') + 1,
                                firstSchedulePath.lastIndexOf('.')
                        );

                        System.out.println("Attempting to auto-load schedule: " + scheduleName);
                        Schedule loadedSchedule = scheduleManager.loadSchedule(scheduleName); // This loads into ScheduleManager.currentSchedule

                        if (loadedSchedule != null) {
                            scheduleManager.initializeUndoRedoAfterLoad(); // Reset history for the loaded schedule
                            System.out.println("Successfully auto-loaded schedule: " + scheduleName);
                        } else {
                            System.err.println("Failed to auto-load schedule: " + scheduleName);
                            // Don't treat this as a login failure, but log the issue.
                            // Maybe clear currentSchedule just in case?
                            ScheduleManager.currentSchedule = null;
                        }
                    } catch (Exception e) {
                        System.err.println("Error extracting or loading first schedule path: " + loggedInUser.mySchedules.get(0));
                        e.printStackTrace();
                        ScheduleManager.currentSchedule = null; // Clear current schedule on error
                    }
                } else {
                    System.out.println("User " + username + " has no saved schedules to auto-load.");
                    ScheduleManager.currentSchedule = null; // Ensure no schedule is loaded if none exist
                    scheduleManager.initializeUndoRedoAfterLoad(); // Still init history for potential new schedule actions
                }
                // --- End of Auto-load ---
                // ***** END OF NEW CODE *****


                // TODO: Create a session for the user in Javalin (ctx.req().getSession(...) etc.)

                // Respond with the user info (doesn't include the schedule data itself)
                getCurrentUser(ctx, scheduleManager); // Reuse the method to send public user info

            } else {
                // loginUser prints error messages, but we send a generic response
                ctx.status(401).json(new ScheduleMeApp.ErrorResponse("Unauthorized", "Invalid username or password"));
            }
        } catch (Exception e) {
            System.err.println("Login error: " + e.getMessage());
            e.printStackTrace(); // Print stack trace for debugging
            ctx.status(500).json(new ScheduleMeApp.ErrorResponse("Server Error", "Login failed due to an unexpected error."));
        }
    }

    private static void logoutUser(Context ctx, ScheduleManager scheduleManager) {
        // Placeholder implementation
        System.out.println("Logout requested via API for user: " + (scheduleManager.user != null ? scheduleManager.user.name : "none"));

        // --- VERY IMPORTANT ---
        // This only clears the shared user in scheduleManager.
        // Real implementation needs to invalidate the specific user's session.
        scheduleManager.logoutUser(); // Clears scheduleManager.user and saves data

        // ***** START OF NEW CODE *****
        // Also clear the static current schedule on logout
        ScheduleManager.currentSchedule = null;
        // ***** END OF NEW CODE *****


        // TODO: Invalidate the actual Javalin session associated with the request (ctx)

        ctx.status(200).json(Map.of("message", "Logout successful"));
    }

    private static void createUser(Context ctx, ScheduleManager scheduleManager) {
        // Placeholder implementation
        try {
            // In a real app, you'd get username/password from ctx.body()
            String username = ctx.queryParam("username"); // Example: using query params
            String password = ctx.queryParam("password"); // Example: using query params

            if (username == null || password == null || username.trim().isEmpty() || password.isEmpty()) {
                ctx.status(400).json(new ScheduleMeApp.ErrorResponse("Bad Request", "Username and password required"));
                return;
            }

            User existingUser = User.loadUserData(username.trim()); // Trim username before checking/adding
            if (existingUser != null) {
                ctx.status(409).json(new ScheduleMeApp.ErrorResponse("Conflict", "Username already exists"));
                return;
            }

            User newUser = User.addUser(username.trim(), password); // Trim username before adding
            if (newUser != null) {
                ctx.status(201).json(Map.of("message", "User created successfully", "username", newUser.name));
            } else {
                // addUser might return null if saving failed, though current implementation returns existing user
                ctx.status(500).json(new ScheduleMeApp.ErrorResponse("Server Error", "Failed to create user (maybe save error?)"));
            }

        } catch (Exception e) {
            System.err.println("User creation error: " + e.getMessage());
            e.printStackTrace(); // Print stack trace
            ctx.status(500).json(new ScheduleMeApp.ErrorResponse("Server Error", "User creation failed due to an unexpected error."));
        }
    }
}
