import React, { useEffect, useState } from "react";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { useSelector } from "react-redux";
import { format, parse, startOfWeek, getDay } from "date-fns";
import enUS from "date-fns/locale/en-US";
import { navigate } from "wouter/use-browser-location";
import { DOCTOR_PORTAL_URL } from "../../constants";
import { FaCopy } from "react-icons/fa";

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
  const appointments = useSelector((state) => state.appointments.appointments);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [joinLink, setJoinLink] = useState("");
  const [isOnline, setIsOnline] = useState(true); // Added

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

  const handleJoinClick = () => {
    setSelectedAppointment(null);
    navigate(`/meeting-room/${selectedAppointment.id}?patient=${selectedAppointment.full_name}`);
  };

  const handlePostCallClick = () => {
    setSelectedAppointment(null);
    navigate(`/post-call/${selectedAppointment.id}`);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(joinLink);
    alert("Link copied to clipboard!");
  };

  useEffect(() => {
    if (selectedAppointment) {
      const link = `${DOCTOR_PORTAL_URL}${selectedAppointment.id}`;
      setJoinLink(link);
      setIsOnline(true); // Reset to Online every time modal opens
    }
  }, [selectedAppointment]);

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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-[90%] max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold text-gray-800">
                Appointment Details
              </h1>
            </div>
            <div className="space-y-2 text-gray-700">
              <p>
                <span className="font-semibold">Appointment ID:</span>{" "}
                {selectedAppointment.id}
              </p>
              <p>
                <span className="font-semibold">Patient:</span>{" "}
                {selectedAppointment.full_name}
              </p>
              <p>
                <span className="font-semibold">Time:</span>{" "}
                {selectedAppointment.time}
              </p>
              <p>
                <span className="font-semibold">Status:</span>{" "}
                {selectedAppointment.status}
              </p>
              <p>
                <span className="font-semibold">SSN:</span>{" "}
                {selectedAppointment.ssn}
              </p>
              <p>
                <span className="font-semibold">Doctor:</span>{" "}
                {selectedAppointment.doctor_name}
              </p>

              {/* Radio buttons */}
              <div className="flex space-x-4 mt-2">
                <label className="flex items-center space-x-1">
                  <input
                    type="radio"
                    name="apptType"
                    value="online"
                    checked={isOnline}
                    onChange={() => setIsOnline(true)}
                  />
                  <span>Online</span>
                </label>
                <label className="flex items-center space-x-1">
                  <input
                    type="radio"
                    name="apptType"
                    value="inperson"
                    checked={!isOnline}
                    onChange={() => setIsOnline(false)}
                  />
                  <span>In-Person</span>
                </label>
              </div>

              {/* Meeting Link visible only if Online is selected */}
              {isOnline && (
                <>
                  <p className="pt-2 font-semibold text-gray-700">Meeting Link:</p>
                  <div className="flex w-full">
                    <input
                      type="text"
                      value={joinLink}
                      readOnly
                      className="flex-grow border border-gray-300 rounded-l-md px-4 py-2 focus:outline-none focus:ring-0"
                    />
                    <button
                      onClick={copyToClipboard}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-r-md"
                    >
                      <FaCopy className="inline-block mr-1" /> Copy
                    </button>
                  </div>
                </>
              )}
            </div>
            <div className="mt-6 text-right space-x-1">
              <button
                onClick={handleJoinClick}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded"
              >
                Join
              </button>
              <button
                onClick={handlePostCallClick}
                className="bg-zinc-600 hover:bg-zinc-700 text-white font-medium py-2 px-4 rounded"
              >
                Post Call Documentation
              </button>
              <button
                onClick={() => setSelectedAppointment(null)}
                className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default AppointmentCalendar