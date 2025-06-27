import { useState } from "react";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Button } from "../components/ui/button";

function AddPatientModal({ onClose, onAddPatient }) {
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone_number: "",
    date_of_birth: "",
    insurance_provider: "",
    insurance_id: "",
  });

  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};
    if (!form.first_name.trim()) newErrors.first_name = "First name is required";
    if (!form.last_name.trim()) newErrors.last_name = "Last name is required";
    if (!form.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(form.email)) {
      newErrors.email = "Email is invalid";
    }
    if (!form.phone_number.trim()) newErrors.phone_number = "Phone number is required";
    if (!form.date_of_birth) newErrors.date_of_birth = "Date of birth is required";
    return newErrors;
  };

  const handleSubmit = () => {
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    const newPatient = {
      ...form,
      patientId: Date.now(),
    };

    onAddPatient(newPatient);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl overflow-hidden">
        <div className="flex flex-col md:flex-row max-h-[90vh]">
          {/* Modal Left (Header and Scrollable Body) */}
          <div className="flex-1 overflow-y-auto p-6">
            <h2 className="text-xl font-semibold mb-4">Add New Patient</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { label: "First Name", key: "first_name", type: "text" },
                { label: "Last Name", key: "last_name", type: "text" },
                { label: "Email", key: "email", type: "email" },
                { label: "Phone Number", key: "phone_number", type: "text" },
                { label: "Date of Birth", key: "date_of_birth", type: "date" },
                { label: "Insurance Provider", key: "insurance_provider", type: "text" },
                { label: "Insurance ID", key: "insurance_id", type: "text" },
              ].map(({ label, key, type }) => (
                <div key={key}>
                  <Label className="block text-sm font-medium text-gray-700 mb-1">
                    {label}
                  </Label>
                  <Input
                    type={type}
                    value={form[key]}
                    onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                    className="w-full"
                  />
                  {errors[key] && (
                    <p className="text-sm text-red-500 mt-1">{errors[key]}</p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Modal Footer (fixed at bottom or right side) */}
          <div className="w-full md:w-[300px] border-t md:border-t-0 md:border-l p-6 flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-medium mb-2">Actions</h3>
              <p className="text-sm text-gray-500 mb-4">
                Fill in the required details and click “Add Patient”.
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={handleSubmit}>Add Patient</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AddPatientModal;
