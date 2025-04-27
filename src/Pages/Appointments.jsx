import { useEffect } from "react";
import Calendar from "../components/appointments/Calendar";
import AppointmentDetails from "../components/appointments/AppointmentDetails";

function Appointments() {
  useEffect(() => {
    document.title = "Appointments - Seismic Connect";
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Appointments</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Calendar />
        </div>
        <div>
          <AppointmentDetails />
        </div>
      </div>
    </div>
  );
}

export default Appointments;
