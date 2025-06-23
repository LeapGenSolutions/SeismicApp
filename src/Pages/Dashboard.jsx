import { useEffect, useState } from "react";
import WelcomeCard from "../components/dashboard/WelcomeCard";
import AppointmentStats from "../components/dashboard/AppointmentStats";
import AppointmentStatus from "../components/dashboard/AppointmentStatus";
import ProviderWorkload from "../components/dashboard/ProviderWorkload";
import { fetchAppointmentDetails } from "../redux/appointment-actions";
import { useDispatch, useSelector } from "react-redux";
import { useLocation } from "wouter";

function Dashboard() {
  const dispatch = useDispatch();
  const myEmail = useSelector((state) => state.me.me.email);
  const appointments = useSelector((state) => state.appointments.appointments);
  const [currentLayout, setCurrentLayout] = useState('original');
  const [, navigate] = useLocation();

  const layouts = [
    { id: 'original', name: 'Original Layout' },
    { id: 'compact', name: 'Compact Layout' },
    { id: 'expanded', name: 'Expanded Layout' }
  ];

  useEffect(() => {
    if (appointments?.length === 0 && myEmail) {
      dispatch(fetchAppointmentDetails(myEmail));
    }
  }, [dispatch, appointments, myEmail]);

  useEffect(() => {
    document.title = "Dashboard - Seismic Connect";
  }, []);

  const handleLayoutChange = (newLayout) => {
    setCurrentLayout(newLayout);
    // Add any layout-specific logic here
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <WelcomeCard />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AppointmentStats date={new Date().toISOString().split('T')[0]} />
        <div style={{ cursor: "pointer" }} onClick={() => navigate("/timeline") }>
          <AppointmentStatus date={new Date().toISOString().split('T')[0]} />
        </div>
        <ProviderWorkload date={new Date().toISOString().split('T')[0]} />
      </div>
    </div>
  );
}

export default Dashboard;
