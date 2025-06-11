import { fetchBillingByAppointment, updateBillingByAppointment } from "../../api/billingcodes";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import { useState, useEffect } from "react";

import ReactMarkdown from "react-markdown";


const Billing = ({ appointmentId }) => {
  const username = useSelector((state) => state.me.me.name);


  const { data, isLoading, refetch } = useQuery({
    queryKey: ["billing-codes", appointmentId, username], // MUST be an array
    queryFn: () =>
      fetchBillingByAppointment(appointmentId, username),
  });

  const [isEditing, setIsEditing] = useState(false);
  const [billingCodes, setBillingCodes] = useState("");

  useEffect(() => {
    if (data?.data?.billing_codes) {
      setBillingCodes(data.data.billing_codes);
    }
  }, [data]);

  const mutation = useMutation({
    mutationFn: (updatedCodes) =>
      updateBillingByAppointment(appointmentId, username, updatedCodes),
    onSuccess: () => {
      refetch();
      setIsEditing(false);
      alert("Billing codes saved successfully.");
    },
    onError: () => {
      alert("Failed to save billing codes.");
    },
  });

  const handleEditClick = () => {
    setIsEditing(true);
  };

  const handleSave = () => {
    if (!billingCodes || billingCodes.trim() === "") {
      alert("Billing code cannot be empty.");
      return;
    }

    mutation.mutate(billingCodes);
  };

  if (isLoading) return <p>Loading billing codes...</p>;

  return (
    <div className="space-y-4">
      {!isEditing && (
        <>
          <ReactMarkdown>{billingCodes}</ReactMarkdown>
          <button
            onClick={handleEditClick}
            className="bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700"
          >
            Edit
          </button>
        </>
      )}

      {isEditing && (
        <>
          <label className="block text-sm font-medium text-gray-700">Edit Billing Codes</label>
          <textarea
            className="w-full border border-gray-300 rounded p-2"
            rows={6}
            value={billingCodes}
            onChange={(e) => setBillingCodes(e.target.value)}
            placeholder="Enter billing codes (e.g., CPT: 99213, ICD-10: E11.9)"
          />
          <div className="flex gap-4 mt-2">
            <button
              onClick={handleSave}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
              disabled={mutation.isLoading}
            >
              {mutation.isLoading ? "Saving..." : "Save"}
            </button>
            <button
              onClick={() => {
                setIsEditing(false);
                setBillingCodes(data?.data?.billing_codes || ""); // reset to backend value
              }}
              className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
            >
              Cancel
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default Billing;
