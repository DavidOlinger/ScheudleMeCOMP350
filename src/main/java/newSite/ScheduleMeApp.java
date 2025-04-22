package newSite; // Ensure this matches your package

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import io.javalin.Javalin;
// Removed Context import as app.error is removed
import io.javalin.json.JavalinGson;
import io.javalin.http.staticfiles.Location;

// Import your core classes
import newSite.core.Course;
import newSite.core.Event;
import newSite.core.EventDeserializer;
import newSite.core.Main;
import newSite.core.ScheduleManager;
import newSite.core.Search;

// Import your controller classes
import newSite.api.CourseController;
import newSite.api.ScheduleController;
import newSite.api.UserController;

// Removed InputStream and StandardCharsets imports
import java.util.Set;

public class ScheduleMeApp {

    private static ScheduleManager scheduleManager;
    private static Search search;
    private static Set<Course> courseDatabase;
    private static final int DEFAULT_PORT = 7070;
    // Removed cached404Html variable

    public static void main(String[] args) {
        // 1. Load Data / Initialize Core Services
        System.out.println("Loading course database...");
        courseDatabase = Main.loadCourseDatabase("data_wolfe.json");
        if (courseDatabase == null || courseDatabase.isEmpty()) {
            System.err.println("FATAL: newSite.core.Course database failed to load or is empty. Exiting.");
            return;
        }
        System.out.println("Loaded " + courseDatabase.size() + " courses.");

        search = new Search();
        search.courseDatabase = courseDatabase;

        scheduleManager = new ScheduleManager();
        scheduleManager.currentSearch = search;

        // Removed call to load404Page();

        // 2. Configure Gson Mapper
        Gson gson = createGsonMapper();

        // 3. Configure and Start Javalin Server
        Javalin app = Javalin.create(config -> {
            // Serve static files (React build output) from src/main/resources/public
            config.staticFiles.add("/public", Location.CLASSPATH);

            // --- Single Page Application (SPA) Mode ---
            // Corrected path: Removed the leading slash from the file path.
            config.spaRoot.addFile("/", "public/index.html", Location.CLASSPATH);

            config.plugins.enableCors(cors -> cors.add(it -> it.anyHost()));
            config.jsonMapper(new JavalinGson(gson));
            config.showJavalinBanner = false;
            config.requestLogger.http((ctx, ms) -> {
                System.out.println(ctx.method() + " " + ctx.path() + " took " + ms + " ms");
            });
        }).start(getPort());

        // 4. Register API Endpoints via Controllers
        UserController.registerEndpoints(app, scheduleManager);
        CourseController.registerEndpoints(app, search);
        ScheduleController.registerEndpoints(app, scheduleManager);

        // 5. Register General Exception Handler (Keep this last)
        app.exception(Exception.class, (e, ctx) -> {
            System.err.println("Unhandled exception: " + e.getMessage());
            e.printStackTrace();
            ctx.status(500).json(new ErrorResponse("Internal Server Error", "An unexpected error occurred."));
        });

        // Removed the app.error(404, ...) handler block

        System.out.println("Server started on http://localhost:" + getPort());
    }

    private static Gson createGsonMapper() {
        return new GsonBuilder()
                .registerTypeAdapter(Event.class, new EventDeserializer())
                .setPrettyPrinting()
                .create();
    }

    private static int getPort() {
        return DEFAULT_PORT;
    }

    // Removed load404Page() method

    // Simple Error response class
    public static class ErrorResponse {
        public String error;
        public String message;
        public ErrorResponse(String error, String message) { this.error = error; this.message = message; }
    }
}
