package exampleSite;

import io.javalin.Javalin;
import io.javalin.http.Context;
import exampleSite.ScheduleItem;

import java.time.ZonedDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

// AI GENERATED EXAMPLE CODE - Ben

public class ScheduleController {
    // In-memory storage for schedule items (replace with a database in production)
    private static Map<Long, ScheduleItem> scheduleItems = new HashMap<>();
    private static Long idCounter = 1L;

    // Initialize with some sample data
    static {
        addScheduleItem(new ScheduleItem(null, "Team Meeting", "Weekly sync",
                ZonedDateTime.now().plusDays(1), ZonedDateTime.now().plusDays(1).plusHours(1)));
        addScheduleItem(new ScheduleItem(null, "Project Review", "Review Q2 progress",
                ZonedDateTime.now().plusDays(2), ZonedDateTime.now().plusDays(2).plusHours(2)));
    }

    public static void registerEndpoints(Javalin app) {
        app.get("/api/schedule", ScheduleController::getAllItems);
        app.get("/api/schedule/{id}", ScheduleController::getItem);
        app.post("/api/schedule", ScheduleController::createItem);
        app.put("/api/schedule/{id}", ScheduleController::updateItem);
        app.delete("/api/schedule/{id}", ScheduleController::deleteItem);
    }

    private static void getAllItems(Context ctx) {
        List<ScheduleItem> items = new ArrayList<>(scheduleItems.values());
        ctx.json(items);
    }

    private static void getItem(Context ctx) {
        try {
            Long id = Long.parseLong(ctx.pathParam("id"));
            ScheduleItem item = scheduleItems.get(id);

            if (item != null) {
                ctx.json(item);
            } else {
                ctx.status(404).result("Schedule item not found");
            }
        } catch (NumberFormatException e) {
            ctx.status(400).result("Invalid ID format");
        }
    }

    private static void createItem(Context ctx) {
        try {
            System.out.println("Received body: " + ctx.body());

            ScheduleItem item = ctx.bodyAsClass(ScheduleItem.class);
            System.out.println("Parsed item: " + item);

            // Validate the item
            if (item.getTitle() == null || item.getTitle().trim().isEmpty()) {
                ctx.status(400).result("Title is required");
                return;
            }

            if (item.getStartTime() == null || item.getEndTime() == null) {
                ctx.status(400).result("Start time and end time are required");
                return;
            }

            // Add the item
            addScheduleItem(item);
            ctx.status(201).json(item);
        } catch (DateTimeParseException e) {
            ctx.status(400).result("Invalid date format: " + e.getMessage());
            e.printStackTrace();
        } catch (Exception e) {
            ctx.status(500).result("Error creating item: " + e.getMessage());
            e.printStackTrace();
        }
    }

    private static void updateItem(Context ctx) {
        try {
            Long id = Long.parseLong(ctx.pathParam("id"));
            if (!scheduleItems.containsKey(id)) {
                ctx.status(404).result("Schedule item not found");
                return;
            }

            System.out.println("Update - Received body: " + ctx.body());
            ScheduleItem updatedItem = ctx.bodyAsClass(ScheduleItem.class);
            System.out.println("Update - Parsed item: " + updatedItem);

            // Validate the item
            if (updatedItem.getTitle() == null || updatedItem.getTitle().trim().isEmpty()) {
                ctx.status(400).result("Title is required");
                return;
            }

            if (updatedItem.getStartTime() == null || updatedItem.getEndTime() == null) {
                ctx.status(400).result("Start time and end time are required");
                return;
            }

            updatedItem.setId(id);
            scheduleItems.put(id, updatedItem);
            ctx.json(updatedItem);
        } catch (NumberFormatException e) {
            ctx.status(400).result("Invalid ID format");
        } catch (DateTimeParseException e) {
            ctx.status(400).result("Invalid date format: " + e.getMessage());
            e.printStackTrace();
        } catch (Exception e) {
            ctx.status(500).result("Error updating item: " + e.getMessage());
            e.printStackTrace();
        }
    }

    private static void deleteItem(Context ctx) {
        try {
            Long id = Long.parseLong(ctx.pathParam("id"));
            if (scheduleItems.remove(id) != null) {
                ctx.status(204);
            } else {
                ctx.status(404).result("Schedule item not found");
            }
        } catch (NumberFormatException e) {
            ctx.status(400).result("Invalid ID format");
        } catch (Exception e) {
            ctx.status(500).result("Error deleting item: " + e.getMessage());
            e.printStackTrace();
        }
    }

    private static void addScheduleItem(ScheduleItem item) {
        if (item.getId() == null) {
            item.setId(idCounter++);
        }
        scheduleItems.put(item.getId(), item);
    }
}