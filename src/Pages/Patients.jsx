// import { useState } from "react";
// import {useEffect} from "react";
// import Select from "react-select";
// import {
//   Card,
//   CardContent,
//   CardHeader,
//   CardTitle,
// } from "../components/ui/card";
// import { Button } from "../components/ui/button";
// import { Input } from "../components/ui/input";
// import {
//   Table,
//   TableBody,
//   TableCell,
//   TableHead,
//   TableHeader,
//   TableRow,
// } from "../components/ui/table";
// import {
//   Plus,
//   Phone,
//   Mail,
//   Calendar,
//   ExternalLink,
//   FileText,
//   RefreshCw,
// } from "lucide-react";
// import { useDispatch, useSelector } from "react-redux";
// import { fetchPatientsDetails } from "../redux/patient-actions";
// import AdvancedSearch from "../components/search/AdvancedSearch";
// import AddPatientModal from "../components/AddPatientModal";
// import { format } from "date-fns";
// import { Link } from "wouter";
// import { navigate } from "wouter/use-browser-location";

// const todayStr = new Date().toISOString().split("T")[0];

// const mockAppointments = [
//   { patientId: 1, date: todayStr, doctor_name: "Dr. Anurag Donapati" },
//   { patientId: 2, date: todayStr, doctor_name: "Dr. Rhea Patel" },
//   { patientId: 3, date: todayStr, doctor_name: "Dr. Meera Shah" },
//   { patientId: 4, date: todayStr, doctor_name: "Dr. Omkar Verma" },
//   { patientId: 5, date: todayStr, doctor_name: "Dr. Madhu Chanthati" },
//   { patientId: 6, date: "2025-06-18", doctor_name: "Dr. Rhea Patel" },
//   { patientId: 7, date: "2025-06-19", doctor_name: "Dr. Omkar Verma" },
// ];

// const mockPatients = [
//   { patientId: 1, first_name: "Emma", last_name: "Thompson", phone_number: "1234567890", email: "emma@example.com", insurance_provider: "Aetna", insurance_id: "AET123", date_of_birth: "1990-01-01" },
//   { patientId: 2, first_name: "Liam", last_name: "Nguyen", phone_number: "0987654321", email: "liam@example.com", insurance_provider: "Cigna", insurance_id: "CIG456", date_of_birth: "1988-05-12" },
//   { patientId: 3, first_name: "Olivia", last_name: "Smith", phone_number: "5551234567", email: "olivia@example.com", insurance_provider: "United", insurance_id: "UNI789", date_of_birth: "1992-07-22" },
//   { patientId: 4, first_name: "Noah", last_name: "Lee", phone_number: "3216549870", email: "noah@example.com", insurance_provider: "Blue Cross", insurance_id: "BCB101", date_of_birth: "1985-11-30" },
//   { patientId: 5, first_name: "Sophia", last_name: "Garcia", phone_number: "1112223333", email: "sophia@example.com", insurance_provider: "Aetna", insurance_id: "AET202", date_of_birth: "1994-03-15" },
//   { patientId: 6, first_name: "James", last_name: "Kim", phone_number: "4445556666", email: "james@example.com", insurance_provider: "Cigna", insurance_id: "CIG303", date_of_birth: "1989-09-09" },
//   { patientId: 7, first_name: "Ava", last_name: "Martinez", phone_number: "7778889999", email: "ava@example.com", insurance_provider: "United", insurance_id: "UNI404", date_of_birth: "1991-12-25" },
// ];

// function Patients() {
//   const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
//   const [showAddModal, setShowAddModal] = useState(false);

//   const [patientFilters, setPatientFilters] = useState({
//     searchQuery: "",
//     dateOfBirth: "",
//     email: "",
//     insuranceProvider: "",
//     insuranceId: "",
//     phoneNumber: "",
//   });

//   const [appointmentFilters, setAppointmentFilters] = useState({
//     selectedDoctors: [],
//     startDate: "",
//     endDate: "",
//   });

//   const [patients, setPatients] = useState(mockPatients);
//   const [showPatients, setShowPatients] = useState([]);

