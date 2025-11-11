import { BACKEND_URL } from "../constants";

export const createOrUpdatePatient = async (payload) => {
  try {
    // Normalize and clone input safely
    const normalizedEmail = payload.email?.toLowerCase().trim();
    const chatbotPayload = { ...payload, email: normalizedEmail };
    delete chatbotPayload.ssn; // Chatbot DB auto-generates SSN

    console.info("Saving to seismic-chat-bot → Patients ...");

    // Save to seismic-chat-bot
    const chatbotResponse = await fetch(`${BACKEND_URL}api/patients/add`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(chatbotPayload),
    });

    if (!chatbotResponse.ok) {
      const text = await chatbotResponse.text();
      console.error("Chatbot DB save failed:", text);
      throw new Error(`Chatbot DB failed: ${chatbotResponse.status}`);
    }

    const chatbotPatient = await chatbotResponse.json();
    const chatbotPatientId =
      chatbotPatient?.patientID ||
      chatbotPatient?.original_json?.patientID ||
      chatbotPatient?.id;

    console.info(" Chatbot → saved patient:", chatbotPatientId);

    // Prepare Seismic DB payload
    const seismicPayload = {
      ...payload,
      email: normalizedEmail,
      ssn: String(chatbotPatientId || payload.patient_id || ""), // mirror SSN = patientID
    };

    console.info("Saving to seismic-db → patients ...");

    const seismicResponse = await fetch(`${BACKEND_URL}api/patients/add/seismic`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(seismicPayload),
    });

    if (!seismicResponse.ok) {
      const text = await seismicResponse.text();
      console.error("Seismic DB save failed:", text);
      throw new Error(`Seismic DB failed: ${seismicResponse.status}`);
    }

    const seismicPatient = await seismicResponse.json();
    console.info("Seismic → saved patient:", seismicPatient.id);

    // Return unified dual-save result
    return {
      chatbot_id: chatbotPatientId,
      seismic_id: seismicPatient.id,
      chatbot_patient: chatbotPatient,
      seismic_patient: seismicPatient,
      message: "Patient successfully saved in both databases ",
    };
  } catch (error) {
    console.error("Error in createOrUpdatePatient dual-save:", error);
    throw error;
  }
};