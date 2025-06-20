import { useState, useRef, useEffect } from "react";
import { ChevronDown, ExternalLink } from "lucide-react";
import { navigate } from "wouter/use-browser-location";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useQuery } from "@tanstack/react-query";
import { fetchCallHistory, fetchDoctorsFromHistory } from "../api/callHistory";
import { useSelector } from "react-redux";
import { bgColors } from "../constants/colors";

const normalizeDate = (iso) => new Date(new Date(iso).toDateString());

const getInitials = (name) => {
  if (!name) return "";
  const parts = name.trim().split(" ");
  return parts[0]?.[0]?.toUpperCase() + (parts[1]?.[0]?.toUpperCase() || "");
};

const ExpandableRow = ({ entry }) => (
  <div className="px-4 py-3 bg-white border rounded-lg shadow-sm">
    <div className="flex justify-between items-center">
      <div className="flex flex-wrap gap-4 text-sm font-medium text-gray-700">
        <span><strong>Patient Name:</strong> {entry.patientName || "Unknown"}</span>
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

function CallHistory() {
  const [selectedDoctors, setSelectedDoctors] = useState([]);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [patientSearch, setPatientSearch] = useState("");
  const [filteredData, setFilteredData] = useState([]);
  const [allDoctors, setAllDoctors] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showDoctorDropdown, setShowDoctorDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const myEmail = useSelector((state) => state.me.me.email)

  const { data: callHistoryData } = useQuery({
    queryKey: ["call-history"],
    queryFn: () => fetchCallHistory(myEmail)
  })

  const { data: doctorsCallHistoryData } = useQuery({
    queryKey: ["doctors-call-history"],
    queryFn: () => fetchDoctorsFromHistory()
  })

  useEffect(() => {
    if (doctorsCallHistoryData) {
      setAllDoctors(doctorsCallHistoryData)
    }
  }, [doctorsCallHistoryData])

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (callHistoryData) {
      setFilteredData(
        callHistoryData.filter(item => item?.patientName && item?.patientName?.toLowerCase() !== "unknown")
      );
    }
  }, [callHistoryData])

  useEffect(() => {
    const handleClick = (e) => {
      if (!dropdownRef.current?.contains(e.target)) setShowDoctorDropdown(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const toggleDoctor = (id) => {
    setSelectedDoctors((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]
    );
  };

  const handleSubmit = () => {
    const filtered = callHistoryData.filter((item) => {
      if (!item.patientName || item.patientName.toLowerCase() === "unknown") {
        return false; //  skip entries with missing or unknown patient name
      }
      const date = normalizeDate(item.startTime);
      const matchDoctor = selectedDoctors.length === 0
        ? false // don't show any records if nothing is selected
        : selectedDoctors.includes(item.userID);

      const matchPatient = !patientSearch || item.patientName.toLowerCase().includes(patientSearch.toLowerCase());
      const matchDate =
        (!startDate || date >= normalizeDate(startDate)) &&
        (!endDate || date <= normalizeDate(endDate));
      return matchDoctor && matchPatient && matchDate;
    });

    setFilteredData(filtered);
  };

  const getDropdownLabel = () =>
    !selectedDoctors.length
      ? "Dr Name"
      : selectedDoctors.length === allDoctors.length
        ? "All Doctors"
        : `${selectedDoctors.length} selected`;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3 mb-4">
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
                <input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search doctor"
                  className="w-full border rounded px-2 py-1 text-sm"
                />
              </div>
              <div
                className="px-3 py-2 border-b text-sm hover:bg-gray-100 cursor-pointer"
                onClick={() => {
                  const all = allDoctors.map((d) => d.userID);
                  setSelectedDoctors(selectedDoctors.length === all.length ? [] : all);
                }}
              >
                {selectedDoctors.length === allDoctors.length ? "Unselect All" : "Select All"}
              </div>
              {allDoctors
                .filter((doc) => doc?.fullName?.toLowerCase().includes(searchTerm?.toLowerCase()))
                .map((doc) => {
                  const initials = getInitials(doc.fullName);
                  const color = bgColors[Math.floor(Math.random() * bgColors.length)];
                  return (
                    <label
                      key={doc.userID}
                      className="flex items-center px-4 py-2 text-sm cursor-pointer hover:bg-gray-100 transition"
                    >
                      <input
                        type="checkbox"
                        checked={selectedDoctors.includes(doc.userID)}
                        onChange={() => toggleDoctor(doc.userID)}
                        className="mr-3 accent-blue-600"
                      />
                      <span
                        className={`w-6 h-6 flex items-center justify-center rounded-full text-white font-semibold text-xs mr-3 ${color}`}
                      >
                        {initials}
                      </span>
                      <span className="text-gray-800">{doc.fullName}</span>
                    </label>
                  );
                })}
            </div>
          )}
        </div>

        <DatePicker
          selected={startDate}
          onChange={(date) => setStartDate(date)}
          placeholderText="Start Date"
          className="h-10 border border-gray-300 rounded-md px-4 text-sm w-48"
        />
        <DatePicker
          selected={endDate}
          onChange={(date) => setEndDate(date)}
          placeholderText="End Date"
          className="h-10 border border-gray-300 rounded-md px-4 text-sm w-48"
        />

        <input
          value={patientSearch}
          onChange={(e) => setPatientSearch(e.target.value)}
          placeholder="Search patient name"
          className="h-10 border rounded-md px-4 text-sm w-64"
        />

        <button
          onClick={handleSubmit}
          className="h-10 bg-blue-600 text-white px-5 rounded-md text-sm hover:bg-blue-700"
        >
          Submit
        </button>
      </div>
      <div className="space-y-3">
        {filteredData.length > 0 ? (
          filteredData.map((entry) => (
            <ExpandableRow key={entry.appointmentId} entry={entry} />
          ))
        ) : (
          <div className="p-4 text-gray-500 text-sm border rounded-md text-center">
            No video calls match your selected filters.
          </div>
        )}
      </div>
    </div>
  );
}
export default CallHistory