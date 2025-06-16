import { BACKEND_URL } from "../constants";
import { appointmentActions } from "./appointment-slice";

// ✅ Existing function — do NOT remove
export const fetchAppointmentDetails = (email) => {
  return async (dispatch) => {
    const fetchAppointments = async () => {
      const response = await fetch(
        `${BACKEND_URL}api/appointments/${email}`
      );

      if (!response.ok) {
        throw new Error('Could not fetch appointment data!');
      }

      const data = await response.json();
      const appts = data.map((appt) => {
        const date = appt.id;
        const thatDaysAppts = appt.data.map((apptTemp) => ({
          ...apptTemp,
          date,
        }));
        return thatDaysAppts;
      });

      return appts.flat();
    };

    try {
      const appointmentData = await fetchAppointments();
      dispatch(appointmentActions.setAppointments(appointmentData));
    } catch (error) {
      throw new Error('Could not fetch appointment data!');
    }
  };
};

// ✅ New function — for fetching all appointments (Patients page)
export const fetchAllAppointments = () => {
  return async (dispatch) => {
    const fetchAppointments = async () => {
      const response = await fetch(`${BACKEND_URL}api/appointments`);

      if (!response.ok) {
        throw new Error("Could not fetch appointment data!");
      }

      const data = await response.json();
      const appts = data.map((appt) => {
        const date = appt.id;
        const thatDaysAppts = appt.data.map((apptTemp) => ({
          ...apptTemp,
          date,
        }));
        return thatDaysAppts;
      });

      return appts.flat();
    };

    try {
      const appointmentData = await fetchAppointments();
      dispatch(appointmentActions.setAppointments(appointmentData));
    } catch (error) {
      console.error("Error loading appointments:", error);
    }
  };
};
