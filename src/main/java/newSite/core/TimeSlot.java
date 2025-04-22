package newSite.core;

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

    TimeSlot(int startTime, int endTime) {

        this.startTime = startTime;
        this.endTime = endTime;
    }


    @Override
    public String toString() {
        int startHours = startTime / 3600;
        int startMinutes = (startTime % 3600) / 60;
        int startSeconds = startTime % 60;
        int endHours = endTime / 3600;
        int endMinutes = (endTime % 3600) / 60;
        int endSeconds = endTime % 60;
        return String.format("Start: %02d:%02d:%02d, End: %02d:%02d:%02d",
                startHours, startMinutes, startSeconds,
                endHours, endMinutes, endSeconds);
    }

}
