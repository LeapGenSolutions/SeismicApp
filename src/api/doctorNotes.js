import { BACKEND_URL } from "../constants";

export const fetchDoctorNotesByAppointment = async (apptId, userID) => {
    const response = await fetch(`${BACKEND_URL}api/doctor-notes/${apptId}?userID=${userID}`);
    if (!response.ok) {
        throw new Error("Failed to fetch doctor notes");
    }
    return response.json();
}

export const updateDoctorNotesByAppointment = async (apptId, userID, updatedNotes, priority = "High") => {
    const checkResponse = await fetch(`${BACKEND_URL}api/doctor-notes/${apptId}?userID=${userID}`);
    if (!checkResponse.ok) {
        // If the notes do not exist, we can create them
        const createResponse = await fetch(`${BACKEND_URL}api/doctor-notes/${apptId}?username=${userID}`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ doctor_notes: updatedNotes , priority: priority })
            }
        );
        if (!createResponse.ok) {
            throw new Error("Failed to create doctor notes");
        }
        return createResponse.json();
    }
    const response = await fetch(
        `${BACKEND_URL}api/doctor-notes/${apptId}?username=${userID}`,
        {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ doctor_notes: updatedNotes, priority: priority })
        }
    );
    if(!response.ok) {
        throw new Error("Failed to update doctor notes");
    }
    return response.json();
}