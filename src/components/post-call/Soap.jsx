import { useEffect, useState, useMemo } from "react";
import { Button } from "../ui/button";
import { useQuery, useMutation } from "@tanstack/react-query";
import { fetchSoapNotes, updateSoapNotes } from "../../api/soap";
import LoadingCard from "./LoadingCard";
import SubjectiveSection from "./sections/SubjectiveSection";
import ObjectiveSection from "./sections/ObjectiveSection";
import AssessmentPlanSection from "./sections/AssessmentPlanSection";
import OrdersSection from "./sections/OrdersSection";
import { Copy, Check } from "lucide-react";

const SECTION_TITLES = [
  "Procedure Information",
  "Anesthesia / Analgesia",
  "Preparation & Equipment",
  "Procedure Description",
  "Post-Procedure Assessment",
  "Discharge Instructions",
  "Provider Attestation",
];

// --- UTILITIES: Formatting ---
const formatDataForClipboard = (data, title) => {
  if (!data) return "";
  if (typeof data === "string") return data;

  let text = "";

  if (title === "Subjective") {
    const keys = {
      chief_complaint: "Chief Complaint",
      hpi: "History of Present Illness",
      family_history: "Family History",
      surgical_history: "Surgical History",
      social_history: "Social History",
      ros: "Review of Systems"
    };
    Object.entries(data).forEach(([key, value]) => {
      if (value) text += `${keys[key] || key}:\n${value}\n\n`;
    });
    return text.trim();
  }

  if (title === "Objective") {
    Object.entries(data).forEach(([category, content]) => {
      const catTitle = category.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
      text += `${catTitle}:\n`;
      
      if (typeof content === "object" && !Array.isArray(content)) {
        Object.entries(content).forEach(([k, v]) => text += `  - ${k}: ${v}\n`);
      } else if (Array.isArray(content)) {
        content.forEach(item => text += `  - ${item}\n`);
      } else {
        text += `  ${content}\n`;
      }
      text += "\n";
    });
    return text.trim();
  }

  if (title.includes("Assessment")) {
    if (data.problems && Array.isArray(data.problems)) {
      data.problems.forEach((item, index) => {
        text += `Problem ${index + 1}: ${item.problem}\n`;
        text += `Assessment: ${item.assessment}\n`;
        text += `Plan: ${item.plan}\n\n`;
      });
    }
    if (data.follow_up) text += `Follow Up:\n${data.follow_up}`;
    return text.trim();
  }

  return JSON.stringify(data, null, 2).replace(/[{"},]/g, "");
};

// --- BUTTON COMPONENTS ---

const CopyButton = ({ text, label, className = "" }) => {
  const [copied, setCopied] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const handleCopy = async (e) => {
    e.stopPropagation();
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy: ", err);
    }
  };

  return (
    <button
      onClick={handleCopy}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      disabled={!text || copied}
      className={`
        flex items-center justify-center gap-1.5 px-1.5 py-0.5 rounded-md border shadow-sm transition-all duration-200
        ${copied 
          ? "bg-green-50 text-green-700 border-green-200" 
          : "bg-white text-neutral-400 border-neutral-200 hover:text-green-600 hover:border-green-400"
        }
        ${className}
      `}
      title={label ? `Copy ${label}` : "Copy"}
    >
      {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
      <div className={`overflow-hidden transition-all duration-300 ease-in-out whitespace-nowrap ${isHovered || copied ? "max-w-[100px] opacity-100 ml-1" : "max-w-0 opacity-0"}`}>
        <span className="text-[10px] font-medium uppercase tracking-wide">{copied ? "COPIED" : "COPY"}</span>
      </div>
    </button>
  );
};

// --- DISPLAY COMPONENTS ---

const DisplaySubjective = ({ data, enableCopy }) => {
  if (!data) return null;
  
  const fields = [
    { key: 'chief_complaint', label: 'Chief Complaint' },
    { key: 'hpi', label: 'History of Present Illness' },
    { key: 'family_history', label: 'Family History Discussed' },
    { key: 'surgical_history', label: 'Surgical History Discussed' },
    { key: 'social_history', label: 'Social History Discussed' },
    { key: 'ros', label: 'Review of Systems' }
  ];

  return (
    <div className="py-3 border-b border-neutral-200">
      <h4 className="text-blue-600 font-semibold text-lg mb-2">Subjective</h4>
      <div className="space-y-3">
        {fields.map(({ key, label }) => {
          if (!data[key]) return null;
          return (
            <div key={key} className="group relative">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-sm font-bold text-neutral-900">{label}:</span>
                {enableCopy && (
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <CopyButton text={data[key]} label={label} />
                  </div>
                )}
              </div>
              {key === 'chief_complaint' ? (
                 <p className="text-sm text-neutral-700 leading-snug">"{data[key]}"</p>
              ) : (
                 <p className="text-sm text-neutral-700 whitespace-pre-wrap leading-snug">{data[key]}</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const DisplayObjective = ({ data, enableCopy }) => {
  if (!data || Object.keys(data).length === 0) return null;

  const formatObjectiveValue = (val) => {
      if (typeof val === 'string') return val;
      if (Array.isArray(val)) return val.map(v => `• ${v}`).join('\n');
      if (typeof val === 'object') return Object.entries(val).map(([k, v]) => `• ${k}: ${v}`).join('\n');
      return JSON.stringify(val);
  };

  return (
    <div className="py-3 border-b border-neutral-200">
      <h4 className="text-blue-600 font-semibold text-lg mb-2">Objective</h4>
      <div className="space-y-3">
        {Object.entries(data).map(([key, value]) => {
          const displayKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
          const displayValue = formatObjectiveValue(value);

          if (key === 'vital_signs' && typeof value === 'object') {
             return (
                <div key={key} className="group relative">
                   <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-bold text-neutral-900">{displayKey}:</span>
                      {enableCopy && (
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                           <CopyButton text={JSON.stringify(value, null, 2)} label={displayKey} />
                        </div>
                      )}
                   </div>
                   <div className="text-sm text-neutral-700 grid grid-cols-2 max-w-xs gap-y-0.5">
                      <div className="font-bold text-neutral-900 border-b border-neutral-200 pb-0.5 mb-0.5">Measure</div>
                      <div className="font-bold text-neutral-900 border-b border-neutral-200 pb-0.5 mb-0.5">Value</div>
                      {Object.entries(value).map(([k, v]) => (
                          <div key={k} className="contents">
                              <div className="text-neutral-700">{k}</div>
                              <div className="text-neutral-700">{v}</div>
                          </div>
                      ))}
                   </div>
                </div>
             );
          }

          return (
            <div key={key} className="group relative">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-sm font-bold text-neutral-900">{displayKey}:</span>
                {enableCopy && (
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <CopyButton text={displayValue} label={displayKey} />
                  </div>
                )}
              </div>
              <div className="text-sm text-neutral-700 whitespace-pre-wrap leading-snug pl-2">
                {displayValue}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const DisplayAssessment = ({ data, enableCopy }) => {
  if (!data || Object.keys(data).length === 0) return null;

  const getProblemText = (p) => `Problem: ${p.problem}\nAssessment: ${p.assessment}\nPlan: ${p.plan}`;

  return (
    <div className="py-3 border-b border-neutral-200">
      <h4 className="text-blue-600 font-semibold text-lg mb-2">Assessment & Plan</h4>
      <div className="space-y-4">
        {data.problems && data.problems.map((item, idx) => (
          <div key={idx} className="group relative">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-bold text-blue-800">Problem #{idx + 1}: {item.problem}</span>
              {enableCopy && (
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <CopyButton text={getProblemText(item)} label="Problem" />
                </div>
              )}
            </div>
            
            <div className="pl-0 space-y-2">
              <div>
                <span className="text-sm font-bold text-neutral-900">Assessment: </span>
                <span className="text-sm text-neutral-700 leading-snug">{item.assessment}</span>
              </div>
              <div>
                <span className="text-sm font-bold text-neutral-900 block mb-0.5">Plan:</span>
                <p className="text-sm text-neutral-700 whitespace-pre-wrap leading-snug ml-2 border-l-2 border-neutral-200 pl-2">{item.plan}</p>
              </div>
            </div>
          </div>
        ))}

        {data.follow_up && (
          <div className="mt-3 pt-2 group relative">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-sm font-bold text-neutral-900">Follow-up:</span>
              {enableCopy && (
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <CopyButton text={data.follow_up} label="Follow Up" />
                </div>
              )}
            </div>
            <p className="text-sm text-neutral-700 leading-snug">{data.follow_up}</p>
          </div>
        )}
      </div>
    </div>
  );
};

// --- Section Wrapper ---
const SectionWrapper = ({ title, dataToCopy, children, enableCopy = true }) => {
  const copyText = useMemo(() => formatDataForClipboard(dataToCopy, title), [dataToCopy, title]);

  return (
    <div className="relative group"> 
      <div className="absolute right-0 top-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
         {enableCopy && <CopyButton text={copyText} label={`All ${title}`} className="bg-neutral-50" />}
      </div>
      {children}
    </div>
  );
};

// --- PROCEDURE NOTES COMPONENT ---
const ProcedureNotesSection = ({ content, procedureMeta }) => {
  if (!content) return <p className="text-sm text-neutral-500 italic">No procedure notes available.</p>;

  const lines = content.split("\n").map((l) => l.trim()).filter((line) => {
      const low = line.toLowerCase();
      return line && low !== "$procedure_notes -" && low !== "procedure_notes -" && low !== "procedure note";
    });

  const sections = [];
  let current = null;

  lines.forEach((line) => {
    if (SECTION_TITLES.includes(line)) {
      current = { title: line, items: [] };
      sections.push(current);
      return;
    }
    if (!current) {
      current = { title: "Procedure Notes", items: [] };
      sections.push(current);
    }
    current.items.push(line);
  });

  const isCalloutSection = (title) => title === "Procedure Description";

  const renderLine = (line, idx) => {
    if (line.includes(":")) {
      const [label, ...rest] = line.split(":");
      let value = rest.join(":").trim();
      if (procedureMeta && label.toLowerCase().includes("date & time") && value.toLowerCase().includes("insert")) {
        value = `${procedureMeta.date}, ${procedureMeta.start} – ${procedureMeta.end}`;
      }
      return (
        <div key={idx} className="grid grid-cols-12 gap-4 py-1">
          <div className="col-span-4 text-sm font-medium text-neutral-700">{label}</div>
          <div className="col-span-8 text-sm text-neutral-900">{value || "—"}</div>
        </div>
      );
    }
    return <p key={idx} className="text-sm text-neutral-800 leading-snug py-0.5">{line}</p>;
  };

  return (
    <div className="space-y-4">
      {sections.map((section, idx) => (
        <div key={idx} className="pb-3 border-b border-neutral-200">
          <h4 className="text-blue-600 font-semibold text-lg mb-2">{section.title}</h4>
          {isCalloutSection(section.title) ? (
            <div className="bg-neutral-50 border-l-4 border-blue-300 rounded-md p-3 space-y-1">
              {section.items.map((line, i) => <p key={i} className="text-sm text-neutral-800 leading-snug">{line}</p>)}
            </div>
          ) : (
            <div className="divide-y divide-neutral-100">{section.items.map((line, i) => renderLine(line, i))}</div>
          )}
        </div>
      ))}
    </div>
  );
};

// --- TOAST ---
const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => onClose(), 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-md shadow-lg flex items-center gap-3 animate-in slide-in-from-top-2 ${
      type === "success" ? "bg-green-50 border border-green-200 text-green-800" : "bg-red-50 border border-red-200 text-red-800"
    }`}>
      <span className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${type === "success" ? "bg-green-200 text-green-800" : "bg-red-200 text-red-800"}`}>{type === "success" ? "✓" : "!"}</span>
      <span className="font-medium text-sm">{message}</span>
    </div>
  );
};

// --- MAIN COMPONENT ---

const Soap = ({ appointmentId, username }) => {
  const [soapNotes, setSoapNotes] = useState({
    patient: "",
    subjective: {},
    objective: {},
    assessmentAndPlan: {},
  });

  const [procedureNotes, setProcedureNotes] = useState("");
  const [ordersData, setOrdersData] = useState({ orders: [], confirmed: false });
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState("soap");
  const [, setRawFromServer] = useState("");

  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("success");
  
  const urlParams = new URLSearchParams(window.location.search);
  // eslint-disable-next-line no-unused-vars
  const patientId = urlParams.get('patientId') || localStorage.getItem('currentPatientId') || "defaultPatient";
  // eslint-disable-next-line no-unused-vars
  const forceSystem = urlParams.get('system') || "Athena";
  const navState = window.history.state || {};
  const encounterStart = navState?.startTime;
  const encounterEnd = navState?.endTime;

  // eslint-disable-next-line no-control-regex
  const controlCharRegex = useMemo(() => new RegExp("[\\x00-\\x1F]+", "g"), []);
  const documentId = useMemo(() => `${username}_${appointmentId}_soap`, [username, appointmentId]);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["soap-notes", appointmentId, username],
    queryFn: () => fetchSoapNotes(documentId, username),
  });

  const extractBlock = (raw, marker, nextMarkers = []) => {
    const idx = raw.indexOf(marker);
    if (idx === -1) return "";
    const start = idx + marker.length;
    const after = raw.slice(start);
    const nextIdxs = nextMarkers.map((m) => after.indexOf(m)).filter((n) => n !== -1);
    const end = nextIdxs.length ? Math.min(...nextIdxs) : after.length;
    return after.slice(0, end).trim();
  };

  useEffect(() => {
    if (!data?.data?.soap_notes || isLoading) return;

    const raw = data.data.soap_notes;
    setRawFromServer(raw);
    let soapText = "";
    if (raw.includes("$soap_notes -")) {
      soapText = extractBlock(raw, "$soap_notes -", ["$procedure_notes -", "$orders -"]);
    } else {
      soapText = raw.split("$procedure_notes -")[0]?.trim() || raw;
    }

    const procText = raw.includes("$procedure_notes -") ? extractBlock(raw, "$procedure_notes -", ["$orders -"]) : "";
    setProcedureNotes(procText);

    if (raw.includes("$orders -")) {
      const afterOrders = raw.split("$orders -")[1] || "";
      try {
        let cleaned = afterOrders.replace(controlCharRegex, "").trim().replace(/'/g, '"').replace(/None/g, "null").replace(/True/g, "true").replace(/False/g, "false");
        const parsed = JSON.parse(cleaned);
        if (Array.isArray(parsed)) {
          setOrdersData({ orders: parsed, confirmed: true });
        } else if (parsed?.orders) {
          setOrdersData(parsed);
        } else {
          setOrdersData({ orders: [], confirmed: false });
        }
      } catch (e) {
        console.error("Orders parse failed:", e);
        setOrdersData({ orders: [], confirmed: false });
      }
    }

    const patientMatch = soapText.match(/Patient:\s*(.*?)\n/);
    const reasonMatch = soapText.match(/Reason for Visit -([\s\S]*?)(?=\n\nSubjective -)/);
    const subjectiveMatch = soapText.match(/Subjective -([\s\S]*?)(?=\n\nFamily history discussed)/);
    const familyHistoryMatch = soapText.match(/Family history discussed in this appointment -([\s\S]*?)(?=\n\nSurgical history discussed)/);
    const surgicalHistoryMatch = soapText.match(/Surgical history discussed in this appointment -([\s\S]*?)(?=\n\nSurgical history discussed)/);
    const socialHistoryMatch = soapText.match(/Social history discussed in this appointment -([\s\S]*?)(?=\n\nSocial history discussed)/);
    const socialHistoryMatch2 = soapText.match(/Social history discussed in this appointment -([\s\S]*?)(?=\n\nReview of Systems)/);
    const rosMatch = soapText.match(/Review of Systems(?:\s*\(ROS\))?:\s*([\s\S]*?)(?=\n\nObjective -)/);
    const objectiveMatch = soapText.match(/Objective -([\s\S]*?)(?=\n\nAssessment and Plan -)/);
    const assessmentPlanMatch = soapText.match(/Assessment and Plan -([\s\S]*)$/);

    let objectiveJSON = {}, assessmentPlanJSON = {};
    try {
      const objRaw = objectiveMatch?.[1]?.trim();
      if (objRaw?.includes("{")) objectiveJSON = JSON.parse(objRaw.slice(objRaw.indexOf("{"), objRaw.lastIndexOf("}") + 1).replace(controlCharRegex, ""));
    } catch {}
    try {
      const apRaw = assessmentPlanMatch?.[1]?.trim();
      if (apRaw?.includes("{")) assessmentPlanJSON = JSON.parse(apRaw.slice(apRaw.indexOf("{"), apRaw.lastIndexOf("}") + 1).replace(controlCharRegex, ""));
    } catch {}

    setSoapNotes({
      patient: patientMatch?.[1] || "",
      subjective: {
        chief_complaint: (reasonMatch?.[1] || "").trim(),
        hpi: (subjectiveMatch?.[1] || "").trim(),
        family_history: (familyHistoryMatch?.[1] || "").trim(),
        surgical_history: (surgicalHistoryMatch?.[1] || "").trim(),
        social_history: (socialHistoryMatch?.[1] || socialHistoryMatch2?.[1] || "").trim(),
        ros: (rosMatch?.[1] || "").trim(),
      },
      objective: objectiveJSON,
      assessmentAndPlan: assessmentPlanJSON,
    });
  }, [data, isLoading, controlCharRegex]);

  const mutation = useMutation({
    mutationFn: (updatedNotes) => updateSoapNotes(documentId, username, updatedNotes),
    onSuccess: () => { refetch(); setIsEditing(false); },
    onError: () => showToastMessage("Failed to save SOAP notes.", "error"),
  });

  const buildRawSoap = useMemo(() => {
    return (state) => {
      const { patient, subjective: { chief_complaint, hpi, family_history, surgical_history, social_history, ros }, objective, assessmentAndPlan } = state;
      return [
        patient ? `Patient: ${patient}` : "", "",
        chief_complaint ? `Reason for Visit - ${chief_complaint}` : "", "",
        `Subjective - ${hpi || ""}`, "",
        `Family history discussed in this appointment - ${family_history || "Not discussed"}`, "",
        `Surgical history discussed in this appointment - ${surgical_history || "Not discussed"}`, "",
        `Social history discussed in this appointment - ${social_history || "Not discussed"}`, "",
        ros ? `Review of Systems:\n${ros}` : "Review of Systems:\n", "",
        `Objective - ${JSON.stringify(objective || {}, null, 2)}`, "",
        `Assessment and Plan - ${JSON.stringify(assessmentAndPlan || {}, null, 2)}`
      ].join("\n");
    };
  }, []);

  const buildFullRaw = (state) => {
    return [`$soap_notes -\n${buildRawSoap(state)}`, `$procedure_notes -\n${procedureNotes || ""}`, `$orders - ${JSON.stringify(ordersData)}`].join("\n\n");
  };

  const handleSave = () => mutation.mutate(buildFullRaw(soapNotes));
  const handleCancel = () => { setIsEditing(false); refetch(); };
  const showToastMessage = (message, type = "success") => { setToastMessage(message); setToastType(type); setShowToast(true); };

  if (isLoading) return <LoadingCard message="Loading SOAP..." />;
  if (error) return <LoadingCard />;

  const procedureMeta = (encounterStart && encounterEnd) ? {
    date: new Date(encounterStart).toLocaleDateString("en-US"),
    start: new Date(encounterStart).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
    end: new Date(encounterEnd).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
  } : null;

  return (
    <div className="space-y-4 text-neutral-900 leading-snug">
      {showToast && <Toast message={toastMessage} type={toastType} onClose={() => setShowToast(false)} />}
      
      <h3 className="font-semibold text-black text-lg">SOAP Notes</h3>

      <div className="flex gap-3">
        {["soap", "procedure", "orders"].map((t) => (
          <button key={t} onClick={() => setActiveTab(t)} className={`px-5 py-2 rounded-md text-sm font-medium border transition-colors ${activeTab === t ? "bg-blue-600 text-white border-blue-600" : "bg-white text-black-700 border-black-300"}`}>
            {t === "soap" ? "SOAP" : t === "procedure" ? "Procedure Notes" : "Orders"}
          </button>
        ))}
      </div>

      {activeTab === "soap" ? (
        <>
          <div className="space-y-4 divide-y divide-neutral-300">
            {soapNotes.patient && <div className="pb-2"><p className="text-base font-medium text-neutral-900">{soapNotes.patient}</p></div>}
            
            {isEditing ? (
              <div className="space-y-6">
                <SubjectiveSection soapNotes={soapNotes} setSoapNotes={setSoapNotes} isEditing={true} />
                <ObjectiveSection soapNotes={soapNotes} setSoapNotes={setSoapNotes} isEditing={true} />
                <AssessmentPlanSection soapNotes={soapNotes} setSoapNotes={setSoapNotes} isEditing={true} />
              </div>
            ) : (
              <div className="space-y-4">
                <SectionWrapper title="Subjective" dataToCopy={soapNotes.subjective}>
                    <DisplaySubjective 
                        data={soapNotes.subjective} 
                        enableCopy={true} 
                    />
                </SectionWrapper>
                <SectionWrapper title="Objective" dataToCopy={soapNotes.objective}>
                    <DisplayObjective 
                        data={soapNotes.objective} 
                        enableCopy={true} 
                    />
                </SectionWrapper>
                <SectionWrapper title="Assessment & Plan" dataToCopy={soapNotes.assessmentAndPlan}>
                    <DisplayAssessment 
                        data={soapNotes.assessmentAndPlan} 
                        enableCopy={true} 
                    />
                </SectionWrapper>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-neutral-300">
            {!isEditing ? (
              <Button onClick={() => setIsEditing(true)} className="bg-blue-600 text-white hover:bg-blue-700">Edit</Button>
            ) : (
              <>
                <Button onClick={handleSave} disabled={mutation.isLoading} className="bg-blue-600 hover:bg-blue-700 text-white">{mutation.isLoading ? "Saving..." : "Save SOAP Notes"}</Button>
                <Button onClick={handleCancel} className="bg-gray-500 hover:bg-gray-600 text-white">Cancel</Button>
              </>
            )}
          </div>
        </>
      ) : activeTab === "procedure" ? (
        <ProcedureNotesSection content={procedureNotes} procedureMeta={procedureMeta} />
      ) : (
        <OrdersSection ordersData={ordersData} />
      )}
    </div>
  );
};

export default Soap;