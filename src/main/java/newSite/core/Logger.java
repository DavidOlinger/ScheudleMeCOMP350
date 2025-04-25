package newSite.core;

import java.io.*;
import java.text.SimpleDateFormat;
import java.util.*;

public class Logger {
    private static final String LOG_DIRECTORY = "logs/";
    private static final SimpleDateFormat DATE_FORMAT = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
    private static final SimpleDateFormat FILE_DATE_FORMAT = new SimpleDateFormat("yyyyMMdd");

    private String username;
    private String scheduleName;
    private List<LogEntry> logEntries;
    private String logFilePath;
    private ScheduleManager scheduleManager;

    public Logger(String username, String scheduleName, ScheduleManager scheduleManager) {
        this.username = username;
        this.scheduleName = scheduleName;
        this.scheduleManager = scheduleManager;
        this.logEntries = new ArrayList<>();
        this.logFilePath = getLogFilename();
        ensureLogDirectoryExists();
        initializeLogFile();
    }

    private void ensureLogDirectoryExists() {
        File directory = new File(LOG_DIRECTORY);
        if (!directory.exists()) {
            directory.mkdir();
        }
    }

    private void initializeLogFile() {
        try (PrintWriter out = new PrintWriter(new FileWriter(logFilePath, true))) {
            out.println("Schedule Log for: " + username + " - " + scheduleName);
            out.println("Created: " + DATE_FORMAT.format(new Date()));
            out.println("Format: timestamp|action|subject|courseCode|section|semester|professor");
            out.println("--------------------------------------------------");
        } catch (IOException e) {
            System.err.println("Error initializing log file: " + e.getMessage());
        }
    }

    public void logCourseAddition(Course course) {
        String timestamp = DATE_FORMAT.format(new Date());
        LogEntry entry = new LogEntry(timestamp, "ADD", course);
        logEntries.add(entry);
        saveLogEntryToFile(entry);
    }

    public void logCourseRemoval(Course course) {
        String timestamp = DATE_FORMAT.format(new Date());
        LogEntry entry = new LogEntry(timestamp, "REMOVE", course);
        logEntries.add(entry);
        saveLogEntryToFile(entry);
    }

    private String getLogFilename() {
        return LOG_DIRECTORY + username + "_" + scheduleName + "_" +
                FILE_DATE_FORMAT.format(new Date()) + ".log";
    }

    private void saveLogEntryToFile(LogEntry entry) {
        try (PrintWriter out = new PrintWriter(new FileWriter(logFilePath, true))) {
            out.println(entry.toString());
        } catch (IOException e) {
            System.err.println("Error writing to log file: " + e.getMessage());
        }
    }

    public Schedule rebuildScheduleFromLog() {
        String latestLogFile = findLatestLogFile();
        if (latestLogFile == null) {
            return null;
        }

        // Create a new empty schedule
        Schedule rebuiltSchedule = new Schedule();
        rebuiltSchedule.name = this.scheduleName;
        rebuiltSchedule.events = new HashSet<>();

        try (BufferedReader reader = new BufferedReader(new FileReader(latestLogFile))) {
            String line;
            // Skip header lines
            while ((line = reader.readLine()) != null && !line.startsWith("----"));

            while ((line = reader.readLine()) != null) {
                LogEntry entry = LogEntry.fromString(line, scheduleManager.getCurrentSchedule().events);
                if (entry != null) {
                    if (entry.getAction().equals("ADD")) {
                        // Use ScheduleManager's addEvent which handles conflicts
                        scheduleManager.addEvent(entry.getCourse());
                    } else if (entry.getAction().equals("REMOVE")) {
                        // Use ScheduleManager's remEvent
                        scheduleManager.remEvent(entry.getCourse());
                    }
                }
            }
        } catch (IOException e) {
            System.err.println("Error reading log file: " + e.getMessage());
            return null;
        }
        return rebuiltSchedule;
    }

    private String findLatestLogFile() {
        File logDir = new File(LOG_DIRECTORY);
        File[] logFiles = logDir.listFiles((dir, name) ->
                name.startsWith(username + "_" + scheduleName + "_") && name.endsWith(".log"));

        if (logFiles == null || logFiles.length == 0) {
            return null;
        }

        // Sort by last modified date to get the most recent
        Arrays.sort(logFiles, (f1, f2) -> Long.compare(f2.lastModified(), f1.lastModified()));
        return logFiles[0].getPath();
    }

    private static class LogEntry {
        private String timestamp;
        private String action;
        private Course course;

        public LogEntry(String timestamp, String action, Course course) {
            this.timestamp = timestamp;
            this.action = action;
            this.course = course;
        }

        public String getTimestamp() {
            return timestamp;
        }

        public String getAction() {
            return action;
        }

        public Course getCourse() {
            return course;
        }

        @Override
        public String toString() {
            return timestamp + "|" + action + "|" +
                    course.subject + "|" + course.courseCode + "|" +
                    course.section + "|" + course.semester + "|" +
                    course.professor.name;
        }

        public static LogEntry fromString(String logLine, Set<Event> events) {
            String[] parts = logLine.split("\\|");
            if (parts.length != 7) {
                return null;
            }

            String subject = parts[2];
            int courseCode = Integer.parseInt(parts[3]);
            char section = parts[4].charAt(0);
            String semester = parts[5];
            String professorName = parts[6];

            // Find the matching course in the current events
            for (Event event : events) {
                if (event instanceof Course) {
                    Course course = (Course) event;
                    if (course.subject.equals(subject) &&
                            course.courseCode == courseCode &&
                            course.section == section &&
                            course.semester.equals(semester) &&
                            course.professor.name.equals(professorName)) {
                        return new LogEntry(parts[0], parts[1], course);
                    }
                }
            }

            return null;
        }
    }
}