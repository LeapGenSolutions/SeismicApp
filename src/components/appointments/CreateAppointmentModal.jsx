import { useState } from "react";
import { useSelector } from "react-redux";
import { BACKEND_URL } from "../../constants";
import { createAppointment } from "../../api/appointment";
import { useToast } from "../../hooks/use-toast";
import UnsavedChangesModal from "../UnsavedChangesModal";
import { Calendar, User2, Clock, ChevronDown } from "lucide-react";
import { v5 as uuidv5 } from "uuid";

const CreateAppointmentModal = ({ username, onClose, onSuccess }) => {
  const { toast } = useToast();
  const loggedInDoctor = useSelector((state) => state.me.me);

  // Doctor Info
  const resolvedDoctorName = loggedInDoctor?.name || "Dr. Unknown";
  const resolvedDoctorEmail =
    loggedInDoctor?.email?.toLowerCase() || username?.toLowerCase() || "";
  const resolvedSpecialization =
    loggedInDoctor?.specialization?.trim() || "General Medicine";
  const resolvedDoctorId =
    loggedInDoctor?.oid?.replace(/-/g, "") ||
    uuidv5(
      resolvedDoctorName,
      "6ba7b810-9dad-11d1-80b4-00c04fd430c8"
    ).replace(/-/g, "");

  const [formData, setFormData] = useState({
    first_name: "",
    middle_name: "",
    last_name: "",
    dob: "",
    gender: "",
    email: "",
    phone: "",
    ehr: "",
    mrn: "",
    appointment_date: "",
    time: "",
    custom_time: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [showUnsavedConfirm, setShowUnsavedConfirm] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.first_name.trim()) newErrors.first_name = "Required";
    if (!formData.last_name.trim()) newErrors.last_name = "Required";
    if (!formData.dob.trim()) newErrors.dob = "Required";
    if (!formData.mrn.trim()) newErrors.mrn = "Required";
    if (!formData.appointment_date.trim()) newErrors.appointment_date = "Required";
    if (!formData.time && !formData.custom_time) newErrors.time = "Required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toast({
        title: "Missing Information",
        description: "Please fill all required fields.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // ⭐ STEP 1 — SAVE PATIENT
      const patientPayload = {
        first_name: formData.first_name,
        middle_name: formData.middle_name,
        last_name: formData.last_name,
        dob: formData.dob,
        gender: formData.gender,
        email: formData.email?.toLowerCase().trim(),
        phone: formData.phone?.replace(/\D/g, ""),
        ehr: formData.ehr,
        mrn: formData.mrn,
      };

      const patientRes = await fetch(`${BACKEND_URL}api/patients/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patientPayload),
      });

      if (!patientRes.ok) throw new Error("Patient save failed");

      const savedPatient = await patientRes.json();
      console.log("🔥 BACKEND PATIENT RESPONSE >>>", savedPatient);

      // ⭐⭐⭐ FIXED PATIENT ID EXTRACTION
      const patient_id =
        savedPatient?.chatbotPatient?.patientID ||
        savedPatient?.chatbotPatient?.original_json?.patientID ||
        savedPatient?.chatbotPatient?.original_json?.original_json?.details
          ?.patient_id;

      // ⭐⭐⭐ FIXED PRACTICE ID EXTRACTION
      const practice_id =
        savedPatient?.chatbotPatient?.practiceID ||
        savedPatient?.chatbotPatient?.original_json?.practiceID ||
        savedPatient?.chatbotPatient?.original_json?.original_json?.details
          ?.practice_id;

      if (!patient_id) throw new Error("Missing patient_id from backend");

      console.log("🔥 patient_id:", patient_id);
      console.log("🔥 practice_id:", practice_id);

      // ⭐ STEP 2 — CREATE APPOINTMENT
      const convertTo24Hour = (t) => {
        if (!t) return "";
        const d = new Date(`1970-01-01 ${t}`);
        return d.toTimeString().slice(0, 5);
      };

      const finalTime = formData.custom_time || formData.time;

      const fullName = [formData.first_name, formData.middle_name, formData.last_name]
        .filter(Boolean)
        .join(" ");

      const appointmentData = {
        id: Math.random().toString(36).slice(2, 26),
        type: "appointment",

        first_name: formData.first_name,
        middle_name: formData.middle_name,
        last_name: formData.last_name,
        full_name: fullName,

        dob: formData.dob,
        gender: formData.gender,
        mrn: formData.mrn,
        ehr: formData.ehr,

        doctor_name: resolvedDoctorName.startsWith("Dr.")
          ? resolvedDoctorName
          : `Dr. ${resolvedDoctorName}`,
        doctor_id: resolvedDoctorId,
        doctor_email: resolvedDoctorEmail,
        specialization: resolvedSpecialization,

        time: convertTo24Hour(finalTime),
        status: "scheduled",
        appointment_date: formData.appointment_date,

        email: formData.email,
        phone: formData.phone?.replace(/\D/g, ""),

        // ⭐ REQUIRED FIELDS BACKEND NEEDS
        patient_id: patient_id,
        practice_id: practice_id,
        ssn: String(patient_id),

        insurance_provider: "Self-Pay",
        insurance_verified: false,
      };

      console.log("🔥 FINAL APPOINTMENT PAYLOAD >>>", appointmentData);

      await createAppointment(resolvedDoctorEmail, appointmentData);

      toast({
        title: "Success",
        description: "Appointment created successfully.",
        variant: "success",
      });

      onSuccess(appointmentData);
      onClose();
    } catch (err) {
      console.error("❌ ERROR:", err.message);
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-40 flex justify-end items-center z-50"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          const hasData = Object.values(formData).some(
            (v) => v && v.toString().trim() !== ""
          );
          if (hasData) setShowUnsavedConfirm(true);
          else onClose();
        }
      }}
    >
      <div
      className="bg-white shadow-2xl rounded-2xl w-full max-w-xl h-[85vh] 
                mr-10 mt-6 mb-4 overflow-y-auto flex flex-col 
                border border-blue-100 relative z-[9999]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="flex justify-between items-center px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700 rounded-t-2xl">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Calendar size={18} /> Create Appointment
          </h2>
          <button
            onClick={onClose}
            className="text-white text-2xl font-bold hover:text-gray-200 leading-none"
          >
            ×
          </button>
        </div>

        {/* FORM */}
        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto px-6 py-5 bg-gray-50 space-y-6 rounded-b-2xl"
        >
          {/* APPOINTMENT SECTION */}
          <section className="bg-white border rounded-xl p-4 shadow-sm">
            <h3 className="text-md font-semibold text-blue-700 mb-3 flex items-center gap-2">
              <Clock size={16} /> Appointment Details
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label={
                  <>
                    Appointment Date <span className="text-red-500">*</span>
                  </>
                }
                type="date"
                name="appointment_date"
                value={formData.appointment_date}
                onChange={handleChange}
                error={errors.appointment_date}
              />

              <ScrollableTimeDropdown
                label={
                  <>
                    Time <span className="text-red-500">*</span>
                  </>
                }
                name="time"
                value={formData.time}
                onChange={handleChange}
                error={errors.time}
              />

              <Input
                label="Custom Time (Optional)"
                name="custom_time"
                value={formData.custom_time}
                onChange={handleChange}
                placeholder="e.g., 7:30 PM or 19:45"
              />

              <Input
                label="Doctor Specialization"
                name="specialization"
                readOnly
                value={resolvedSpecialization}
                className="bg-gray-100"
              />
            </div>
          </section>

          {/* PATIENT SECTION */}
          <section className="bg-white border rounded-xl p-4 shadow-sm">
            <h3 className="text-md font-semibold text-blue-700 mb-3 flex items-center gap-2">
              <User2 size={16} /> Patient Information
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label={
                  <>
                    First Name <span className="text-red-500">*</span>
                  </>
                }
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                error={errors.first_name}
              />

              <Input
                label="Middle Name"
                name="middle_name"
                value={formData.middle_name}
                onChange={handleChange}
              />

              <Input
                label={
                  <>
                    Last Name <span className="text-red-500">*</span>
                  </>
                }
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                error={errors.last_name}
              />

              <Input
                type="date"
                label={
                  <>
                    Date of Birth <span className="text-red-500">*</span>
                  </>
                }
                name="dob"
                value={formData.dob}
                onChange={handleChange}
                error={errors.dob}
              />

              <Select
                label="Gender"
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                options={["Male", "Female", "Other"]}
              />

              <Input
                label="Email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
              />

              <Input
                label="Phone Number"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="e.g., 5551234567"
              />

              <Input
                label="EHR"
                name="ehr"
                value={formData.ehr}
                onChange={handleChange}
              />

              <Input
                label={
                  <>
                    MRN <span className="text-red-500">*</span>
                  </>
                }
                name="mrn"
                value={formData.mrn}
                onChange={handleChange}
                error={errors.mrn}
              />
            </div>
          </section>

          {/* FOOTER */}
          <div className="flex justify-end gap-3 pt-3 border-t">
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-400 text-white px-5 py-2 rounded-lg hover:bg-gray-500"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700"
            >
              {isSubmitting ? "Saving..." : "Save Appointment"}
            </button>
          </div>
        </form>
      </div>

      {showUnsavedConfirm && (
        <UnsavedChangesModal
          onConfirm={() => {
            setShowUnsavedConfirm(false);
            onClose();
          }}
          onCancel={() => setShowUnsavedConfirm(false)}
        />
      )}
    </div>
  );
};

/* ---------------- INPUT ---------------- */
const Input = ({
  label,
  type = "text",
  name,
  value,
  onChange,
  error,
  placeholder,
  readOnly,
  className = "",
}) => (
  <div>
    <label className="block text-xs font-semibold text-gray-600 mb-1">
      {label}
    </label>
    <input
      type={type}
      name={name}
      value={value}
      readOnly={readOnly}
      onChange={onChange}
      placeholder={placeholder}
      className={`border rounded-md w-full p-2 text-sm focus:ring-2 focus:ring-blue-400 ${
        error ? "border-red-500 bg-red-50" : "border-gray-300"
      } ${className}`}
    />
    {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
  </div>
);

/* ---------------- SELECT ---------------- */
const Select = ({ label, name, value, onChange, options }) => (
  <div>
    <label className="block text-xs font-semibold text-gray-600 mb-1">
      {label}
    </label>
    <select
      name={name}
      value={value}
      onChange={onChange}
      className="border border-gray-300 rounded-md w-full p-2 text-sm bg-white"
    >
      <option value="">Select</option>
      {options.map((opt) => (
        <option key={opt}>{opt}</option>
      ))}
    </select>
  </div>
);

/* ---------------- TIME DROPDOWN ---------------- */
const ScrollableTimeDropdown = ({ label, name, value, onChange, error }) => {
  const [open, setOpen] = useState(false);

  const generateTimeSlots = () => {
    let slots = [];
    for (let h = 8; h <= 18; h++) {
      for (let m = 0; m < 60; m += 15) {
        const d = new Date();
        d.setHours(h, m, 0, 0);
        slots.push(
          d.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          })
        );
      }
    }
    return slots;
  };

  const times = generateTimeSlots();

  return (
    <div className="relative">
      <label className="block text-xs font-semibold text-gray-600 mb-1">
        {label}
      </label>

      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`flex justify-between items-center w-full border rounded-md px-3 py-2 text-sm bg-white ${
          error ? "border-red-500 bg-red-50" : "border-gray-300"
        }`}
      >
        {value || "Select time"}
        <ChevronDown size={16} />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full max-h-48 overflow-y-auto bg-white border rounded-lg shadow-lg">
          {times.map((time) => (
            <div
              key={time}
              onClick={() => {
                onChange({ target: { name, value: time } });
                setOpen(false);
              }}
              className={`px-3 py-2 text-sm cursor-pointer hover:bg-blue-50 ${
                value === time ? "bg-blue-100 font-semibold" : ""
              }`}
            >
              {time}
            </div>
          ))}
        </div>
      )}

      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
};

export default CreateAppointmentModal
