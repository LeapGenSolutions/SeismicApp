import { BACKEND_URL } from "../constants";
import { appointmentActions } from "./appointment-slice";

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
                const date = appt.id
                const thatDaysAppts = appt.data.map((apptTemp) => {
                    return {
                        ...apptTemp,
                        date
                    }
                })
                return thatDaysAppts
            })
            return appts.flat();
        }

        try {
            const appointmentData = await fetchAppointments()
            dispatch(appointmentActions.setAppointments(appointmentData))
        } catch (error) {
            throw new Error('Could not fetch appointment data!');
        }
    }
}

export const fetchAppointmentsByDoctors = (emails = []) => {
  return async (dispatch) => {
    const fetchAppointments = async () => {
      const allAppointments = [];

      for (const email of emails) {
        const response = await fetch(`${BACKEND_URL}api/appointments/${email}`);
        if (!response.ok) {
          throw new Error(`Could not fetch appointments for ${email}`);
        }
        const data = await response.json();
        const formatted = data.flatMap((appt) =>
          appt.data.map((d) => ({ ...d, date: appt.id }))
        );
        allAppointments.push(...formatted);
      }

      return allAppointments;
    };

    try {
      const data = await fetchAppointments();
      dispatch(appointmentActions.setAppointments(data));
    } catch (err) {
      console.error(err);
    }
  };
}

export const fetchAppointmentsViaPost = (emails = []) => {
  return async (dispatch) => {
    const fetchAppointments = async () => {
      const response = await fetch(`${BACKEND_URL}api/appointments/multi`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emails }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch appointments for doctors");
      }

      const data = await response.json();
      const formatted = data.flatMap((appt) =>
        appt.data.map((d) => ({ ...d, date: appt.id }))
      );

      return formatted;
    };

    try {
      const appointmentData = await fetchAppointments();
      dispatch(appointmentActions.setAppointments(appointmentData));
    } catch (err) {
      console.error(err);
    }
  };
}
