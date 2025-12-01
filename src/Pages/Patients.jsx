import { useEffect, useState, useCallback } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { Phone, Mail, Calendar, ExternalLink } from "lucide-react";
import AdvancedSearch from "../components/search/AdvancedSearch";
import { format } from "date-fns";
import { useDispatch, useSelector } from "react-redux";
import { fetchPatientsDetails } from "../redux/patient-actions";
import { fetchAppointmentDetails } from "../redux/appointment-actions";
import DoctorMultiSelect from "../components/DoctorMultiSelect";
import { Link } from "wouter";
import { PageNavigation } from "../components/ui/page-navigation";
import CreateAppointmentModal from "../components/appointments/CreateAppointmentModal";

function Patients() {
  const dispatch = useDispatch();
  const patients = useSelector((state) => state.patients.patients || []);
  const appointments = useSelector(
    (state) => state.appointments.appointments || []
  );
  const loggedInDoctor = useSelector((state) => state.me.me);

  const today = new Date().toISOString().split("T")[0];

  const [searchQuery, setSearchQuery] = useState("");
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [showPatients, setShowPatients] = useState([]);

  const [appointmentFilters, setAppointmentFilters] = useState({
    selectedDoctors: loggedInDoctor?.doctor_email
      ? [loggedInDoctor?.doctor_email]
      : [],
    startDate: today,
    endDate: today,
  });

  const [isDoctorDropdownOpen, setIsDoctorDropdownOpen] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  // Fetch patients
  useEffect(() => {
    dispatch(fetchPatientsDetails());
  }, [dispatch]);

  // Ensure selectedDoctors is never empty
  useEffect(() => {
    if (
      (!appointmentFilters.selectedDoctors ||
        appointmentFilters.selectedDoctors.length === 0) &&
      loggedInDoctor?.doctor_email
    ) {
      setAppointmentFilters((prev) => ({
        ...prev,
        selectedDoctors: [loggedInDoctor.doctor_email],
      }));
    }
  }, [appointmentFilters.selectedDoctors, loggedInDoctor]);

  // Fetch appointments for doctor
  useEffect(() => {
    if (appointmentFilters.selectedDoctors.length > 0) {
      dispatch(fetchAppointmentDetails(appointmentFilters.selectedDoctors));
    }
  }, [appointmentFilters.selectedDoctors, dispatch]);

  const refreshAllData = () => {
    dispatch(fetchPatientsDetails());

    if (appointmentFilters.selectedDoctors.length > 0) {
      dispatch(fetchAppointmentDetails(appointmentFilters.selectedDoctors));
    }
  };

  // Normalize date
  const normalizeDate = (date) => {
    if (!date) return null;
    return date.split("T")[0];
  };

  // Fetch appointment date field
  const getUnifiedApptDate = (appt) => {
    return (
      appt.appointment_date ||
      appt.date ||
      appt.timestamp ||
      appt.created_at
    );
  };

  // Build latest patient visits
  const enrichPatients = useCallback(() => {
    const { selectedDoctors, startDate, endDate } = appointmentFilters;

    const startStr = normalizeDate(startDate);
    const endStr = normalizeDate(endDate);

    const filteredAppointments = appointments.filter((appt) => {
      const doctorMatch =
        !selectedDoctors.length ||
        selectedDoctors.includes(appt.doctor_email);

      const unifiedDate = getUnifiedApptDate(appt);
      const apptDateStr = normalizeDate(unifiedDate);

      const dateMatch =
        (!startStr || apptDateStr >= startStr) &&
        (!endStr || apptDateStr <= endStr);

      return doctorMatch && dateMatch;
    });

    const latestByPatient = {};

    filteredAppointments.forEach((appt) => {
      const matchedPatient = patients.find((p) => {
        const pFirst = p.firstname || p.first_name || "";
        const pLast = p.lastname || p.last_name || "";
        const fullName = `${pFirst} ${pLast}`.trim().toLowerCase();
        const apptName = (appt.full_name || "").trim().toLowerCase();

        // Match using patient_id first
        if (
          appt.patient_id &&
          p.patient_id &&
          String(appt.patient_id) === String(p.patient_id)
        ) {
          return true;
        }

        // Fallback: full_name match
        if (apptName === fullName) return true;

        return false;
      });

      if (matchedPatient) {
        const pid = matchedPatient.patient_id;
        const unifiedDate = getUnifiedApptDate(appt);

        if (
          !latestByPatient[pid] ||
          new Date(unifiedDate) >
            new Date(getUnifiedApptDate(latestByPatient[pid].appointment))
        ) {
          latestByPatient[pid] = { patient: matchedPatient, appointment: appt };
        }
      }
    });

    setShowPatients(
      Object.values(latestByPatient).map(({ patient, appointment }) => {
        const unifiedDate = getUnifiedApptDate(appointment);

        return {
          ...patient,
          lastVisit: unifiedDate,
          doctorName: appointment.doctor_name || appointment.doctor_email,
        };
      })
    );
  }, [patients, appointments, appointmentFilters]);

  useEffect(() => {
    if (patients.length && appointments.length) enrichPatients();
  }, [patients, appointments, enrichPatients]);

  // Search
  const handleSearchChange = (e) => {
    const q = e.target.value.toLowerCase();
    setSearchQuery(q);

    if (!q) {
      enrichPatients();
      return;
    }

    setShowPatients((prev) =>
      prev.filter((p) => {
        const pFirst = p.firstname || p.first_name || "";
        const pLast = p.lastname || p.last_name || "";
        return `${pFirst} ${pLast}`.toLowerCase().includes(q);
      })
    );
  };

  // Advanced search
  const advancedSearchHandler = (query) => {
    if (!query) {
      enrichPatients();
      return;
    }

    setShowPatients(
      patients.filter((p) => {
        const phone = p.contactmobilephone || p.phone || "";

        return (
          (query.dateOfBirth ? p.dob === query.dateOfBirth : true) &&
          (query.email
            ? p.email?.toLowerCase().includes(query.email.toLowerCase())
            : true) &&
          (query.insuranceId
            ? p.insurance_id
                ?.toLowerCase()
                .includes(query.insuranceId.toLowerCase())
            : true) &&
          (query.insuranceProvider
            ? p.insurance_provider
                ?.toLowerCase()
                .includes(query.insuranceProvider.toLowerCase())
            : true) &&
          (query.phoneNumber ? phone.includes(query.phoneNumber) : true) &&
          (query.ssn
            ? p.ssn?.toLowerCase().includes(query.ssn.toLowerCase())
            : true)
        );
      })
    );
  };

  return (
    <div className="space-y-6">
      <PageNavigation showDate={false} />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold leading-none tracking-tight">
            Patients
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            View, search, and organize all patient reports.
          </p>
        </div>
        <Button
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 text-white"
        >
          + Add
        </Button>
      </div>

      {/* Patient Search */}
      <Card>
        <CardHeader>
          <CardTitle>Patient Search</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Input
              className="flex-1"
              placeholder="Search patients..."
              value={searchQuery}
              onChange={handleSearchChange}
            />
            <Button
              variant="outline"
              onClick={() => setShowAdvancedSearch((s) => !s)}
            >
              Advanced Search
            </Button>
          </div>
          {showAdvancedSearch && (
            <AdvancedSearch submitHandler={advancedSearchHandler} />
          )}
        </CardContent>
      </Card>

      {/* Appointment Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Appointment Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label className="block mb-1 text-sm font-medium">Doctor</label>
              <DoctorMultiSelect
                selectedDoctors={appointmentFilters.selectedDoctors}
                isDropdownOpen={isDoctorDropdownOpen}
                setDropdownOpen={setIsDoctorDropdownOpen}
                onDoctorSelect={(emails) =>
                  setAppointmentFilters((prev) => ({
                    ...prev,
                    selectedDoctors: emails.length
                      ? emails
                      : [loggedInDoctor.doctor_email],
                  }))
                }
              />
            </div>
            <div>
              <label className="block mb-1 text-sm font-medium">Start Date</label>
              <Input
                type="date"
                value={appointmentFilters.startDate}
                onChange={(e) =>
                  setAppointmentFilters((prev) => ({
                    ...prev,
                    startDate: e.target.value,
                  }))
                }
              />
            </div>
            <div>
              <label className="block mb-1 text-sm font-medium">End Date</label>
              <Input
                type="date"
                value={appointmentFilters.endDate}
                onChange={(e) =>
                  setAppointmentFilters((prev) => ({
                    ...prev,
                    endDate: e.target.value,
                  }))
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Patient Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Insurance</TableHead>
                <TableHead>Last Visit</TableHead>
                <TableHead>Doctor</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {showPatients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6}>
                    <p className="py-4 text-center text-gray-500">
                      No Patients Found
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                showPatients?.map((patient) => {
                  const pFirst = patient.firstname || patient.first_name || "";
                  const pLast = patient.lastname || patient.last_name || "";
                  const phone =
                    patient.contactmobilephone || patient.phone || "";

                  return (
                    <TableRow key={patient?.patient_id}>
                      <TableCell>{`${pFirst} ${pLast}`.trim()}</TableCell>

                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4" />
                          {phone}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Mail className="w-4 h-4" />
                          {patient?.email}
                        </div>
                      </TableCell>

                      <TableCell>
                        <div>{patient?.insurance_provider}</div>
                        <div className="text-sm text-gray-500">
                          {patient?.insurance_id}
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />

                          {/* FIX: Prevent timezone shift by forcing midday */}
                          {patient?.lastVisit
                            ? format(
                                new Date(
                                  (patient?.lastVisit || "").split("T")[0] +
                                    "T12:00:00"
                                ),
                                "MMM dd, yyyy"
                              )
                            : "N/A"}
                        </div>
                      </TableCell>

                      <TableCell>{patient?.doctorName}</TableCell>

                      <TableCell>
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/patients/${patient?.patient_id}`}
                          className="flex items-center gap-2 text-black-600"
                        >
                          <Button variant="ghost" size="icon">
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                          <span className="text-sm">View Reports</span>
                        </Link>
                      </div>
                    </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add Appointment Modal */}
      {showAddModal && (
        <CreateAppointmentModal
          username={loggedInDoctor?.doctor_email}
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            refreshAllData();
            setShowAddModal(false);
          }}
        />
      )}
    </div>
  );
}

export default Patients

