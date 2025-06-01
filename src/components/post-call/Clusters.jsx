import React from "react";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Button } from "../ui/button";

const Clusters = () => {
  const clusterData = {
    Category: "General",
    Severity: "Medium",
    Tags: "Neurology, Follow-Up",
    Notes: "Patient falls under general neurology care cluster. Regular follow-up needed every 3 months.",
  };

  return (
    <div>
      <h3 className="font-medium text-lg mb-4">Cluster Information</h3>
      {Object.entries(clusterData).map(([field, value]) => (
        <div key={field} className="mb-4">
          <Label>{field}</Label>
          <Textarea
            className="mt-1"
            value={value}
            readOnly
          />
        </div>
      ))}

      <div className="flex justify-between mt-4">
        <Button variant="outline" disabled>
          Preview
        </Button>
        <div className="flex justify-between mt-4">
       <Button variant="outline" aria-disabled="true" className="cursor-not-allowed opacity-100 text-black border-gray-300">
        Send to Patient
       </Button>
       <Button
       aria-disabled="true"
       className="bg-blue-600 text-white hover:bg-blue-600 cursor-not-allowed opacity-100"
       >
       Save to Chart
       </Button>
        </div>
      </div>
    </div>
  );
};

export default Clusters;