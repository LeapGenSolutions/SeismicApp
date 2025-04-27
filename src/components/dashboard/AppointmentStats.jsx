import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Progress } from "../ui/progress";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";

const AppointmentStats = ({ date = format(new Date(), "yyyy-MM-dd") }) => {
  const formattedDate = format(new Date(date), "MMMM d, yyyy");

  const { data: stats, isLoading } = useQuery({
    queryKey: [`/api/stats/appointments/${date}`],
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Today's Appointments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-neutral-200 rounded w-3/4"></div>
            <div className="h-2 bg-neutral-200 rounded w-full"></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="h-4 bg-neutral-200 rounded w-1/2"></div>
                <div className="h-2 bg-neutral-200 rounded w-full"></div>
              </div>
              <div className="space-y-2">
                <div className="h-4 bg-neutral-200 rounded w-1/2"></div>
                <div className="h-2 bg-neutral-200 rounded w-full"></div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalAppointments = stats?.totalAppointments || 0;
  const inPersonAppointments = stats?.inPersonAppointments || 0;
  const virtualAppointments = stats?.virtualAppointments || 0;

  const inPersonPercentage =
    totalAppointments > 0
      ? (inPersonAppointments / totalAppointments) * 100
      : 0;

  const virtualPercentage =
    totalAppointments > 0 ? (virtualAppointments / totalAppointments) * 100 : 0;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between mb-2">
          <CardTitle className="text-lg">Today's Appointments</CardTitle>
          <span className="text-sm font-medium text-neutral-500">
            {formattedDate}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between mb-1">
          <span className="text-neutral-600 text-sm">Total</span>
          <span className="text-neutral-800 font-semibold">
            {totalAppointments}
          </span>
        </div>
        <Progress value={100} className="h-2 mb-4" />

        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-neutral-600 text-sm">In-Person</span>
              <span className="text-neutral-800 font-semibold">
                {inPersonAppointments}
              </span>
            </div>
            <Progress
              value={inPersonPercentage}
              className="h-2 mb-2 bg-neutral-200"
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-neutral-600 text-sm">Virtual</span>
              <span className="text-neutral-800 font-semibold">
                {virtualAppointments}
              </span>
            </div>
            <Progress
              value={virtualPercentage}
              className="h-2 mb-2 bg-neutral-200"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AppointmentStats;
