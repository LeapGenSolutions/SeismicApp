// src/components/post-call/utils/soapUtils.js

// --- Subjective Parsing ---
export const parseSubjective = (subjectiveTextRaw = "") => {
  const rosIndex = subjectiveTextRaw.search(/\b(ROS|Review of Systems|System Review)\b\s*[:-]/i);
  let hpi = "";
  let ros = "";

  if (rosIndex !== -1) {
    hpi = subjectiveTextRaw.slice(0, rosIndex).trim();
    ros = subjectiveTextRaw
      .slice(rosIndex)
      .replace(/\b(ROS|Review of Systems|System Review)\b\s*[:-]/i, "")
      .trim();
  } else {
    hpi = subjectiveTextRaw.trim();
  }

  return { hpi, ros };
};

// --- ROS Formatter ---
export const formatROS = (rosText) => {
  if (!rosText) return null;

  const validSystems = [
    "Constitutional",
    "Eyes",
    "ENT",
    "Cardiovascular",
    "Respiratory",
    "Gastrointestinal",
    "Genitourinary",
    "Neurological",
    "Musculoskeletal",
    "Skin",
  ];

  const rosLines = rosText
    .split(/\n|(?:-\s+)/)
    .map((l) => l.trim())
    .filter((line) => line && /^[A-Za-z]/.test(line));

  return rosLines
    .map((line) => {
      const [heading, ...rest] = line.split(":");
      const system = heading?.trim().replace(/\.$/, "");
      let value = rest.join(":").trim().replace(/\.+$/, "");

      if (!system || !validSystems.some((v) => v.toLowerCase() === system.toLowerCase())) {
        return null;
      }

      value = value
        .replace(/\s+and\s+/gi, ", ")
        .replace(/\s*positive for\s*/i, "Positive for ")
        .replace(/\s*positive\s*/i, "Positive for ")
        .replace(/\s*negative for\s*/i, "Negative for ")
        .replace(/\s*negative\s*/i, "Negative for ")
        .replace(/^no\s+/i, "Negative for ")
        .replace(/^denies\s+/i, "Negative for ");

      if (!/^Negative for|^Positive for/i.test(value)) {
        value = `Positive for ${value}`;
      }

      return { system, value };
    })
    .filter(Boolean);
};

// --- Vitals Normalizer ---
export const normalizeVitalLabel = (label) => {
  const map = {
    bp: "Blood Pressure",
    "blood pressure": "Blood Pressure",
    hr: "Heart Rate",
    "heart rate": "Heart Rate",
    pulse: "Pulse",
    temp: "Temperature",
    temperature: "Temperature",
    rr: "Respiratory Rate",
    "respiratory rate": "Respiratory Rate",
    "o2 sat": "Oxygen Saturation",
    "oxygen saturation": "Oxygen Saturation",
    spo2: "Oxygen Saturation",
    "pulse ox": "Oxygen Saturation",
    bmi: "BMI",
    wt: "Weight",
    weight: "Weight",
    ht: "Height",
    height: "Height",
  };
  return map[label.toLowerCase()] || label;
};