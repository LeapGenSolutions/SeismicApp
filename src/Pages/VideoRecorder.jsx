import React, { useState, useRef, useEffect } from "react";
import { io } from "socket.io-client";
import {
  FaPhoneSlash,
  FaVideo,
  FaStop,
  FaCopy,
} from "react-icons/fa";
import html2canvas from "html2canvas";

const socket = io("http://localhost:8080");
const config = { iceServers: [{ urls: "stun:stun.l.google.com:19302" }] };

const VideoCallPage = () => {
  const [callAccepted, setCallAccepted] = useState(false);
  const [callEnded, setCallEnded] = useState(false);
  const [name, setName] = useState("");
  const [userName, setUserName] = useState("");
  const [me, setMe] = useState("");
  const [room, setRoom] = useState("");
  const [isHost, setIsHost] = useState(true);
  const [showShareLink, setShowShareLink] = useState(false);
  const [joinLink, setJoinLink] = useState("");

  const myVideo = useRef(null);
  const userVideo = useRef(null);
  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);

  const [activeTab, setActiveTab] = useState("upcoming");
  const [appointmentId, setAppointmentId] = useState("");
  const [appointmentType, setAppointmentType] = useState("online");
  const isLoadingUpcoming = useState(false)[0];

  // Mock data - replace with your actual data
  const upcomingAppointments = [
    {
      appointmentId: "demo-appointment-1",
      patientName: "John Doe",
      date: "2025-04-30",
      time: "10:00 AM",
      reason: "Follow-up consultation",
    },
    {
      appointmentId: "demo-appointment-2",
      patientName: "Jane Smith",
      date: "2025-04-30",
      time: "2:30 PM",
      reason: "Initial consultation",
    },
  ];

  const selectedAppointment =
    upcomingAppointments.find((app) => app.appointmentId === appointmentId) ||
    null;
  const patient = selectedAppointment
    ? {
        firstName: selectedAppointment.patientName.split(" ")[0],
        lastName: selectedAppointment.patientName.split(" ")[1],
      }
    : null;

  // Initialize and handle URL parameters
  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    const roomParam = queryParams.get("room");
    const hostParam = queryParams.get("host");

    if (roomParam) {
      setRoom(roomParam);
      setActiveTab("join");
    }
    if (hostParam) {
      setUserName(hostParam);
    }

    socket.on("connect", () => {
      console.log("Connected to server:", socket.id);
      setMe(socket.id);
    });

    socket.on("user-joined", async ({ id, name }) => {
      console.log(`User ${name} joined with ID ${id}`);
      setUserName(name);

      peerConnectionRef.current = new RTCPeerConnection(config);
      if (localStreamRef.current) {
        localStreamRef.current
          .getTracks()
          .forEach((track) =>
            peerConnectionRef.current.addTrack(track, localStreamRef.current)
          );
      }

      peerConnectionRef.current.onicecandidate = (e) => {
        if (e.candidate) {
          socket.emit("ice-candidate", {
            target: id,
            candidate: e.candidate,
          });
        }
      };

      peerConnectionRef.current.ontrack = (e) => {
        userVideo.current.srcObject = e.streams[0];
      };

      const offer = await peerConnectionRef.current.createOffer();
      await peerConnectionRef.current.setLocalDescription(offer);
      socket.emit("offer", { target: id, sdp: offer });
    });

    socket.on("offer", async (data) => {
      peerConnectionRef.current = new RTCPeerConnection(config);
      localStreamRef.current
        .getTracks()
        .forEach((track) =>
          peerConnectionRef.current.addTrack(track, localStreamRef.current)
        );

      peerConnectionRef.current.onicecandidate = (e) => {
        if (e.candidate) {
          socket.emit("ice-candidate", {
            target: data.sender,
            candidate: e.candidate,
          });
        }
      };

      peerConnectionRef.current.ontrack = (e) => {
        userVideo.current.srcObject = e.streams[0];
      };

      await peerConnectionRef.current.setRemoteDescription(
        new RTCSessionDescription(data.sdp)
      );
      const answer = await peerConnectionRef.current.createAnswer();
      await peerConnectionRef.current.setLocalDescription(answer);
      socket.emit("answer", { target: data.sender, sdp: answer });
    });

    socket.on("answer", async (data) => {
      await peerConnectionRef.current.setRemoteDescription(
        new RTCSessionDescription(data.sdp)
      );
    });

    socket.on("ice-candidate", async (data) => {
      if (peerConnectionRef.current) {
        try {
          await peerConnectionRef.current.addIceCandidate(
            new RTCIceCandidate(data.candidate)
          );
        } catch (e) {
          console.error("Error adding received ICE candidate", e);
        }
      }
    });

    return () => {
      socket.off("user-joined");
      socket.off("offer");
      socket.off("answer");
      socket.off("ice-candidate");
      socket.off("user-left");
    };
  }, []);

  const joinRoom = async (isJoining = false) => {
    if (socket.connected) {
      socket.disconnect();
    }
    socket.connect();
    if (!room) return alert("Enter room ID");
    if (!name) return alert("Enter your name");

    try {
      const localStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      myVideo.current.srcObject = localStream;
      localStreamRef.current = localStream;

      socket.emit("join-room", { roomId: room, name, isHost: !isJoining });
      setCallAccepted(true);
      if (!isJoining) {
        setIsHost(true);
        generateJoinLink();
      }
    } catch (error) {
      console.error("Error accessing media devices.", error);
      alert("Could not access camera/mic.");
    }
  };

  const generateJoinLink = () => {
    const currentUrl = window.location.href.split("?")[0];
    const link = `${currentUrl}?room=${encodeURIComponent(
      room
    )}&host=${encodeURIComponent(name)}`;
    setJoinLink(link);
    setShowShareLink(true);
    return link;
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(joinLink);
    alert("Link copied to clipboard!");
  };

  const leaveCall = () => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }

    socket.emit("leave-room", room);
    socket.disconnect();

    myVideo.current.srcObject = null;
    userVideo.current.srcObject = null;
    setRoom("");
    setCallEnded(true);
    setIsHost(false);
    setShowShareLink(false);
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
    const localAudioSource = audioContext.createMediaStreamSource(
      localAudioStream
    );
    localAudioSource.connect(destination);

    // Add remote audio to the AudioContext
    if (callAccepted && userVideo.current?.srcObject) {
      const remoteAudioStream = userVideo.current.srcObject;
      const remoteAudioSource = audioContext.createMediaStreamSource(
        remoteAudioStream
      );
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

      recorder.current.start(3000); // Collect 3-second chunks
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
    <div className="bg-gray-50 flex flex-col justify-center items-center min-h-screen p-4">
      <div className="rounded-lg border bg-white shadow-sm w-full">
        <div className="flex flex-col space-y-1.5 p-6">
          <h3 className="text-2xl font-semibold leading-none tracking-tight">
            Seismic Video Call
          </h3>
          <p className="text-sm text-gray-500">
            Connect with patients through secure video consultations
          </p>
        </div>

        <div className="p-6 pt-0">
          <div className="space-y-4">
            <div className="inline-flex h-10 items-center justify-center rounded-md bg-gray-100 p-1 text-gray-500 mb-4">
              <button
                onClick={() => setActiveTab("upcoming")}
                className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium transition-all ${
                  activeTab === "upcoming"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "hover:text-gray-900"
                }`}
              >
                Upcoming Calls
              </button>
              <button
                onClick={() => setActiveTab("join")}
                className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium transition-all ${
                  activeTab === "join"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "hover:text-gray-900"
                }`}
              >
                Join by ID
              </button>
              <button
                onClick={() => setActiveTab("history")}
                className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium transition-all ${
                  activeTab === "history"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "hover:text-gray-900"
                }`}
              >
                Call History
              </button>
            </div>

            {activeTab === "upcoming" && (
              <div className="space-y-4">
                <div className="grid gap-2">
                  <label
                    htmlFor="appointment"
                    className="text-sm font-medium text-gray-700"
                  >
                    Select an appointment
                  </label>
                  <div className="relative">
                    <select
                      value={appointmentId}
                      onChange={(e) => setAppointmentId(e.target.value)}
                      className="flex h-10 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="">Select an appointment</option>
                      {isLoadingUpcoming ? (
                        <option value="loading" disabled>
                          Loading appointments...
                        </option>
                      ) : upcomingAppointments.length > 0 ? (
                        upcomingAppointments.map((appointment) => (
                          <option
                            key={appointment.appointmentId}
                            value={appointment.appointmentId}
                          >
                            {appointment.patientName} - {appointment.date}{" "}
                            {appointment.time}
                          </option>
                        ))
                      ) : (
                        <option value="no-appointments" disabled>
                          No upcoming video calls
                        </option>
                      )}
                    </select>
                  </div>
                </div>

                {appointmentId && (
                  <div className="mt-4">
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Appointment Type
                    </label>
                    <div className="flex space-x-4">
                      <div className="flex items-center space-x-2">
                        <input
                          type="radio"
                          id="online"
                          name="appointmentType"
                          value="online"
                          checked={appointmentType === "online"}
                          onChange={() => setAppointmentType("online")}
                          className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <label
                          htmlFor="online"
                          className="text-sm font-medium text-gray-700 cursor-pointer"
                        >
                          Online
                        </label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="radio"
                          id="in-person"
                          name="appointmentType"
                          value="in-person"
                          checked={appointmentType === "in-person"}
                          onChange={() => setAppointmentType("in-person")}
                          className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <label
                          htmlFor="in-person"
                          className="text-sm font-medium text-gray-700 cursor-pointer"
                        >
                          In-Person
                        </label>
                      </div>
                    </div>
                  </div>
                )}

                {appointmentId && selectedAppointment && patient && (
                  <div className="bg-gray-50 p-4 rounded-md mt-4">
                    <h3 className="font-medium mb-2">Appointment Details</h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-gray-500">Patient:</span>
                        <span className="ml-2 font-medium">
                          {patient.firstName} {patient.lastName}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Appointment ID:</span>
                        <span className="ml-2 font-medium">
                          {selectedAppointment.appointmentId}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Date & Time:</span>
                        <span className="ml-2 font-medium">
                          {selectedAppointment.date} at{" "}
                          {selectedAppointment.time}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Reason:</span>
                        <span className="ml-2 font-medium">
                          {selectedAppointment.reason || "Not specified"}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
                <div className="w-full mb-6">
                  <div className="flex flex-row justify-between w-full gap-4">
                    <label className="block text-gray-700 mb-2 flex-1">
                      Your Name
                      <input
                        type="text"
                        placeholder="Enter your name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="border border-gray-300 rounded-lg px-4 w-full py-2 mb-4"
                      />
                    </label>
                    <label className="block text-gray-700 mb-2 flex-1">
                      {isHost ? "Meeting ID" : "Meeting ID (from invite link)"}
                      <input
                        placeholder="Meeting ID"
                        value={room}
                        onChange={(e) => setRoom(e.target.value)}
                        className="border border-gray-300 rounded-lg px-4 w-full py-2 mb-4"
                      />
                    </label>
                  </div>
                  {userName && (
                    <div className="bg-blue-50 p-3 rounded-lg mb-4">
                      <p className="text-blue-800">
                        Joining meeting hosted by: <strong>{userName}</strong>
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex justify-end space-x-2 mt-4">
                  <button
                    onClick={() => {
                      setIsHost(true);
                      joinRoom();
                    }}
                    className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors bg-blue-600 hover:bg-blue-700 text-white h-10 px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="mr-2 h-4 w-4"
                    >
                      <path d="M22 8a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2Z"></path>
                      <path d="m22 8-10 7-10-7"></path>
                    </svg>
                    Start Video Call
                  </button>
                </div>
              </div>
            )}

            {activeTab === "join" && (
              <div className="space-y-4">
                <div className="w-full mb-6">
                  <div className="flex flex-row justify-between w-full gap-4">
                    <label className="block text-gray-700 mb-2 flex-1">
                      Your Name
                      <input
                        type="text"
                        placeholder="Enter your name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="border border-gray-300 rounded-lg px-4 w-full py-2 mb-4"
                      />
                    </label>
                    <label className="block text-gray-700 mb-2 flex-1">
                      {isHost ? "Meeting ID" : "Meeting ID (from invite link)"}
                      <input
                        placeholder="Meeting ID"
                        value={room}
                        onChange={(e) => setRoom(e.target.value)}
                        className="border border-gray-300 rounded-lg px-4 w-full py-2 mb-4"
                      />
                    </label>
                  </div>
                  {userName && (
                    <div className="bg-blue-50 p-3 rounded-lg mb-4">
                      <p className="text-blue-800">
                        Joining meeting hosted by: <strong>{userName}</strong>
                      </p>
                    </div>
                  )}
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={() => joinRoom(true)}
                    disabled={!room || !name}
                    className={`inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors bg-blue-600 hover:bg-blue-700 text-white h-10 px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed${
                      !room || !name ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                  >
                    Join Call
                  </button>
                </div>
              </div>
            )}

            {activeTab === "history" && (
              <div className="space-y-4">
                <div className="text-center py-8 text-gray-500">
                  <h3 className="text-lg font-medium mb-2">Call History</h3>
                  <p>Your recent video call history will appear here.</p>
                </div>
              </div>
            )}
          </div>
        </div>
        {showShareLink && (
          <div className="mt-6 p-4 bg-gray-100 rounded-lg">
            <h3 className="font-medium text-gray-800 mb-2">
              Invite others to join
            </h3>
            <div className="flex items-center">
              <input
                type="text"
                value={joinLink}
                readOnly
                className="border border-gray-300 rounded-l-lg px-4 py-2 flex-grow"
              />
              <button
                onClick={copyToClipboard}
                className="bg-blue-500 text-white px-4 py-2 rounded-r-lg hover:bg-blue-600"
              >
                <FaCopy className="inline-block mr-1" /> Copy
              </button>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Share this link with participants to join your meeting
            </p>
          </div>
        )}
      </div>
      <div className="rounded-lg border bg-white shadow-sm w-full mt-6">
        <div className="bg-blue-600 p-4">
          <h2 className="text-2xl font-semibold text-white mb-2">
            Call with {userName}
          </h2>
        </div>
        {/* <div className="flex flex-col items-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">
            {isHost ? "Host Meeting" : "Join Meeting"}
          </h1>
        </div> */}

        <div
          ref={divRef}
          className="flex justify-center p-6 video-container gap-4"
        >
          {/* {callAccepted && !callEnded && ( */}
          <div className="relative h-80 bg-gray-200 rounded-lg overflow-hidden flex-2">
            <video
              playsInline
              ref={userVideo}
              autoPlay
              className="w-full h-full object-cover"
            />
            <p className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded">
              {userName || "Participant"}
            </p>
          </div>
          {/* )} */}
          <div className="relative h-80 bg-gray-200 rounded-lg overflow-hidden flex-1">
            <video
              playsInline
              muted
              ref={myVideo}
              autoPlay
              className="w-full h-full object-cover"
            />
            <p className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded">
              {name || "You"}
            </p>
          </div>
        </div>

        {callAccepted && !callEnded && (
          <div className="text-center mb-4">
            {!recording ? (
              <button
                onClick={startRecording}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 mr-2"
              >
                <FaVideo className="inline-block mr-2" />
                Start Recording
              </button>
            ) : (
              <button
                onClick={stopRecording}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 mr-2"
              >
                <FaStop className="inline-block mr-2" />
                Stop Recording
              </button>
            )}
            <button
              onClick={leaveCall}
              className="bg-red-500 text-white rounded-lg py-2 px-4 hover:bg-red-600 focus:outline-none"
            >
              <FaPhoneSlash className="inline-block mr-2" />
              End Call
            </button>
          </div>
        )}

        {videoBlob && (
          <div className="flex flex-col items-center mt-6">
            <h3 className="mb-2 text-lg font-medium">Recorded Video:</h3>
            <video
              controls
              className="w-full max-w-lg border border-gray-300 rounded-lg"
              src={URL.createObjectURL(videoBlob)}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoCallPage;
