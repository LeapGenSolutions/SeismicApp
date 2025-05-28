import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import Transcript from "../components/post-call/Transcript";
import Summary from "../components/post-call/Summary";
import Soap from "../components/post-call/Soap";
import Billing from "../components/post-call/Billing";
import Reccomendations from "../components/post-call/Reccomendations";
import Clusters from "../components/post-call/Clusters";



const PostCallDocumentation = ({
  onSave,
}) => {
  const [docTab, setDocTab] = useState("summary");

  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle>Post-Call Documentation</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex space-x-2 mb-6 justify-center">
          {['summary', 'transcript', 'soap', 'recommendations', 'billing', 'clusters'].map(tab => (
            <button
              key={tab}
              className={`px-4 py-2 rounded font-medium ${docTab === tab ? 'bg-blue-600 text-white' : 'bg-white text-neutral-800 border border-b-0'} transition`}
              onClick={() => setDocTab(tab)}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {docTab === 'summary' && (
          <Summary />
        )}

        {docTab === 'transcript' && (
          <Transcript />
        )}
        {docTab === 'soap' && (
          <Soap />
        )}

        {docTab === 'recommendations' && (
          <Reccomendations />
        )}
        {docTab === 'billing' && (
          <Billing />
        )}
        {docTab ==='clusters' &&(
          <Clusters/>
        )}

        <div className="flex justify-end mt-8">
          <Button
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 text-lg"
            onClick={onSave}
          >
            Save Documentation
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default PostCallDocumentation;