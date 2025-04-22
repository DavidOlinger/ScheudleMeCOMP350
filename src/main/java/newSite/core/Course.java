package newSite.core;


public class Course extends Event {
    //public int refNumber; // json file doesn't include this
    //public ArrayList<newSite.core.Course> prerequisites; // json file doesn't include this
    //public String description; // json file doesn't include this

    public Professor professor;
    public int courseCode;
    public String semester;
    public String location;
    public char section;
    public String subject;
    public int credits;

//    {  THIS IS WHAT THE JSON LOOKS LIKE
//        "credits": 3,
//            "faculty": ["Graybill, Keith B."],
//        "is_lab": false,
//            "is_open": true,
//            "location": "SHAL 316",
//            "name": "PRINCIPLES OF ACCOUNTING I",
//            "number": 201,
//            "open_seats": 1,
//            "section": "A",
//            "semester": "2023_Fall",
//            "subject": "ACCT",
//            "times": [
//        {
//            "day": "T",
//                "end_time": "16:45:00",
//                "start_time": "15:30:00"
//        },
//        {
//            "day": "R",
//                "end_time": "16:45:00",
//                "start_time": "15:30:00"
//        }
//  ],
//        "total_seats": 30
//    }

    Course(String name, TimeSlot time, String days, Professor professor, int coursecode, String semester,
           String location, char section, String subject, int credits){
        super(name, days, time);
        this.professor = professor;
        this.courseCode = coursecode;
        this.semester = semester;
        this.location = location;
        this.section = section;
        this.subject = subject;
        this.credits = credits;
    }


    @Override
    public String toString() {
        return super.toString() + "\nnewSite.core.Professor: " + professor + "\nnewSite.core.Course Code: " + courseCode +
                "\nSemester: " + semester + "\nLocation: " + location + "\nSection: " + section +
                "\nSubject: " + subject;
    }


}
