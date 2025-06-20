import * as React from "react";
import { useEffect, useState } from "react";
import WelcomeCard from "../components/dashboard/WelcomeCard";
import AppointmentStats from "../components/dashboard/AppointmentStats";
import AppointmentStatus from "../components/dashboard/AppointmentStatus";
import ProviderWorkload from "../components/dashboard/ProviderWorkload";
import { fetchAppointmentDetails } from "../redux/appointment-actions";
import { useDispatch, useSelector } from "react-redux";
import { BackButton, DashboardLayout } from "../components/ui/back-button";
import { RootState } from "../redux/store";

interface AppState {
  me: {
    me: {
      email: string;
    };
  };
  appointments: {
    appointments: any[];
  };
}

function Dashboard() {
  const dispatch = useDispatch();
  const myEmail = useSelector((state: RootState) => state.me.me.email);
  const appointments = useSelector((state: RootState) => state.appointments.appointments);
  const [currentLayout, setCurrentLayout] = useState<DashboardLayout>('original');

  const layouts = [
    { id: 'original' as DashboardLayout, name: 'Original Layout' },
    { id: 'compact' as DashboardLayout, name: 'Compact Layout' },
    { id: 'expanded' as DashboardLayout, name: 'Expanded Layout' }
  ];

  useEffect(() => {
    if (appointments?.length === 0 && myEmail) {
      dispatch(fetchAppointmentDetails(myEmail));
    }
  }, [dispatch, appointments, myEmail]);

  useEffect(() => {
    document.title = "Dashboard - Seismic Connect";
  }, []);

  const handleLayoutChange = (newLayout: DashboardLayout) => {
    setCurrentLayout(newLayout);
    // Add any layout-specific logic here
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <WelcomeCard />
        <BackButton layouts={layouts} onLayoutChange={handleLayoutChange} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AppointmentStats date={new Date()} />
        <AppointmentStatus date={new Date()} />
        <ProviderWorkload date={new Date()} />
      </div>
    </div>
  );
}

export default Dashboard; 