import java.util.ArrayList;


public class Course extends Event {
    public int refNumber;
    public Professor professor;
    public ArrayList<Course> prerequisites;
    public String description;

    Course(String name, String days, TimeSlot time, int refNum, Professor prof, ArrayList<Course> prereqs, String desc){
        // add superclass init
        super(name, days, time);
        refNumber = refNum;
        professor = prof;
        prerequisites = prereqs;
        description = desc;
    }


    @Override
    public String toString(){
        return super.toString() + "\nRef Number: " + refNumber + "\nProfessor: "
                + professor + "\nPrerequisites: " + prerequisites + "\nDescription: " + description;
    }

}
