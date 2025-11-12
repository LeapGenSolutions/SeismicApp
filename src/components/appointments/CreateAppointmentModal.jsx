import { useState } from "react";
import { useSelector } from "react-redux";
import { createAppointment } from "../../api/appointment";
import { createOrUpdatePatient } from "../../api/patient";
import { useToast } from "../../hooks/use-toast";
import UnsavedChangesModal from "../UnsavedChangesModal";
import { Calendar, User2, Clock, ChevronDown } from "lucide-react";
import { v5 as uuidv5 } from "uuid";

const CreateAppointmentModal = ({ username, onClose, onSuccess }) => {
  const { toast } = useToast();
  const loggedInDoctor = useSelector((state) => state.me.me);

  // Doctor details
  const resolvedDoctorName = loggedInDoctor?.name || "Dr. Unknown";
  const resolvedDoctorEmail =
    loggedInDoctor?.email?.toLowerCase() || username?.toLowerCase() || "";
  const resolvedSpecialization =
    loggedInDoctor?.specialization?.trim() || "General Medicine";
  const resolvedDoctorId =
    loggedInDoctor?.oid?.replace(/-/g, "") ||
    uuidv5(resolvedDoctorName, "6ba7b810-9dad-11d1-80b4-00c04fd430c8").replace(
      /-/g,
      ""
    );

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    dob: "",
    gender: "",
    email: "",
    phone: "",
    ehr: "",
    mrn: "",
    appointment_date: "",
    time: "",
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
    if (!formData.first_name.trim()) newErrors.first_name = "First name required";
    if (!formData.last_name.trim()) newErrors.last_name = "Last name required";
    if (!formData.email.trim()) newErrors.email = "Email required";
    if (!formData.phone.trim()) newErrors.phone = "Phone required";
    if (!formData.mrn.trim()) newErrors.mrn = "MRN required";
    if (!formData.appointment_date) newErrors.appointment_date = "Date required";
    if (!formData.time) newErrors.time = "Time required";
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
      newErrors.email = "Invalid email";
    if (formData.phone && !/^\d{10}$/.test(formData.phone))
      newErrors.phone = "10 digits required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toast({
        title: "Incomplete Information",
        description: "Please fill in all required fields correctly.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Step 1: Save or update patient
      const patientPayload = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        dob: formData.dob,
        gender: formData.gender,
        email: formData.email,
        phone: formData.phone.replace(/\D/g, ""),
        ehr: formData.ehr,
        mrn: formData.mrn,
      };

      const createdPatient = await createOrUpdatePatient(patientPayload);

      const patient_id =
        createdPatient?.chatbot_id ||
        createdPatient?.chatbot_patient?.patientID ||
        createdPatient?.chatbot_patient?.original_json?.patientID ||
        createdPatient?.patientID ||
        "";

      if (!patient_id) throw new Error("Missing patient_id from backend");

      // Step 2: Prepare appointment data
      const convertTo24Hour = (t) => {
        if (!t) return "";
        const d = new Date(`1970-01-01 ${t}`);
        return d.toTimeString().slice(0, 5);
      };

      const appointmentData = {
        id: Math.random().toString(36).slice(2, 26),
        type: "appointment",
        first_name: formData.first_name,
        last_name: formData.last_name,
        full_name: `${formData.first_name} ${formData.last_name}`,
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
        time: convertTo24Hour(formData.time),
        status: "scheduled",
        email: formData.email,
        phone: formData.phone.replace(/\D/g, ""),
        patient_id,
        practice_id: "12345",
        appointment_date: formData.appointment_date,
        insurance_provider: "Self-Pay",
        insurance_verified: false,
      };

      await createAppointment(resolvedDoctorEmail, appointmentData);

      toast({
        title: "Appointment Created",
        description: `Appointment for ${formData.first_name} ${formData.last_name} has been saved successfully.`,
        variant: "success",
      });

      onSuccess(appointmentData);
      onClose();
    } catch (err) {
      console.error("Error creating patient record:", err.message);
      toast({
        title: "Error Creating Appointment",
        description: "Something went wrong. Please try again.",
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
        className="bg-white shadow-2xl rounded-2xl w-full max-w-xl h-[85vh] mr-10 mt-10 mb-10 overflow-y-auto flex flex-col transition-all duration-300 border border-blue-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
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

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto px-6 py-5 bg-gray-50 space-y-6 rounded-b-2xl"
        >
          {/* Appointment Section */}
          <section className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
            <h3 className="text-md font-semibold text-blue-700 mb-3 flex items-center gap-2">
              <Clock size={16} /> Appointment Details
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Appointment Date"
                type="date"
                name="appointment_date"
                value={formData.appointment_date}
                onChange={handleChange}
                error={errors.appointment_date}
              />
              <ScrollableTimeDropdown
                label="Time"
                name="time"
                value={formData.time}
                onChange={handleChange}
                error={errors.time}
              />
              <Input
                label="Doctor Specialization"
                name="specialization"
                value={resolvedSpecialization}
                readOnly
                className="bg-gray-100 text-gray-700"
              />
            </div>
          </section>

          {/* Patient Info */}
          <section className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
            <h3 className="text-md font-semibold text-blue-700 mb-3 flex items-center gap-2">
              <User2 size={16} /> Patient Information
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="First Name"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                error={errors.first_name}
              />
              <Input
                label="Last Name"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                error={errors.last_name}
              />
              <Input
                label="Date of Birth"
                type="date"
                name="dob"
                value={formData.dob}
                onChange={handleChange}
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
                error={errors.email}
              />
              <Input
                label="Phone Number"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                error={errors.phone}
                placeholder="e.g., 5551234567"
              />
              <Input label="EHR" name="ehr" value={formData.ehr} onChange={handleChange} />
              <Input
                label="MRN"
                name="mrn"
                value={formData.mrn}
                onChange={handleChange}
                error={errors.mrn}
              />
            </div>
          </section>

          {/* Footer Buttons */}
          <div className="flex justify-end gap-3 pt-3 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-400 text-white px-5 py-2 rounded-lg hover:bg-gray-500 transition text-sm font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 transition text-sm font-medium shadow-md"
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

// Reusable Inputs
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
    <label className="block text-xs font-semibold text-gray-600 mb-1">{label}</label>
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      readOnly={readOnly}
      className={`border rounded-md w-full p-2 text-sm focus:ring-2 focus:ring-blue-400 focus:border-blue-500 transition ${
        error ? "border-red-500 bg-red-50" : "border-gray-300 bg-white"
      } ${className}`}
    />
    {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
  </div>
);

const Select = ({ label, name, value, onChange, options }) => (
  <div>
    <label className="block text-xs font-semibold text-gray-600 mb-1">{label}</label>
    <select
      name={name}
      value={value}
      onChange={onChange}
      className="border border-gray-300 rounded-md w-full p-2 text-sm bg-white focus:ring-2 focus:ring-blue-400 focus:border-blue-500 transition"
    >
      <option value="">Select</option>
      {options.map((opt) => (
        <option key={opt}>{opt}</option>
      ))}
    </select>
  </div>
);

const ScrollableTimeDropdown = ({ label, name, value, onChange, error }) => {
  const [open, setOpen] = useState(false);
  const generateTimeSlots = () => {
    const slots = [];
    for (let h = 8; h <= 18; h++) {
      for (let m = 0; m < 60; m += 15) {
        const d = new Date();
        d.setHours(h, m, 0, 0);
        slots.push(
          d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true })
        );
      }
    }
    return slots;
  };
  const times = generateTimeSlots();
  return (
    <div className="relative">
      <label className="block text-xs font-semibold text-gray-600 mb-1">{label}</label>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`flex justify-between items-center w-full border rounded-md px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-400 ${
          error ? "border-red-500 bg-red-50" : "border-gray-300"
        }`}
      >
        {value || "Select time"}
        <ChevronDown size={16} className="ml-1 text-gray-500" />
      </button>
      {open && (
        <div className="absolute z-50 mt-1 w-full max-h-48 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg">
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