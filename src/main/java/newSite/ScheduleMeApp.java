package newSite; // Ensure this matches your package structure

// Javalin imports
import io.javalin.Javalin;
import io.javalin.json.JavalinGson;
import io.javalin.http.staticfiles.Location;
import io.javalin.http.UnauthorizedResponse; // For 401 errors
import io.javalin.http.ForbiddenResponse;   // For 403 errors (can also use for invalid token)

// Gson imports
import com.google.gson.Gson;
import com.google.gson.GsonBuilder;

// Firebase Admin SDK imports
import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseAuthException;
import com.google.firebase.auth.FirebaseToken;

// Your core classes
import newSite.core.Course;
import newSite.core.Event;
import newSite.core.EventDeserializer;
import newSite.core.Main;
import newSite.core.ScheduleManager;
import newSite.core.Search;

// Your controller classes
import newSite.api.CourseController;
import newSite.api.ScheduleController;
import newSite.api.UserController; // Keep for profile-related endpoints

// Java IO / Util imports
import java.io.FileInputStream;
import java.io.IOException;
import java.util.Objects;
import java.util.Set;

public class ScheduleMeApp {

    private static ScheduleManager scheduleManager;
    private static Search search;
    private static Set<Course> courseDatabase;
    private static final int DEFAULT_PORT = 7070;

    public static void main(String[] args) {
        // --- 0. Initialize Firebase Admin SDK ---
        // Must be done before starting Javalin or using FirebaseAuth
        initializeFirebaseAdminSDK();

        // --- 1. Load Data / Initialize Core Services ---
        System.out.println("Loading course database...");
        courseDatabase = Main.loadCourseDatabase("data_wolfe.json"); // Ensure path is correct
        if (courseDatabase == null || courseDatabase.isEmpty()) {
            System.err.println("FATAL: Course database failed to load or is empty. Exiting.");
            System.exit(1); // Exit if core data isn't available
        }
        System.out.println("Loaded " + courseDatabase.size() + " courses.");

        search = new Search();
        search.courseDatabase = courseDatabase;

        scheduleManager = new ScheduleManager();
        scheduleManager.currentSearch = search;
        System.out.println("Linked Search instance to ScheduleManager.");

        // --- 2. Configure Gson Mapper ---
        Gson gson = createGsonMapper();

        // --- 3. Configure and Start Javalin Server ---
        Javalin app = Javalin.create(config -> {
            // --- Static Files & SPA ---
            config.staticFiles.add("/public", Location.CLASSPATH); // Serve React build
            config.spaRoot.addFile("/", "public/index.html", Location.CLASSPATH); // SPA fallback

            // --- Plugins ---
            config.plugins.enableCors(cors -> cors.add(it -> it.anyHost())); // Enable CORS
            config.jsonMapper(new JavalinGson(gson)); // Use custom Gson mapper
            config.showJavalinBanner = false;

            // --- Request Logger ---
            config.requestLogger.http((ctx, ms) -> {
                String uid = ctx.attribute("firebase_uid"); // Log UID if available
                System.out.println(
                        ctx.method() + " " + ctx.path() +
                                (uid != null ? " (UID: " + uid + ")" : "") +
                                " -> " + ctx.status() + " (" + ms + " ms)"
                );
            });

            // --- **** NEW: Firebase Authentication Access Manager **** ---
            config.accessManager((handler, ctx, permittedRoles) -> {
                String path = ctx.path();

                // Define which paths require authentication
                // Assume all /api/ paths need auth EXCEPT course search
                // Adjust this logic based on your specific needs
                boolean requiresAuth = path.startsWith("/api/") &&
                        !path.startsWith("/api/courses/search"); // Course search is public

                if (!requiresAuth) {
                    handler.handle(ctx); // No auth needed, proceed
                    return;
                }

                // --- Authentication Required ---
                String idToken = extractBearerToken(ctx.header("Authorization"));

                if (idToken == null) {
                    System.err.println("Auth Error: No Bearer token provided for protected path: " + path);
                    throw new UnauthorizedResponse("Authentication required: Bearer token missing."); // 401
                }

                try {
                    // Verify the token against Firebase servers
                    FirebaseToken decodedToken = FirebaseAuth.getInstance().verifyIdToken(idToken);
                    String uid = decodedToken.getUid();

                    // ** IMPORTANT: Attach UID to context for controllers **
                    ctx.attribute("firebase_uid", uid);
                    ctx.attribute("firebase_token", decodedToken); // Optionally pass the whole token

                    // Token is valid, proceed with the original request handler
                    handler.handle(ctx);

                } catch (FirebaseAuthException e) {
                    System.err.println("Auth Error: Invalid Firebase token for path: " + path + " - " + e.getMessage());
                    // Use 403 Forbidden as the token was provided but invalid/expired
                    throw new ForbiddenResponse("Authentication failed: Invalid or expired token.");
                } catch (Exception e) {
                    // Catch unexpected errors during verification
                    System.err.println("Auth Error: Unexpected error verifying token for path: " + path + " - " + e.getMessage());
                    e.printStackTrace();
                    throw new ForbiddenResponse("Authentication failed: Token verification error.");
                }
            });
            // --- **** End of Access Manager **** ---

        }).start(getPort());

        // --- 4. Register API Endpoints ---
        // Controllers now need to be aware they might receive a "firebase_uid" attribute
        // OLD LOGIN/REGISTER Endpoints in UserController MUST BE REMOVED/REFACTORED
        UserController.registerEndpoints(app, scheduleManager); // Keep for profile endpoints ('/api/users/me')
        CourseController.registerEndpoints(app, search);         // Course search remains public (handled by AccessManager)
        ScheduleController.registerEndpoints(app, scheduleManager); // Schedule actions need auth

        // --- 5. Register General Exception Handler (Keep this last) ---
        app.exception(Exception.class, (e, ctx) -> {
            // Avoid logging auth errors twice if they bubble up
            if (!(e instanceof UnauthorizedResponse || e instanceof ForbiddenResponse)) {
                System.err.println("Unhandled exception for " + ctx.method() + " " + ctx.path() + ": " + e.getMessage());
                e.printStackTrace();
            } else {
                System.err.println("Auth Exception Caught by General Handler: " + e.getMessage());
            }

            // Don't override status/body if it's already set by an Auth Exception
            // ***** FIX: Use getCode() *****
            if (ctx.status().getCode() < 400) { // Check if status is not already an error
                String errorMessage = e.getMessage() != null ? e.getMessage() : "An unexpected error occurred.";
                ctx.status(500).json(new ErrorResponse("Internal Server Error", errorMessage));
            } else {
                // If it was an auth error handled by AccessManager, ensure body matches expected format
                // Check body() result carefully depending on Javalin version or how errors are set
                // Assuming body() might return the ErrorResponse object or null/empty if set differently
                Object body = ctx.resultInputStream(); // Check if anything was written might be safer
                if (body == null ) { // Check if body hasn't been explicitly set by auth exceptions
                    // ***** FIX: Use getCode() *****
                    ctx.json(new ErrorResponse(ctx.status().getCode() == 401 ? "Unauthorized" : "Forbidden", e.getMessage()));
                }
                // Note: The logic to check if the body() already contains the error might need refinement
                // depending on exactly how UnauthorizedResponse/ForbiddenResponse set the body in your Javalin setup.
                // Checking ctx.resultInputStream() == null is a simple way to see if anything has been written yet.
            }
        });

        System.out.println("Server started successfully on http://localhost:" + getPort());
        System.out.println("Access API endpoints under /api/");
        System.out.println("React App served from root '/'");
    }

