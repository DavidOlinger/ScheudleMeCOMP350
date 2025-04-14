package exampleSite;

import io.javalin.Javalin;
import io.javalin.http.staticfiles.Location;
import io.javalin.json.JavalinJackson;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import exampleSite.ScheduleController;

// AI GENERATED EXAMPLE CODE - Ben

public class ScheduleApp {
    public static void main(String[] args) {
        // Configure Jackson for proper serialization of dates
        ObjectMapper objectMapper = new ObjectMapper()
                .registerModule(new JavaTimeModule())
                .configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false)
                .configure(DeserializationFeature.ADJUST_DATES_TO_CONTEXT_TIME_ZONE, true)
                .disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);

        Javalin app = Javalin.create(config -> {
            config.staticFiles.add("/public", Location.CLASSPATH);
            config.plugins.enableCors(cors -> cors.add(it -> {
                it.anyHost();
            }));
            config.jsonMapper(new JavalinJackson(objectMapper));
            config.http.defaultContentType = "application/json";
        }).start(7000);

        app.exception(Exception.class, (e, ctx) -> {
            e.printStackTrace();
            ctx.status(500).result("Internal server error: " + e.getMessage());
        });

        // Register endpoints
        ScheduleController.registerEndpoints(app);

        System.out.println("Server started on http://localhost:7000");
    }
}