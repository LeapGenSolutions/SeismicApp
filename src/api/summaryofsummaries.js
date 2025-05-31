import { SOS_URL } from "../constants";

export const fetchsummaryofsummaries = async (doctor_email, patient_id) => {
  const encodedEmail = encodeURIComponent(doctor_email);
  const url = `${SOS_URL}summaries/${encodedEmail}/${patient_id}`;

  // Log the final URL to the browser console
  console.log("Calling SummaryOfSummaries API:", url);

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ doctor_email, patient_id }), // include if backend uses it
  });

  if (!response.ok) {
    throw new Error("Failed to fetch summary");
  }

  return response.json();
};