//   const enrichAndSetPatients = (patientsList, apptsList) => {
//     const enriched = patientsList.map((p) => {
//       const appts = apptsList.filter((a) => a.patientId === p.patientId);
//       const latest = appts.sort((a, b) => new Date(b.date) - new Date(a.date))[0];
//       return {
//         ...p,
//         lastVisit: latest?.date ? new Date(latest.date) : null,
//         doctorName: latest?.doctor_name || null,
//       };
//     });

//     const filtered = enriched.filter((p) => {
//       const fullName = `${p.first_name} ${p.last_name}`.toLowerCase();
//       const visit = p.lastVisit ? new Date(p.lastVisit).setHours(0, 0, 0, 0) : null;
//       const start = appointmentFilters.startDate ? new Date(appointmentFilters.startDate).setHours(0, 0, 0, 0) : new Date(todayStr).setHours(0, 0, 0, 0);
//       const end = appointmentFilters.endDate ? new Date(appointmentFilters.endDate).setHours(23, 59, 59, 999) : new Date(todayStr).setHours(23, 59, 59, 999);

//       return (
//         (!patientFilters.searchQuery || fullName.includes(patientFilters.searchQuery.toLowerCase())) &&
//         (!patientFilters.email || p.email.toLowerCase().includes(patientFilters.email.toLowerCase())) &&
//         (!patientFilters.dateOfBirth || p.date_of_birth === patientFilters.dateOfBirth) &&
//         (!patientFilters.insuranceProvider || p.insurance_provider.toLowerCase().includes(patientFilters.insuranceProvider.toLowerCase())) &&
//         (!patientFilters.insuranceId || p.insurance_id.toLowerCase().includes(patientFilters.insuranceId.toLowerCase())) &&
//         (!patientFilters.phoneNumber || p.phone_number.includes(patientFilters.phoneNumber)) &&
//         (appointmentFilters.selectedDoctors.length === 0 || appointmentFilters.selectedDoctors.includes(p.doctorName)) &&
//         (!start || (visit && visit >= start)) &&
//         (!end || (visit && visit <= end))
//       );
//     });

//     setShowPatients(filtered);
//   };

//   const applyAllFilters = () => {
//     enrichAndSetPatients(patients, mockAppointments);
//   };

//   const resetPatientFilters = () => {
//     setPatientFilters({
//       searchQuery: "",
//       dateOfBirth: "",
//       email: "",
//       insuranceProvider: "",
//       insuranceId: "",
//       phoneNumber: "",
//     });
//     enrichAndSetPatients(patients, mockAppointments);
//   };

//   const resetAppointmentFilters = () => {
//     setAppointmentFilters({
//       selectedDoctors: [],
//       startDate: "",
//       endDate: "",
//     });
//     enrichAndSetPatients(patients, mockAppointments);
//   };

//   const handleAddPatient = (newPatient) => {
//     setPatients((prev) => [...prev, newPatient]);
//     enrichAndSetPatients([...patients, newPatient], mockAppointments);
//   };

//   const handleRefresh = () => {
//     const todayAppointments = mockAppointments.filter((a) => a.date === todayStr);
//     enrichAndSetPatients(patients, todayAppointments);
//   };

//   const doctorOptions = Array.from(
//     new Set(mockAppointments.map((a) => a.doctor_name).filter(Boolean))
//   ).map((name) => ({ value: name, label: name }));

//   useEffect(() => {
//     handleRefresh();
//   },[]);

//   return (
//     <div className="space-y-6 p-4">
//       <div className="flex items-center justify-between">
//         <h1 className="text-2xl font-semibold">Patients</h1>
//         <div className="flex gap-2">
//           <Button variant="outline" onClick={handleRefresh}>
//             <RefreshCw className="w-4 h-4 mr-2" /> Refresh
//           </Button>
//           <Button onClick={() => setShowAddModal(true)}>
//             <Plus className="w-4 h-4 mr-2" /> Add Patient
//           </Button>
//         </div>
//       </div>

//       <Card>
//         <CardHeader>
//           <CardTitle>Patient Search</CardTitle>
//         </CardHeader>
//         <CardContent>
//           <div className="flex gap-4">
//             <Input
//               placeholder="Search patients..."
//               value={patientFilters.searchQuery}
//               onChange={(e) =>
//                 setPatientFilters({ ...patientFilters, searchQuery: e.target.value })
//               }
//             />
//             <Button variant="outline" onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}>
//               Advanced Search
//             </Button>
//           </div>

