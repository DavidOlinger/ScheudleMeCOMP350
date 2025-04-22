package newSite; // Assuming your classes are in this package

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import io.javalin.Javalin;
import io.javalin.json.JavalinGson; // Import Javalin's Gson adapter
import io.javalin.http.staticfiles.Location;

// Import your core classes (adjust package if necessary)
import newSite.core.Course; // Adjust path if needed
import newSite.core.Event; // Adjust path if needed
import newSite.core.EventDeserializer; // Your custom Gson deserializer
import newSite.core.Main; // Adjust path if needed
import newSite.core.ScheduleManager; // Adjust path if needed
import newSite.core.Search; // Adjust path if needed

// Import your controller classes (you'll need to create these)
import newSite.api.CourseController;
import newSite.api.ScheduleController;
import newSite.api.UserController;

import java.util.Set;

public class ScheduleMeApp {

    // Centralized instances (consider refinement for multi-user scenarios later)
    private static ScheduleManager scheduleManager;
    private static Search search;
    private static Set<Course> courseDatabase;
    private static final int DEFAULT_PORT = 7070;

    public static void main(String[] args) {
        // 1. Load Data / Initialize Core Services
        System.out.println("Loading course database...");
        courseDatabase = Main.loadCourseDatabase("data_wolfe.json"); // Ensure path is correct
        if (courseDatabase == null || courseDatabase.isEmpty()) {
            System.err.println("FATAL: newSite.core.Course database failed to load or is empty. Exiting.");
            return;
        }
        System.out.println("Loaded " + courseDatabase.size() + " courses.");

        search = new Search();
        search.courseDatabase = courseDatabase; //

        scheduleManager = new ScheduleManager(); //
        scheduleManager.currentSearch = search;

        // 2. Configure Gson Mapper
        Gson gson = createGsonMapper();

        // 3. Configure and Start Javalin Server
        Javalin app = Javalin.create(config -> {
            config.staticFiles.add("/public", Location.CLASSPATH); // Serve static React files
            config.plugins.enableCors(cors -> cors.add(it -> it.anyHost())); // Enable CORS
            config.jsonMapper(new JavalinGson(gson)); // Set the JsonMapper to use Gson
            // config.http.defaultContentType = "application/json"; // JavalinGson sets this
            config.showJavalinBanner = false;

            config.requestLogger.http((ctx, ms) -> {
                System.out.println(ctx.method() + " " + ctx.path() + " took " + ms + " ms");
            });

        }).start(getPort());

        // 4. Register API Endpoints via Controllers
        UserController.registerEndpoints(app, scheduleManager);
        CourseController.registerEndpoints(app, search);
        ScheduleController.registerEndpoints(app, scheduleManager);

        // 5. Register Exception Handlers
        app.exception(Exception.class, (e, ctx) -> {
            System.err.println("Unhandled exception: " + e.getMessage());
            e.printStackTrace();
            // Use the ErrorResponse class for consistent JSON errors
            ctx.status(500).json(new ErrorResponse("Internal Server Error", "An unexpected error occurred."));
        });

        System.out.println("Server started on http://localhost:" + getPort());
    }

    private static Gson createGsonMapper() {
        return new GsonBuilder()
                // Register your custom deserializer for handling newSite.core.Event/newSite.core.Course polymorphism
                .registerTypeAdapter(Event.class, new EventDeserializer())
                // Add pretty printing if desired for responses (optional, slight overhead)
                .setPrettyPrinting()
                // Add any other Gson configuration needed (e.g., date formats if not using simple types)
                // .setDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'") // Example if using java.util.Date
                .create();
        // NOTE: If you use Java 8+ time types (like ZonedDateTime, LocalDate) directly in classes
        // serialized by Gson, you might need to add custom TypeAdapters for them, as Gson doesn't
        // have built-in support like Jackson's JavaTimeModule. Your current core classes seem
        // okay, but be aware if you add new ones.
    }

    private static int getPort() {
        // Future: Get from environment variable or config
        return DEFAULT_PORT;
    }

    // Simple Error response class for consistent JSON errors
    // Ensure this class is accessible or redefine it here
    public static class ErrorResponse {
        public String error;
        public String message;

        public ErrorResponse(String error, String message) {
            this.error = error;
            this.message = message;
        }
    }
}