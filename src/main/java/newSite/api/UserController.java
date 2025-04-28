package newSite.api;

import io.javalin.Javalin;
import io.javalin.http.Context;
import io.javalin.http.NotFoundResponse;
import io.javalin.http.InternalServerErrorResponse;

import com.google.firebase.auth.FirebaseToken;

import newSite.core.ScheduleManager; // May not be needed here anymore
import newSite.core.User;
import newSite.ScheduleMeApp; // For ErrorResponse, if still needed

import java.io.IOException;
import java.util.ArrayList;

public class UserController {

    // Only register the endpoint for getting the current user's profile
    public static void registerEndpoints(Javalin app /* Remove ScheduleManager if unused */) {
        app.get("/api/users/me", ctx -> getCurrentUserProfile(ctx));
    }

    /**
     * Gets the profile for the currently authenticated user.
     * If the user profile doesn't exist locally (first login via Firebase),
     * it creates a basic profile using info from the Firebase token.
     */
    private static void getCurrentUserProfile(Context ctx) {
        FirebaseToken decodedToken = ctx.attribute("firebase_token");
        if (decodedToken == null) {
            throw new InternalServerErrorResponse("Authentication token missing in context.");
        }

        String uid = decodedToken.getUid();
        String email = decodedToken.getEmail();
        String displayName = decodedToken.getName(); // Get display name from Firebase if available

        if (uid == null || uid.isBlank()) {
            // Should not happen if token is valid
            throw new InternalServerErrorResponse("Firebase UID missing from token.");
        }

        // 1. Attempt to load existing user data using Firebase UID
        User currentUser = User.loadUserByFirebaseUid(uid);

        // 2. If user data doesn't exist locally, create it
        if (currentUser == null) {
            System.out.println("User profile for UID " + uid + " not found locally. Creating new profile...");
            try {
                // Use the constructor designed for Firebase info
                currentUser = new User(uid, email, displayName);
                // Set any other desired default values here if not handled by constructor
                // e.g., currentUser.major = "Undetermined";

                // Save the newly created user data
                currentUser.saveUserByFirebaseUid();
                System.out.println("Successfully created and saved new user profile for UID: " + uid);

            } catch (IllegalStateException | IOException e) {
                System.err.println("FATAL: Failed to create/save new user profile for UID " + uid + ": " + e.getMessage());
                e.printStackTrace();
                throw new InternalServerErrorResponse("Failed to initialize user profile.");
            }
        }

        // 3. Return sanitized user profile data
        // Create a safe DTO or ensure sensitive fields aren't included/sent
        // NOTE: The passwordHash field is already removed from User class
        User publicUserInfo = new User(); // Use default constructor for DTO
        publicUserInfo.firebaseUid = currentUser.firebaseUid;
        publicUserInfo.name = currentUser.name;
        publicUserInfo.email = currentUser.email;
        publicUserInfo.idNumber = currentUser.idNumber;
        publicUserInfo.major = currentUser.major;
        publicUserInfo.year = currentUser.year;
        // Ensure schedule list exists and use relative paths if User class now stores them
        publicUserInfo.mySchedules = (currentUser.mySchedules != null) ? new ArrayList<>(currentUser.mySchedules) : new ArrayList<>();

        System.out.println("Returning profile for user UID: " + uid);
        ctx.json(publicUserInfo);
    }
}