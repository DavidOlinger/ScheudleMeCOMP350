package newSite.core;

public class Professor {
    public String name;
    public float rating;
    public float difficulty;
    public String department;



    Professor(String name){
        this.name = name;
    }

    @Override
    public String toString(){
        return name;
    }
}
