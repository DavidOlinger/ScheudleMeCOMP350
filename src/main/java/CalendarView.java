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
    }

    public void setSearchResults(Set<Course> results) {
        this.searchResults = results;
    }

    public void display() {
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
        if (schedule != null) {
            for (Event event : schedule.events) {
                if (event instanceof Course course) {
                    if (isTimeOverlap(course.time, currentTime) && course.days.contains(day)) {
                        content.append(formatCourseDisplay(course, currentTime));
                    }
                }
            }
        }

        // Check search results
        for (Course course : searchResults) {
            if (isTimeOverlap(course.time, currentTime) && course.days.contains(day)) {
                if (content.length() > 0) {
                    content.append("/");
                }
                content.append(formatSearchResultDisplay(course, currentTime));
            }
        }

        return content.length() > 0 ? content.toString() : "----";
    }

    private boolean isTimeOverlap(TimeSlot timeSlot, int currentTime) {
        // Round the end time for 50-minute classes to nearest 15 minutes
        int endTime = timeSlot.endTime;
        int duration = timeSlot.endTime - timeSlot.startTime;

        // If duration is close to 50 minutes (3000 seconds), round to 45 minutes (2700 seconds)
        if (duration >= 2900 && duration <= 3100) {  // 50 minutes ±100 seconds
            endTime = timeSlot.startTime + 2700;  // 45 minutes in seconds
        }

        return currentTime >= timeSlot.startTime && currentTime < endTime;
    }

    private String formatCourseDisplay(Course course, int currentTime) {
        if (currentTime == course.time.startTime) {
            // Course start - show code
            return String.format("%s%d", course.subject, course.courseCode);
        } else if (currentTime > course.time.startTime && currentTime < course.time.endTime) {
            // Course middle - show continuation
            if ((currentTime - course.time.startTime) % 900 == 0) { // Every 15 minutes
                return "├────";
            } else {
                return "│    ";
            }
        } else if (currentTime == getPreviousSlot(course.time.endTime)) {
            // Course end
            return "└────";
        }
        return "";
    }

    private String formatSearchResultDisplay(Course course, int currentTime) {
        if (currentTime == course.time.startTime) {
            return String.format("[%s%d]", course.subject, course.courseCode);
        } else if (currentTime > course.time.startTime && currentTime < course.time.endTime) {
            return "[│]";
        } else if (currentTime == getPreviousSlot(course.time.endTime)) {
            return "[─]";
        }
        return "";
    }

    private int getPreviousSlot(int time) {
        // Round down to nearest 15-minute slot
        return time - (time % 900);
    }
}