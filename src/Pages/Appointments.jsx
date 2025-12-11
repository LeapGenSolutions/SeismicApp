import { useEffect } from "react";
import AppointmentCalendar from "../components/appointments/AppointmentCalendar";
import { useDispatch, useSelector } from "react-redux";
import { fetchAppointmentDetails } from "../redux/appointment-actions";
import { PageNavigation } from "../components/ui/page-navigation";

function Appointments() {
  useEffect(() => {
    document.title = "Appointments - Seismic Connect";
  }, []);

  const dispatch = useDispatch();
  const myEmail = useSelector((state) => state.me.me.email);

  useEffect(() => {
    if (myEmail) {
      dispatch(fetchAppointmentDetails(myEmail));
    }
  }, [dispatch, myEmail]);

  return (
    <div className="space-y-6 px-4">

      <PageNavigation
        title="Appointments"
        subtitle="Manage all appointments and schedules"
        showBackButton={true}
      />
      <AppointmentCalendar />
    </div>
  );
}

export default Appointments