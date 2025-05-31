import { useState, useMemo, useEffect } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useSelector } from "react-redux";
import { useParams } from "wouter";
import { fetchsummaryofsummaries } from "../api/summaryofsummaries"; // Adjust path if needed

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
        className="w-full px-4 py-2 flex justify-between items-center text-left text-base font-semibold bg-gray-100 rounded-t"
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

const PatientReports = () => {
  const { patientId } = useParams();
  const patients = useSelector((state) => state.patients.patients);
  const appointments = useSelector((state) => state.appointments.appointments);
  const patient = patients.find((p) => p.id === patientId);

  const filteredAppointments = useMemo(() => {
    return appointments
      .filter((a) => patient?.full_name === a.full_name)
      .sort(
        (a, b) =>
          new Date(b.timestamp || b.date || b.created_at) -
          new Date(a.timestamp || a.date || a.created_at)
      );
  }, [appointments, patient?.full_name]);

  const doctorEmail = useMemo(() => {
    return filteredAppointments[0]?.doctor_email || null;
  }, [filteredAppointments]);

  const [summaryOfSummaries, setSummaryOfSummaries] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState(null);

  useEffect(() => {
    const fetchSummary = async () => {
      if (!doctorEmail || !patient?.id) return;
      setSummaryLoading(true);
      try {
        const data = await fetchsummaryofsummaries(doctorEmail, patient.id);
        setSummaryOfSummaries(data?.combined_summary || "No summary found");
      } catch (err) {
        setSummaryError("Failed to fetch summary of summaries");
      } finally {
        setSummaryLoading(false);
      }
    };
    fetchSummary();
  }, [doctorEmail, patient?.id]);

  const [transcripts, setTranscripts] = useState({});
  const [summaries, setSummaries] = useState({});
  const [soapNotes, setSoapNotes] = useState({});
  const [billingCodes, setBillingCodes] = useState({});
  const [openCards, setOpenCards] = useState({}); // ✅ to manage expanded cards

  const toggleCard = (appointmentId) => {
    setOpenCards((prev) => ({
      ...prev,
      [appointmentId]: !prev[appointmentId],
    }));
  };

  if (!patient) return null;

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

  const [firstName, lastName] = patient.full_name?.split(" ") || ["", ""];
  const maskedSSN = patient.ssn ? `XXX-XX-${patient.ssn.slice(-4)}` : "Not Available";

  return (
    <div className="p-6 w-full">
      <h1 className="text-3xl font-bold mb-4 text-gray-800 text-left">Patient Reports</h1>

      {/* Patient Info Summary Card */}
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

      {/* Summary of Summaries Card */}
      <div className="bg-white border border-gray-300 rounded-xl shadow p-6 mb-6 w-full">
        <h2 className="text-2xl font-semibold mb-4 text-gray-700">Summary of Summaries</h2>
        {summaryLoading ? (
          <p className="text-sm text-gray-500">Loading...</p>
        ) : summaryError ? (
          <p className="text-sm text-red-500">{summaryError}</p>
        ) : (
          <p className="text-gray-800 text-sm whitespace-pre-wrap leading-relaxed">
            {summaryOfSummaries}
          </p>
        )}
      </div>

      {filteredAppointments.length === 0 && (
        <p className="text-red-500 text-sm mb-6">
          No appointments found for patient ID
        </p>
      )}

      {/* Appointment Cards */}
      {filteredAppointments.map((appointment) => {
        const appointmentId = appointment.id;
        const appointmentTime = new Date(
          appointment.timestamp || appointment.date || appointment.created_at
        ).toLocaleString();

        const isOpen = openCards[appointmentId] || false;

        return (
          <div
            key={appointmentId}
            className="bg-white border rounded-xl shadow-lg w-full mb-8"
          >
            <button
              onClick={() => toggleCard(appointmentId)}
              className="w-full text-left px-6 py-4 flex justify-between items-center bg-gray-100 rounded-t font-medium text-lg"
            >
              <span>Appointment: {appointmentTime}</span>
              {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>

            {isOpen && (
              <div className="p-6 space-y-4">
                <LazySection
                  title="Full Transcript"
                  appointmentId={appointmentId}
                  fetchFn={fetchTranscript}
                />
                <LazySection
                  title="Summary"
                  appointmentId={appointmentId}
                  fetchFn={fetchSummary}
                />
                <LazySection
                  title="SOAP Notes"
                  appointmentId={appointmentId}
                  fetchFn={fetchSOAP}
                />
                <LazySection
                  title="Billing Codes"
                  appointmentId={appointmentId}
                  fetchFn={fetchBilling}
                />
                <LazySection
                  title="Clusters"
                  appointmentId={appointmentId}
                  fetchFn={async () =>
                    "Cluster Category: General | Severity: Medium | Tags: Neurology, Follow-Up"
                  }
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default PatientReports;
