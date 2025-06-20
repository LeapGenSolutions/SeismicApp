import { useEffect, useState, useRef } from "react";
import { useSelector } from "react-redux";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Download, Calendar, X } from "lucide-react";
import { DateRange } from "react-date-range";
import { addDays, format, isWithinInterval } from "date-fns";
import { enUS } from 'date-fns/locale';
import { PageNavigation } from "../components/ui/page-navigation";

// Import styles
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";

// Mock data for demonstration
const mockBillingData = [
  {
    doctorId: "doctor1@example.com",
    doctorName: "Dr. John Smith",
    totalSessions: 45,
    totalTime: 1350,
    totalBilled: 44.55,
    billingStatus: "Paid",
    specialty: "Cardiology",
    sessions: [
      {
        date: "2024-03-15",
        duration: 45,
        patientName: "Alice Johnson",
        charge: 1.98
      },
      {
        date: "2024-03-15",
        duration: 30,
        patientName: "Bob Wilson",
        charge: 0.99
      }
    ]
  },
  {
    doctorId: "doctor2@example.com",
    doctorName: "Dr. Sarah Lee",
    totalSessions: 38,
    totalTime: 1140,
    totalBilled: 37.62,
    billingStatus: "Pending",
    specialty: "Pediatrics",
    sessions: [
      {
        date: "2024-03-15",
        duration: 60,
        patientName: "Charlie Brown",
        charge: 1.98
      }
    ]
  }
];