//           {showAdvancedSearch && (
//             <AdvancedSearch filters={patientFilters} setFilters={setPatientFilters} />
//           )}

//           <div className="flex gap-2 mt-4">
//             <Button onClick={applyAllFilters}>Search</Button>
//             <Button variant="destructive" onClick={resetPatientFilters}>Reset</Button>
//           </div>
//         </CardContent>
//       </Card>

//       <Card>
//         <CardHeader>
//           <CardTitle>Appointment Filters</CardTitle>
//         </CardHeader>
//         <CardContent>
//           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//             <div>
//               <label className="block text-sm font-medium mb-1">Select Doctor(s)</label>
//               <Select
//                 isMulti
//                 options={doctorOptions}
//                 value={doctorOptions.filter(opt => appointmentFilters.selectedDoctors.includes(opt.value))}
//                 onChange={(selected) =>
//                   setAppointmentFilters({ ...appointmentFilters, selectedDoctors: selected.map(opt => opt.value) })
//                 }
//               />
//             </div>
//             <div>
//               <label className="block text-sm font-medium mb-1">Start Date</label>
//               <Input
//                 type="date"
//                 value={appointmentFilters.startDate}
//                 onChange={(e) => setAppointmentFilters({ ...appointmentFilters, startDate: e.target.value })}
//               />
//             </div>
//             <div>
//               <label className="block text-sm font-medium mb-1">End Date</label>
//               <Input
//                 type="date"
//                 value={appointmentFilters.endDate}
//                 onChange={(e) => setAppointmentFilters({ ...appointmentFilters, endDate: e.target.value })}
//               />
//             </div>
//           </div>

//           <div className="flex gap-2 mt-4">
//             <Button onClick={applyAllFilters}>Search</Button>
//             <Button variant="destructive" onClick={resetAppointmentFilters}>Reset</Button>
//           </div>
//         </CardContent>
//       </Card>

//       <Card>
//         <CardContent className="p-0">
//           <Table>
//             <TableHeader>
//               <TableRow>
//                 <TableHead>Name</TableHead>
//                 <TableHead>Contact</TableHead>
//                 <TableHead>Insurance</TableHead>
//                 <TableHead>Last Visit</TableHead>
//                 <TableHead>Doctor</TableHead>
//                 <TableHead>Actions</TableHead>
//               </TableRow>
//             </TableHeader>
//             <TableBody>
//               {showPatients.length === 0 ? (
//                 <TableRow>
//                   <TableCell colSpan={6}>
//                     <p className="text-center text-gray-500 py-4">No Patients Found</p>
//                   </TableCell>
//                 </TableRow>
//               ) : (
//                 showPatients.map((patient) => (
//                   <TableRow key={patient.patientId}>
//                     <TableCell>{patient.first_name} {patient.last_name}</TableCell>
//                     <TableCell>
//                       <div className="flex items-center gap-2">
//                         <Phone className="w-4 h-4" /> {patient.phone_number}
//                       </div>
//                       <div className="flex items-center gap-2 text-sm text-gray-500">
//                         <Mail className="w-4 h-4" /> {patient.email}
//                       </div>
//                     </TableCell>
//                     <TableCell>
//                       <div>{patient.insurance_provider}</div>
//                       <div className="text-sm text-gray-500">{patient.insurance_id}</div>
//                     </TableCell>
//                     <TableCell>
//                       <div className="flex items-center gap-2">
//                         <Calendar className="w-4 h-4" />
//                         {patient.lastVisit ? format(new Date(patient.lastVisit), "MMM dd, yyyy") : "N/A"}
//                       </div>
//                     </TableCell>
//                     <TableCell>{patient.doctorName || "N/A"}</TableCell>
//                     <TableCell>
//                       <div className="flex items-center gap-2">
//                         <Button variant="ghost" size="icon">
//                           <FileText className="w-4 h-4" />
//                         </Button>
//                         <Link href={`/patients/${patient.patientId}`}>
//                           <Button
//                             onClick={() => navigate(`/patients/${patient.patientId}`)}
//                             variant="ghost"
//                             size="icon"
//                           >
//                             <ExternalLink className="w-4 h-4" />
//                           </Button>
//                         </Link>
//                       </div>
//                     </TableCell>
//                   </TableRow>
//                 ))
//               )}
//             </TableBody>
//           </Table>
//         </CardContent>
//       </Card>

