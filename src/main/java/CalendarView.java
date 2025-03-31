import java.util.HashSet;
import java.util.Set;

public class CalendarView {
    private static final String[] DAYS = {"M", "T", "W", "R", "F"};
    private static final int START_HOUR = 8;  // 8 AM
    private static final int END_HOUR = 22;   // 10 PM
    private static final int SLOTS_PER_HOUR = 4; // 15-minute slots

    public Schedule schedule;
    private Set<Course> searchResults;

    public CalendarView() {
        this.searchResults = new HashSet<>();
    }

    public void setSchedule(Schedule schedule) {
        this.schedule = schedule;
        // Debug information when setting schedule
        if (schedule != null) {
            // System.out.println("Calendar view received schedule: " + schedule.name);
            // System.out.println("Events in schedule: " + (schedule.events != null ? schedule.events.size() : "null"));
        }
    }

    public void setSearchResults(Set<Course> results) {
        this.searchResults = results;
    }

    public void display() {
        // Print debug info before display
        if (schedule != null && schedule.events != null) {
            System.out.println("Displaying schedule with " + schedule.events.size() + " events");
        }
        
        // Print header with day names
        System.out.printf("%7s |", "Time");
        for (String day : DAYS) {
            System.out.printf(" %-12s |", day);
        }
        System.out.println();
        System.out.println("-".repeat(80));

        // Print time slots in 15-minute increments
        for (int hour = START_HOUR; hour < END_HOUR; hour++) {
            for (int minute = 0; minute < 60; minute += 15) {
                displayTimeSlot(hour, minute);
            }
        }
    }

    private void displayTimeSlot(int hour, int minute) {
        // Format time as HH:MM
        System.out.printf("%02d:%02d |", hour, minute);
        int currentTime = hour * 3600 + minute * 60; // Convert to seconds

        // Display content for each day
        for (String day : DAYS) {
            String content = getSlotContent(day, currentTime);
            System.out.printf(" %-12s |", content);
        }
        System.out.println();
    }

    private String getSlotContent(String day, int currentTime) {
        StringBuilder content = new StringBuilder();

        // Check scheduled courses
        if (schedule != null && schedule.events != null) {
            for (Event event : schedule.events) {
                if (event instanceof Course course) {
                    // Normalize the time values if needed
                    TimeSlot normalizedTime = normalizeTimeSlot(course.time);
                    
                    // Check for time overlap and day match
                    if (isTimeOverlap(normalizedTime, currentTime) && isDayMatch(course.days, day)) {
                        content.append(formatCourseDisplay(course, currentTime));
                    }
                }
            }
        }

        // Check search results
        if (searchResults != null) {
            for (Course course : searchResults) {
                // Normalize the time values if needed
                TimeSlot normalizedTime = normalizeTimeSlot(course.time);
                
                // Check for time overlap and day match
                if (isTimeOverlap(normalizedTime, currentTime) && isDayMatch(course.days, day)) {
                    if (content.length() > 0) {
                        content.append("/");
                    }
                    content.append(formatSearchResultDisplay(course, currentTime));
                }
            }
        }

        return content.length() > 0 ? content.toString() : "----";
    }
    
    /**
     * New method to normalize time slots to ensure they're in seconds format
     */
    private TimeSlot normalizeTimeSlot(TimeSlot timeSlot) {
        // If the time values seem too small (e.g., hours instead of seconds)
        if (timeSlot.startTime < 100 && timeSlot.endTime < 100) {
            return new TimeSlot(timeSlot.startTime * 3600, timeSlot.endTime * 3600);
        }
        // If the time values are already valid seconds
        else if (timeSlot.startTime >= 8 * 3600 && timeSlot.startTime <= 22 * 3600 &&
                 timeSlot.endTime >= 8 * 3600 && timeSlot.endTime <= 22 * 3600) {
            return timeSlot;
        }
        // Default fallback - try to interpret based on range
        else {
            int startInSeconds = convertToSeconds(timeSlot.startTime);
            int endInSeconds = convertToSeconds(timeSlot.endTime);
            return new TimeSlot(startInSeconds, endInSeconds);
        }
    }
    
