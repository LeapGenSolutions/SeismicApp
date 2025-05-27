import React from "react";
import{ useState, useEffect } from "react";
import { navigate } from "wouter/use-browser-location";
import { ChevronDown, ChevronUp } from "lucide-react";

const LazySection = ({ title, appointmentId, fetchFn }) => {
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(false);

  const toggle = async (e) => {
    e.stopPropagation();
    const nowOpen = !open;
    setOpen(nowOpen);

    if (nowOpen && !content) {
      setLoading(true);
      const data = await fetchFn(appointmentId);
      setContent(data);
      setLoading(false);
    }
  };

  return (
    <div className="border rounded-lg bg-white shadow transition-all duration-300 w-full">
      <button
        onClick={toggle}
        className="w-full px-4 py-2 flex justify-between items-center text-left text-base font-semibold bg-gray-100 rounded-t hover:bg-gray-200"
      >
        <span>{title}</span>
        {open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
      </button>
      {open && (
        <div className="px-4 py-3 text-sm text-gray-800 whitespace-pre-wrap">
          {loading ? "Loading..." : content || "No data available"}
        </div>
      )}
    </div>
  );
};

const normalize = (str) =>
  typeof str === "string" ? str.trim().toLowerCase() : "";

const formatDateTime = (timeString, dateId) => {
  try {
    const date = new Date(`${dateId}T${timeString}`);
    return date.toLocaleString(undefined, {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "Unknown";
  }
};

const maskSSN = (ssn) => {
  if (!ssn || typeof ssn !== "string") return "***-**-****";
  return "***-**-" + ssn.slice(-4);
};

const PatientReports = () => {
  //const [patients, setPatients] = useState([]);
  //const [appointments, setAppointments] = useState([]);
  const [filteredAppointments, setFilteredAppointments] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [expandedAppointmentId, setExpandedAppointmentId] = useState(null);

  const [transcripts, setTranscripts] = useState({});
  const [summaries, setSummaries] = useState({});
  const [soapNotes, setSoapNotes] = useState({});
  const [billingCodes, setBillingCodes] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  const clusters = {
    clusterInfo: `This patient is part of the Cardiology Monitoring Group.

- Cluster ID: cluster-1
- Department: Cardiology
- Lead Doctor: Dr. Smith
- Team Size: 12 members`,
  };

  const queryParams = new URLSearchParams(window.location.search);
  const patientId = queryParams.get("id");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [patientRes, appointmentRes] = await Promise.all([
          fetch("https://seismic-backend-04272025-bjbxatgnadguabg9.centralus-01.azurewebsites.net/api/patients"),
          fetch("https://seismic-backend-04272025-bjbxatgnadguabg9.centralus-01.azurewebsites.net/api/appointments"),
        ]);

        const [patientsData, appointmentsRaw] = await Promise.all([
          patientRes.json(),
          appointmentRes.json(),
        ]);

        const appointmentList = appointmentsRaw.flatMap((entry) =>
          Array.isArray(entry.data)
            ? entry.data.map((appt) => ({ ...appt, date: entry.id }))
            : []
        );

        //setPatients(patientsData);
        //setAppointments(appointmentList);

        const patient = patientsData.find((p) => p.id === patientId);
        if (!patient) {
          console.warn("Patient not found. Redirecting...");
          navigate("/patients");
          return;
        }

        setSelectedPatient(patient);

        const matchedAppointments = appointmentList.filter(
          (a) =>
            normalize(a.ssn) === normalize(patient.ssn) ||
            normalize(a.full_name) === normalize(patient.full_name)
        );

        matchedAppointments.sort((a, b) => {
          const dateTimeA = new Date(`${a.date}T${a.time}`);
          const dateTimeB = new Date(`${b.date}T${b.time}`);
          return dateTimeB.getTime() - dateTimeA.getTime();
        });

        setFilteredAppointments(matchedAppointments);
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [patientId]);

  const toggleExpand = (id) => {
    setExpandedAppointmentId((prev) => (prev === id ? null : id));
  };

  const buildUrl = (base, doctorId, apptId) => {
    const suffixMap = {
      transcript: "transcription",
      summary: "summary",
      soap: "soap",
      billing: "billing",
    };
    const suffix = suffixMap[base] || base;

    return `https://seismic-backend-04272025-bjbxatgnadguabg9.centralus-01.azurewebsites.net/api/${base}/${doctorId}_${apptId}_${suffix}?userID=${doctorId}`;
  };

  const fetchTranscript = async (appointmentId) => {
    const a = filteredAppointments.find((x) => x.id === appointmentId);
    if (!a) return "Appointment not found";
    if (transcripts[appointmentId]) return transcripts[appointmentId];

    try {
      const res = await fetch(buildUrl("transcript", a.doctor_id, a.id));
      const json = await res.json();
      const content = json.data?.full_conversation || "No transcript available";
      setTranscripts((prev) => ({ ...prev, [appointmentId]: content }));
      return content;
    } catch {
      return "Failed to load transcript";
    }
  };

  const fetchSummary = async (appointmentId) => {
    const a = filteredAppointments.find((x) => x.id === appointmentId);
    if (!a) return "Appointment not found";
    if (summaries[appointmentId]) return summaries[appointmentId];

    try {
      const res = await fetch(buildUrl("summary", a.doctor_id, a.id));
      const json = await res.json();
      const content = json.data?.full_summary_text || "No summary available";
      setSummaries((prev) => ({ ...prev, [appointmentId]: content }));
      return content;
    } catch {
      return "Failed to load summary";
    }
  };

  const fetchSOAP = async (appointmentId) => {
    const a = filteredAppointments.find((x) => x.id === appointmentId);
    if (!a) return "Appointment not found";
    if (soapNotes[appointmentId]) return soapNotes[appointmentId];

    try {
      const res = await fetch(buildUrl("soap", a.doctor_id, a.id));
      const json = await res.json();
      const content = json.data?.soap_notes || "No SOAP notes available";
      setSoapNotes((prev) => ({ ...prev, [appointmentId]: content }));
      return content;
    } catch {
      return "Failed to load SOAP notes";
    }
  };

  const fetchBilling = async (appointmentId) => {
    const a = filteredAppointments.find((x) => x.id === appointmentId);
    if (!a) return "Appointment not found";
    if (billingCodes[appointmentId]) return billingCodes[appointmentId];

    try {
      const res = await fetch(buildUrl("billing", a.doctor_id, a.id));
      const json = await res.json();
      const content = json.data?.billing_codes || "No billing info available";
      setBillingCodes((prev) => ({ ...prev, [appointmentId]: content }));
      return content;
    } catch {
      return "Failed to load billing codes";
    }
  };

  return (
    <div className="p-6 w-full">
      <h1 className="text-3xl font-bold mb-4 text-gray-900 leading-tight tracking-tight">Patient Reports</h1>

      {selectedPatient && (
        <p className="text-lg text-gray-600 mb-6">
          Showing records for: <span className="font-semibold">{selectedPatient.full_name}</span>
        </p>
      )}

      {!isLoading && filteredAppointments.length === 0 && (
        <p className="text-red-500 text-sm mb-6">
          No appointments found for patient ID "{patientId}"
        </p>
      )}

      {filteredAppointments.map((appointment) => {
        const appointmentId = appointment.id;
        const isExpanded = expandedAppointmentId === appointmentId;

        return (
          <div
            key={appointmentId}
            className="bg-white border rounded-xl shadow-md hover:shadow-lg transition p-6 space-y-4 w-full mb-10"
          >
            <div
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between cursor-pointer"
              onClick={() => toggleExpand(appointmentId)}
            >
              <p className="text-xl font-semibold text-gray-700">
                Appointment Time: {formatDateTime(appointment.time, appointment.date)}
              </p>
            </div>

            <div className="text-sm text-gray-600 space-y-1 mt-2">
              <p><strong className="text-gray-700">Patient:</strong> {appointment.full_name}</p>
              <p><strong className="text-gray-700">First Name:</strong> {appointment.first_name}</p>
              <p><strong className="text-gray-700">Last Name:</strong> {appointment.last_name}</p>
              <p><strong className="text-gray-700">SSN:</strong> {maskSSN(appointment.ssn)}</p>
            </div>

            {isExpanded && (
              <>
                <LazySection title="Full Transcript" appointmentId={appointmentId} fetchFn={fetchTranscript} />
                <LazySection title="Summary" appointmentId={appointmentId} fetchFn={fetchSummary} />
                <LazySection title="SOAP Notes" appointmentId={appointmentId} fetchFn={fetchSOAP} />
                <LazySection title="Billing Codes" appointmentId={appointmentId} fetchFn={fetchBilling} />
                <LazySection title="Clusters" appointmentId={appointmentId} fetchFn={() => Promise.resolve(clusters.clusterInfo)} />
              </>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default PatientReports;

