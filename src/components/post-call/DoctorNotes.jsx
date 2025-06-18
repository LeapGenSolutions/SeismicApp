import { useQuery, useMutation } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import { useEffect, useState } from "react";
import { fetchDoctorNotesByAppointment, updateDoctorNotesByAppointment } from "../../api/doctorNotes";
import ReactMarkdown from "react-markdown";
import LoadingCard from "./LoadingCard";

const DoctorNotes = ({ appointmentId }) => {
  const username = useSelector((state) => state.me.me.email);
  const queryKey = ["doctor-notes", appointmentId];
  const [isEditing, setIsEditing] = useState(false);
  const [notes, setNotes] = useState("");

  const { data, isLoading, refetch } = useQuery({
    queryKey,
    queryFn: () =>
      fetchDoctorNotesByAppointment(`${username}_${appointmentId}_doctor_notes`, username)
  });

  useEffect(() => {
    if (data?.data?.notes) {
      setNotes(data.data.notes);
    }
  }, [data]);

  const mutation = useMutation({
    mutationFn: (updatedNotes) =>
      updateDoctorNotesByAppointment(
        `${username}_${appointmentId}_doctor_notes`,
        username,
        updatedNotes
      ),
    onSuccess: () => {
      refetch();
      setIsEditing(false);
    },
    onError: () => {
      console.error("Failed to update doctor notes.");
    },
  });

  const handleSave = () => {
    if (!notes || notes.trim() === "") {
      alert("Doctor notes cannot be empty.");
      return;
    }
    mutation.mutate(notes);
  };

    if (isLoading) {
    return (
        <LoadingCard message="The shift may end, but notes live on… Doctor in-call notes coming right up!" />
    );
    }

  return (
    <div className="space-y-4">
      {!isEditing && (
        <>
          <ReactMarkdown>{notes || "*No notes available.*"}</ReactMarkdown>
          <button
            onClick={() => setIsEditing(true)}
            className="bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700"
          >
            Edit
          </button>
        </>
      )}

      {isEditing && (
        <>
          <label className="block text-sm font-medium text-gray-700">
            Edit Doctor's Notes
          </label>
          <textarea
            className="w-full border border-gray-300 rounded p-2"
            rows={6}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Enter doctor's notes here..."
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
                setNotes(data?.data?.notes || "");
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

export default DoctorNotes;