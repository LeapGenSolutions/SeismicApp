// Patients.jsx
import { useEffect, useState } from "react";
import Select from "react-select";
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
import { Badge } from "../components/ui/badge";
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
// import { useDispatch, useSelector } from "react-redux";
// import { fetchPatientsDetails } from "../redux/patient-actions";
// import { fetchAllAppointments } from "../redux/appointment-actions";
import { Link } from "wouter";
import { navigate } from "wouter/use-browser-location";

function Patients() {
  const [searchQuery, setSearchQuery] = useState("");
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [selectedDoctors, setSelectedDoctors] = useState([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // const dispatch = useDispatch();
  // const patients = useSelector((state) => state.patients.patients);
  // const appointments = useSelector((state) => state.appointments.appointments);

  // 🟡 Mock Appointments
  const mockAppointments = [
    { patientId: 1, date: "2025-06-14", doctor_name: "Dr. Anurag Donapati" },
    { patientId: 1, date: "2025-06-16", doctor_name: "Dr. Anurag Donapati" },
    { patientId: 2, date: "2025-06-13", doctor_name: "Dr. Madhu Chanthati" },
    { patientId: 3, date: "2025-06-15", doctor_name: "Dr. Rhea Patel" },
    { patientId: 4, date: "2025-06-12", doctor_name: "Dr. Omkar Verma" },
    { patientId: 5, date: "2025-06-16", doctor_name: "Dr. Meera Shah" },
    { patientId: 6, date: "2025-06-15", doctor_name: "Dr. Madhu Chanthati" },
    { patientId: 7, date: "2025-06-14", doctor_name: "Dr. Rhea Patel" },
  ];

  // 🟡 Mock Patients
  const mockPatients = [
    { patientId: 1, first_name: "Emma", last_name: "Thompson", phone_number: "1234567890", email: "emma@example.com", insurance_provider: "Aetna", insurance_id: "AET123", date_of_birth: "1990-01-01", ssn: "123-45-6789" },
    { patientId: 2, first_name: "Liam", last_name: "Nguyen", phone_number: "0987654321", email: "liam@example.com", insurance_provider: "Cigna", insurance_id: "CIG456", date_of_birth: "1988-05-12", ssn: "234-56-7890" },
    { patientId: 3, first_name: "Olivia", last_name: "Smith", phone_number: "5551234567", email: "olivia@example.com", insurance_provider: "United", insurance_id: "UNI789", date_of_birth: "1992-07-22", ssn: "345-67-8901" },
    { patientId: 4, first_name: "Noah", last_name: "Lee", phone_number: "3216549870", email: "noah@example.com", insurance_provider: "Blue Cross", insurance_id: "BCB101", date_of_birth: "1985-11-30", ssn: "456-78-9012" },
    { patientId: 5, first_name: "Sophia", last_name: "Garcia", phone_number: "1112223333", email: "sophia@example.com", insurance_provider: "Aetna", insurance_id: "AET202", date_of_birth: "1994-03-15", ssn: "567-89-0123" },
    { patientId: 6, first_name: "James", last_name: "Kim", phone_number: "4445556666", email: "james@example.com", insurance_provider: "Cigna", insurance_id: "CIG303", date_of_birth: "1989-09-09", ssn: "678-90-1234" },
    { patientId: 7, first_name: "Ava", last_name: "Martinez", phone_number: "7778889999", email: "ava@example.com", insurance_provider: "United", insurance_id: "UNI404", date_of_birth: "1991-12-25", ssn: "789-01-2345" },
  ];

  const [showPatients, setShowPatients] = useState([]);

  // 🟡 Build unique doctor dropdown options from mock data
  const doctorOptions = Array.from(
    new Set(mockAppointments.map((a) => a.doctor_name).filter(Boolean))
  ).map((name) => ({ value: name, label: name }));

  // 🟡 Filter and enrich patients with appointment details
  useEffect(() => {
    const enriched = mockPatients.map((p) => {
      const apptsForPatient = mockAppointments.filter((a) => a.patientId === p.patientId);
      const latestAppt = apptsForPatient.sort((a, b) => new Date(b.date) - new Date(a.date))[0];
      return {
        ...p,
        lastVisit: latestAppt?.date ? new Date(latestAppt.date) : null,
        doctorName: latestAppt?.doctor_name || null,
      };
    });

    const filtered = enriched.filter((p) => {
      const fullName = `${p.first_name} ${p.last_name}`.toLowerCase();
      const nameMatch = !searchQuery || fullName.includes(searchQuery.toLowerCase());
      const doctorMatch =
        selectedDoctors.length === 0 || selectedDoctors.includes(p.doctorName);
      const visit = p.lastVisit ? new Date(p.lastVisit).setHours(0, 0, 0, 0) : null;
      const start = startDate ? new Date(startDate).setHours(0, 0, 0, 0) : null;
      const end = endDate ? new Date(endDate).setHours(23, 59, 59, 999) : null;
      const dateMatch = (!start || (visit && visit >= start)) && (!end || (visit && visit <= end));
      return nameMatch && doctorMatch && dateMatch;
    });

    setShowPatients(filtered);
  }, [searchQuery, selectedDoctors, startDate, endDate]);

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const advancedSearchHandler = (query) => {
    if (!query) return;
    setShowPatients((prev) =>
      prev.filter((p) => {
        const dob = query?.dateOfBirth ? p?.date_of_birth === query.dateOfBirth : true;
        const email = query?.email ? p?.email?.includes(query.email.toLowerCase()) : true;
        const insuranceId = query?.insuranceId ? p?.insurance_id?.toLowerCase().includes(query.insuranceId.toLowerCase()) : true;
        const insuranceProvider = query?.insuranceProvider ? p?.insurance_provider?.toLowerCase().includes(query.insuranceProvider.toLowerCase()) : true;
        const phoneNumber = query.phoneNumber ? p?.phone_number?.includes(query.phoneNumber) : true;
        const ssn = query.ssn ? p?.ssn?.toLowerCase().includes(query.ssn.toLowerCase()) : true;
        return dob && email && insuranceId && insuranceProvider && phoneNumber && ssn;
      })
    );
  };

  // ... (leave rest of JSX unchanged)

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
              <label className="block text-sm font-medium text-gray-700 mb-1">Select Doctor(s)</label>
              <Select
                isMulti
                options={doctorOptions}
                value={doctorOptions.filter(opt => selectedDoctors.includes(opt.value))}
                onChange={(selected) => setSelectedDoctors(selected.map(opt => opt.value))}
                placeholder="Filter by doctor..."
                className="w-full"
                styles={{ control: (base) => ({ ...base, padding: "4px" }), menu: (base) => ({ ...base, zIndex: 50 }) }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
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
                    <p className="text-center text-gray-500 py-4">No Patients Found</p>
                  </TableCell>
                </TableRow>
              ) : (
                showPatients.map((patient) => (
                  <TableRow key={patient.id}>
                    <TableCell>{patient.first_name} {patient.last_name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4" /> {patient.phone_number}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Mail className="w-4 h-4" /> {patient.email}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>{patient.insurance_provider}</div>
                      <div className="text-sm text-gray-500">{patient.insurance_id}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        {patient.lastVisit ? format(new Date(patient.lastVisit), "MMM dd, yyyy") : "N/A"}
                      </div>
                    </TableCell>
                    <TableCell>{patient.doctorName || "N/A"}</TableCell>
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
