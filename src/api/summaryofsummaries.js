import { useState, useEffect } from "react"; //Added by anusha
import { SOS_URL } from "../constants"; 

export const useSummaryOfSummaries = (doctor_email, patient_id) => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSummary = async () => {
      if (!doctor_email || !patient_id) return;

      setLoading(true);
      const encodedEmail = encodeURIComponent(doctor_email);
      const url = `${SOS_URL}summaries/${encodedEmail}/${patient_id}`;
      console.log("Calling SummaryOfSummaries API:", url);

      try {
        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ doctor_email, patient_id }),
        });

        if (!response.ok) {
          throw new Error("Failed to fetch summary");
        }

        const data = await response.json();
        setSummary(data?.combined_summary || "No summary found");
      } catch (err) {
        setError("Failed to fetch summary of summaries");
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, [doctor_email, patient_id]);

  return { summary, loading, error };
};