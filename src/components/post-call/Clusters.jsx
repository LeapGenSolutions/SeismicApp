import React from "react";

//  Original clustered data (not deeply nested, still simple)
const clusteredData = [
  {
    topic: "Introduction and reason for visit",
    soap_section: "S",
    lines: [
      "Doctor: Hi, Mr. Jones. How are you?",
      "Patient: I'm good, Doctor Smith. Nice to see you.",
      "Doctor: Nice to see you again. What brings you back?",
      "Patient: Well, my back's been hurting again."
    ]
  },
  {
    topic: "History of recurring back pain",
    soap_section: "S",
    lines: [
      "Doctor: I see. I've seen you a number of times for this, haven't I?",
      "Patient: Yeah, well, ever since I got hurt on the job three years ago..."
    ]
  },
  {
    topic: "Physical therapy adherence and challenges",
    soap_section: "S",
    lines: [
      "Doctor: Unfortunately, that can happen...",
      "Patient: Which—the pills?",
      "Doctor: Actually, I was talking about the physical therapy...",
      "Patient: See, yeah, once my back started feeling better...",
      "Doctor: Why was that?",
      "Patient: It was starting to become kind of a hassle..."
    ]
  },
  // Add more topics
];

const Clusters = () => {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-xl font-bold">Clusters Information</h1>

      {clusteredData.map((item, index) => (
        <div
          key={index}
          className="p-4 border border-gray-300 rounded-xl shadow-sm bg-white"
        >
          <h2 className="text-lg font-bold mb-1">Topic: {item.topic}</h2>
          <p className="text-sm text-gray-600 mb-2">
            SOAP Section: {item.soap_section}
          </p>
          <ul className="list-disc ml-6 space-y-1">
            {item.lines.map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
};

export default Clusters