//       {showAddModal && (
//         <AddPatientModal
//           onClose={() => setShowAddModal(false)}
//           onAddPatient={handleAddPatient}
//         />
//       )}
//     </div>
//   );
// }
// export default Patients;



// import { useEffect, useState } from "react";
// import {
//   Card,
//   CardContent,
//   CardHeader,
//   CardTitle,
// } from "../components/ui/card";
// import { Button } from "../components/ui/button";
// import { Input } from "../components/ui/input";
// import {
//   Table,
//   TableBody,
//   TableCell,
//   TableHead,
//   TableHeader,
//   TableRow,
// } from "../components/ui/table";
// import {
//   Plus,
//   Phone,
//   Mail,
//   Calendar,
//   ExternalLink,
//   FileText,
//   RefreshCw,
// } from "lucide-react";
// import Select from "react-select";
// import AdvancedSearch from "../components/search/AdvancedSearch";
// import { format } from "date-fns";
// import { useDispatch, useSelector } from "react-redux";
// import { fetchPatientsDetails } from "../redux/patient-actions";
// import { fetchAllAppointments } from "../redux/appointment-actions";
// import { fetchDoctorsFromHistory } from "../api/callHistory"; // Adjust path as needed
// import { Link } from "wouter";
// import { navigate } from "wouter/use-browser-location";

// function Patients() {
//   const dispatch = useDispatch();
//   const patients = useSelector((state) => state.patients.patients || []);
//   const appointments = useSelector((state) => state.appointments.appointments || []);

//   const [searchQuery, setSearchQuery] = useState("");
//   const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
//   const [showPatients, setShowPatients] = useState([]);
//   const [doctorOptions, setDoctorOptions] = useState([]);
//   const [appointmentFilters, setAppointmentFilters] = useState({
//     selectedDoctors: [],
//     startDate: "",
//     endDate: "",
//   });

//   useEffect(() => {
//     dispatch(fetchPatientsDetails());
//     dispatch(fetchAllAppointments());
//   }, [dispatch]);

//   useEffect(() => {
//     const enrichPatients = () => {
//       const enriched = patients.map((p) => {
//         const appts = appointments.filter((a) => a.patientId === p.patient_id);
//         const latest = appts.sort((a, b) => new Date(b.date) - new Date(a.date))[0];
//         return {
//           ...p,
//           lastVisit: latest?.date ? new Date(latest.date) : null,
//           doctorName: latest?.doctor_name || latest?.doctor?.full_name || "",
//         };
//       });

//       const filtered = enriched.filter((p) => {
//         const visit = p.lastVisit ? new Date(p.lastVisit).setHours(0, 0, 0, 0) : null;
//         const start = appointmentFilters.startDate
//           ? new Date(appointmentFilters.startDate).setHours(0, 0, 0, 0)
//           : null;
//         const end = appointmentFilters.endDate
//           ? new Date(appointmentFilters.endDate).setHours(23, 59, 59, 999)
//           : null;

//         return (
//           (appointmentFilters.selectedDoctors.length === 0 ||
//             appointmentFilters.selectedDoctors.includes(p.doctorName)) &&
//           (!start || (visit && visit >= start)) &&
//           (!end || (visit && visit <= end))
//         );
//       });

//       setShowPatients(filtered);
//     };

//     enrichPatients();
//   }, [patients, appointments, appointmentFilters]);

//   useEffect(() => {
//     const loadDoctors = async () => {
//       try {
//         const data = await fetchDoctorsFromHistory();
//         const uniqueNames = Array.from(
//           new Set(
//             data
//               .map((item) => item?.doctor?.full_name || item?.doctor_name)
//               .filter(Boolean)
//           )
//         );
//         const formatted = uniqueNames.map((name) => ({
//           value: name,
//           label: name,
//         }));
//         setDoctorOptions(formatted);
//       } catch (err) {
//         console.error("Failed to load doctors:", err);
//       }
//     };

