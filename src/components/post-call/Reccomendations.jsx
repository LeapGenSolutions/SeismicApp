import { useQuery } from "@tanstack/react-query";
import { fetchRecommendationByAppointment, postRecommendationsToAthena } from "../../api/recommendations";
import ReactMarkdown from "react-markdown";
import { useEffect, useState } from "react";
import LoadingCard from "./LoadingCard";
import UpToDate from "./UpToDate";

const Reccomendations = ({ appointmentId, username }) => {
  const { data: reccomendations, isLoading, error } = useQuery({
    queryKey: ["recommendations", appointmentId, username],
    queryFn: () =>
      fetchRecommendationByAppointment(
        `${username}_${appointmentId}_recommendations`,
        username
      ),
  });
  
  const [text, setText] = useState(null);
  const [active, setActive] = useState("recommendations");
  
  // Workflow States
  const [showReview, setShowReview] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [postError, setPostError] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  useEffect(() => {
    if (reccomendations) {
      setText(reccomendations.data.recommendations);
    } else {
      setText("No recommendations available.");
    }
  }, [reccomendations]);

  useEffect(() => {
    if (text) {
      setText(text.replaceAll("####", "## ").replaceAll("###", "# "));
    }
  }, [text]);

  const handleInitiatePost = () => {
    setPostError(false); 
    setShowReview(true);
  };

  const handleCancel = () => {
    setShowReview(false);
    setPostError(false);
  };

  const executePostToAthena = async () => {
    setIsPosting(true);
    setPostError(false);
    
    try {
      console.log("Posting to Athena...");
      
      // Actual API Call
      await postRecommendationsToAthena(appointmentId, username, text);
      
      console.log("Successfully posted to Athena!");
      setShowReview(false); 
      setShowSuccessToast(true); 
      
      // Auto-hide success toast after 3 seconds
      setTimeout(() => {
        setShowSuccessToast(false);
      }, 3000);
      
    } catch (err) {
      console.error("Failed to post to Athena", err);
      setPostError(true); 
    } finally {
      setIsPosting(false);
    }
  };

  if (isLoading) {
    return <LoadingCard message="From symptoms to strategy… aligning recommendations." />;
  }

  if (error) {
    return <LoadingCard />;
  }

  return (
    <div className="relative h-full flex flex-col"> 
      <style>
        {`.markdown h1 {
            font-size: 1.5rem;
            font-weight: bold;
            margin-top: 0.5rem;
          }

          .markdown h2 {
            font-size: 1rem;
            font-weight: bold;
            margin-top: 0.5rem;
          }

          .markdown p {
            line-height: 1.6;
            margin: 0.5rem 0;
          }`}
      </style>

      {/* ==========================================
          MAIN SCREEN 
          ========================================== */}
      <div className="mb-4">
        <h2 className="text-2xl font-semibold text-slate-900">Recommendations</h2>

        <div className="mt-4 flex items-center gap-3">
          <button
            onClick={() => setActive("recommendations")}
            aria-pressed={active === "recommendations"}
            className={`px-6 py-2 rounded-md border shadow-sm text-sm font-medium transition-colors ${
              active === "recommendations"
                ? "bg-blue-600 text-white"
                : "bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            Recommendations
          </button>

          <button
            onClick={() => setActive("uptodate")}
            aria-pressed={active === "uptodate"}
            className={`px-6 py-2 rounded-md border shadow-sm text-sm font-medium transition-colors ${
              active === "uptodate"
                ? "bg-blue-600 text-white"
                : "bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            UpToDate
          </button>
        </div>
      </div>

      <div className="mb-6 flex-grow">
        {active === "recommendations" ? (
          <div className="markdown">
            <ReactMarkdown>{text}</ReactMarkdown>
          </div>
        ) : (
          <div>
            <UpToDate appId={appointmentId} username={username} data={reccomendations?.data} />
          </div>
        )}
      </div>

      <div className="mt-8 pt-4 border-t border-slate-200 flex justify-end">
        <button
          onClick={handleInitiatePost}
          disabled={!text || text === "No recommendations available."}
          className={`px-6 py-2 rounded-md shadow-sm text-sm font-medium text-white transition-colors
            ${(!text || text === "No recommendations available.")
              ? "bg-blue-400 cursor-not-allowed" 
              : "bg-blue-600 hover:bg-blue-700"
            }
          `}
        >
          Post to Athena
        </button>
      </div>

      {/* ==========================================
          MODAL OVERLAY (90vw / 90vh)
          ========================================== */}
      {showReview && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 sm:p-6">
          <div className="bg-white rounded-lg shadow-2xl w-[90vw] h-[90vh] max-w-none flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            
            <div className="px-6 py-4 border-b border-slate-200 shrink-0">
              <h2 className="text-xl font-semibold text-slate-900">Review Recommendations</h2>
              <p className="text-sm text-slate-500 mt-1">Please review the text below before posting to Athena.</p>
            </div>

            <div className="p-6 overflow-y-auto bg-slate-50/50 flex-grow">
              <div className="markdown bg-white border border-slate-200 rounded p-6 shadow-sm min-h-full">
                <ReactMarkdown>{text}</ReactMarkdown>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-200 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
              
              <div className="flex-1 min-h-[24px]">
                {postError && (
                  <p className="text-red-600 text-sm font-medium flex items-center gap-1.5 animate-in fade-in slide-in-from-left-2 duration-200">
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    Posting failed. Please try again.
                  </p>
                )}
              </div>

              <div className="flex items-center gap-3 justify-end">
                <button
                  onClick={handleCancel}
                  disabled={isPosting}
                  className="px-8 py-2.5 rounded-md border border-slate-300 shadow-sm text-sm font-medium bg-white text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                
                <button
                  onClick={executePostToAthena}
                  disabled={isPosting}
                  className={`px-8 py-2.5 rounded-md shadow-sm text-sm font-medium text-white transition-colors min-w-[160px]
                    ${isPosting 
                      ? "bg-blue-400 cursor-not-allowed" 
                      : "bg-blue-600 hover:bg-blue-700"
                    }
                  `}
                >
                  {isPosting ? "Posting..." : "Confirm & Post"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          SUCCESS TOAST NOTIFICATION
          ========================================== */}
      {showSuccessToast && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
          <div className="bg-green-50 border border-green-200 px-4 py-3 rounded-lg shadow-lg flex items-center gap-3">
            <div className="bg-green-100 rounded-full p-1">
              <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            
            <span className="font-medium text-green-800 text-sm pr-2">
              Successfully posted to Athena!
            </span>
            
            <button
              onClick={() => setShowSuccessToast(false)}
              className="text-green-500 hover:text-green-700 transition-colors ml-auto flex-shrink-0"
              aria-label="Close"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reccomendations;