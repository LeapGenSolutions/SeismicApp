import { useState } from "react";
import Summary from "../components/post-call/Summary";
import Transcript from "../components/post-call/Transcript";
import Soap from "../components/post-call/Soap";
import Billing from "../components/post-call/Billing";
import Reccomendations from "../components/post-call/Reccomendations";
import Clusters from "../components/post-call/Clusters";

const PostCallTabs = ({ appointmentId }) => {
  const [docTab, setDocTab] = useState("summary");

  const renderTabContent = () => {
    switch (docTab) {
      case "summary":
        return <Summary appointmentId={appointmentId} />;
      case "transcript":
        return <Transcript appointmentId={appointmentId} />;
      case "soap":
        return <Soap appointmentId={appointmentId} />;
      case "billing":
        return <Billing appointmentId={appointmentId} />;
      case "recommendations":
        return <Reccomendations appointmentId={appointmentId} />;
      case "clusters":
        return <Clusters appointmentId={appointmentId} />;
      default:
        return null;
    }
  };

  return (
    <div className="mt-4 border border-gray-300 rounded-lg p-4">
      <div className="flex space-x-2 mb-4 justify-center">
        {["summary", "transcript", "soap", "billing", "clusters", "recommendations"].map((tab) => (
          <button
            key={tab}
            onClick={() => setDocTab(tab)}
            className={`px-3 py-1 rounded ${
              docTab === tab
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-800 border"
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {renderTabContent()}
    </div>
  );
};

export default PostCallTabs