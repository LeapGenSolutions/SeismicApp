import { useEffect } from "react";
import AppointmentCalendar from "../components/appointments/AppointmentCalendar";
import { useDispatch, useSelector } from "react-redux";
import { fetchAppointmentDetails } from "../redux/appointment-actions";

function Appointments() {
  useEffect(() => {
    document.title = "Appointments - Seismic Connect";
  }, []);

  const dispatch = useDispatch();
  const myEmail = useSelector((state) => state.me.me.email);
  const appointments = useSelector((state) => state.appointments.appointments);

  useEffect(() => {
    if (appointments?.length === 0 && myEmail) {
      dispatch(fetchAppointmentDetails(myEmail));
    }
  }, [dispatch, appointments, myEmail]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Appointments</h1>
      <div className="grid grid-cols-1">
        {/*  Pass only what needed, safely */}
        <AppointmentCalendar />
      </div>
    </div>
  );
}

export default Appointments