//     loadDoctors();
//   }, []);

//   const handleSearchChange = (e) => {
//     const query = e.target.value;
//     setSearchQuery(query);

//     if (query === "") {
//       setShowPatients(patients);
//       return;
//     }

//     const filtered = patients.filter((p) => {
//       const fullName = `${p?.firstname} ${p?.lastname}`.toLowerCase();
//       return fullName.includes(query.toLowerCase());
//     });
//     setShowPatients(filtered);
//   };

//   const handleRefresh = () => {
//     dispatch(fetchPatientsDetails());
//     dispatch(fetchAllAppointments());
//   };

//   const advancedSearchHandler = (query) => {
//     if (!query) {
//       setShowPatients(patients);
//       return;
//     }

//     setShowPatients(
//       patients.filter((p) => {
//         const dob = query?.dateOfBirth ? p?.dob === query.dateOfBirth : true;
//         const email = query?.email
//           ? p?.email?.toLowerCase().includes(query?.email.toLowerCase())
//           : true;
//         const insuranceId = query?.insuranceId
//           ? p?.insurance_id?.toLowerCase().includes(query?.insuranceId.toLowerCase())
//           : true;
//         const insuranceProvider = query?.insuranceProvider
//           ? p?.insurance_provider?.toLowerCase().includes(query.insuranceProvider.toLowerCase())
//           : true;
//         const phoneNumber = query.phoneNumber
//           ? p?.contactmobilephone?.includes(query.phoneNumber)
//           : true;
//         const ssn = query.ssn
//           ? p?.ssn?.toLowerCase().includes(query.ssn.toLowerCase())
//           : true;

//         return (
//           dob &&
//           email &&
//           insuranceId &&
//           insuranceProvider &&
//           phoneNumber &&
//           ssn
//         );
//       })
//     );
//   };

//   return (
//     <div className="space-y-6">
//       <div className="flex items-center justify-between">
//         <h1 className="text-2xl font-semibold">Patients</h1>
//         <Button onClick={handleRefresh}>
//           <RefreshCw className="w-4 h-4 mr-2" />
//           Refresh
//         </Button>
//       </div>

//       <Card>
//         <CardHeader>
//           <CardTitle>Patient Search</CardTitle>
//         </CardHeader>
//         <CardContent>
//           <div className="flex gap-4">
//             <div className="flex-1">
//               <Input
//                 placeholder="Search patients..."
//                 value={searchQuery}
//                 onChange={handleSearchChange}
//               />
//             </div>
//             <Button
//               variant="outline"
//               onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
//             >
//               Advanced Search
//             </Button>
//           </div>
//           {showAdvancedSearch && (
//             <AdvancedSearch submitHandler={advancedSearchHandler} />
//           )}
//         </CardContent>
//       </Card>

//       <Card>
//         <CardHeader>
//           <CardTitle>Appointment Filters</CardTitle>
//         </CardHeader>
//         <CardContent>
//           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//             <div>
//               <label className="block text-sm font-medium mb-1">Select Doctor(s)</label>
//               <Select
//                 isMulti
//                 options={doctorOptions}
//                 value={doctorOptions.filter(opt =>
//                   appointmentFilters.selectedDoctors.includes(opt.value)
//                 )}
//                 onChange={(selected) =>
//                   setAppointmentFilters({
//                     ...appointmentFilters,
//                     selectedDoctors: selected.map((opt) => opt.value),
//                   })
//                 }
//               />
//             </div>
//             <div>
//               <label className="block text-sm font-medium mb-1">Start Date</label>
//               <Input
//                 type="date"
//                 value={appointmentFilters.startDate}
//                 onChange={(e) =>
//                   setAppointmentFilters({
//                     ...appointmentFilters,
//                     startDate: e.target.value,
//                   })
//                 }
//               />
//             </div>
//             <div>
//               <label className="block text-sm font-medium mb-1">End Date</label>
//               <Input
//                 type="date"
//                 value={appointmentFilters.endDate}
//                 onChange={(e) =>
//                   setAppointmentFilters({
//                     ...appointmentFilters,
//                     endDate: e.target.value,
//                   })
//                 }
//               />
//             </div>
//           </div>
//         </CardContent>
//       </Card>

