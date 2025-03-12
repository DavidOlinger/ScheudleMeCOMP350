import java.util.ArrayList;
import java.util.Set;


public class Search {
    public String query;
    public Filter filter;
    public ArrayList<Course> resultsList;
    public ArrayList<Course> filteredResultsList;
    private Set<Professor> professors;


    public Search() {
        this.resultsList = new ArrayList<>();
        this.filteredResultsList = new ArrayList<>();
    }


    public void SearchQ(String query) {
        // Perform search operation
        this.query = query;
        filteredResultsList.clear();

        // Loop through all available courses
        for (Course course : resultsList) {
            if (Integer.toString(course.refNumber).equals(query)) {
                filteredResultsList.add(course);
            }
            else if(course.description.toLowerCase().contains(query.toLowerCase())){
                filteredResultsList.add(course);
            }
        }

        if (filteredResultsList.isEmpty()) {
            System.out.println("No courses found matching: " + query);
        } else {
            System.out.println("Courses matching '" + query + "':");
            for (Course course : filteredResultsList) {
                String professorName = (course.professor != null) ? course.professor.name : "Unknown";
                System.out.println("- " + course.refNumber + ": " + course.description + " (Professor: " + professorName + ")");
            }
        }


    }






    public void ModifyTimeFilter() {
        // Modify search time filter
    }

    public void ModifyDayFilter() {
        // Modify search day filter
    }

    public void ResetFilters() {
        // Reset search filters
    }
}