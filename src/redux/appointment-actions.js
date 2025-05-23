import { appointmentActions } from "./appointment-slice";

export const fetchAppointmentDetails = () => {
    return async (dispatch) => {
        const fetchAppointments = async () => {
            const response = await fetch(
                'https://seismic-backend-04272025-bjbxatgnadguabg9.centralus-01.azurewebsites.net/api/appointments'
            );

            if (!response.ok) {
                throw new Error('Could not fetch appointment data!');
            }

            const data = await response.json();

            return data;
        }

        try {
            const appointmentData = await fetchAppointments()
            dispatch(appointmentActions.setAppointments(appointmentData))
        } catch (error) {
            throw new Error('Could not fetch appointment data!');
        }
    }
}