import { useEffect} from "react";
import AppointmentCalendar from "../components/appointments/AppointmentCalendar";
import { useDispatch } from "react-redux";
import { fetchAppointmentDetails } from "../redux/appointment-actions";

function Appointments() {
  useEffect(() => {
    document.title = "Appointments - Seismic Connect";
  }, []);

  const dispatch = useDispatch();
  

  useEffect(() => {
    dispatch(fetchAppointmentDetails())
  }, [dispatch]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Appointments</h1>
      <div className="grid grid-cols-1">
          <AppointmentCalendar />
      </div>
    </div>
  );
}

export default Appointments;
