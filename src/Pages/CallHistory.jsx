import { useState, useRef, useEffect } from "react";
import { ChevronDown, ExternalLink } from "lucide-react";
import { navigate } from "wouter/use-browser-location";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useQuery } from "@tanstack/react-query";
import { fetchCallHistory, fetchDoctorsFromHistory } from "../api/callHistory";
import { useSelector } from "react-redux";

const generateMockDate = (offset = 0) => new Date(Date.now() + offset * 864e5).toISOString().split("T")[0];
const normalizeDate = (d) => new Date(new Date(d).toDateString());

const mockData = [
  { appointmentId: "apt_1001", doctorId: "anusha", doctorName: "Dr. Anusha Yammada", patient: "Robert Paul", date: generateMockDate(0), time: "10:00 AM" },
  { appointmentId: "apt_1002", doctorId: "ganga", doctorName: "Dr. Ganga Raju", patient: "Emily Stone", date: generateMockDate(0), time: "1:30 PM" },
  { appointmentId: "apt_1003", doctorId: "deepika", doctorName: "Dr. Deepika", patient: "Sara Thomas", date: generateMockDate(0), time: "3:45 PM" }
];

const getInitials = (name) => [name.split(" ")[0][0], name.split(" ")[1][0]].join("").toUpperCase();

const getDateRange = (preset) => {
  const today = new Date(), start = new Date(today), end = new Date(today);
  switch (preset) {
    case "yesterday": start.setDate(today.getDate() - 1); end.setDate(today.getDate() - 1); break;
    case "tomorrow": start.setDate(today.getDate() + 1); end.setDate(today.getDate() + 1); break;
    case "thisWeek": start.setDate(today.getDate() - today.getDay()); end.setDate(start.getDate() + 6); break;
    case "lastWeek": start.setDate(today.getDate() - today.getDay() - 7); end.setDate(start.getDate() + 6); break;
    case "nextWeek": start.setDate(today.getDate() - today.getDay() + 7); end.setDate(start.getDate() + 6); break;
    case "thisMonth": start.setDate(1); break;
    default: break;
  }
  return [start, end];
};

const presetLabels = {
  today: "Today",
  yesterday: "Yesterday",
  tomorrow: "Tomorrow",
  thisWeek: "This Week",
  lastWeek: "Last Week",
  nextWeek: "Next Week",
  thisMonth: "This Month"
};

const ExpandableRow = ({ entry }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="px-4 py-3 bg-white border rounded-lg shadow-sm">
      <div className="flex justify-between items-center" onClick={() => setOpen(!open)}>
        <div className="flex flex-wrap gap-4 text-sm font-medium text-gray-700">
          <span><strong>Patient Name:</strong> {entry.patientName}</span>
          <span><strong>Start Time:</strong> {entry?.startTime}</span>
          <span><strong>End Time:</strong> {entry?.endTime}</span>
          <span><strong>Dr Name:</strong> {entry.fullName}</span>
        </div>
        <div className="flex items-center gap-2 text-gray-500">
          <button onClick={(e) => { e.stopPropagation(); navigate(`/post-call/${entry.appointmentID}`); }} title="Open Post-Call Documentation">
            <ExternalLink className="w-4 h-4 text-blue-600" />
          </button>
        </div>
      </div>
    </div>
  );
};

