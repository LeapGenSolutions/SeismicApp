import { useMemo } from "react";
import { ExternalLink } from "lucide-react";
import { useSelector } from "react-redux";
import { navigate } from "wouter/use-browser-location";
import { useParams } from "wouter";
import { PageNavigation } from "../components/ui/page-navigation";

const PatientReports = () => {
  const { patientId } = useParams();
  const patients = useSelector((state) => state.patients.patients);
  const appointments = useSelector((state) => state.appointments.appointments);
  const patient = patients.find((p) => p.id === patientId);
  // const doctor = useSelector((state) => state.me.me);

  const filteredAppointments = useMemo(() => {
    return appointments
      .filter((a) => patient?.full_name === a.full_name)
      .sort(
        (a, b) =>
          new Date(b.timestamp || b.date || b.created_at) -
          new Date(a.timestamp || a.date || a.created_at)
      );
  }, [appointments, patient?.full_name]);

  // const [summaryOfSummariesData, setSummaryOfSummariesData] = useState(null);

  // useEffect(() => {
  //   summaryOfSummaries();
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, []);

  // const summaryOfSummaries = async () => {
  //   const data = await fetchSummaryofSummaries(doctor.email, patientId);
  //   setSummaryOfSummariesData(data);
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
      <PageNavigation 
        title="Patient Reports"
        subtitle={`${firstName} ${lastName}`}
        customTrail={[
          { href: "/patients", label: "Patients", icon: null },
          { href: `/patients/${patient.id}`, label: "Patient Details", icon: null },
          { href: `/patients/${patient.id}/reports`, label: "Reports", icon: null, isLast: true }
        ]}
      />

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

      {/* {summaryOfSummariesData && (
        <div className="bg-white border border-gray-300 rounded-xl shadow p-6 mb-6 w-full">
          <h2 className="text-2xl font-semibold mb-4 text-gray-700">Summary of Summaries</h2>
          <p className="text-gray-800 text-sm whitespace-pre-wrap leading-relaxed">
            {summaryOfSummariesData}
          </p>
        </div>
      )} */}

      {filteredAppointments.map((appointment) => {
        const appointmentId = appointment.id;
        const appointmentTime = appointment.date
          ? `${new Date(appointment.date).toLocaleDateString(undefined, {
            year: "numeric",
            month: "long",
            day: "numeric",
          })} at ${appointment.time ?? "N/A"}`
          : appointment.time ?? "Time not available";

        return (
          <div
            key={appointmentId}
            className="bg-white border rounded-xl shadow-lg w-full mb-8"
          >
            <button
              onClick={() => navigate(`/post-call/${appointmentId}`)}
              className="w-full text-left px-6 py-4 flex justify-between items-center bg-white-100 rounded-t font-medium text-lg"
            >
              <span>Appointment: {appointmentTime}</span>
              <ExternalLink className="h-5 w-5 text-blue-600" />
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default PatientReports