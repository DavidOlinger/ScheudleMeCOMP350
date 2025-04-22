package newSite.api;

import io.javalin.Javalin;
import io.javalin.http.Context;
import newSite.core.ScheduleManager;
import newSite.core.User;
// Assuming ErrorResponse is accessible, e.g., defined in ScheduleMeApp or a util package
import newSite.ScheduleMeApp; // Or replace with the actual import path for ErrorResponse

import java.util.Map;

public class UserController {

    public static void registerEndpoints(Javalin app, ScheduleManager scheduleManager) {

        // Placeholder: Get current user info
        // TODO: Implement proper session handling to identify the actual current user
        app.get("/api/user/current", ctx -> getCurrentUser(ctx, scheduleManager));

        // Placeholder: User Login
        // TODO: Implement actual password checking and session creation
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
        User currentUser = scheduleManager.user;

        if (currentUser != null) {
            // Avoid sending sensitive info like password hash
            User publicUserInfo = new User(currentUser.name, currentUser.idNumber, currentUser.major, currentUser.year, ""); // Create a DTO or clean user object
            publicUserInfo.mySchedules = currentUser.mySchedules; // Include schedules if needed
            ctx.json(publicUserInfo);
        } else {
            ctx.status(401).json(new ScheduleMeApp.ErrorResponse("Unauthorized", "No user logged in or found"));
        }
    }

    private static void loginUser(Context ctx, ScheduleManager scheduleManager) {
        // Placeholder implementation
        try {
            // In a real app, you'd get username/password from ctx.body() or form params
            String username = ctx.queryParam("username"); // Example: using query params
            String password = ctx.queryParam("password"); // Example: using query params

            if (username == null || password == null) {
                ctx.status(400).json(new ScheduleMeApp.ErrorResponse("Bad Request", "Username and password required"));
                return;
            }

            // Attempt login using ScheduleManager logic (which uses User.loadUserData and checkPassword)
            boolean loggedIn = scheduleManager.loginUser(username, password); // This sets scheduleManager.user

            if (loggedIn) {
                System.out.println("User logged in via API: " + username);
                // TODO: Create a session for the user in Javalin (ctx.req().getSession(...) etc.)
                getCurrentUser(ctx, scheduleManager); // Return current user info on successful login
            } else {
                // loginUser prints error messages, but we send a generic response
                ctx.status(401).json(new ScheduleMeApp.ErrorResponse("Unauthorized", "Invalid username or password"));
            }
        } catch (Exception e) {
            System.err.println("Login error: " + e.getMessage());
            ctx.status(500).json(new ScheduleMeApp.ErrorResponse("Server Error", "Login failed"));
        }
    }

    private static void logoutUser(Context ctx, ScheduleManager scheduleManager) {
        // Placeholder implementation
        System.out.println("Logout requested via API for user: " + (scheduleManager.user != null ? scheduleManager.user.name : "none"));

        // --- VERY IMPORTANT ---
        // This only clears the shared user in scheduleManager.
        // Real implementation needs to invalidate the specific user's session.
        scheduleManager.logoutUser(); // Clears scheduleManager.user and saves data

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

            User existingUser = User.loadUserData(username);
            if (existingUser != null) {
                ctx.status(409).json(new ScheduleMeApp.ErrorResponse("Conflict", "Username already exists"));
                return;
            }

            User newUser = User.addUser(username, password);
            if (newUser != null) {
                ctx.status(201).json(Map.of("message", "User created successfully", "username", newUser.name));
            } else {
                ctx.status(500).json(new ScheduleMeApp.ErrorResponse("Server Error", "Failed to create user"));
            }

        } catch (Exception e) {
            System.err.println("User creation error: " + e.getMessage());
            ctx.status(500).json(new ScheduleMeApp.ErrorResponse("Server Error", "User creation failed"));
        }
    }
}