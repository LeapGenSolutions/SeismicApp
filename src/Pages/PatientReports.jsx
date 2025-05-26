import { useState } from "react";
import { navigate } from "wouter/use-browser-location";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useSelector } from "react-redux";
import { useParams } from "wouter";

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
  const patients = useSelector((state) => state.patients.patients)
  const appointments = useSelector((state) => state.appointments.appointments)

  const [transcripts, setTranscripts] = useState({});
  const [summaries, setSummaries] = useState({});
  const [soapNotes, setSoapNotes] = useState({});
  const [billingCodes, setBillingCodes] = useState({});

  const { patientId } = useParams()

  const patient = patients.find((p) => p.id === patientId);
  if (!patient) {
    console.warn("Patient not found. Redirecting...");
    navigate("/patients");
    return;
  }
  const filteredAppointments = appointments.filter(
    (a) => patient.full_name === a.full_name
  );

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
      <h1 className="text-3xl font-bold mb-4 text-gray-800 text-left">Patient Reports</h1>

      {patient && (
        <p className="text-lg text-gray-600 mb-6">
          Showing records for:{" "}
          <span className="font-semibold">{patient.full_name}</span>
        </p>
      )}

      {filteredAppointments.length === 0 && (
        <p className="text-red-500 text-sm mb-6">
          No appointments found for patient ID "{patientId}"
        </p>
      )}

      {filteredAppointments.map((appointment) => {
        const appointmentId = appointment.id;

        return (
          <div
            key={appointmentId}
            className="bg-white border rounded-xl shadow-lg p-6 space-y-4 w-full mb-8"
          >
            <div
              className="flex flex-col sm:flex-row sm:items-center sm:gap-4 text-left cursor-pointer">
              <p className="text-xl font-semibold text-gray-700">
                Appointment ID: {appointmentId}
              </p>
            </div>

            <div className="text-sm text-gray-600">
              <p>
                <strong>Patient:</strong> {patient.full_name}
              </p>
            </div>
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
          </div>
        );
      })}
    </div>
  );
};

export default PatientReports;