package newSite.core;

import com.google.gson.Gson;

import java.io.FileReader;
import java.util.*;

public class Main {

    private static Set<Course> courseDatabase;

    // Wrapper class to represent the root JSON object
    private static class CourseList {
        List<CourseData> classes; // List of courses in the JSON
    }

    // Class to represent a single course in the JSON
    private static class CourseData {
        int credits;
        List<String> faculty;
        boolean is_lab;
        boolean is_open;
        String location;
        String name;
        int number;
        int open_seats;
        String section;
        String semester;
        String subject;
        List<TimeSlotData> times;
        int total_seats;
    }

    // Class to represent a time slot in the JSON
    private static class TimeSlotData {
        String day;
        String start_time;
        String end_time;
    }

    /**
     * Reads the JSON file and converts it into a Set of newSite.core.Course objects.
     *
     * @param filePath Path to the JSON file.
     * @return A Set of newSite.core.Course objects.
     */
    public static Set<Course> loadCourseDatabase(String filePath) {
        Set<Course> courseDatabase = new HashSet<>();
        Gson gson = new Gson();

        // System.out.println("Attempting to load course database from: " + filePath);

        try (FileReader reader = new FileReader(filePath)) {
            // Step 1: Deserialize the JSON file into a CourseList object
            // System.out.println("Parsing JSON file...");
            CourseList courseList = gson.fromJson(reader, CourseList.class);

            if (courseList == null || courseList.classes == null) {
                // System.out.println("Error: JSON file is empty or malformed.");
                return courseDatabase;
            }

            // System.out.println("Found " + courseList.classes.size() + " courses in the JSON file.");

            // Step 2: Loop through each course in the JSON and convert it to a newSite.core.Course object
            for (CourseData courseData : courseList.classes) {
                // System.out.println("\nProcessing course: " + courseData.name);

                // Step 3: Create a newSite.core.Professor object (assuming the first faculty member is the primary professor)
                if (courseData.faculty == null || courseData.faculty.isEmpty()) {
                    // System.out.println("Warning: No faculty listed for course: " + courseData.name);
                    continue; // Skip this course if no faculty is listed
                }
                Professor professor = new Professor(courseData.faculty.get(0));
                // System.out.println("newSite.core.Professor: " + professor.name);

                // Step 4: Create newSite.core.TimeSlot objects for the course
                Set<TimeSlot> timeSlots = new HashSet<>();
                if (courseData.times != null && !courseData.times.isEmpty()) {
                    for (TimeSlotData timeData : courseData.times) {
                        // System.out.println("Adding time slot: " + timeData.day + " " + timeData.start_time + "-" + timeData.end_time);
                        TimeSlot timeSlot = new TimeSlot(timeData.start_time, timeData.end_time);
                        timeSlots.add(timeSlot);
                    }
                } else {
                    // System.out.println("Warning: No time slots listed for course: " + courseData.name);
                }

                // Step 5: Combine days from all time slots (e.g., "MWF" or "TR")
                StringBuilder daysBuilder = new StringBuilder();
                if (courseData.times != null) {
                    for (TimeSlotData timeData : courseData.times) {
                        daysBuilder.append(timeData.day);
                    }
                }
                String days = daysBuilder.toString();
                // System.out.println("Days: " + days);

                // Step 6: Create a newSite.core.Course object
                if (timeSlots.isEmpty()) {
                    // System.out.println("Warning: Skipping course due to missing time slots: " + courseData.name);
                    continue; // Skip this course if no time slots are available
                }

                Course course = new Course(
                        courseData.name,
                        timeSlots.iterator().next(), // Use the first time slot for simplicity
                        days,
                        professor,
                        courseData.number,
                        courseData.semester,
                        courseData.location,
                        courseData.section.charAt(0), // Convert section to char
                        courseData.subject,
                        courseData.credits
                );

                // Step 7: Add the course to the database
                // System.out.println("Created course: " + course.name);
                courseDatabase.add(course);
            }
        } catch (Exception e) {
            // System.out.println("Error loading course database: " + e.getMessage());
            e.printStackTrace();
        }

        // System.out.println("\nFinished loading course database. Total courses: " + courseDatabase.size());
        return courseDatabase;
    }

