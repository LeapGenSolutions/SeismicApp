import { useState } from "react";
import { createAppointment } from "../../api/appointment";
import { useToast } from "../../hooks/use-toast";
import UnsavedChangesModal from "../UnsavedChangesModal";
import { ChevronDown } from "lucide-react";

const CreateAppointmentModal = ({
  username,
  doctorName,
  doctorSpecialization,
  practiceId,    // ✅ dynamically passed
  patientId,     // ✅ dynamically passed
  onClose,
  onSuccess,
}) => {
  const { toast } = useToast();

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
    specialization: doctorSpecialization || "",
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
    if (!formData.first_name.trim()) newErrors.first_name = "First name is required.";
    if (!formData.last_name.trim()) newErrors.last_name = "Last name is required.";
    if (!formData.email.trim()) newErrors.email = "Email is required.";
    if (!formData.phone.trim()) newErrors.phone = "Phone number is required.";
    if (!formData.mrn.trim()) newErrors.mrn = "MRN is required.";
    if (!formData.appointment_date) newErrors.appointment_date = "Appointment date is required.";
    if (!formData.time) newErrors.time = "Appointment time is required.";

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
      newErrors.email = "Please enter a valid email.";
    if (formData.phone && !/^\d{10}$/.test(formData.phone))
      newErrors.phone = "Phone number must be 10 digits.";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please complete all required fields correctly.",
        variant: "destructive",
        duration: 4000,
      });
      return;
    }

    setIsSubmitting(true);

    try {
      //  Keep local date as-is (no UTC conversion)
      const formattedDate = formData.appointment_date || "";
      const normalizedEmail = username?.toLowerCase();

      const convertTo24Hour = (time12h) => {
        if (!time12h) return "";
        const date = new Date(`1970-01-01 ${time12h}`);
        return date.toTimeString().slice(0, 5);
      };

      const appointmentData = {
        ...formData,
        phone: formData.phone.replace(/\D/g, ""),
        appointment_date: formattedDate,
        dob: formData.dob || "", //  store dob as yyyy-mm-dd
        time: convertTo24Hour(formData.time),
        full_name: `${formData.first_name} ${formData.last_name}`.trim(),
        status: "scheduled",
        user_id: normalizedEmail,
        doctor_email: normalizedEmail,
        doctor_name: doctorName
          ? `Dr. ${doctorName.replace(/^Dr\.\s*/i, "").replace(/\b\w/g, (ch) => ch.toUpperCase())}`
          : "",
        specialization: formData.specialization || doctorSpecialization || "General",
       practice_id: 11130,
      patient_id: 1000, 
        clinic_name: "",
        clinic_code: "",
      };

      const newAppt = await createAppointment(normalizedEmail, appointmentData);

      toast({
        title: "Appointment Created",
        description: `New appointment for ${appointmentData.full_name} saved successfully.`,
        variant: "success",
      });

      onSuccess({
        ...appointmentData,
        id: newAppt?.id || Date.now().toString(),
      });
      onClose();
    } catch (err) {
      console.error("Error creating appointment:", err);
      toast({
        title: "Failed to Create Appointment",
        description: "There was an issue saving the appointment. Please try again.",
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
          const hasFilledField = Object.values(formData).some(
            (value) => value && value.toString().trim() !== ""
          );
          if (hasFilledField) setShowUnsavedConfirm(true);
          else onClose();
        }
      }}
    >
      <div
        className="bg-white border border-gray-200 shadow-2xl rounded-2xl w-full max-w-xl h-[65vh] mr-10 mt-10 mb-10 overflow-y-auto flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center px-5 py-3 border-b bg-gray-50 rounded-t-2xl">
          <h2 className="text-lg font-semibold text-gray-800">Create Appointment</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-red-600 text-2xl font-bold leading-none"
          >
            ×
          </button>
        </div>

        {/* --- FORM CONTENT --- */}
        <form
          onSubmit={handleSubmit}
          noValidate
          className="flex-1 overflow-y-auto px-5 py-4 bg-white rounded-b-2xl space-y-5"
        >
          {/* Appointment Details — on top */}
          <section>
            <h3 className="text-md font-semibold text-black-700 mb-2 border-b border-black-100 pb-1">
              Appointment Details
            </h3>
            <div className="grid grid-cols-2 gap-3">
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
            </div>
          </section>

          {/* Patient Info */}
          <section>
            <h3 className="text-md font-semibold text-black-700 mb-2 border-b border-black-100 pb-1">
              Patient Information
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <Input label="First Name" name="first_name" value={formData.first_name} onChange={handleChange} error={errors.first_name} />
              <Input label="Last Name" name="last_name" value={formData.last_name} onChange={handleChange} error={errors.last_name} />
              <Input label="DOB" type="date" name="dob" value={formData.dob} onChange={handleChange} />
              <Select label="Gender" name="gender" value={formData.gender} onChange={handleChange} options={["Male", "Female", "Other"]} />
              <Input label="Email" type="email" name="email" value={formData.email} onChange={handleChange} error={errors.email} />
              <Input label="Phone Number" name="phone" value={formData.phone} onChange={handleChange} error={errors.phone} placeholder="e.g., 5551234567" />
              <Input label="EHR" name="ehr" value={formData.ehr} onChange={handleChange} />
              <Input label="MRN" name="mrn" value={formData.mrn} onChange={handleChange} error={errors.mrn} />
            </div>
          </section>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-3 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition text-sm"
            >
              {isSubmitting ? "Saving..." : "Save"}
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

// --- Input Component ---
const Input = ({ label, type = "text", name, value, onChange, error, placeholder }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      aria-invalid={!!error}
      className={`border rounded-md w-full p-2 focus:ring-blue-500 focus:border-blue-500 text-sm ${
        error ? "border-red-500 bg-red-50" : "border-gray-300"
      }`}
    />
    {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
  </div>
);

// --- Select Component ---
const Select = ({ label, name, value, onChange, options }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    <select
      name={name}
      value={value}
      onChange={onChange}
      className="border border-gray-300 rounded-md w-full p-2 text-sm bg-white focus:ring-blue-500 focus:border-blue-500"
    >
      <option value="">Select</option>
      {options.map((opt) => (
        <option key={opt}>{opt}</option>
      ))}
    </select>
  </div>
);

// --- Scrollable Time Dropdown ---
const ScrollableTimeDropdown = ({ label, name, value, onChange, error }) => {
  const [open, setOpen] = useState(false);

  const generateTimeSlots = () => {
    const slots = [];
    const start = 8;
    const end = 18;
    for (let hour = start; hour <= end; hour++) {
      for (let min = 0; min < 60; min += 15) {
        const date = new Date();
        date.setHours(hour, min, 0, 0);
        slots.push(date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true }));
      }
    }
    return slots;
  };

  const times = generateTimeSlots();

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`flex justify-between items-center w-full border rounded-md px-3 py-2 text-sm ${
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