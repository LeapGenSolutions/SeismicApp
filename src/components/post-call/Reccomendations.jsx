import React, { useState } from "react";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Button } from "../ui/button";

const Reccomendations = () => {
    const [recommendations, setRecommendations] = useState({ Diagnosis: "", Medications: "", Lifestyle: "", Followup: "", CallSummary: "" });
      
    return (
        <div>
            <h3 className="font-medium text-lg mb-4">Patient Recommendations</h3>
            {Object.entries(recommendations).map(([field, value]) => (
                <div key={field} className="mb-4">
                    <Label>{field.replace(/([A-Z])/g, ' $1')}</Label>
                    <Textarea
                        className="mt-1"
                        placeholder={`Enter ${field.toLowerCase()}...`}
                        value={value}
                        onChange={e => setRecommendations({ ...recommendations, [field]: e.target.value })}
                    />
                </div>
            ))}
            <div className="flex justify-between mt-4">
                <Button variant="outline">Preview</Button>
                <div className="space-x-2">
                    <Button variant="outline">Send to Patient</Button>
                    <Button className="bg-blue-600 hover:bg-blue-700">Save to Chart</Button>
                </div>
            </div>
        </div>
    )
}

export default Reccomendations