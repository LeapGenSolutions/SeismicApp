import { useState } from "react";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { format, parse, startOfWeek, getDay } from "date-fns";
import enUS from "date-fns/locale/en-US";
import AppointmentModal from "./AppointmentModal";
import { useSelector } from "react-redux";

const locales = {
  "en-US": enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 0 }),
  getDay,
  locales,
});

const AppointmentCalendar = () => {
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const appointments = useSelector((state) => state.appointments.appointments);

  const events = appointments.map((appt) => {
    const today = new Date(appt.date + " CST");
    const [hours, minutes] = appt.time.split(":");
    const start = new Date(today.setHours(+hours, +minutes, 0));
    const end = new Date(start.getTime() + 30 * 60000);

    return {
      title: `${appt.full_name} (${appt.status})`,
      start,
      end,
      allDay: false,
      ...appt,
    };
  });


  return (
    <div style={{ height: "600px", margin: "20px" }}>
      <Calendar
        localizer={localizer}
        events={events}
        defaultView="day"
        views={["day", "week", "agenda"]}
        startAccessor="start"
        endAccessor="end"
        style={{ height: 500 }}
        onSelectEvent={(event) => {
          setSelectedAppointment(event);
        }}
      />
      {selectedAppointment && (
        <AppointmentModal
          selectedAppointment={selectedAppointment}
          setSelectedAppointment={setSelectedAppointment}
        />
      )}
    </div>
  );
};

export default AppointmentCalendar