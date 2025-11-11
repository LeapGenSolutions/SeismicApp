import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import {
  XCircle,
  User2,
  CalendarDays,
  ChevronDown,
  Clock,
} from "lucide-react";
import { createAppointment } from "../../api/appointment";
import { createOrUpdatePatient } from "../../api/patient";
import { useToast } from "../../hooks/use-toast";
import { useSelector, useDispatch } from "react-redux";
import { fetchPatientsDetails } from "../../redux/patient-actions";
import { fetchAppointmentDetails } from "../../redux/appointment-actions";

const AddPatientModal = ({ onClose, onSuccess }) => {
  const { toast } = useToast();
  const dispatch = useDispatch();

  const patients = useSelector((state) => state.patients.patients || []);
  const loggedInDoctor = useSelector((state) => state.me.me);
  const doctorEmail = loggedInDoctor?.email?.toLowerCase() || "doctor@example.com";

  const [formData, setFormData] = useState({
    firstname: "",
    lastname: "",
    ehr: "",
    mrn: "",
    dob: "",
    gender: "",
    email: "",
    phone: "",
    appointment_date: "",
    time: "",
  });

  const [existingPatient, setExistingPatient] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showTimeDropdown, setShowTimeDropdown] = useState(false);

  // 🕐 Time slots: 8 AM – 8 PM (30 min intervals)
  const timeSlots = [];
  for (let hour = 8; hour <= 20; hour++) {
    timeSlots.push(`${hour.toString().padStart(2, "0")}:00`);
    timeSlots.push(`${hour.toString().padStart(2, "0")}:30`);
  }

  // Detect existing patient
  useEffect(() => {
    const found = patients.find(
      (p) =>
        p.email === formData.email ||
        p.contactmobilephone === formData.phone ||
        p.mrn === formData.mrn ||
        p.ehr === formData.ehr
    );
    setExistingPatient(found || null);
  }, [formData.email, formData.phone, formData.mrn, formData.ehr, patients]);

  // Prefill known patient data
  useEffect(() => {
    if (existingPatient) {
      setFormData((prev) => ({
        ...prev,
        firstname: existingPatient.firstname || prev.firstname,
        lastname: existingPatient.lastname || prev.lastname,
        dob: existingPatient.dob || prev.dob,
        email: existingPatient.email || prev.email,
        phone: existingPatient.contactmobilephone || prev.phone,
        ehr: existingPatient.ehr || prev.ehr,
        mrn: existingPatient.mrn || prev.mrn,
        gender: existingPatient.gender || prev.gender,
      }));
    }
  }, [existingPatient]);

  const formatTime12hr = (timeStr) => {
    if (!timeStr) return "";
    const [h, m] = timeStr.split(":");
    const d = new Date();
    d.setHours(h);
    d.setMinutes(m);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      let patientId;
      if (existingPatient) {
        patientId = existingPatient.patient_id;
      } else {
        patientId = Math.floor(1000 + Math.random() * 9000).toString();
        await createOrUpdatePatient({ ...formData, patient_id: patientId });
      }

      await createAppointment(doctorEmail, {
        patient_id: patientId,
        appointment_date: formData.appointment_date,
        time: formatTime12hr(formData.time),
      });

      toast({
        title: existingPatient
          ? "Appointment Created"
          : "Patient & Appointment Created",
        description: existingPatient
          ? `New appointment scheduled for ${existingPatient.firstname} ${existingPatient.lastname}.`
          : "New patient record and appointment created successfully.",
      });

      await Promise.all([
        dispatch(fetchPatientsDetails()),
        dispatch(fetchAppointmentDetails([doctorEmail])),
      ]);

      if (typeof onSuccess === "function") await onSuccess();
      onClose();
    } catch (err) {
      console.error("❌ Error:", err);
      toast({
        title: "Error",
        description: "Something went wrong while saving appointment.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed top-[60px] right-[30px] z-50"
        initial={{ x: "100%", opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: "100%", opacity: 0 }}
        transition={{ type: "spring", stiffness: 100, damping: 20 }}
      >
        <motion.div
          className="bg-white w-[480px] rounded-xl shadow-2xl border border-gray-200 overflow-y-auto max-h-[85vh]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex justify-between items-center px-6 py-3 rounded-t-xl">
            <div className="flex items-center gap-2">
              <CalendarDays className="w-5 h-5" />
              <h2 className="text-lg font-semibold">Add Patient/Create Appointment</h2>
            </div>
            <button onClick={onClose}>
              <XCircle className="w-6 h-6 hover:opacity-80 transition" />
            </button>
          </div>

          {/* Body */}
          <div className="p-5 space-y-6">
            {existingPatient && (
              <div className="bg-blue-50 border-l-4 border-blue-600 p-4 rounded-lg">
                <p className="text-blue-800 font-semibold">
                  Patient already exists — {existingPatient.firstname}{" "}
                  {existingPatient.lastname}
                </p>
                <p className="text-sm text-gray-600">
                  EHR: {existingPatient.ehr || "N/A"} | MRN:{" "}
                  {existingPatient.mrn || "N/A"}
                </p>
              </div>
            )}

            {/* Appointment section */}
            <div className="rounded-lg border border-blue-100">
              <div className="bg-blue-50 px-4 py-2 border-b flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-blue-700" />
                <h3 className="text-sm font-semibold text-blue-800">
                  Appointment Details
                </h3>
              </div>
              <div className="grid grid-cols-2 gap-4 p-4 relative">
                <div>
                  <label className="text-sm text-gray-600">Date</label>
                  <Input
                    name="appointment_date"
                    type="date"
                    value={formData.appointment_date}
                    onChange={handleChange}
                  />
                </div>

                {/* Custom time dropdown */}
                <div className="relative">
                  <label className="text-sm text-gray-600">Time</label>
                  <div
                    className="flex items-center border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-700 cursor-pointer hover:border-blue-400"
                    onClick={() => setShowTimeDropdown(!showTimeDropdown)}
                  >
                    <Clock className="w-4 h-4 mr-2 text-blue-600" />
                    {formData.time ? formatTime12hr(formData.time) : "Select time"}
                    <ChevronDown className="ml-auto w-4 h-4 text-gray-500" />
                  </div>

                  {showTimeDropdown && (
                    <div className="absolute z-10 bg-white border border-gray-200 rounded-md mt-1 max-h-48 overflow-y-auto shadow-md w-full">
                      {timeSlots.map((slot) => (
                        <div
                          key={slot}
                          className="px-3 py-2 text-sm hover:bg-blue-50 cursor-pointer"
                          onClick={() => {
                            setFormData({ ...formData, time: slot });
                            setShowTimeDropdown(false);
                          }}
                        >
                          {formatTime12hr(slot)}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Patient info */}
            <div className="rounded-lg border border-blue-100">
              <div className="bg-blue-50 px-4 py-2 border-b flex items-center gap-2">
                <User2 className="w-5 h-5 text-blue-700" />
                <h3 className="text-sm font-semibold text-blue-800">
                  Patient Information
                </h3>
              </div>

              <div className="grid grid-cols-2 gap-4 p-4">
                <Input name="firstname" placeholder="First Name" value={formData.firstname} onChange={handleChange} />
                <Input name="lastname" placeholder="Last Name" value={formData.lastname} onChange={handleChange} />
                <Input name="dob" type="date" value={formData.dob} onChange={handleChange} />
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="border border-gray-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-500 w-full"
                >
                  <option value="">Gender</option>
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                  <option value="Other">Other</option>
                </select>
                <Input name="email" type="email" placeholder="Email" value={formData.email} onChange={handleChange} />
                <Input name="phone" type="tel" placeholder="Phone" value={formData.phone} onChange={handleChange} />
                <Input name="ehr" placeholder="EHR" value={formData.ehr} onChange={handleChange} />
                <Input name="mrn" placeholder="MRN" value={formData.mrn} onChange={handleChange} />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 px-6 py-4 border-t bg-gray-50 rounded-b-xl">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white"
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting
                ? "Saving..."
                : existingPatient
                ? "Schedule Appointment"
                : "Save & Create"}
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AddPatientModal