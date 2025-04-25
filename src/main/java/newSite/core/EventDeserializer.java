package newSite.core; // Ensure this package matches your project structure

import com.google.gson.*;
import java.lang.reflect.Type;

/**
 * Custom Gson Deserializer for Event objects.
 * This deserializer handles the fact that an "event" in the JSON
 * could represent either a generic Event or a more specific Course.
 * It inspects the JSON object to determine which type to create.
 */
public class EventDeserializer implements JsonDeserializer<Event> {

    @Override
    public Event deserialize(JsonElement json, Type typeOfT, JsonDeserializationContext context) throws JsonParseException {
        JsonObject jsonObject = json.getAsJsonObject();

        // --- Check for fields specific to Course ---
        // Check if the JSON object contains fields that uniquely identify it as a Course.
        boolean isCourse = jsonObject.has("courseCode") &&
                jsonObject.has("subject");
        // Add other mandatory Course fields here if needed for disambiguation

        if (isCourse) {
            // --- Deserialize as Course ---
            // If it has Course-specific fields, delegate deserialization to Gson,
            // specifying that the target type is Course.class.
            System.out.println("Deserializing as Course: " + jsonObject.get("name").getAsString()); // Debug log
            try {
                // IMPORTANT: Use Course.class here
                return context.deserialize(jsonObject, Course.class);
            } catch (JsonParseException e) {
                System.err.println("Error deserializing JSON object explicitly as Course: " + jsonObject.toString());
                throw e; // Re-throw the exception
            }

        } else {
            // --- Deserialize as generic Event MANUALLY ---
            // If it doesn't have the specific Course fields, assume it's a generic Event.
            // Manually extract fields to ensure correct object creation.
            System.out.println("Deserializing as generic Event: " + jsonObject.get("name").getAsString()); // Debug log
            try {
                // Extract basic fields directly from the JsonObject
                String name = jsonObject.has("name") ? jsonObject.get("name").getAsString() : "Unnamed Event";
                String days = jsonObject.has("days") ? jsonObject.get("days").getAsString() : "";

                // Manually deserialize the nested TimeSlot object
                TimeSlot time = null;
                if (jsonObject.has("time") && jsonObject.get("time").isJsonObject()) {
                    JsonObject timeObject = jsonObject.getAsJsonObject("time");
                    // Check for expected integer fields within the time object
                    if (timeObject.has("startTime") && timeObject.get("startTime").isJsonPrimitive() &&
                            timeObject.has("endTime") && timeObject.get("endTime").isJsonPrimitive())
                    {
                        int startTimeSeconds = timeObject.get("startTime").getAsInt();
                        int endTimeSeconds = timeObject.get("endTime").getAsInt();
                        // Use the TimeSlot constructor that takes integer seconds
                        time = new TimeSlot(startTimeSeconds, endTimeSeconds);
                    } else {
                        // Log a warning if the time object structure is unexpected
                        System.err.println("Warning: 'time' object missing or has invalid startTime/endTime for event: " + name);
                        // Use a default TimeSlot (e.g., 0 duration) or throw an error
                        time = new TimeSlot(0, 0); // Default empty timeslot
                        // Alternatively, throw:
                        // throw new JsonParseException("Invalid 'time' object structure for event: " + name);
                    }
                } else {
                    // Log a warning if the time field is missing or not an object
                    System.err.println("Warning: Missing or invalid 'time' object for event: " + name);
                    // Use a default TimeSlot or throw an error
                    time = new TimeSlot(0, 0); // Default empty timeslot
                    // Alternatively, throw:
                    // throw new JsonParseException("Missing or invalid 'time' object for event: " + name);
                }

                // Create and return the generic Event object using the extracted values
                return new Event(name, days, time);

            } catch (Exception e) { // Catch broader exceptions during manual parsing (e.g., ClassCastException)
                System.err.println("Error during manual deserialization of generic Event: " + jsonObject.toString());
                // Wrap the original exception for clarity and re-throw as JsonParseException
                throw new JsonParseException("Failed to manually deserialize generic Event", e);
            }
        }
    }
}
