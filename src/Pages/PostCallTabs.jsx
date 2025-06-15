import { useState } from "react";
import { useSelector } from "react-redux";

const PostCallTabs = ({ appointmentId }) => {
  const [docTab, setDocTab] = useState("summary");

  // Safely select state with fallback to empty object
  const transcripts = useSelector((state) => state.transcripts?.[appointmentId] ?? null);
  const summaries = useSelector((state) => state.summaries?.[appointmentId] ?? null);
  const soapNotes = useSelector((state) => state.soapNotes?.[appointmentId] ?? null);
  const billingCodes = useSelector((state) => state.billingCodes?.[appointmentId] ?? null);
  const clusters = useSelector((state) => state.clusters?.[appointmentId] ?? null);
  const doctorNotes = useSelector((state) => state.doctorNotes?.[appointmentId] ?? null);

  const renderTabContent = () => {
    switch (docTab) {
      case "summary":
        return <div>{summaries || "No summary available"}</div>;
      case "transcript":
        return <div>{transcripts || "No transcript available"}</div>;
      case "soap":
        return <div>{soapNotes || "No SOAP notes available"}</div>;
      case "billing":
        return <div>{billingCodes || "No billing info available"}</div>;
      case "clusters":
        return <div>{clusters || "No cluster info available"}</div>;
      case "recommendations":
        return <div>{clusters || "No recommendations info available"}</div>;
      case "doctorNotes":
        return <div>{doctorNotes || "No doctor notes added."}</div>;
      default:
        return null;
    }
  };

  return (
    <div className="mt-4 border border-gray-300 rounded-lg p-4">
      <div className="flex space-x-2 mb-4 justify-center">
        {["summary", "transcript", "soap", "billing", "clusters", "doctorNotes","recommendations",].map((tab) => (
          <button
            key={tab}
            onClick={() => setDocTab(tab)}
            className={`px-3 py-1 rounded ${
              docTab === tab
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-800 border"
            }`}
          >
            {tab === "doctorNotes" ? "Doctor Notes" : tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {renderTabContent()}
    </div>
  );
};
export default PostCallTabs