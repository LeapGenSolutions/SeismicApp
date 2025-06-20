import { Card, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { PageNavigation } from "../components/ui/page-navigation";
import {
  Clock,
  Calendar,
  User,
  Video,
  MapPin,
  CheckCircle,
  AlertCircle,
  HourglassIcon,
  UserX,
  Plus,
  Activity
} from "lucide-react";
import './TimelineDashboard.css';
// import { useDashboardData } from "../hooks/use-dashboard-data";

export function TimelineDashboard() {
  // const { data: dashboardData, isLoading } = useDashboardData();
  const isLoading = false;
  const dashboardData = {
    todaysAppointments: 5,
    statusCounts: { completed: 2, waiting: 1 },
    providers: [
      { id: 1, name: "Dr. Sarah Chen" },
      { id: 2, name: "Dr. Michael Rodriguez" }
    ]
  };

  if (isLoading) {
    return (
      <div className="timeline-dashboard">
        <div className="timeline-skeleton">
          <div className="timeline-skeleton-line w-1/3 mb-6"></div>
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex space-x-4">
                <div className="timeline-skeleton-circle"></div>
                <div className="flex-1 space-y-2">
                  <div className="timeline-skeleton-line"></div>
                  <div className="timeline-skeleton-line w-2/3"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case "in-progress":
        return <Clock className="w-5 h-5 text-blue-600" />;
      case "waiting":
        return <HourglassIcon className="w-5 h-5 text-yellow-600" />;
      case "no-show":
        return <UserX className="w-5 h-5 text-red-600" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-600" />;
    }
  };

  const mockAppointments = [
    {
      id: 1,
      time: "09:00",
      patient: "John Smith",
      provider: "Dr. Sarah Chen",
      type: "in-person",
      status: "completed",
      duration: 30,
      specialty: "Cardiology"
    },
    {
      id: 2,
      time: "10:30",
      patient: "Maria Rodriguez",
      provider: "Dr. Michael Rodriguez",
      type: "virtual",
      status: "in-progress",
      duration: 45,
      specialty: "Neurology"
    },
    {
      id: 3,
      time: "11:15",
      patient: "David Johnson",
      provider: "Dr. Sarah Chen",
      type: "in-person",
      status: "waiting",
      duration: 30,
      specialty: "Cardiology"
    },
    {
      id: 4,
      time: "14:00",
      patient: "Lisa Brown",
      provider: "Dr. Emily Watson",
      type: "virtual",
      status: "completed",
      duration: 20,
      specialty: "Pediatrics"
    },
    {
      id: 5,
      time: "15:30",
      patient: "Robert Wilson",
      provider: "Dr. James Park",
      type: "in-person",
      status: "no-show",
      duration: 30,
      specialty: "Orthopedics"
    }
  ];

  return (
    <div className="timeline-dashboard">
      <PageNavigation 
        title="Timeline Dashboard"
        subtitle="View and manage today's appointments"
        showDate={true}
      />

      {/* Header Stats */}
      <div className="timeline-stats-grid">
        <Card className="timeline-stat-card blue">
          <CardContent className="p-6">
            <div className="timeline-stat-content">
              <div>
                <p className="timeline-stat-number">
                  {dashboardData?.todaysAppointments || 0}
                </p>
                <p className="timeline-stat-label">Today's Total</p>
              </div>
              <Calendar className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="timeline-stat-card green">
          <CardContent className="p-6">
            <div className="timeline-stat-content">
              <div>
                <p className="timeline-stat-number">
                  {dashboardData?.statusCounts.completed || 0}
                </p>
                <p className="timeline-stat-label">Completed</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="timeline-stat-card yellow">
          <CardContent className="p-6">
            <div className="timeline-stat-content">
              <div>
                <p className="timeline-stat-number">
                  {dashboardData?.statusCounts.waiting || 0}
                </p>
                <p className="timeline-stat-label">Waiting</p>
              </div>
              <HourglassIcon className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="timeline-stat-card purple">
          <CardContent className="p-6">
            <div className="timeline-stat-content">
              <div>
                <p className="timeline-stat-number">
                  {dashboardData?.providers.length || 0}
                </p>
                <p className="timeline-stat-label">Active Providers</p>
              </div>
              <User className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Timeline View */}
      <Card className="timeline-main-card">
        <CardContent className="p-6">
          <div className="timeline-header">
            <h2 className="timeline-title">Today's Schedule Timeline</h2>
            <Button className="timeline-add-btn">
              <Plus className="w-4 h-4 mr-2" />
              Add Appointment
            </Button>
          </div>

          <div className="timeline-container">
            <div className="timeline-line"></div>
            <div className="timeline-items">
              {mockAppointments.map((appointment) => (
                <div key={appointment.id} className="timeline-item">
                  <div className={`timeline-dot ${appointment.status.replace('-', '-')}`}>
                    {getStatusIcon(appointment.status)}
                  </div>

                  <Card className="timeline-appointment-card">
                    <CardContent className="p-4">
                      <div className="timeline-appointment-header">
                        <div className="timeline-appointment-meta">
                          <div className="timeline-time">{appointment.time}</div>
                          <Badge className={`timeline-status-badge ${appointment.status.replace('-', '-')}`}>
                            {appointment.status.replace('-', ' ')}
                          </Badge>
                          <Badge variant="outline" className="timeline-type-badge">
                            {appointment.type === "virtual" ? (
                              <Video className="w-3 h-3" />
                            ) : (
                              <MapPin className="w-3 h-3" />
                            )}
                            <span>{appointment.type}</span>
                          </Badge>
                        </div>
                        <div className="timeline-duration">
                          {appointment.duration} min
                        </div>
                      </div>

                      <div className="timeline-appointment-details">
                        <div className="timeline-detail-section">
                          <p className="timeline-detail-label">Patient</p>
                          <p className="timeline-detail-value">{appointment.patient}</p>
                        </div>
                        <div className="timeline-detail-section">
                          <p className="timeline-detail-label">Provider</p>
                          <p className="timeline-detail-value">{appointment.provider}</p>
                          <p className="timeline-detail-subtitle">{appointment.specialty}</p>
                        </div>
                      </div>

                      {appointment.status === "in-progress" && (
                        <div className="timeline-active-session">
                          <div className="timeline-active-indicator">
                            <Activity className="w-4 h-4 text-blue-500 animate-pulse" />
                            <span className="timeline-active-text">Currently in session</span>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default TimelineDashboard; 