//       <Card>
//         <CardContent className="p-0">
//           <Table>
//             <TableHeader>
//               <TableRow>
//                 <TableHead>Name</TableHead>
//                 <TableHead>Contact</TableHead>
//                 <TableHead>Insurance</TableHead>
//                 <TableHead>Last Visit</TableHead>
//                 <TableHead>Doctor</TableHead>
//                 <TableHead>Actions</TableHead>
//               </TableRow>
//             </TableHeader>
//             <TableBody>
//               {showPatients.length === 0 ? (
//                 <TableRow>
//                   <TableCell colSpan={6}>
//                     <p className="text-center text-gray-500 py-4">
//                       No Patients Found
//                     </p>
//                   </TableCell>
//                 </TableRow>
//               ) : (
//                 showPatients.map((patient) => (
//                   <TableRow key={patient.patient_id}>
//                     <TableCell>
//                       {patient.firstname} {patient.lastname}
//                     </TableCell>
//                     <TableCell>
//                       <div className="flex items-center gap-2">
//                         <Phone className="w-4 h-4" />
//                         {patient.contactmobilephone}
//                       </div>
//                       <div className="flex items-center gap-2 text-sm text-gray-500">
//                         <Mail className="w-4 h-4" />
//                         {patient.email}
//                       </div>
//                     </TableCell>
//                     <TableCell>
//                       <div>{patient.insurance_provider}</div>
//                       <div className="text-sm text-gray-500">
//                         {patient.insurance_id}
//                       </div>
//                     </TableCell>
//                     <TableCell>
//                       <div className="flex items-center gap-2">
//                         <Calendar className="w-4 h-4" />
//                         {patient.lastVisit
//                           ? format(new Date(patient.lastVisit), "MMM dd, yyyy")
//                           : "N/A"}
//                       </div>
//                     </TableCell>
//                     <TableCell>
//                       {patient.doctorName}
//                     </TableCell>
//                     <TableCell>
//                       <div className="flex items-center gap-2">
//                         <Button variant="ghost" size="icon">
//                           <FileText className="w-4 h-4" />
//                         </Button>
//                         <Link href={`/patients/${patient.patient_id}`}>
//                           <Button
//                             onClick={() => navigate(`/patients/${patient.patient_id}`)}
//                             variant="ghost"
//                             size="icon"
//                           >
//                             <ExternalLink className="w-4 h-4" />
//                           </Button>
//                         </Link>
//                       </div>
//                     </TableCell>
//                   </TableRow>
//                 ))
//               )}
//             </TableBody>
//           </Table>
//         </CardContent>
//       </Card>
//     </div>
//   );
// }

// export default Patients;


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
  Phone,
  Mail,
  Calendar,
  ExternalLink,
  FileText,
  RefreshCw,
} from "lucide-react";
import Select from "react-select";
import AdvancedSearch from "../components/search/AdvancedSearch";
import { format } from "date-fns";
import { useDispatch, useSelector } from "react-redux";
import { fetchPatientsDetails } from "../redux/patient-actions";
import { fetchAllAppointments } from "../redux/appointment-actions";
import { fetchDoctorsFromHistory } from "../api/callHistory";
import { Link } from "wouter";
import { navigate } from "wouter/use-browser-location";