    /**
     * Helper method to convert time values to seconds if they're not already
     */
    private int convertToSeconds(int time) {
        // If already in valid range (8:00 AM to 10:00 PM in seconds)
        if (time >= 8 * 3600 && time <= 22 * 3600) {
            return time;
        }
        // If in minutes (8:00 AM to 10:00 PM in minutes)
        else if (time >= 8 * 60 && time <= 22 * 60) {
            return time * 60;
        }
        // If in hours (8 to 22)
        else if (time >= 8 && time <= 22) {
            return time * 3600;
        }
        // Default - assume it's some non-standard format and try to fit it in a reasonable range
        else {
            return ((time % 24) + 8) * 3600; // Map to 8:00 AM to next day 8:00 AM
        }
    }
    
    /**
     * Improved method to check if a course is on a specific day
     */
    private boolean isDayMatch(String courseDays, String calendarDay) {
        if (courseDays == null) {
            return false;
        }
        
        // Direct match if the day is mentioned exactly
        if (courseDays.contains(calendarDay)) {
            return true;
        }
        
        // Try alternative formats
        switch (calendarDay) {
            case "M":
                return courseDays.contains("Monday") || courseDays.contains("MON");
            case "T":
                return courseDays.contains("Tuesday") || courseDays.contains("TUE");
            case "W":
                return courseDays.contains("Wednesday") || courseDays.contains("WED");
            case "R":
                return courseDays.contains("Thursday") || courseDays.contains("THU");
            case "F":
                return courseDays.contains("Friday") || courseDays.contains("FRI");
            default:
                return false;
        }
    }

    private boolean isTimeOverlap(TimeSlot timeSlot, int currentTime) {
        // Round the end time for 50-minute classes to nearest 15 minutes
        int endTime = timeSlot.endTime;
        int duration = timeSlot.endTime - timeSlot.startTime;

        // If duration is close to 50 minutes (3000 seconds), round to 45 minutes (2700 seconds)
        if (duration >= 2900 && duration <= 3100) {  // 50 minutes ±100 seconds
            endTime = timeSlot.startTime + 2700;  // 45 minutes in seconds
        }

        // Verify the times are in the expected range
        if (timeSlot.startTime < START_HOUR * 3600 || timeSlot.endTime > END_HOUR * 3600) {
            System.out.println("Warning: Course has out-of-range times: " + 
                formatTimeSeconds(timeSlot.startTime) + " - " + formatTimeSeconds(timeSlot.endTime));
        }

        return currentTime >= timeSlot.startTime && currentTime < endTime;
    }

    private String formatCourseDisplay(Course course, int currentTime) {
        // Normalize time slot for display checks
        TimeSlot normalizedTime = normalizeTimeSlot(course.time);
        
        if (currentTime == normalizedTime.startTime) {
            // Course start - show code
            return String.format("%s%d", course.subject, course.courseCode);
        } else if (currentTime > normalizedTime.startTime && currentTime < normalizedTime.endTime) {
            // Course middle - show continuation
            if ((currentTime - normalizedTime.startTime) % 900 == 0) { // Every 15 minutes
                return "++++";
            } else {
                return "│    ";
            }
        } else if (currentTime == getPreviousSlot(normalizedTime.endTime)) {
            // Course end
            return "++++";
        }
        return "";
    }

    private String formatSearchResultDisplay(Course course, int currentTime) {
        // Normalize time slot for display checks
        TimeSlot normalizedTime = normalizeTimeSlot(course.time);
        
        if (currentTime == normalizedTime.startTime) {
            return String.format("[%s%d]", course.subject, course.courseCode);
        } else if (currentTime > normalizedTime.startTime && currentTime < normalizedTime.endTime) {
            return "[│]";
        } else if (currentTime == getPreviousSlot(normalizedTime.endTime)) {
            return "[─]";
        }
        return "";
    }

    private int getPreviousSlot(int time) {
        // Round down to nearest 15-minute slot
        return time - (time % 900);
    }
    
    /**
     * Helper method to format seconds as HH:MM for debugging
     */
    private String formatTimeSeconds(int seconds) {
        int hours = seconds / 3600;
        int minutes = (seconds % 3600) / 60;
        return String.format("%02d:%02d", hours, minutes);
    }
}