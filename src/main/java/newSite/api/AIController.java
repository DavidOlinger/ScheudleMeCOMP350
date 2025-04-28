package newSite.api;

import io.javalin.Javalin;
import io.javalin.http.Context;
import newSite.core.Event;
import newSite.core.Schedule;
import newSite.core.ScheduleManager;
import newSite.ScheduleMeApp; // For ErrorResponse

import com.google.gson.Gson; // Reuse Gson from ScheduleMeApp if possible
import com.google.gson.GsonBuilder;
import com.google.gson.JsonObject; // To build JSON request body
import com.google.gson.JsonSyntaxException;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.net.http.HttpTimeoutException;
import java.time.Duration;
import java.util.stream.Collectors;

public class AIController {

    // Define the Python agent's URL (ensure port matches app.py)
    private static final String PYTHON_AGENT_URL = "http://localhost:5001/ask";
    private static final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10)) // Connection timeout
            .build();
    // Use a shared Gson instance if possible, otherwise create one
    private static final Gson gson = new GsonBuilder().create();

    // Inner class for the request body expected by this controller
    public static class AiQuestionRequest {
        public String question;
    }

    public static void registerEndpoints(Javalin app, ScheduleManager scheduleManager) {
        app.post("/api/ai/ask", ctx -> handleAiAsk(ctx, scheduleManager));
    }

    private static void handleAiAsk(Context ctx, ScheduleManager scheduleManager) {
        System.out.println(">>> ENTERED AI Ask handler");

        // 1. Check Authentication
        if (scheduleManager.user == null) {
            ctx.status(401).json(new ScheduleMeApp.ErrorResponse("Unauthorized", "User not logged in"));
            return;
        }

        // 2. Get User Question from Request Body
        AiQuestionRequest requestPayload;
        try {
            requestPayload = ctx.bodyAsClass(AiQuestionRequest.class);
            if (requestPayload.question == null || requestPayload.question.trim().isEmpty()) {
                ctx.status(400).json(new ScheduleMeApp.ErrorResponse("Bad Request", "Missing 'question' in request body"));
                return;
            }
        } catch (Exception e) { // Catch potential JsonSyntaxException or others
            System.err.println("AI Ask error - Invalid JSON request body: " + e.getMessage());
            ctx.status(400).json(new ScheduleMeApp.ErrorResponse("Bad Request", "Invalid JSON request body. Expected {\"question\": \"...\"}"));
            return;
        }
        String userQuestion = requestPayload.question.trim();
        System.out.println("AI Ask: Received question: \"" + userQuestion + "\" from user: " + scheduleManager.user.name);


        // 3. Get Current Schedule Context
        Schedule currentSchedule = ScheduleManager.getCurrentSchedule();
        String scheduleContextString = "No active schedule loaded."; // Default context

        if (currentSchedule != null && currentSchedule.events != null && !currentSchedule.events.isEmpty()) {
            // Simple string representation of events (customize as needed)
            scheduleContextString = currentSchedule.events.stream()
                    .map(Event::toString) // Use the Event's toString() or create a custom representation
                    .collect(Collectors.joining("\n- ", "Current schedule ('" + currentSchedule.name + "') contains:\n- ", ""));
            System.out.println("AI Ask: Generated schedule context (first 200 chars): " + scheduleContextString.substring(0, Math.min(200, scheduleContextString.length())));
        } else {
            System.out.println("AI Ask: No active schedule or events found for context.");
        }


        // 4. Prepare Request for Python Agent
        JsonObject pythonRequestBody = new JsonObject();
        pythonRequestBody.addProperty("question", userQuestion);
        pythonRequestBody.addProperty("current_schedule_context", scheduleContextString);

        HttpRequest pythonRequest = HttpRequest.newBuilder()
                .uri(URI.create(PYTHON_AGENT_URL))
                .timeout(Duration.ofSeconds(60)) // Timeout for the AI response itself
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(gson.toJson(pythonRequestBody)))
                .build();

        // 5. Send Request to Python Agent and Handle Response
        try {
            System.out.println("AI Ask: Sending request to Python agent at " + PYTHON_AGENT_URL);
            HttpResponse<String> pythonResponse = httpClient.send(pythonRequest, HttpResponse.BodyHandlers.ofString());

            System.out.println("AI Ask: Received response from Python agent. Status: " + pythonResponse.statusCode());

            // Forward the Python agent's response (body and status code)
            ctx.status(pythonResponse.statusCode());
            ctx.contentType("application/json"); // Ensure correct content type
            ctx.result(pythonResponse.body()); // Send the raw JSON body back

        } catch (HttpTimeoutException e) {
            System.err.println("AI Ask error - Timeout connecting to or waiting for Python agent: " + e.getMessage());
            ctx.status(504).json(new ScheduleMeApp.ErrorResponse("Gateway Timeout", "The AI service took too long to respond."));
        } catch (java.io.IOException | InterruptedException e) {
            System.err.println("AI Ask error - Could not connect to Python agent: " + e.getMessage());
            // Distinguish between connection refusal and other IO errors if possible
            if (e instanceof java.net.ConnectException) {
                ctx.status(502).json(new ScheduleMeApp.ErrorResponse("Bad Gateway", "Could not connect to the AI service. Is it running?"));
            } else {
                ctx.status(500).json(new ScheduleMeApp.ErrorResponse("Internal Server Error", "Failed to communicate with the AI service."));
            }
            // Log stack trace for debugging if needed
            // e.printStackTrace();
        } catch (Exception e) { // Catch-all for other unexpected errors
            System.err.println("AI Ask error - Unexpected error during Python agent communication: " + e.getMessage());
            e.printStackTrace();
            ctx.status(500).json(new ScheduleMeApp.ErrorResponse("Internal Server Error", "An unexpected error occurred while contacting the AI service."));
        }
    }
}