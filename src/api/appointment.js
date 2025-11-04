import { BACKEND_URL } from "../constants";

export const createAppointment = async (userID, appointmentData) => {
  const response = await fetch(
    `${BACKEND_URL}api/appointments/${userID}/custom/appointment`,
    {
      method: "POST",
      body: JSON.stringify(appointmentData),
      headers: { "Content-Type": "application/json" },
    }
  );

  if (!response.ok) {
    const errText = await response.text();
    console.log("Failed to create appointment:", errText);
    throw new Error(
      `Appointment creation failed: ${response.status} ${response.statusText}`
    );
  }

  return response.json();
};

