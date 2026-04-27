// api/recommendations.js
import { BACKEND_URL } from "../constants"

export const fetchRecommendationByAppointment = async (apptId, userID) => {
  const response = await fetch(`${BACKEND_URL}/api/recommendations/${apptId}?userID=${userID}`);
  if (!response.ok) {
    throw new Error('Failed to fetch recommendations');
  }
  return response.json();
};

// NEW FUNCTION TO ADD
export const postRecommendationsToAthena = async (apptId, userID, textPayload) => {
  const response = await fetch(`${BACKEND_URL}/api/athena/post-recommendations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      appointmentId: apptId,
      userID: userID,
      recommendations: textPayload 
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to post recommendations to Athena');
  }
  return response.json();
};