    /**
     * Provides access to the course database for other classes.
     */
    public static Set<Course> getCourseDatabase() {
        return courseDatabase;
    }

    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        String filePath = "data_wolfe.json";

        // Initialize components
        Search search = new Search();
        ScheduleManager scheduleManager = new ScheduleManager();
        CalendarView calendarView = new CalendarView();
        courseDatabase = loadCourseDatabase(filePath);

        // Connect the components
        search.courseDatabase = courseDatabase;

        // Login/Registration menu
        boolean validLoginChoice = false;
        String loginChoice = "";

        while (!validLoginChoice) {
            System.out.println("Welcome to newSite.core.Course Scheduler!");
            System.out.println("1. Login");
            System.out.println("2. Create new account");
            System.out.print("Enter choice (1-2): ");

            loginChoice = scanner.nextLine();

            if (loginChoice.equals("1") || loginChoice.equals("2")) {
                validLoginChoice = true;
            } else {
                System.out.println("Invalid choice. Please enter 1 or 2.");
            }
        }

        switch (loginChoice) {
            case "1":
                boolean loginSuccessful = false;
                while (!loginSuccessful) {
                    // Login existing user
                    System.out.print("Enter username: ");
                    String loginUsername = scanner.nextLine();
                    System.out.print("Enter password: ");
                    String loginPassword = scanner.nextLine();

                    scheduleManager.user = User.loadUserData(loginUsername);
                    if (scheduleManager.user == null) {
                        System.out.println("newSite.core.User does not exist.");
                        System.out.print("Would you like to create a new account? (y/n): ");
                        String createAccount = scanner.nextLine().toLowerCase();

                        if (createAccount.equals("y")) {
                            System.out.print("Enter new username: ");
                            String newUsername = scanner.nextLine();
                            System.out.print("Enter new password: ");
                            String newPassword = scanner.nextLine();

                            scheduleManager.user = User.addUser(newUsername, newPassword);
                            if (scheduleManager.user == null) {
                                System.out.println("Failed to create user account. Please try again.");
                                continue;
                            }
                            System.out.println("Account created successfully!");
                            loginSuccessful = true;
                        } else {
                            System.out.println("Returning to login screen...");
                            continue;
                        }
                    } else if (!scheduleManager.user.checkPassword(loginPassword)) {
                        System.out.println("Incorrect password. Please try again.");
                        continue;
                    } else {
                        System.out.println("Login successful!");
                        loginSuccessful = true;
                    }
                }
                break;

            case "2":
                // Create new account
                System.out.print("Enter new username: ");
                String newUsername = scanner.nextLine();
                System.out.print("Enter new password: ");
                String newPassword = scanner.nextLine();

                scheduleManager.user = User.addUser(newUsername, newPassword);
                if (scheduleManager.user == null) {
                    System.out.println("Failed to create user account. Exiting...");
                    return;
                }
                System.out.println("Account created successfully!");
                break;

            default:
                System.out.println("Invalid choice. Exiting...");
                return;
        }

