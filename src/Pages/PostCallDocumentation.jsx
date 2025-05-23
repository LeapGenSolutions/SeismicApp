import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Textarea } from "../components/ui/textarea";
import { Label } from "../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "../components/ui/accordion";
import { FileText, Copy, Download } from "lucide-react";



const PostCallDocumentation = ({
  patient: propPatient,
  selectedAppointment: propSelectedAppointment,
  formatRecordingTime: propFormatRecordingTime,
  recordingTime: propRecordingTime,
  onSave,
}) => {
  // Use props if passed, fallback to localStorage if not
  const localData = JSON.parse(localStorage.getItem("postCallData") || "{}");

  const patient = propPatient || localData.patient || { firstName: "Unknown", lastName: "" };
  const selectedAppointment = propSelectedAppointment || localData.selectedAppointment || { reason: "N/A" };
  const recordingTime = propRecordingTime || localData.recordingTime || 0;

  const formatRecordingTime =
    propFormatRecordingTime ||
    ((s) => {
      const min = Math.floor(s / 60).toString().padStart(2, "0");
      const sec = (s % 60).toString().padStart(2, "0");
      return `${min}:${sec}`;
    });

  const [docTab, setDocTab] = useState("summary");
  const [soapNotes, setSoapNotes] = useState({ Subjective: "", Objective: "", Assessment: "", Plan: "" });
  const [recommendations, setRecommendations] = useState({ Diagnosis: "", Medications: "", Lifestyle: "", Followup: "", CallSummary: "" });
  const [billing, setBilling] = useState({ cpt: "", icd: "", notes: "" });
  const [billingModifiers, setBillingModifiers] = useState([]);


  //const [showTemplates, setShowTemplates] = useState(false);
  //const [showCodeSets, setShowCodeSets] = useState(false);

  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle>Post-Call Documentation</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex space-x-2 mb-6 justify-center">
          {['summary', 'transcript', 'soap', 'recommendations', 'billing'].map(tab => (
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
          <div className="bg-blue-50 border border-blue-200 rounded p-6">
            <h3 className="font-medium text-blue-800 mb-2 flex items-center">
              <FileText className="w-5 h-5 mr-2" /> Call Summary
            </h3>
            <div className="text-sm text-neutral-700">
              <p className="mb-2"><span className="font-bold">Patient:</span> {patient?.firstName} {patient?.lastName}</p>
              <p className="mb-2"><span className="font-bold">Date & Time:</span> {new Date().toLocaleString()}</p>
              <p className="mb-2"><span className="font-bold">Duration:</span> {formatRecordingTime(recordingTime)}</p>
              <p className="mb-2"><span className="font-bold">Reason for Visit:</span> {selectedAppointment?.reason}</p>
            </div>
          </div>
        )}

  {docTab === 'transcript' && (
  <div>
    <div className="flex justify-between items-center mb-2">
      <h3 className="font-medium">Call Transcript</h3>
      <div className="flex space-x-2">
        <Button variant="outline" size="sm"><Download className="w-4 h-4 mr-1" /> Download</Button>
        <Button variant="outline" size="sm"><Copy className="w-4 h-4 mr-1" /> Copy</Button>
      </div>
    </div>
    <div className="border rounded p-6 text-neutral-700 min-h-[120px] whitespace-pre-wrap">
      <strong>Doctor:</strong> Hello! How are you feeling today?<br />
      <strong>Patient:</strong> I’ve been having headaches since Monday.<br />
      <strong>Doctor:</strong> Okay. Let’s talk through your symptoms and check for patterns...
    </div>
  </div>
)} 
        {docTab === 'soap' && (
          <div>
            <h3 className="font-medium text-lg mb-4">SOAP Notes</h3>
            <Accordion type="single" collapsible className="mb-6">
              {['Subjective', 'Objective', 'Assessment', 'Plan'].map(section => (
                <AccordionItem value={section} key={section}>
                  <AccordionTrigger className="text-blue-700 font-semibold text-lg">{section}</AccordionTrigger>
                  <AccordionContent>
                    <Textarea
                      className="w-full mt-2"
                      placeholder={`Enter ${section.toLowerCase()}...`}
                      value={soapNotes[section]}
                      onChange={e => setSoapNotes({ ...soapNotes, [section]: e.target.value })}
                      rows={4}
                    />
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
            <div className="flex justify-end">
              <Button className="bg-blue-600 hover:bg-blue-700">Save SOAP Notes</Button>
            </div>
          </div>
        )}

        {docTab === 'recommendations' && (
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
        )}
        {docTab === 'billing' && (
          <div>
            <h3 className="font-medium text-lg mb-4">Billing Codes</h3>
            <Label>CPT Codes</Label>
            <Select value={billing.cpt} onValueChange={val => setBilling({ ...billing, cpt: val })}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select CPT code" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="99213">99213 - Office/outpatient visit</SelectItem>
                <SelectItem value="99214">99214 - Office/outpatient visit, moderate</SelectItem>
              </SelectContent>
            </Select>

            <Label className="mt-4">ICD-10 Codes</Label>
            <Select value={billing.icd} onValueChange={val => setBilling({ ...billing, icd: val })}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select ICD-10 code" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="E11.9">E11.9 - Type 2 diabetes mellitus</SelectItem>
                <SelectItem value="I10">I10 - Hypertension</SelectItem>
              </SelectContent>
            </Select>

            <Label className="mt-4">Modifiers</Label>
            <div className="flex gap-2 mt-2">
              {['95 - Telehealth', 'GT - Telemedicine', 'GQ - Store and Forward'].map(mod => (
                <Button
                  key={mod}
                  variant={billingModifiers.includes(mod) ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setBillingModifiers(
                    billingModifiers.includes(mod)
                      ? billingModifiers.filter(m => m !== mod)
                      : [...billingModifiers, mod]
                  )}
                >
                  {mod}
                </Button>
              ))}
            </div>

            <Label className="mt-4">Billing Notes</Label>
            <Textarea
              className="mt-1"
              placeholder="Additional billing notes..."
              value={billing.notes}
              onChange={e => setBilling({ ...billing, notes: e.target.value })}
            />

            <div className="flex justify-between mt-4">
              <Button variant="outline">Verify Codes</Button>
              <div className="space-x-2">
                <Button variant="outline">Clear All</Button>
                <Button className="bg-blue-600 hover:bg-blue-700">Submit for Billing</Button>
              </div>
            </div>
          </div>
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