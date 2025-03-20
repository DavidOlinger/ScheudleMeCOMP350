import com.google.gson.*;
import java.lang.reflect.Type;

/**
 * Custom deserializer for Event objects to properly handle Course subclasses.
 */
public class EventDeserializer implements JsonDeserializer<Event> {
    @Override
    public Event deserialize(JsonElement json, Type typeOfT, JsonDeserializationContext context) throws JsonParseException {
        JsonObject jsonObject = json.getAsJsonObject();
        
        // Check if this is a Course object by testing for Course-specific properties
        if (jsonObject.has("courseCode") && jsonObject.has("subject")) {
            // This is a Course object
            return context.deserialize(json, Course.class);
        } 
        // Add other event type checks here if needed
        
        // Default case - just a regular Event
        return context.deserialize(json, Event.class);
    }
}