        // After successful login, check for existing schedules
        String scheduleName;
        AES encryptor = AES.getInstance();
        if (scheduleManager.user.mySchedules != null && !scheduleManager.user.mySchedules.isEmpty()) {
            boolean validScheduleChoice = false;
            String scheduleChoice = "";

            while (!validScheduleChoice) {
                System.out.println("\nYou have existing schedules. Would you like to:");
                System.out.println("1. Load existing schedule");
                System.out.println("2. Create new schedule");
                System.out.print("Choice (1-2): ");

                scheduleChoice = scanner.nextLine();

                if (scheduleChoice.equals("1") || scheduleChoice.equals("2")) {
                    validScheduleChoice = true;
                } else {
                    System.out.println("Invalid choice. Please enter 1 or 2.");
                }
            }

            if (scheduleChoice.equals("1")) {
                System.out.println("\nAvailable schedules:");
                int i = 1;
                String[] scheduleArray = scheduleManager.user.mySchedules.toArray(new String[0]);
                for (String schedule : scheduleArray) {
                    // Extract schedule name from path
                    String name = schedule.substring(schedule.lastIndexOf("/") + 1, schedule.lastIndexOf("."));
                    System.out.println(i++ + ". " + name);
                }

                int choice = -1;
                boolean validChoice = false;

                while (!validChoice) {
                    System.out.print("Enter number (1-" + scheduleArray.length + "): ");
                    String choiceInput = scanner.nextLine();

                    try {
                        choice = Integer.parseInt(choiceInput);
                        if (choice > 0 && choice <= scheduleArray.length) {
                            validChoice = true;
                        } else {
                            System.out.println("Number out of range. Please enter a number between 1 and " + scheduleArray.length + ".");
                        }
                    } catch (NumberFormatException e) {
                        System.out.println("Invalid input. Please enter a number.");
                    }
                }

                String selectedSchedule = scheduleArray[choice - 1];
                // Extract schedule name from path
                scheduleName = selectedSchedule.substring(selectedSchedule.lastIndexOf("/") + 1, selectedSchedule.lastIndexOf("."));
                // Load the schedule once and store the result
                Schedule loadedSchedule = scheduleManager.loadSchedule(scheduleName);

                // Decrypt Schedule

                // System.out.println("Loaded schedule: " + loadedSchedule.events);

                // Initialize the undo/redo history after loading a schedule
                scheduleManager.initializeUndoRedoAfterLoad();

                // Update the calendar view with the loaded schedule
                calendarView.setSchedule(scheduleManager.getCurrentSchedule());

                // Display the loaded schedule immediately
                System.out.println("\nLoaded newSite.core.Schedule:");
                calendarView.display();
            } else {
                System.out.print("Enter new schedule name: ");
                scheduleName = scanner.nextLine();
                scheduleManager.newSchedule(scheduleName);

                // Initialize the undo/redo history after creating a new schedule
                scheduleManager.initializeUndoRedoAfterLoad();

                // Update calendar view with the new empty schedule
                calendarView.setSchedule(scheduleManager.getCurrentSchedule());
            }
        } else {
            System.out.println("\nNo existing schedules found. Creating new schedule...");
            System.out.print("Enter new schedule name: ");
            scheduleName = scanner.nextLine();
            scheduleManager.newSchedule(scheduleName);

            // Initialize the undo/redo history after creating a new schedule
            scheduleManager.initializeUndoRedoAfterLoad();

            // Update calendar view with the new empty schedule
            calendarView.setSchedule(scheduleManager.getCurrentSchedule());
        }
        // When initializing the Logger (in Main class)
        Logger logger = new Logger(scheduleManager.user.name, scheduleName, scheduleManager);

