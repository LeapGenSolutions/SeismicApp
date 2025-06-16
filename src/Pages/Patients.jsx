import { useEffect, useState } from "react";
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
import {
  Plus,
  Phone,
  Mail,
  Calendar,
  ExternalLink,
  FileText,
} from "lucide-react";
import AdvancedSearch from "../components/search/AdvancedSearch";
import { format } from "date-fns";
import { useDispatch, useSelector } from "react-redux";
import { fetchPatientsDetails } from "../redux/patient-actions";
import { Link } from "wouter";
import { navigate } from "wouter/use-browser-location";

function Patients() {
  const [searchQuery, setSearchQuery] = useState("");
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const dispatch = useDispatch();
  const patients = useSelector((state) => state.patients.patients);
  const appointments = useSelector((state) => state.appointments.appointments);
  console.log("Appointments loaded from Redux:", appointments);
  const [enrichedPatients, setEnrichedPatients] = useState([]);
  const [showPatients, setShowPatients] = useState([]);

  useEffect(() => {
    dispatch(fetchPatientsDetails());
  }, [dispatch]);

  useEffect(() => {
    document.title = "Patients - Seismic Connect";
  }, []);

  useEffect(() => {
    if (!patients || !appointments) return;

    const enriched = patients.map((patient) => {
      const appts = appointments
        .filter((appt) => appt.patient_id == patient.id)
        .sort((a, b) => new Date(b.date) - new Date(a.date));
      const latest = appts[0];

      return {
        ...patient,
        doctor_name: latest?.provider?.name || "", // adjust based on real data field
        last_visit_date: latest?.date || "",
      };
    });

    setEnrichedPatients(enriched);
    setShowPatients(enriched);
  }, [patients, appointments]);

  const applyAllFilters = (search = searchQuery) => {
    let filtered = [...enrichedPatients];

    if (search) {
      filtered = filtered.filter((p) => {
        const fullName = `${p.first_name} ${p.last_name}`.toLowerCase();
        return fullName.includes(search.toLowerCase());
      });
    }

    if (selectedDoctor) {
      filtered = filtered.filter((p) => p.doctor_name === selectedDoctor);
    }

    if (startDate || endDate) {
      filtered = filtered.filter((p) => {
        if (!p.last_visit_date) return false;
        const visitDate = new Date(p.last_visit_date);
        const start = startDate ? new Date(startDate) : null;
        const end = endDate ? new Date(endDate) : null;
        return (!start || visitDate >= start) && (!end || visitDate <= end);
      });
    }

    setShowPatients(filtered);
  };

  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    applyAllFilters(query);
  };

  const advancedSearchHandler = (query) => {
    if (!query) {
      applyAllFilters();
      return;
    }

    const filtered = enrichedPatients.filter((p) => {
      const dob = query?.dateOfBirth ? p?.date_of_birth === query.dateOfBirth : true;
      const email = query?.email ? p?.email?.includes(query.email.toLowerCase()) : true;
      const insuranceId = query?.insuranceId ? p?.insurance_id?.toLowerCase().includes(query.insuranceId.toLowerCase()) : true;
      const insuranceProvider = query?.insuranceProvider ? p?.insurance_provider?.toLowerCase().includes(query.insuranceProvider.toLowerCase()) : true;
      const phoneNumber = query.phoneNumber ? p?.phone_number?.includes(query.phoneNumber) : true;
      const ssn = query.ssn ? p?.ssn?.toLowerCase().includes(query.ssn.toLowerCase()) : true;

      return dob && email && insuranceId && insuranceProvider && phoneNumber && ssn;
    });

    setShowPatients(filtered);
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    applyAllFilters();
  }, [selectedDoctor, startDate, endDate]);

  return (
    <div className="space-y-6 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Patients</h1>
        <Button>
          <Plus className="w-4 h-4 mr-2" /> Add Patient
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Patient Search</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search patients..."
                value={searchQuery}
                onChange={handleSearchChange}
              />
            </div>
            <Button
              variant="outline"
              onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
            >
              Advanced Search
            </Button>
          </div>
          {showAdvancedSearch && (
            <AdvancedSearch submitHandler={advancedSearchHandler} />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Appointment Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Doctor
              </label>
              <select
                className="w-full border rounded px-3 py-2"
                value={selectedDoctor}
                onChange={(e) => setSelectedDoctor(e.target.value)}
              >
                <option value="">All Doctors</option>
                <option value="Dr. Madhu Chanthati">Dr. Madhu Chanthati</option>
                <option value="Dr. Anurag Donapati">Dr. Anurag Donapati</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date
              </label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

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
                    <p className="text-center text-gray-500 py-4">
                      No Patients Found
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                showPatients.map((patient) => (
                  <TableRow key={patient.id}>
                    <TableCell>
                      {patient.first_name} {patient.last_name}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        {patient.phone_number}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Mail className="w-4 h-4" />
                        {patient.email}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>{patient.insurance_provider}</div>
                      <div className="text-sm text-gray-500">
                        {patient.insurance_id}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        {patient.last_visit_date
                          ? format(new Date(patient.last_visit_date), "MMM dd, yyyy")
                          : "N/A"}
                      </div>
                    </TableCell>
                    <TableCell>{patient.doctor_name || "N/A"}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon">
                          <FileText className="w-4 h-4" />
                        </Button>
                        <Link href={`/patients/${patient.id}`}>
                          <Button
                            onClick={() => navigate(`/patients/${patient.id}`)}
                            variant="ghost"
                            size="icon"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        </Link>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

export default Patients;
