import React, { useState, useRef, useEffect } from "react";
import { io } from "socket.io-client";
import Peer from "simple-peer";
import html2canvas from "html2canvas";
import { FaPhoneAlt, FaPhoneSlash, FaVideo, FaStop } from "react-icons/fa";

const VideoCallPage = () => {
  const [callAccepted, setCallAccepted] = useState(false);
  const [callEnded, setCallEnded] = useState(false);
  const [stream, setStream] = useState();
  const [name, setName] = useState("");
  const [call, setCall] = useState({});
  const [me, setMe] = useState("");
  const [callStatus, setCallStatus] = useState("Waiting to connect...");

  const myVideo = useRef();
  const userVideo = useRef();
  const connectionRef = useRef();

  const socket = useRef(null);

  useEffect(() => {
    socket.current = io(
      "https://seismic-backend-04272025-bjbxatgnadguabg9.centralus-01.azurewebsites.net/"
    );

    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((currentStream) => {
        setStream(currentStream);
        if (myVideo.current) {
          myVideo.current.srcObject = currentStream;
        }
      });

    socket.current.on("me", (id) => setMe(id));

    socket.current.on("callUser", ({ from, name: callerName, signal }) => {
      setCall({ isReceivingCall: true, from, name: callerName, signal });
    });

    return () => {
      socket.current.disconnect();
    };
  }, []);

  const answerCall = () => {
    setCallStatus("In Call");
    setCallAccepted(true);

    const peer = new Peer({ initiator: false, trickle: false, stream });

    peer.on("signal", (data) => {
      socket.current.emit("answerCall", { signal: data, to: call.from });
    });

    peer.on("stream", (currentStream) => {
      userVideo.current.srcObject = currentStream;
    });

    peer.signal(call.signal);

    connectionRef.current = peer;
  };

  const callUser = (id) => {
    setCallStatus("In Call");
    const peer = new Peer({ initiator: true, trickle: false, stream });

    peer.on("signal", (data) => {
      socket.current.emit("callUser", {
        userToCall: id,
        signalData: data,
        from: me,
        name,
      });
    });

    peer.on("stream", (currentStream) => {
      userVideo.current.srcObject = currentStream;
    });

    socket.current.on("callAccepted", (signal) => {
      setCallAccepted(true);

      peer.signal(signal);
    });

    connectionRef.current = peer;
  };

  const leaveCall = () => {
    setCallStatus("Call Ended");
    setCallEnded(true);

    if (connectionRef.current) {
      connectionRef.current.destroy();
    }

    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }

    window.location.reload();
  };

  const divRef = useRef(null);
  const [recording, setRecording] = useState(false);
  const videoBlob = useState(null)[0];
  const mediaStream = useRef(null);
  const recorder = useRef(null);
  const chunks = useRef([]);

  const startCanvasUpdates = (canvas, sourceDiv) => {
    const ctx = canvas.getContext("2d");
    setInterval(async () => {
      try {
        const snapshot = await html2canvas(sourceDiv);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(snapshot, 0, 0, canvas.width, canvas.height);
      } catch (error) {
        console.error("Error capturing canvas snapshot:", error);
      }
    }, 1000 / 30);
  };

  const captureDivWithAudio = async () => {
    const sourceDiv = divRef.current;
    const { width, height } = sourceDiv.getBoundingClientRect();

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    startCanvasUpdates(canvas, sourceDiv);

    const canvasStream = canvas.captureStream(30);

    // Get the local audio stream
    const localAudioStream = await navigator.mediaDevices.getUserMedia({
      audio: true,
    });

    // Prepare AudioContext for mixing
    const audioContext = new AudioContext();
    const destination = audioContext.createMediaStreamDestination();

    // Add local audio to the AudioContext
    const localAudioSource =
      audioContext.createMediaStreamSource(localAudioStream);
    localAudioSource.connect(destination);

    // Add remote audio to the AudioContext
    if (callAccepted && userVideo.current?.srcObject) {
      const remoteAudioStream = userVideo.current.srcObject;
      const remoteAudioSource =
        audioContext.createMediaStreamSource(remoteAudioStream);
      remoteAudioSource.connect(destination);
    }

    // Create a combined stream
    const combinedStream = new MediaStream();

    // Add canvas video track to the combined stream
    canvasStream
      .getVideoTracks()
      .forEach((track) => combinedStream.addTrack(track));

    // Add mixed audio track to the combined stream
    destination.stream
      .getAudioTracks()
      .forEach((track) => combinedStream.addTrack(track));

    mediaStream.current = localAudioStream; // Store the local audio stream to stop later

    return combinedStream;
  };

  // Add these state variables
  const [recordingInterval, setRecordingInterval] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  // Modified startRecording function
  const startRecording = async () => {
    try {
      const stream = await captureDivWithAudio();
      mediaStream.current = stream;
      chunks.current = [];

      recorder.current = new MediaRecorder(stream, {
        mimeType: "video/webm;codecs=vp9,opus",
      });

      // Upload chunks every 5 seconds (adjust as needed)
      const interval = setInterval(() => {
        if (chunks.current.length > 0 && !isUploading) {
          uploadChunks();
        }
      }, 5000);

      setRecordingInterval(interval);

      recorder.current.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.current.push(e.data);
        }
      };

      recorder.current.start(5000); // Collect 1-second chunks
      setRecording(true);
    } catch (error) {
      console.error("Recording start failed:", error);
    }
  };

  // New function to upload chunks
  const uploadChunks = async () => {
    if (chunks.current.length === 0 || isUploading) return;

    setIsUploading(true);
    const chunkToUpload = chunks.current.shift();

    try {
      const formData = new FormData();
      formData.append("chunk", chunkToUpload);

      await fetch(`https://seismic-backend-04272025-bjbxatgnadguabg9.centralus-01.azurewebsites.net/upload-chunk/${me}/${Date.now()}`, {
        method: "POST",
        body: formData,
      });

      console.log("Chunk uploaded successfully");
    } catch (error) {
      console.error("Chunk upload failed:", error);
      // Requeue failed chunk
      chunks.current.unshift(chunkToUpload);
    } finally {
      setIsUploading(false);
    }
  };

  // Modified stopRecording function
  const stopRecording = () => {
    if (recorder.current && recorder.current.state === "recording") {
      recorder.current.stop();
    }
    if (recordingInterval) {
      clearInterval(recordingInterval);
    }

    // Upload any remaining chunks
    if (chunks.current.length > 0) {
      uploadChunks();
    }

    setRecording(false);
  };

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (recordingInterval) {
        clearInterval(recordingInterval);
      }
    };
  }, [recordingInterval]);

  return (
    <div className="bg-gray-50 flex flex-col justify-center items-center">
      <div className="bg-white shadow-lg rounded-lg p-8 w-full">
        <div className="flex flex-col items-center">
          <p className="text-center mb-4 font-bold text-black text-xl">
            Your ID: {me}
          </p>
          <input
            type="text"
            placeholder="Enter your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="border border-gray-300 rounded-lg px-4 w-[20rem] py-2 mb-4"
          />
        </div>
        <div
          ref={divRef}
          className="flex justify-center space-x-4 mb-6 video-container"
        >
          <div className="relative w-64 h-48 bg-gray-200 rounded-lg overflow-hidden">
            <video
              playsInline
              muted
              ref={myVideo}
              autoPlay
              className="w-full h-full object-cover"
            />
          </div>
          {callAccepted && !callEnded && (
            <div className="relative w-64 h-48 bg-gray-200 rounded-lg overflow-hidden">
              <video
                playsInline
                ref={userVideo}
                autoPlay
                className="w-full h-full object-cover"
              />
            </div>
          )}
        </div>
        <p className="text-gray-500 mb-4 text-center">{callStatus}</p>

        <div className="text-center mb-6">
          <button
            onClick={() => callUser(prompt("Enter ID to call:"))}
            className="bg-blue-500 text-white rounded-lg py-2 px-4 w-full max-w-xs hover:bg-blue-600 focus:outline-none"
          >
            <FaPhoneAlt className="inline-block mr-2" />
            Start Call
          </button>
        </div>

        {call.isReceivingCall && !callAccepted && (
          <div className="text-center mb-4">
            <h2 className="text-xl font-semibold mb-2">
              {call.name} is calling...
            </h2>
            <button
              onClick={answerCall}
              className="bg-green-500 text-white rounded-lg py-2 px-4 hover:bg-green-600 focus:outline-none"
            >
              <FaPhoneAlt className="inline-block mr-2" />
              Answer
            </button>
          </div>
        )}

        {callAccepted && !callEnded && (
          <div className="text-center mb-4">
            {!recording ? (
              <button
                onClick={startRecording}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
              >
                <FaVideo className="inline-block mr-2" />
                Start Recording
              </button>
            ) : (
              <button
                onClick={stopRecording}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
              >
                <FaStop className="inline-block mr-2" />
                Stop Recording
              </button>
            )}
            <button
              onClick={leaveCall}
              className="bg-red-500 text-white rounded-lg py-2 px-4 ml-2 hover:bg-red-600 focus:outline-none"
            >
              <FaPhoneSlash className="inline-block mr-2" />
              Hang Up
            </button>
          </div>
        )}

        {videoBlob && (
          <div className="flex flex-col items-center">
            <h3 className="mb-2 text-lg">Recorded Video:</h3>
            <video
              controls
              className="w-80 h-40 border border-gray-300"
              src={URL.createObjectURL(videoBlob)}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoCallPage;
