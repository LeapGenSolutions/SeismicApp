import { useState, useEffect } from "react";
import { FaVideo, FaCopy } from "react-icons/fa";
import { navigate } from "wouter/use-browser-location";
import { useDispatch, useSelector } from "react-redux";
import { format, parse } from "date-fns";
import { DOCTOR_PORTAL_URL } from "../constants";
import { fetchAppointmentDetails } from "../redux/appointment-actions";
import CallHistory from "./CallHistory"
import { useToast } from "../hooks/use-toast";
import { PageNavigation } from "../components/ui/page-navigation";

const VideoCallPage = () => {
  const [room, setRoom] = useState("");
  const isHost = useState(true)[0];
  const [showShareLink, setShowShareLink] = useState(false);
  const [joinLink, setJoinLink] = useState("");

  const [activeTab, setActiveTab] = useState("upcoming");
  const [appointmentId, setAppointmentId] = useState("");
  const [appointmentType, setAppointmentType] = useState("online");
  const isLoadingUpcoming = useState(false)[0];
  const dispatch = useDispatch();
  const userName = useSelector((state) => state.me.me.given_name);
  const userEmail = useSelector((state) => state.me.me.email);
  const appointments = useSelector((state) => state.appointments.appointments);
  const { toast } = useToast();

  const today = format(new Date(), 'yyyy-MM-dd');
  useEffect(() => {
          document.title = "VideoCall - Seismic Connect";
  }, []);

  useEffect(() => {
    if(appointments.length === 0 && userEmail){
      dispatch(fetchAppointmentDetails(userEmail))
    }
  }, [dispatch, userEmail, appointments])
  

  // Mock data - replace with your actual data
  const upcomingAppointments = appointments.filter(
    (appt) => appt.appointment_date === today && appt.status !== 'cancelled'
  );

  const sortedAppointments = [...upcomingAppointments]
    .sort((a, b) =>
      new Date(`${a.appointment_date}T${a.time}`) - new Date(`${b.appointment_date}T${b.time}`)
    );

  const selectedAppointment =
    sortedAppointments.find((app) => app.id === appointmentId) ||
    null;

  // Add these new states at the top of the component
  const [invalidMeetingId, setInvalidMeetingId] = useState(false);
  const setAppointmentDetails = useState(null)[1];

  // Initialize and handle URL parameters
  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    const roomParam = queryParams.get("room");
    // const hostParam = queryParams.get("host");

    if (roomParam) {
      setRoom(roomParam);
      setActiveTab("join");
      // Find appointment details
      const appointment = sortedAppointments.find(
        (app) => app.id === roomParam
      );

      if (appointment) {
        setAppointmentDetails(appointment);
      } else {
        setInvalidMeetingId(true);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const queryParams = new URLSearchParams(window.location.search);
  const role = queryParams.get("role") || "doctor"

  const handleAppointmentSelect = (selectedAppointmentId) => {
    const appointment = sortedAppointments.find(
      (app) => app.id === selectedAppointmentId
    );

    if (!appointment) {
      setInvalidMeetingId(true);
      return;
    }

    setAppointmentId(selectedAppointmentId);
    setRoom(selectedAppointmentId);
    setAppointmentDetails(appointment);
    generateJoinLink(selectedAppointmentId);
  };

  const generateJoinLink = (selectedAppointmentId) => {
    const link = `${DOCTOR_PORTAL_URL}${selectedAppointmentId}`;
    setJoinLink(link);
    setShowShareLink(true);
    return link;
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(joinLink);
    toast({
      title: "Copied!",
      description: "Link copied to clipboard.",
      duration: 2000,
    });
  };

  const joinAsParticipant = (room, name) => {
    navigate(
      `/meeting-room/${encodeURIComponent(
        room
      )}?role=patient&name=${encodeURIComponent(userName)}`
    );
  };

  const joinAsDoctor = (room, name) => {
    navigate(
      `/meeting-room/${encodeURIComponent(
        room
      )}?patient=${encodeURIComponent(selectedAppointment.full_name)}`
    );
  };

  const SortedAppointmentsComponent = () => sortedAppointments.map((appointment) => {
    const startTime = parse(appointment.time, "HH:mm", new Date());
    const formattedStart = format(startTime, "h:mm a");
    if (appointment.end_time && /^\d{2}:\d{2}$/.test(appointment.end_time)) {
      try {
        //const endTime = parse(appointment.end_time, "HH:mm", new Date());
        //formattedEnd = format(endTime, "h:mm a");
      } catch (err) {
        console.warn("Invalid end_time format for:", appointment.end_time);
      }
    } else {
      console.warn("Missing or malformed end_time for:", appointment);
    }

    const capitalizedStatus =
      appointment.status?.charAt(0).toUpperCase() + appointment.status?.slice(1) || "Unknown";

    return (
      <option
        key={appointment.id}
        value={appointment.id}
      //disabled={!isInFuture(appointment)}
      >
        {appointment.full_name} – {formattedStart} ({capitalizedStatus})
        {/*!isInFuture(appointment) ? " – Expired" : ""*/}
      </option>
    );
  })

  return (
    <>
    <PageNavigation showBackButton={true} hideTitle={true} />
    <div className="bg-gray-50 flex flex-col items-center min-h-screen p-4">
      <div className="rounded-lg border bg-white shadow-sm w-full">
        <div className="flex flex-col space-y-1.5 p-6">
          <h3 className="text-2xl font-semibold leading-none tracking-tight">
            Seismic Video Call
          </h3>
          <p className="text-sm text-gray-500">
            Connect with patients through secure video consultations
          </p>
        </div>

        <div className="p-6 pt-0">
          <div className="space-y-4">
            <div className="inline-flex h-10 items-center justify-center rounded-md bg-gray-100 p-1 text-gray-500 mb-4">
              {role === "doctor" && (
                <button
                  onClick={() => setActiveTab("upcoming")}
                  className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium transition-all ${activeTab === "upcoming"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "hover:text-gray-900"
                    }`}
                >
                  Upcoming Calls
                </button>
              )}
              {role === "patient" && (
                <button
                  onClick={() => setActiveTab("join")}
                  className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium transition-all ${activeTab === "join"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "hover:text-gray-900"
                    }`}
                >
                  Join by ID
                </button>
              )}
              {role === "doctor" && (
                <button
                  onClick={() => setActiveTab("history")}
                  className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium transition-all ${activeTab === "history"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "hover:text-gray-900"
                    }`}
                >
                  Call History
                </button>
              )}
            </div>

            {activeTab === "upcoming" && (
              <div className="space-y-4">
                <div className="grid gap-2">
                  <label
                    htmlFor="appointment"
                    className="text-sm font-medium text-gray-700"
                  >
                    Select an appointment
                  </label>
                  <div className="relative">
                    <select
                      value={appointmentId}
                      onChange={(e) => handleAppointmentSelect(e.target.value)}
                      className="flex h-10 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="">Select an appointment</option>
                      {isLoadingUpcoming ? (
                        <option value="loading" disabled>
                          Loading appointments...
                        </option>
                      ) : sortedAppointments.length > 0 ? (
                        <SortedAppointmentsComponent />
                      ) : (
                        <option value="no-appointments" disabled>
                          No upcoming video calls
                        </option>
                      )}
                    </select>
                  </div>
                </div>

                {appointmentId && (
                  <div className="mt-4">
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Appointment Type
                    </label>
                    <div className="flex space-x-4">
                      <div className="flex items-center space-x-2">
                        <input
                          type="radio"
                          id="online"
                          name="appointmentType"
                          value="online"
                          checked={appointmentType === "online"}
                          onChange={() => setAppointmentType("online")}
                          className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <label
                          htmlFor="online"
                          className="text-sm font-medium text-gray-700 cursor-pointer"
                        >
                          Online
                        </label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="radio"
                          id="in-person"
                          name="appointmentType"
                          value="in-person"
                          checked={appointmentType === "in-person"}
                          onChange={() => setAppointmentType("in-person")}
                          className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <label
                          htmlFor="in-person"
                          className="text-sm font-medium text-gray-700 cursor-pointer"
                        >
                          In-Person
                        </label>
                      </div>
                    </div>
                  </div>
                )}

                {appointmentId && selectedAppointment && (
                  <div className="bg-gray-50 p-4 rounded-md mt-4">
                    <h3 className="font-medium mb-2">Appointment Details</h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-gray-500">Patient:</span>
                        <span className="ml-2 font-medium">
                          {selectedAppointment.full_name}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Appointment ID:</span>
                        <span className="ml-2 font-medium">
                          {selectedAppointment.id}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Date & Time:</span>
                        <span className="ml-2 font-medium">
                          {selectedAppointment.appointment_date} at{" "}
                          {selectedAppointment.time}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Reason:</span>
                        <span className="ml-2 font-medium">
                          {selectedAppointment.reason || "Not specified"}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
                <div className="w-full mb-6">
                  <div className="flex flex-row justify-between w-full gap-4">
                    <label className="block text-gray-700 mb-2 flex-1">
                      Your Name
                      <input
                        type="text"
                        placeholder="Enter your name"
                        value={userName}
                        readOnly
                        className="border border-gray-300 rounded-lg px-4 w-full py-2 mb-4"
                      />
                    </label>
                    <label className="block text-gray-700 mb-2 flex-1">
                      {isHost ? "Meeting ID" : "Meeting ID (from invite link)"}
                      <input
                        placeholder="Meeting ID"
                        value={room}
                        onChange={(e) => setRoom(e.target.value)}
                        className="border border-gray-300 rounded-lg px-4 w-full py-2 mb-4"
                      />
                    </label>
                  </div>
                </div>

                <div className="flex justify-end space-x-2 mt-4">
                  <button
                    onClick={() => {
                      if (!room) {
                        alert("Please select an appointment first");
                        return;
                      }
                      joinAsDoctor(room, userName);
                    }}
                    className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors bg-blue-600 hover:bg-blue-700 text-white h-10 px-4 py-2"
                  >
                    <FaVideo className="mr-2" />
                    Start Video Call
                  </button>
                </div>
                {showShareLink && (
                  <div className="mt-6 w-full flex justify-center">
                    <div className="bg-gray-100 rounded-lg px-6 py-4 w-full max-w-xl shadow-sm">
                      <h3 className="font-medium text-gray-800 text-sm mb-2">
                        Invite others to join
                      </h3>
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-700 mr-4">
                          Patient's link for the appointment
                        </p>
                        <button
                          onClick={copyToClipboard}
                          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded"
                        >
                          <FaCopy className="w-4 h-4" />
                          Copy
                        </button>
                      </div>
                      <p className="text-sm text-gray-600 mt-2">
                        Click copy to share this appointment link
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === "join" && (
              <div className="space-y-4">
                <div className="w-full mb-6">
                  <div className="flex flex-row justify-between w-full gap-4">
                    <label className="block text-gray-700 mb-2 flex-1">
                      Your Name
                      <input
                        type="text"
                        placeholder="Enter your name"
                        value={userName}
                        className="border border-gray-300 rounded-lg px-4 w-full py-2 mb-4"
                      />
                    </label>
                    <label className="block text-gray-700 mb-2 flex-1">
                      Meeting ID (from invite link)
                      <input
                        placeholder="Meeting ID"
                        value={room}
                        onChange={(e) => setRoom(e.target.value)}
                        className="border border-gray-300 rounded-lg px-4 w-full py-2 mb-4"
                      />
                    </label>
                  </div>
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={() => joinAsParticipant(room, userName)}
                    disabled={!room || !userName}
                    className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors bg-blue-600 hover:bg-blue-700 text-white h-10 px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Join Call
                  </button>
                </div>
              </div>
            )}

           {activeTab === "history" && (
           <div className="space-y-4">
          <CallHistory />
         </div>
          )}
          </div>
        </div>
        {invalidMeetingId && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
            <p>Invalid meeting ID. Please check your meeting link.</p>
          </div>
        )}
      </div>
    </div >
    </>
  );
};

export default VideoCallPage;