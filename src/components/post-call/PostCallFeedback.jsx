import React, { useState, useRef } from "react";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { updatePostCallFeedbackByAppointment } from "../../api/postCallFeedback";

const CallFeedback = ({ username, appointmentId }) => {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    overallExperience: 0,
    summaryAccuracy: 0,
    soapHelpfulness: 0,
    billingAccuracy: 0,
    transcriptAccuracy: 0,
    featureSuggestions: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [showThankYou, setShowThankYou] = useState(false);
  const [dialogMode, setDialogMode] = useState(null);

  // Resize State
  const [dimensions, setDimensions] = useState({ width: 384, height: 500 });

  const ratingOptions = [1, 2, 3, 4, 5];

  // Manual Resizing Logic for Bottom-Left
  const handleMouseDown = (e) => {
    e.preventDefault();
    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = dimensions.width;
    const startHeight = dimensions.height;

    const onMouseMove = (moveEvent) => {
      // Horizontal resize: Increasing width when dragging LEFT, limited to 50% screen width
      const deltaX = startX - moveEvent.clientX; 
      const newWidth = Math.min(window.innerWidth / 2, Math.max(350, startWidth + deltaX));
      
      // Vertical resize: Increasing height when dragging DOWN
      const deltaY = moveEvent.clientY - startY;
      const newHeight = Math.max(300, startHeight + deltaY);

      setDimensions({ width: newWidth, height: newHeight });
    };

    const onMouseUp = () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  };

  const resizableContainerClass = "absolute top-0 right-0 bg-white border border-gray-300 rounded-xl shadow-lg z-50 overflow-hidden flex flex-col";

  const renderRatingButtons = (field, editable = true) => (
    <div className="flex items-center space-x-2 mt-1">
      {ratingOptions.map((num) => (
        <button
          key={num}
          type="button"
          className={`w-8 h-8 rounded-lg border font-medium text-sm ${
            form[field] === num
              ? "bg-blue-600 text-white"
              : "bg-white text-gray-700 border-gray-300"
          } ${!editable ? "cursor-default" : "hover:border-blue-500"}`}
          onClick={() => {
            if (!editable) return;
            setForm((f) => ({
              ...f,
              [field]: f[field] === num ? 0 : num,
            }));
          }}
        >
          {num}
        </button>
      ))}
      <span className="ml-2 text-xs text-gray-500">1-Poor, 5-Very Satisfied</span>
    </div>
  );

  const validateForm = () => {
    const ratings = [
      form.overallExperience,
      form.summaryAccuracy,
      form.soapHelpfulness,
      form.billingAccuracy,
      form.transcriptAccuracy,
    ];
    return !ratings.every((r) => r === 0);
  };

  const handleSave = async () => {
    setError(null);
    if (!validateForm()) {
      setError("Please provide rating to submit. Thank you.");
      return;
    }

    setSaving(true);
    try {
      await updatePostCallFeedbackByAppointment(appointmentId, {
        userID: username,
        ...form,
      });
      setSubmitted(true);
      setShowForm(false);
      setDialogMode(null);
      setShowThankYou(true);
      setTimeout(() => setShowThankYou(false), 3000);
    } catch {
      setError("Failed to save post call feedback. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleFeedbackButtonClick = () => {
    if (submitted) {
      setDialogMode("select");
    } else {
      setShowForm(true);
    }
  };

  return (
    <div className="relative">
      {!showForm && !showThankYou && !dialogMode && (
        <Button
          className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-white bg-blue-600 border border-blue-700 rounded-lg hover:bg-blue-700 transition-colors duration-200"
          onClick={handleFeedbackButtonClick}
        >
          Call Feedback
        </Button>
      )}

      {(showForm || dialogMode === "view" || dialogMode === "edit" || dialogMode === "select") && (
        <div 
          className={resizableContainerClass} 
          style={{ width: `${dimensions.width}px`, height: dialogMode === "select" ? 'auto' : `${dimensions.height}px` }}
        >
          <div className="p-6 flex-1 overflow-y-auto">
            {/* Logic for Title/Content based on mode */}
            <h2 className="text-lg font-semibold text-blue-800 mb-4">
              {dialogMode === "select" ? "Feedback already given" : 
               dialogMode === "view" ? "View Feedback" : 
               dialogMode === "edit" ? "Edit Feedback" : "Call Feedback"}
            </h2>

            {dialogMode === "select" ? (
              <div className="flex justify-end space-x-2">
                <Button size="sm" onClick={() => setDialogMode("view")}>View</Button>
                <Button size="sm" className="bg-blue-600 text-white" onClick={() => setDialogMode("edit")}>Edit</Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="font-medium text-gray-700 text-sm">Overall Experience</label>
                  {renderRatingButtons("overallExperience", dialogMode !== "view")}
                </div>
                <div>
                  <label className="font-medium text-gray-700 text-sm">Was summary accurate?</label>
                  {renderRatingButtons("summaryAccuracy", dialogMode !== "view")}
                </div>
                <div>
                  <label className="font-medium text-gray-700 text-sm">Were SOAP notes accurate?</label>
                  {renderRatingButtons("soapHelpfulness", dialogMode !== "view")}
                </div>
                <div>
                  <label className="font-medium text-gray-700 text-sm">Were billing codes accurate?</label>
                  {renderRatingButtons("billingAccuracy", dialogMode !== "view")}
                </div>
                <div>
                  <label className="font-medium text-gray-700 text-sm">Was transcript accurate?</label>
                  {renderRatingButtons("transcriptAccuracy", dialogMode !== "view")}
                </div>
                <div>
                  <label className="font-medium text-gray-700 text-sm">Features/Improvements</label>
                  <Textarea
                    placeholder="Your suggestions..."
                    value={form.featureSuggestions}
                    readOnly={dialogMode === "view"}
                    onChange={(e) => setForm((f) => ({ ...f, featureSuggestions: e.target.value }))}
                    rows={3}
                    className={`${dialogMode === "view" ? "bg-gray-50" : "bg-white"} border border-gray-300 mt-1 w-full rounded`}
                  />
                </div>
                {error && dialogMode !== "view" && <div className="text-red-600 font-medium text-sm">{error}</div>}
                <div className="flex justify-end space-x-2 mt-4">
                  {dialogMode !== "view" && (
                    <Button size="sm" onClick={handleSave} disabled={saving}>
                      {saving ? "Saving..." : "Submit"}
                    </Button>
                  )}
                  <Button size="sm" variant="outline" onClick={() => { setShowForm(false); setDialogMode(null); }}>
                    {dialogMode === "view" ? "Close" : "Cancel"}
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* RESIZE HANDLE: Double Sided Arrow Icon */}
          <div 
            onMouseDown={handleMouseDown} 
            className="absolute bottom-0 left-0 w-8 h-8 cursor-nesw-resize flex items-center justify-center group"
            title="Drag to resize"
          >
            <svg 
              className="w-4 h-4 text-gray-400 group-hover:text-blue-600 rotate-90 transition-colors" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor" 
              strokeWidth={3}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7l4-4m0 0l4 4m-4-4v18m0 0l-4-4m4 4l4 4" />
            </svg>
          </div>
        </div>
      )}

      {showThankYou && (
        <div className="absolute top-0 right-0 bg-white border border-gray-300 rounded-xl shadow-lg p-6 w-96 z-50 flex items-center justify-center">
          <span className="text-green-600 font-medium">Thank you for your feedback!</span>
        </div>
      )}
    </div>
  );
};

export default CallFeedback;