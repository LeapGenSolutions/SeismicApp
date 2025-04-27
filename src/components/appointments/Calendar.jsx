import { useState } from "react";
import { Card, CardContent, CardHeader } from "../ui/card";
import { Button } from "../ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { format, addDays, subDays } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "../../lib/queryClient";

const CalendarView = ({ onAppointmentClick }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [, setViewMode] = useState("day");

  const formattedDate = format(currentDate, "yyyy-MM-dd");
  const displayDate = format(currentDate, "MMMM d, yyyy");

  const { data: appointments, isLoading } = useQuery({
    queryKey: ["appointments", formattedDate, selectedProvider],
    queryFn: async () => {
      const url = selectedProvider
        ? `/api/appointments/by-provider/${selectedProvider}?date=${formattedDate}`
        : `/api/appointments?date=${formattedDate}`;
      const response = await apiRequest("GET", url);
      return response.json();
    },
  });

  const { data: providers } = useQuery({
    queryKey: ["providers"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/providers");
      return response.json();
    },
  });

  const handlePreviousDay = () => {
    setCurrentDate((prev) => subDays(prev, 1));
  };

  const handleNextDay = () => {
    setCurrentDate((prev) => addDays(prev, 1));
  };

  const handleTodayClick = () => {
    setCurrentDate(new Date());
  };

  const timeSlots = [
    "8:00 AM",
    "9:00 AM",
    "10:00 AM",
    "11:00 AM",
    "12:00 PM",
    "1:00 PM",
    "2:00 PM",
    "3:00 PM",
    "4:00 PM",
    "5:00 PM",
  ];

  const getAppointmentsForTimeSlot = (timeSlot) => {
    if (!appointments) return [];

    return appointments.filter((appointment) => appointment.time === timeSlot);
  };

  const getAppointmentTypeClass = (method, status) => {
    if (status === "waiting")
      return "bg-yellow-50 border-l-4 border-warning-500";
    if (method === "video") return "bg-blue-50 border-l-4 border-primary-500";
    return "bg-green-50 border-l-4 border-success-500";
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={() => setViewMode("day")}
            size="sm"
          >
            Day
          </Button>
          <Button
            variant="outline"
            onClick={() => setViewMode("week")}
            size="sm"
          >
            Week
          </Button>
          <Button
            variant="outline"
            onClick={() => setViewMode("month")}
            size="sm"
          >
            Month
          </Button>
        </div>

        <div className="flex items-center space-x-2">
          <Button variant="outline" size="icon" onClick={handlePreviousDay}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="font-medium">{displayDate}</span>
          <Button variant="outline" size="icon" onClick={handleNextDay}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={handleTodayClick}>
            Today
          </Button>
        </div>

        <Select value={selectedProvider} onValueChange={setSelectedProvider}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="All Providers" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectValue value="">All Providers</SelectValue>
              {providers?.map((provider) => (
                <SelectValue key={provider.id} value={provider.id}>
                  {provider.fullName}
                </SelectValue>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          Array(5)
            .fill(0)
            .map((_, index) => (
              <div key={index} className="animate-pulse flex space-x-4 mb-4">
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </div>
            ))
        ) : (
          <div className="space-y-4">
            {timeSlots.map((timeSlot) => (
              <div key={timeSlot} className="flex">
                <div className="w-24 font-medium">{timeSlot}</div>
                <div className="flex-1">
                  {getAppointmentsForTimeSlot(timeSlot).map((appointment) => (
                    <div
                      key={appointment.id}
                      className={`p-3 mb-2 rounded-md ${getAppointmentTypeClass(
                        appointment.method,
                        appointment.status
                      )}`}
                      onClick={() =>
                        onAppointmentClick && onAppointmentClick(appointment.id)
                      }
                    >
                      <div className="font-medium">
                        {appointment.patientName}
                      </div>
                      <div className="text-sm text-gray-500">
                        {appointment.reason}
                      </div>
                    </div>
                  ))}

                  {getAppointmentsForTimeSlot(timeSlot).length === 0 && (
                    <div className="text-sm text-gray-400 italic">
                      No appointments scheduled
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CalendarView;
