public class TimeSlot {

    public int startTime;
    public int endTime;

    // converts clock time string like "16:45:00" into seconds from beginning of day (int)
    TimeSlot(String clockStartTime, String clockEndTime) {
        if(clockStartTime.equals("") || clockEndTime.equals("")) {
            startTime = 0;
            endTime = 0;
            return;
        }
        String[] startTimeArr = clockStartTime.split(":");
        String[] endTimeArr = clockEndTime.split(":");
        startTime = Integer.parseInt(startTimeArr[0]) * 3600 + Integer.parseInt(startTimeArr[1]) * 60 + Integer.parseInt(startTimeArr[2]);
        endTime = Integer.parseInt(endTimeArr[0]) * 3600 + Integer.parseInt(endTimeArr[1]) * 60 + Integer.parseInt(endTimeArr[2]);
    }
    
    @Override
    public String toString() {
        return "Start: " + startTime + ", End: " + endTime;
    }

}
