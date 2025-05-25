import { useEffect } from "react";
import { useRoute } from "wouter";
import { navigate } from "wouter/use-browser-location";

const PatientJoinPage = () => {
  const [match] = useRoute("/join-as-patient/:meetingId");

  useEffect(() => {
    if (match?.params?.meetingId) {
      const meetingId = match.params.meetingId;
      // Clean redirect with role=patient
      navigate(`/video-call?room=${meetingId}&role=patient`, { replace: true });
    }
  }, [match]);

  return (
    <div className="p-6 text-center text-gray-700">
      <p>🔄 Redirecting to your secure video call...</p>
    </div>
  );
};

export default PatientJoinPage;
