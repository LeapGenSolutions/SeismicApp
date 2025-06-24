import { BACKEND_URL } from "../constants";

// Fetch doctor notes by appointment ID and user ID
export const fetchDoctorNotesByAppointment = async (apptId, userID) => {
  const response = await fetch(
    `${BACKEND_URL}api/doctor-notes/${apptId}?userID=${userID}`
  );
  if (!response.ok) {
    throw new Error("Failed to fetch doctor notes");
  }
  return response.json();
};

// Update doctor notes by appointment ID and user ID
export const updateDoctorNotesByAppointment = async (apptId, userID, updatedNotes) => {
  const response = await fetch(
    `${BACKEND_URL}api/doctor-notes/${apptId}?username=${userID}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        notes: updatedNotes // assuming backend will wrap this inside `data`
      })
    }
  );

  if (!response.ok) {
    throw new Error("Failed to update doctor notes");
  }

  return response.json();
};