    /**
     * Initializes the Firebase Admin SDK using credentials from a service account file.
     * Reads the file path from the FIREBASE_SERVICE_ACCOUNT_KEY_PATH environment variable.
     */
    private static void initializeFirebaseAdminSDK() {
        try {
            // --- IMPORTANT: Securely provide the path to your service account key ---
            // 1. Best Practice: Use an environment variable
            String serviceAccountPath = System.getenv("FIREBASE_SERVICE_ACCOUNT_KEY_PATH");

            // 2. Fallback (Less Secure - for local dev ONLY, ensure file is NOT committed)
            if (serviceAccountPath == null || serviceAccountPath.isBlank()) {
                // Define a default path for local development IF the env var isn't set
                // Example: "C:/Users/YourUser/secrets/firebase-service-account.json"
                // OR relative path if managed carefully: "src/main/resources/firebase-service-account.json"
                // ** WARNING: Do NOT commit your service account key file to Git! **
                serviceAccountPath = "path/to/your/serviceAccountKey.json"; // <--- UPDATE THIS PATH CAREFULLY
                System.out.println("WARN: FIREBASE_SERVICE_ACCOUNT_KEY_PATH env var not set. Using hardcoded path: " + serviceAccountPath);
                System.out.println("WARN: Ensure this service account key file is secured and not committed to version control.");
            }

            FileInputStream serviceAccountStream = new FileInputStream(serviceAccountPath);

            FirebaseOptions options = FirebaseOptions.builder()
                    .setCredentials(GoogleCredentials.fromStream(serviceAccountStream))
                    // Optionally add databaseURL etc. if using other Firebase services from backend
                    // .setDatabaseUrl("https://<YOUR_PROJECT_ID>.firebaseio.com")
                    .build();

            // Initialize only if default app doesn't exist
            if (FirebaseApp.getApps().isEmpty()) {
                FirebaseApp.initializeApp(options);
                System.out.println("Firebase Admin SDK Initialized Successfully.");
            } else {
                System.out.println("Firebase Admin SDK already initialized.");
            }

        } catch (IOException e) {
            System.err.println("FATAL: Error initializing Firebase Admin SDK. Check service account key path and validity.");
            System.err.println("Error details: " + e.getMessage());
            // Exit if Firebase Admin SDK cannot be initialized - critical for auth
            System.exit(1);
        }
    }


    /**
     * Configures Gson with custom type adapters.
     */
    private static Gson createGsonMapper() {
        return new GsonBuilder()
                .registerTypeAdapter(Event.class, new EventDeserializer())
                .setPrettyPrinting()
                .create();
    }

    /**
     * Gets the port number from the PORT environment variable or defaults to 7070.
     */
    private static int getPort() {
        String portEnv = System.getenv("PORT");
        if (portEnv != null) {
            try {
                return Integer.parseInt(portEnv);
            } catch (NumberFormatException e) {
                System.err.println("WARN: Invalid PORT environment variable value '" + portEnv + "'. Using default " + DEFAULT_PORT + ".");
            }
        }
        return DEFAULT_PORT;
    }

    /**
     * Extracts the Bearer token from the Authorization header.
     * @param authHeader The content of the Authorization header.
     * @return The token string or null if header is missing or invalid.
     */
    private static String extractBearerToken(String authHeader) {
        if (authHeader == null || !authHeader.toLowerCase().startsWith("bearer ")) {
            return null; // No header or doesn't start with "Bearer "
        }
        // Return the part after "Bearer "
        return authHeader.substring(7);
    }

    /**
     * Simple standardized error response class for JSON output.
     */
    public static class ErrorResponse {
        public String error;
        public String message;
        public ErrorResponse(String error, String message) {
            this.error = error;
            this.message = message;
        }
    }
}