function BillingReports() {
  const user = useSelector((state) => state.me.me);
  const doctorId = user?.email || user?.id;

  const [dateRange, setDateRange] = useState({
    startDate: new Date(),
    endDate: new Date(),
    key: 'selection'
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [timeFilter, setTimeFilter] = useState("thisWeek");
  const datePickerRef = useRef(null);

  // Close date picker when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target)) {
        setShowDatePicker(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const calculateBilling = (minutes) => {
    return Math.ceil(minutes / 30) * 0.99;
  };

  const getDateRange = (preset) => {
    const today = new Date();
    const start = new Date(today);
    const end = new Date(today);

    switch (preset) {
      case "thisWeek":
        start.setDate(today.getDate() - today.getDay());
        end.setDate(start.getDate() + 6);
        break;
      case "thisMonth":
        start.setDate(1);
        end.setMonth(today.getMonth() + 1);
        end.setDate(0);
        break;
      case "thisQuarter":
        const quarter = Math.floor(today.getMonth() / 3);
        start.setMonth(quarter * 3);
        start.setDate(1);
        end.setMonth((quarter + 1) * 3);
        end.setDate(0);
        break;
      case "thisYear":
        start.setMonth(0);
        start.setDate(1);
        end.setMonth(11);
        end.setDate(31);
        break;
      default:
        break;
    }
    return { startDate: start, endDate: end, key: 'selection' };
  };

  const handleTimeFilterChange = (filter) => {
    setTimeFilter(filter);
    if (filter !== "custom") {
      setDateRange(getDateRange(filter));
      setShowDatePicker(false);
    } else {
      setShowDatePicker(true);
    }
  };

  const handleDateRangeChange = (ranges) => {
    setDateRange(ranges.selection);
  };

  const handleApplyDateRange = () => {
    setShowDatePicker(false);
    // Apply the date filter to the data
    // This will be implemented when we connect to real data
  };

  const getDateRangeDisplay = () => {
    if (timeFilter === "custom") {
      return `${format(dateRange.startDate, 'MMM d, yyyy')} - ${format(dateRange.endDate, 'MMM d, yyyy')}`;
    }
    switch (timeFilter) {
      case "thisWeek":
        return "This Week";
      case "thisMonth":
        return "This Month";
      case "thisQuarter":
        return "This Quarter";
      case "thisYear":
        return "This Year";
      default:
        return "";
    }
  };

  const handleExport = () => {
    const headers = ["Total Sessions", "Total Time (min)", "Total Billed", "Billing Status"];
    const csvData = filteredData.map(doctor => [
      doctor.totalSessions,
      doctor.totalTime,
      doctor.totalBilled.toFixed(2),
      doctor.billingStatus
    ]);

    const csvContent = [
      headers.join(","),
      ...csvData.map(row => row.join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    
    const today = new Date();
    const filename = `billing-report-${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}.csv`;
    
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter for the authenticated doctor only
  const filteredData = mockBillingData.filter(doctor => doctor.doctorId === doctorId)
    .map(doctor => {
      // Filter sessions by date range
      const filteredSessions = doctor.sessions.filter(session => {
        const sessionDate = new Date(session.date);
        return sessionDate >= dateRange.startDate && sessionDate <= dateRange.endDate;
      });
      const totalTime = filteredSessions.reduce((sum, s) => sum + s.duration, 0);
      const totalSessions = filteredSessions.length;
      const totalBilled = calculateBilling(totalTime);
      return {
        ...doctor,
        sessions: filteredSessions,
        totalTime,
        totalSessions,
        totalBilled
      };
    })
    .filter(doctor => doctor.totalSessions > 0); // Only show if there are sessions in range

  // Summary stats for the single doctor
  const summaryStats = filteredData.length > 0 ? {
    totalRevenue: filteredData[0].totalBilled,
    averageSessionDuration: filteredData[0].totalSessions > 0 ? filteredData[0].totalTime / filteredData[0].totalSessions : 0,
    totalSessions: filteredData[0].totalSessions
  } : {
    totalRevenue: 0,
    averageSessionDuration: 0,
    totalSessions: 0
  };

  const noData = filteredData.length === 0;

  return (
    <div className="space-y-6">
      <PageNavigation 
        title="Reports"
        subtitle="View and download reports"
        showDate={true}
      />

      {/* Billing Reports Section */}
      <div className="space-y-6">
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Billing Reports</h2>
            <div className="text-sm text-neutral-500">
              {getDateRangeDisplay()}
            </div>
          </div>
          <div className="flex gap-2">
            <Button 
              variant={timeFilter === "thisWeek" ? "default" : "outline"}
              className={`${
                timeFilter === "thisWeek" 
                  ? "bg-blue-50 text-blue-700 border-blue-200 font-semibold" 
                  : ""
              }`}
              onClick={() => handleTimeFilterChange("thisWeek")}
            >
              This Week
            </Button>
            <Button 
              variant={timeFilter === "thisMonth" ? "default" : "outline"}
              className={`${
                timeFilter === "thisMonth" 
                  ? "bg-blue-50 text-blue-700 border-blue-200 font-semibold" 
                  : ""
              }`}
              onClick={() => handleTimeFilterChange("thisMonth")}
            >
              This Month
            </Button>
            <Button 
              variant={timeFilter === "thisQuarter" ? "default" : "outline"}
              className={`${
                timeFilter === "thisQuarter" 
                  ? "bg-blue-50 text-blue-700 border-blue-200 font-semibold" 
                  : ""
              }`}
              onClick={() => handleTimeFilterChange("thisQuarter")}
            >
              This Quarter
            </Button>
            <Button 
              variant={timeFilter === "thisYear" ? "default" : "outline"}
              className={`${
                timeFilter === "thisYear" 
                  ? "bg-blue-50 text-blue-700 border-blue-200 font-semibold" 
                  : ""
              }`}
              onClick={() => handleTimeFilterChange("thisYear")}
            >
              This Year
            </Button>
            <div className="relative" ref={datePickerRef}>
              <Button 
                variant={timeFilter === "custom" ? "default" : "outline"}
                className={`${
                  timeFilter === "custom" 
                    ? "bg-blue-50 text-blue-700 border-blue-200 font-semibold" 
                    : ""
                }`}
                onClick={() => handleTimeFilterChange("custom")}
              >
                <Calendar className="w-4 h-4 mr-2" />
                Custom Range
              </Button>
              {showDatePicker && (
                <div className="absolute right-0 mt-2 z-10 bg-white shadow-lg rounded-lg p-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold">Select Date Range</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowDatePicker(false)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  <DateRange
                    ranges={[dateRange]}
                    onChange={handleDateRangeChange}
                    months={2}
                    direction="horizontal"
                    showSelectionPreview={true}
                    moveRangeOnFirstSelection={false}
                    locale={enUS}
                    rangeColors={['#3b82f6']}
                  />
                  <div className="flex justify-end gap-2 mt-4">
                    <Button
                      variant="outline"
                      onClick={() => setShowDatePicker(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleApplyDateRange}
                    >
                      Apply
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{noData ? "$0.00" : `$${summaryStats.totalRevenue.toFixed(2)}`}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Average Session Duration</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{noData ? "--" : `${Math.round(summaryStats.averageSessionDuration)} min`}</p>
            </CardContent>
          </Card>
        </div>

        {/* Fallback State */}
        {noData && (
          <div className="text-center text-neutral-500 py-8">
            <p className="text-lg font-semibold">No billing data available for the selected period.</p>
          </div>
        )}

        {/* Main Report Table */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Billing Details</CardTitle>
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Total Sessions</th>
                    <th className="text-left py-3 px-4">Total Time (min)</th>
                    <th className="text-left py-3 px-4">Total Billed</th>
                    <th className="text-left py-3 px-4">Billing Status</th>
                    <th className="text-left py-3 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((doctor, index) => (
                    <tr key={index} className="border-b hover:bg-neutral-50">
                      <td className="py-3 px-4">{doctor.totalSessions}</td>
                      <td className="py-3 px-4">{doctor.totalTime}</td>
                      <td className="py-3 px-4">${doctor.totalBilled.toFixed(2)}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          doctor.billingStatus === "Paid" 
                            ? "bg-green-100 text-green-800" 
                            : "bg-yellow-100 text-yellow-800"
                        }`}>
                          {doctor.billingStatus}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => setSelectedDoctor(selectedDoctor === doctor ? null : doctor)}
                        >
                          {selectedDoctor === doctor ? "Hide Details" : "View Details"}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Drill-down View */}
            {selectedDoctor && (
              <div className="mt-6 p-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                <div className="flex items-center gap-4 mb-4">
                  <h3 className="font-semibold">Session Details</h3>
                </div>
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-4">Session Date</th>
                      <th className="text-left py-2 px-4">Duration (min)</th>
                      <th className="text-left py-2 px-4">Patient Name</th>
                      <th className="text-left py-2 px-4">Charge</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedDoctor.sessions.map((session, index) => (
                      <tr key={index} className="border-b">
                        <td className="py-2 px-4">{session.date}</td>
                        <td className="py-2 px-4">{session.duration}</td>
                        <td className="py-2 px-4">{session.patientName}</td>
                        <td className="py-2 px-4">${session.charge.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Reports() {
  useEffect(() => {
    document.title = "Reports - Seismic Connect";
  }, []);

  return <BillingReports />;
}

export default Reports;
