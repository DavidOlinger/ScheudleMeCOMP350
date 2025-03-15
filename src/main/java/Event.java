public class Event {
    public String name;
    public String days; // e.g., "MWF"
    public TimeSlot time;



    public Event (String name, String days, TimeSlot time) {
        this.name = name;
        this.days = days;
        this.time = time;
    }



    // Check if this event conflicts with another
    public boolean ConflictsWith(Event e) {
        // Check if the events share a day
        boolean sameDay = false;
        for (int i = 0; i < days.length(); i++) {
            if (e.days.contains(days.substring(i, i + 1))) {
                sameDay = true;
                break;
            }
        }
        if (!sameDay) {
            return false;
        }

        // return check if events overlap for any length of time
        // (make sure to check for both cases where this event starts first and when the other event starts first)
        return (time.startTime < e.time.endTime && time.endTime > e.time.startTime);
    }


    @Override
    public String toString() {
        return "Name: " + name + "\nDays: " + days + "\nTime: " + time;
    }

    public String quietToString() {
        return "Event:" + name + " on " + days + " with timeslot: " + time;
    }
}