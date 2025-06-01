import { BACKEND_URL } from "../constants"; //Added by anusha

export const fetchClustersByAppointment = async (apptId, userID) => {
  const response = await fetch(`${BACKEND_URL}api/clusters/${apptId}?userID=${userID}`);
  if (!response.ok) {
    throw new Error("Failed to fetch clusters data");
  }
  return response.json();
};