import { useState, useMemo,  } from "react";
import { ChevronDown, ChevronUp,ExternalLink } from "lucide-react";
import { useSelector } from "react-redux";
import { navigate } from "wouter/use-browser-location";
import { useParams } from "wouter";
import PostCallTabs from "./PostCallTabs"; // adjust path if needed

const PatientReports = () => {
  const { patientId } = useParams();
  const patients = useSelector((state) => state.patients.patients);
  const appointments = useSelector((state) => state.appointments.appointments);
  const patient = patients.find((p) => p.id === patientId);
  //const doctor = useSelector((state) => state.me.me);

  const filteredAppointments = useMemo(() => {
    return appointments
      .filter((a) => patient?.full_name === a.full_name)
      .sort(
        (a, b) =>
          new Date(b.timestamp || b.date || b.created_at) -
          new Date(a.timestamp || a.date || a.created_at)
      );
  }, [appointments, patient?.full_name]);

  const [openCards, setOpenCards] = useState({});
  //const [summaryOfSummariesData, setSummaryOfSummariesData] = useState(null);

 // useEffect(() => {
    //summaryOfSummaries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
 // }, []);

  const toggleCard = (appointmentId) => {
    setOpenCards((prev) => ({
      ...prev,
      [appointmentId]: !prev[appointmentId],
    }));
  };

 // const summaryOfSummaries = async () => {
    //const data = await fetchSummaryofSummaries(doctor.email, patientId);
   // setSummaryOfSummariesData(data);
 // };

  if (!patient) {
    console.warn("Patient not found. Redirecting...");
    navigate("/patients");
    return;
  }

  const [firstName, lastName] = patient.full_name?.split(" ") || ["", ""];
  const maskedSSN = patient.ssn ? `XXX-XX-${patient.ssn.slice(-4)}` : "Not Available";
  
return (
    <div className="p-6 w-full">
      <div className="mb-4">
      <button
      onClick={() => navigate("/patients")}
      className="flex items-center text-blue-600 text-sm font-medium hover:underline"
  >
       <span className="mr-1 text-lg">←</span> Back
      </button>
      </div>

      <h1 className="text-3xl font-bold mb-4 text-gray-800 text-left">Patient Reports</h1>
      <div className="bg-white border border-gray-300 rounded-xl shadow p-6 mb-6 w-full">
        <h2 className="text-2xl font-semibold mb-4 text-gray-700">Patient Info</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-gray-800">
          <p><strong>First Name:</strong> {firstName}</p>
          <p><strong>Last Name:</strong> {lastName}</p>
          <p><strong>SSN:</strong> {maskedSSN}</p>
          <p><strong>Full Name:</strong> {patient.full_name}</p>
          <p><strong>Total Appointments:</strong> {filteredAppointments.length}</p>
        </div>
      </div>

      {/*summaryOfSummariesData && (
        <div className="bg-white border border-gray-300 rounded-xl shadow p-6 mb-6 w-full">
          <h2 className="text-2xl font-semibold mb-4 text-gray-700">Summary of Summaries</h2>
          <p className="text-gray-800 text-sm whitespace-pre-wrap leading-relaxed">
            {summaryOfSummariesData}
          </p>
        </div>
      )*/}

      {filteredAppointments.map((appointment) => {
        const appointmentId = appointment.id;
        const appointmentTime = appointment.date
          ? `${new Date(appointment.date).toLocaleDateString(undefined, {
              year: "numeric",
              month: "long",
              day: "numeric",
            })} at ${appointment.time ?? "N/A"}`
          : appointment.time ?? "Time not available";
        const isOpen = openCards[appointmentId] || false;

        return (
          <div
            key={appointmentId}
            className="bg-white border rounded-xl shadow-lg w-full mb-8"
          >
            <button
              onClick={() => toggleCard(appointmentId)}
              className="w-full text-left px-6 py-4 flex justify-between items-center bg-white-100 rounded-t font-medium text-lg"
            >
              <span>Appointment: {appointmentTime}</span>
              {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>

            {isOpen && (
              <div className="p-6 space-y-4">
                <div className="flex justify-end">
                  <button
                    onClick={() => navigate(`/post-call/${appointmentId}`)}
                    className="p-2 hover:bg-gray-100 rounded-full transition"
                    title="Open Post-Call Page"
                  >
                    <ExternalLink className="h-5 w-5 text-blue-600" />
                  </button>
                </div>
                <PostCallTabs appointmentId={appointmentId} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default PatientReports