function Patients() {
  const dispatch = useDispatch();
  const patients = useSelector((state) => state.patients.patients || []);
  const appointments = useSelector((state) => state.appointments.appointments || []);

  const [searchQuery, setSearchQuery] = useState("");
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [showPatients, setShowPatients] = useState([]);
  const [doctorOptions, setDoctorOptions] = useState([]);
  const [appointmentFilters, setAppointmentFilters] = useState({
    selectedDoctors: [],
    startDate: "",
    endDate: "",
  });

  useEffect(() => {
    dispatch(fetchPatientsDetails());
    dispatch(fetchAllAppointments());
  }, [dispatch]);

  useEffect(() => {
    const enrichPatients = () => {
      const today = new Date();
      const todayStart = new Date(today.setHours(0, 0, 0, 0));
      const todayEnd = new Date(today.setHours(23, 59, 59, 999));

      const enriched = patients.map((p) => {
        const appts = appointments.filter((a) => a.patientID === p.patient_id);
        const latest = appts.sort((a, b) => new Date(b.date) - new Date(a.date))[0];
        return {
          ...p,
          lastVisit: latest?.date ? new Date(latest.date) : null,
          doctorName: latest?.doctor_name || latest?.doctor?.full_name || "",
        };
      });

      const isFiltering =
        searchQuery ||
        appointmentFilters.selectedDoctors.length > 0 ||
        appointmentFilters.startDate ||
        appointmentFilters.endDate;

      const filtered = enriched.filter((p) => {
        const fullName = `${p?.firstname} ${p?.lastname}`.toLowerCase();
        const visit = p.lastVisit ? new Date(p.lastVisit).getTime() : null;

        const start = appointmentFilters.startDate
          ? new Date(appointmentFilters.startDate).setHours(0, 0, 0, 0)
          : todayStart;
        const end = appointmentFilters.endDate
          ? new Date(appointmentFilters.endDate).setHours(23, 59, 59, 999)
          : todayEnd;

        const matchesDoctor =
          appointmentFilters.selectedDoctors.length === 0 ||
          appointmentFilters.selectedDoctors.includes(p.doctorName);

        const matchesSearch =
          !searchQuery || fullName.includes(searchQuery.toLowerCase());

        const matchesDate = !visit || (visit >= start && visit <= end);

        return matchesSearch && matchesDoctor && matchesDate;
      });

      setShowPatients(
        isFiltering
          ? filtered
          : enriched.filter((p) => {
              const visit = p.lastVisit ? new Date(p.lastVisit).getTime() : null;
              return visit >= todayStart.getTime() && visit <= todayEnd.getTime();
            })
      );
    };

    enrichPatients();
  }, [patients, appointments, searchQuery, appointmentFilters]);

  useEffect(() => {
    const loadDoctors = async () => {
      try {
        const data = await fetchDoctorsFromHistory();
        const uniqueNames = Array.from(
          new Set(
            data.map((item) => item?.doctor?.full_name || item?.doctor_name).filter(Boolean)
          )
        );
        const formatted = uniqueNames.map((name) => ({ value: name, label: name }));
        setDoctorOptions(formatted);
      } catch (err) {
        console.error("Failed to load doctors:", err);
      }
    };

    loadDoctors();
  }, []);

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const resetPatientSearch = () => {
    setSearchQuery("");
  };

  const resetAppointmentFilters = () => {
    setAppointmentFilters({
      selectedDoctors: [],
      startDate: "",
      endDate: "",
    });
  };

  const handleRefresh = () => {
    dispatch(fetchPatientsDetails());
    dispatch(fetchAllAppointments());
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Patients</h1>
        <Button onClick={handleRefresh}>
          <RefreshCw className="w-4 h-4 mr-2" /> Refresh
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
            <Button variant="outline" onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}>
              Advanced Search
            </Button>
          </div>
          <div className="mt-4">
            <Button onClick={resetPatientSearch} variant="destructive">
              Reset Search
            </Button>
          </div>
          {showAdvancedSearch && <AdvancedSearch />}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Appointment Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Select Doctor(s)</label>
              <Select
                isMulti
                options={doctorOptions}
                value={doctorOptions.filter((opt) => appointmentFilters.selectedDoctors.includes(opt.value))}
                onChange={(selected) =>
                  setAppointmentFilters({
                    ...appointmentFilters,
                    selectedDoctors: selected.map((opt) => opt.value),
                  })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Start Date</label>
              <Input
                type="date"
                value={appointmentFilters.startDate}
                onChange={(e) => setAppointmentFilters({ ...appointmentFilters, startDate: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">End Date</label>
              <Input
                type="date"
                value={appointmentFilters.endDate}
                onChange={(e) => setAppointmentFilters({ ...appointmentFilters, endDate: e.target.value })}
              />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <Button onClick={resetAppointmentFilters} variant="destructive">
              Reset Filters
            </Button>
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
                  <TableRow key={patient.patient_id}>
                    <TableCell>{patient.firstname} {patient.lastname}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4" /> {patient.contactmobilephone}
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
                        <Link href={`/patients/${patient.patient_id}`}>
                          <Button
                            onClick={() => navigate(`/patients/${patient.patient_id}`)}
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
