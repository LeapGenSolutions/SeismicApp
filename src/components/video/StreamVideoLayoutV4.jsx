import {
  CallingState,
  CancelCallButton,
  RecordCallButton,
  StreamTheme,
  ToggleAudioPreviewButton,
  ToggleVideoPreviewButton,
  useCall,
  useCallStateHooks,
} from "@stream-io/video-react-sdk";

import SideBySideLayout from "./SideBySideLayout";
import { useEffect, useRef, useState } from "react";
import "@stream-io/video-react-sdk/dist/css/styles.css";
import { useSelector } from "react-redux";
import sendMessageToQueue from "../../api/SendMessageToQueue";
import { navigate } from "wouter/use-browser-location";
import DoctorNotesPanel from "./DoctorNotesPanel";

const StreamVideoLayoutV4 = ({ callId }) => {
  const {
    useCallCallingState,
    useParticipants,
    useIsCallRecordingInProgress,
  } = useCallStateHooks();

  const call = useCall();
  const callingState = useCallCallingState();
  const participants = useParticipants();
  const username = useSelector((state) => state.me.me.email);
  const isCallRecordingInProgress = useIsCallRecordingInProgress();

  const [showNotes, setShowNotes] = useState(false);
  const [notes, setNotes] = useState("");

  const intervalRef = useRef(null);
  const cyclingRef = useRef(false);

  useEffect(() => {
    if (!isCallRecordingInProgress) return;
    const interval = setInterval(() => {
      call.stopRecording().then(() => call.startRecording());
      console.log("Triggering periodic recording toggle");
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [isCallRecordingInProgress, call]);

  useEffect(() => {
    if (!call) return;

    const handleRecordingStarted = () =>
      console.log("recording started - " + new Date());
    const handleRecordingStopped = () =>
      console.log("recording stopped - " + new Date());

    const unsubscribers = [
      call.on("call.recording_started", handleRecordingStarted),
      call.on("call.recording_stopped", handleRecordingStopped),
      call.on("call.ended", async () => {
        if (isCallRecordingInProgress) await call.stopRecording();
      }),
    ];
    let localIntervalRef=null
    if (intervalRef.current) localIntervalRef = intervalRef.current;
    return () => {
      unsubscribers.forEach((unsub) => unsub());
      if (localIntervalRef) clearInterval(localIntervalRef);
      cyclingRef.current = false;
    };
  }, [call, isCallRecordingInProgress]);

  const handleCancel = async () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (isCallRecordingInProgress) await call.stopRecording();
    sendMessageToQueue(callId, username);
    navigate(`/post-call/${callId}`, { state: { from: "video-call" } });
  };

  if (callingState !== CallingState.JOINED) {
    return <div>Loading...</div>;
  }

  return (
    <StreamTheme>
      <div>
        <SideBySideLayout participants={participants} />
      </div>

      {showNotes && (
        <DoctorNotesPanel
          notes={notes}
          setNotes={setNotes}
          onClose={() => setShowNotes(false)}
          callId={callId}
        />
      )}

      <div
        style={{
          display: "flex",
          gap: "10px",
          justifyContent: "center",
          marginTop: "10px",
        }}
      >
        <ToggleAudioPreviewButton />
        <ToggleVideoPreviewButton />
        <RecordCallButton />
        <button
          onClick={() => setShowNotes((prev) => !prev)}
          style={{
            backgroundColor: "#4A90E2",
            color: "#fff",
            padding: "10px 14px",
            borderRadius: "8px",
            border: "none",
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          {showNotes ? "Hide Notes" : "Doctor Notes"}
        </button>
        <div onClick={handleCancel}>
          <CancelCallButton />
        </div>
      </div>
    </StreamTheme>
  );
};

export default StreamVideoLayoutV4;