function CallHistory() {
  const [selectedDoctors, setSelectedDoctors] = useState([]);
  const [dateFilter, setDateFilter] = useState(null);
  const [activePreset, setActivePreset] = useState("today");
  const [patientSearch, setPatientSearch] = useState("");
  const [filteredData, setFilteredData] = useState([]);
  const [allDoctors, setAllDoctors] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showDoctorDropdown, setShowDoctorDropdown] = useState(false);
  const [showPresetDropdown, setShowPresetDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const presetDropdownRef = useRef(null);
  const myEmail = useSelector((state) => state.me.me.email)

  const { data: callHistoryData } = useQuery({
    queryKey: ["call-history"],
    queryFn: () => fetchCallHistory(myEmail)
  })
  
  const { data: doctorsCallHistoryData } = useQuery({
    queryKey: ["doctors-call-history"],
    queryFn: () => fetchDoctorsFromHistory()
  })

  useEffect(()=>{
    if(doctorsCallHistoryData){
      setAllDoctors(doctorsCallHistoryData)
    }
  },[doctorsCallHistoryData])



  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (callHistoryData) {
      setFilteredData(callHistoryData)
    }
  }, [callHistoryData])

  useEffect(() => {
    const handleClick = (e) => {
      if (!dropdownRef.current?.contains(e.target)) setShowDoctorDropdown(false);
      if (!presetDropdownRef.current?.contains(e.target)) setShowPresetDropdown(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const getDropdownLabel = () => !selectedDoctors.length ? "Dr Name" : selectedDoctors.length === allDoctors.length ? "All Doctors" : `${selectedDoctors.length} selected`;

  const handleSubmit = () => {
    const [rangeStart, rangeEnd] = getDateRange(activePreset);
    const filtered = mockData.filter((item) => {
      const date = normalizeDate(item.date);
      return (!selectedDoctors.length || selectedDoctors.includes(item.doctorId)) &&
        (!patientSearch || item?.patient?.toLowerCase()?.includes(patientSearch?.toLowerCase?.())) &&
        (activePreset ? (date >= normalizeDate(rangeStart) && date <= normalizeDate(rangeEnd)) : (!dateFilter || date.getTime() === normalizeDate(dateFilter).getTime()));
    });
    setFilteredData(filtered);
  };

  const toggleDoctor = (id) => setSelectedDoctors((prev) => prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3 mb-4">

        {/* Doctor Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowDoctorDropdown((prev) => !prev)}
            className="flex items-center justify-between w-52 h-10 border border-gray-300 rounded-md px-4 text-sm bg-white shadow-sm hover:border-blue-500"
          >
            <span>{getDropdownLabel()}</span>
            <ChevronDown className="w-4 h-4 text-gray-600" />
          </button>
          {showDoctorDropdown && (
            <div className="absolute mt-2 w-64 border rounded-md bg-white shadow-lg max-h-80 overflow-y-auto z-50">
              <div className="p-2 sticky top-0 bg-white z-10">
                <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search doctor" className="w-full border rounded px-2 py-1 text-sm" />
              </div>
              <div className="px-3 py-2 border-b text-sm hover:bg-gray-100 cursor-pointer" onClick={() => setSelectedDoctors(selectedDoctors.length === allDoctors.length ? [] : allDoctors.map((d) => d.userID))}>
                {selectedDoctors.length === allDoctors.length ? "Unselect All" : "Select All"}
              </div>
              {allDoctors.filter(doc => doc?.fullName?.toLowerCase()?.includes(searchTerm?.toLowerCase?.())).map((doc) => {
                const initials = getInitials(doc.fullName);
                const colorMap = {
                  "Anusha Yammada": "bg-purple-700",
                  "Ganga Raju": "bg-blue-700",
                  "Deepika": "bg-pink-600",
                };
                return (
                  <label key={doc.id} className="flex items-center px-4 py-2 text-sm cursor-pointer hover:bg-gray-100 transition">
                    <input type="checkbox" checked={selectedDoctors.includes(doc.id)} onChange={() => toggleDoctor(doc.id)} className="mr-3 accent-blue-600" />
                    <span className={`w-6 h-6 flex items-center justify-center rounded-full text-white font-semibold text-xs mr-3 ${colorMap[doc.fullName] || "bg-gray-400"}`}>{initials}</span>
                    <span className="text-gray-800">{doc.fullName}</span>
                  </label>
                );
              })}
            </div>
          )}
        </div>

        {/* Custom Quick Filter Dropdown */}
        <div className="relative" ref={presetDropdownRef}>
          <button
            onClick={() => setShowPresetDropdown(prev => !prev)}
            className="flex items-center justify-between w-48 h-10 border border-gray-300 rounded-md px-4 text-sm bg-white shadow-sm hover:border-blue-500"
          >
            {presetLabels[activePreset] || "Quick Filter"}
            <ChevronDown className="w-4 h-4 text-gray-600 ml-2" />
          </button>
          {showPresetDropdown && (
            <div className="absolute z-50 mt-2 w-48 rounded-md shadow-lg bg-white border max-h-64 overflow-auto">
              {Object.entries(presetLabels).map(([key, label]) => (
                <div key={key} onClick={() => { setActivePreset(key); setDateFilter(null); setShowPresetDropdown(false); }} className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer">
                  {label}
                </div>
              ))}
            </div>
          )}
        </div>

        <DatePicker selected={dateFilter} onChange={(date) => { setDateFilter(date); setActivePreset(""); }} placeholderText="Or Pick a Date" className="h-10 border border-gray-300 rounded-md px-4 text-sm w-48" />

        <input value={patientSearch} onChange={(e) => setPatientSearch(e.target.value)} placeholder="Search patient name" className="h-10 border rounded-md px-4 text-sm w-64" />

        <button onClick={handleSubmit} className="h-10 bg-blue-600 text-white px-5 rounded-md text-sm hover:bg-blue-700">Submit</button>
      </div>

      <div className="space-y-3">
        {filteredData.length > 0 ? filteredData.map((entry) => (
          <ExpandableRow key={entry.appointmentId} entry={entry} />
        )) : (
          <div className="p-4 text-gray-500 text-sm border rounded-md text-center">No video calls match your selected filters.</div>
        )}
      </div>
    </div>
  );
}

export default CallHistory