        // newSite.core.Main program loop
        while (true) {
            // Ensure the calendar view has the latest schedule
            calendarView.setSchedule(scheduleManager.getCurrentSchedule());

            boolean validMenuChoice = false;
            String choice = "";

            do {
                System.out.println("\nMenu Options:");
                System.out.println("1. newSite.core.Search for courses");
                System.out.println("2. Add course to schedule");
                System.out.println("3. Remove course from schedule");
                System.out.println("4. Save schedule");

                // Check if there are changes to undo/redo
                // Make sure the stacks are initialized before checking
                if (scheduleManager.editHistory == null) {
                    scheduleManager.editHistory = new Stack<>();
                }
                if (scheduleManager.undoneHistory == null) {
                    scheduleManager.undoneHistory = new Stack<>();
                }

                // Only show undo if we have more than one state in the history
                // (first state is the initial loaded/created state)
                boolean canUndo = scheduleManager.editHistory != null &&
                        scheduleManager.editHistory.size() > 1;
                boolean canRedo = scheduleManager.undoneHistory != null &&
                        !scheduleManager.undoneHistory.isEmpty();

                int menuOffset = 0;
                if (canUndo) {
                    menuOffset++;
                    System.out.println("5. Undo last change");
                }
                if (canRedo) {
                    menuOffset++;
                    System.out.println((5 + (canUndo ? 1 : 0)) + ". Redo last change");
                }

                System.out.println((5 + menuOffset) + ". Exit");
                System.out.print("Enter choice (1-" + (5 + menuOffset) + "): ");

                choice = scanner.nextLine();

                // Validate menu choice
                int maxOption = 5 + menuOffset;
                try {
                    int choiceNum = Integer.parseInt(choice);
                    if (choiceNum >= 1 && choiceNum <= maxOption) {
                        validMenuChoice = true;
                    } else {
                        System.out.println("Invalid choice. Please enter a number between 1 and " + maxOption + ".");
                    }
                } catch (NumberFormatException e) {
                    System.out.println("Invalid input. Please enter a number between 1 and " + maxOption + ".");
                }
            } while (!validMenuChoice);

            // Convert choice to integer for easier comparison
            int choiceNum = Integer.parseInt(choice);

            // Base menu options
            if (choiceNum == 1) {
                // newSite.core.Search for courses
                boolean filtering = true;
                Set<String> subjectFilter = new HashSet<>();
                Set<String> daysFilter = new HashSet<>();
                Set<TimeSlot> timeFilter = new HashSet<>();
                String query = ""; // Initialize query string

                while (filtering) {
                    String filterChoice = "";
                    boolean validFilterChoice = false;

                    while (!validFilterChoice) {
                        System.out.println("\nnewSite.core.Search and newSite.core.Filter Menu:");
                        System.out.println("1. Enter search query");
                        System.out.println("2. newSite.core.Filter by subject");
                        System.out.println("3. newSite.core.Filter by days (MWF/TR)");
                        System.out.println("4. newSite.core.Filter by time range");
                        System.out.println("5. Clear all filters");
                        System.out.println("6. Execute search");
                        System.out.println("7. Cancel");
                        System.out.print("Enter choice (1-7): ");

                        filterChoice = scanner.nextLine();

                        if (filterChoice.matches("[1-7]")) {
                            validFilterChoice = true;
                        } else {
                            System.out.println("Invalid choice. Please enter a number between 1 and 7.");
                        }
                    }

                    switch (filterChoice) {
                        case "1":
                            System.out.print("Enter search query: ");
                            query = scanner.nextLine();
                            // Only perform the search query without displaying results
                            search.searchQuery(query);
                            System.out.println("newSite.core.Search query added. Select option 6 to execute the search.");
                            break;

                        case "2":
                            System.out.print("Enter subject code (e.g., MATH, COMP): ");
                            String subject = scanner.nextLine().toUpperCase();
                            subjectFilter.add(subject);
                            System.out.println("Added subject filter: " + subject);
                            break;

                        case "3":
                            System.out.print("Enter days pattern (MWF or TR): ");
                            String days = scanner.nextLine().toUpperCase();
                            daysFilter.add(days);
                            System.out.println("Added days filter: " + days);
                            break;

                        case "4":
                            boolean validTimeFormat = false;
                            String startTime = "";
                            String endTime = "";

                            while (!validTimeFormat) {
                                System.out.print("Enter start time (HH:mm): ");
                                startTime = scanner.nextLine();

                                if (startTime.matches("^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$")) {
                                    validTimeFormat = true;
                                } else {
                                    System.out.println("Invalid time format. Please use HH:mm format (e.g., 09:30).");
                                }
                            }

                            validTimeFormat = false;
                            while (!validTimeFormat) {
                                System.out.print("Enter end time (HH:mm): ");
                                endTime = scanner.nextLine();

                                if (endTime.matches("^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$")) {
                                    validTimeFormat = true;
                                } else {
                                    System.out.println("Invalid time format. Please use HH:mm format (e.g., 09:30).");
                                }
                            }

                            timeFilter.add(new TimeSlot(startTime + ":00", endTime + ":00"));
                            System.out.println("Added time filter: " + startTime + " - " + endTime);
                            break;

                        case "5":
                            subjectFilter.clear();
                            daysFilter.clear();
                            timeFilter.clear();
                            System.out.println("All filters cleared");
                            break;

                        case "6":
                            filtering = false;
                            // Apply filters only if we have search results
                            if (search.filteredResultsList != null && !search.filteredResultsList.isEmpty()) {
                                if (!subjectFilter.isEmpty()) {
                                    search.filteredResultsList.removeIf(course ->
                                            !subjectFilter.contains(course.subject));
                                }
                                if (!daysFilter.isEmpty()) {
                                    search.filteredResultsList.removeIf(course ->
                                            !daysFilter.contains(course.days));
                                }
                                if (!timeFilter.isEmpty()) {
                                    search.filteredResultsList.removeIf(course -> {
                                        for (TimeSlot filter : timeFilter) {
                                            if (course.time.startTime >= filter.startTime &&
                                                    course.time.endTime <= filter.endTime) {
                                                return false;
                                            }
                                        }
                                        return true;
                                    });
                                }
                            }

                            // Display search results using the displaySearchResults method
                            System.out.println("\nnewSite.core.Search Results:\n");
                            search.displaySearchResults(query, search.filteredResultsList);

                            // Display current schedule
                            System.out.println("\nCurrent newSite.core.Schedule:");
                            calendarView.display();
                            break;

                        case "7":
                            filtering = false;
                            break;

                        default:
                            System.out.println("Invalid choice. Please try again.");
                    }
                }
            } else if (choiceNum == 2) {
                // Add course to schedule
                if (search.filteredResultsList == null || search.filteredResultsList.isEmpty()) {
                    System.out.println("Please search for courses first.");
                    continue;
                }

                System.out.println("\nAvailable courses from search results:");
                int i = 1;
                for (Course course : search.filteredResultsList) {
                    System.out.printf("%d. %s (%s %d) - %s %s - Prof. %s\n",
                            i++,
                            course.name,
                            course.subject,
                            course.courseCode,
                            course.days,
                            course.time.toString(),
                            course.professor.name);
                }

                int courseNum = -1;
                boolean validCourseNum = false;

                while (!validCourseNum) {
                    System.out.print("Enter course number to add (or 0 to cancel): ");
                    String courseNumInput = scanner.nextLine();

                    try {
                        courseNum = Integer.parseInt(courseNumInput);
                        if (courseNum >= 0 && courseNum <= search.filteredResultsList.size()) {
                            validCourseNum = true;
                        } else {
                            System.out.println("Number out of range. Please enter a number between 0 and " +
                                    search.filteredResultsList.size() + ".");
                        }
                    } catch (NumberFormatException e) {
                        System.out.println("Invalid input. Please enter a number.");
                    }
                }

                if (courseNum > 0) {
                    Course selectedCourse = (Course) search.filteredResultsList.toArray()[courseNum - 1];

                    // Check for conflicts before adding
                    Event conflictingEvent = null;
                    for (Event event : scheduleManager.getCurrentSchedule().events) {
                        if (event instanceof Course existingCourse) {
                            if (selectedCourse.ConflictsWith(existingCourse)) {
                                conflictingEvent = existingCourse;
                                break;
                            }
                        }
                    }

                    if (conflictingEvent != null) {
                        Course conflictingCourse = (Course) conflictingEvent;
                        System.out.println("\nConflict detected!");
                        System.out.printf("newSite.core.Course 1: %s (%s %d) - %s %s\n",
                                selectedCourse.name, selectedCourse.subject,
                                selectedCourse.courseCode, selectedCourse.days,
                                selectedCourse.time.toString());
                        System.out.printf("newSite.core.Course 2: %s (%s %d) - %s %s\n",
                                conflictingCourse.name, conflictingCourse.subject,
                                conflictingCourse.courseCode, conflictingCourse.days,
                                conflictingCourse.time.toString());

                        boolean validConflictChoice = false;
                        String conflictChoice = "";

                        while (!validConflictChoice) {
                            System.out.println("\nWhich course would you like to keep?");
                            System.out.printf("1. %s (new course)\n", selectedCourse.name);
                            System.out.printf("2. %s (existing course)\n", conflictingCourse.name);
                            System.out.print("Enter choice (1-2): ");

                            conflictChoice = scanner.nextLine();

                            if (conflictChoice.equals("1") || conflictChoice.equals("2")) {
                                validConflictChoice = true;
                            } else {
                                System.out.println("Invalid choice. Please enter 1 or 2.");
                            }
                        }

                        if (conflictChoice.equals("1")) {
                            scheduleManager.remEvent(conflictingEvent);
                            scheduleManager.addEvent(selectedCourse);
                            System.out.printf("Removed %s and added %s.\n", conflictingCourse.name, selectedCourse.name);
                        } else {
                            System.out.printf("Keeping %s.\n", conflictingCourse.name);
                        }
                    } else {
                        scheduleManager.addEvent(selectedCourse);
                        System.out.println("newSite.core.Course added successfully!");

                        // logs the course being added
                        if (!scheduleManager.addEvent(selectedCourse)) {
                            logger.logCourseAddition(selectedCourse);
                        }
                    }

                    // Update the calendar view with the modified schedule
                    calendarView.setSchedule(scheduleManager.getCurrentSchedule());

                    // Display updated schedule
                    System.out.println("\nUpdated newSite.core.Schedule:");
                    calendarView.display();
                }
            } else if (choiceNum == 3) {
                // Remove course from schedule
                if (scheduleManager.getCurrentSchedule() == null ||
                        scheduleManager.getCurrentSchedule().events == null ||
                        scheduleManager.getCurrentSchedule().events.isEmpty()) {
                    System.out.println("No courses in current schedule.");
                    continue;
                }

                System.out.println("\nCurrent schedule courses:");
                int i = 1;
                for (Event event : scheduleManager.getCurrentSchedule().events) {
                    if (event instanceof Course course) {
                        System.out.printf("%d. %s (%s %d) - Prof. %s\n",
                                i++,
                                course.name,
                                course.subject,
                                course.courseCode,
                                course.professor.name);
                    }
                }

                int courseNum = -1;
                boolean validCourseNum = false;

                while (!validCourseNum) {
                    System.out.print("Enter course number to remove (or 0 to cancel): ");
                    String courseNumInput = scanner.nextLine();

                    try {
                        courseNum = Integer.parseInt(courseNumInput);
                        if (courseNum >= 0 && courseNum <= scheduleManager.getCurrentSchedule().events.size()) {
                            validCourseNum = true;
                        } else {
                            System.out.println("Number out of range. Please enter a number between 0 and " +
                                    scheduleManager.getCurrentSchedule().events.size() + ".");
                        }
                    } catch (NumberFormatException e) {
                        System.out.println("Invalid input. Please enter a number.");
                    }
                }

                if (courseNum > 0) {
                    Event eventToRemove = (Event) scheduleManager.getCurrentSchedule().events.toArray()[courseNum - 1];
                    scheduleManager.remEvent(eventToRemove);

                    // logs the course removal
                    if (eventToRemove instanceof Course) {
                        logger.logCourseRemoval((Course)eventToRemove);
                    }

                    System.out.println("newSite.core.Course removed successfully!");

                    // Update the calendar view with the modified schedule
                    calendarView.setSchedule(scheduleManager.getCurrentSchedule());

                    // Display updated schedule
                    System.out.println("\nUpdated newSite.core.Schedule:");
                    calendarView.display();
                }
            } else if (choiceNum == 4) {
                // Save schedule
                if (scheduleManager.getCurrentSchedule() != null) {
                    scheduleManager.user.saveSchedule(scheduleManager.getCurrentSchedule());
                    System.out.println("newSite.core.Schedule saved successfully!");
                } else {
                    System.out.println("No schedule to save.");
                }
            } else {
                // Handle undo/redo options or exit
                // Only consider undo available if we have more than one state in history
                boolean canUndo = scheduleManager.editHistory != null &&
                        scheduleManager.editHistory.size() > 1;
                boolean canRedo = scheduleManager.undoneHistory != null &&
                        !scheduleManager.undoneHistory.isEmpty();

                // Calculate the position of menu options based on available undo/redo
                int undoPosition = 5;
                int redoPosition = undoPosition + (canUndo ? 1 : 0);
                int exitPosition = 5 + (canUndo ? 1 : 0) + (canRedo ? 1 : 0);

                if (canUndo && choiceNum == undoPosition) {
                    // Undo
                    scheduleManager.undo();
                    // Update calendar view after undo
                    calendarView.setSchedule(scheduleManager.getCurrentSchedule());
                    System.out.println("\nUndo successful! Updated newSite.core.Schedule:");
                    calendarView.display();
                } else if (canRedo && choiceNum == redoPosition) {
                    // Redo
                    scheduleManager.redo();
                    // Update calendar view after redo
                    calendarView.setSchedule(scheduleManager.getCurrentSchedule());
                    System.out.println("\nRedo successful! Updated newSite.core.Schedule:");
                    calendarView.display();
                } else if (choiceNum == exitPosition) {
                    // Exit
                    System.out.println("Goodbye!");
                    // encrypt Schedule
                    scanner.close();
                    return;
                }
            }
        }
    }
}