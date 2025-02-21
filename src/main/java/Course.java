import java.util.ArrayList;

public class Course extends Event {
    public int refNumber;
    public Professor professor;
    public ArrayList<Course> prerequisites;
    public String description;

    Course(int refNum, Professor prof, ArrayList<Course> prereqs, String desc){
        refNumber = refNum;
        professor = prof;
        prerequisites = prereqs;
        description = desc;
    }
}
