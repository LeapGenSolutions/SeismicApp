import React, { useState, useRef, useEffect } from "react";
import { io } from "socket.io-client";
import {
  FaPhoneAlt,
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
  const [isHost, setIsHost] = useState(false);
  const [showShareLink, setShowShareLink] = useState(false);
  const [joinLink, setJoinLink] = useState("");

  const myVideo = useRef(null);
  const userVideo = useRef(null);
  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);

  // Initialize and handle URL parameters
  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    const roomParam = queryParams.get("room");
    const hostParam = queryParams.get("host");

    if (roomParam) {
      setRoom(roomParam);
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
      <div className="bg-white shadow-lg rounded-lg p-8 w-full max-w-4xl">
        <div className="flex flex-col items-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">
            {isHost ? "Host Meeting" : "Join Meeting"}
          </h1>

          {!callAccepted && (
            <>
              <div className="w-full max-w-md mb-6">
                <label className="block text-gray-700 mb-2">Your Name</label>
                <input
                  type="text"
                  placeholder="Enter your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="border border-gray-300 rounded-lg px-4 w-full py-2 mb-4"
                />

                <label className="block text-gray-700 mb-2">
                  {isHost ? "Meeting ID" : "Meeting ID (from invite link)"}
                </label>
                <input
                  placeholder="Meeting ID"
                  value={room}
                  onChange={(e) => setRoom(e.target.value)}
                  className="border border-gray-300 rounded-lg px-4 w-full py-2 mb-4"
                />

                {userName && (
                  <div className="bg-blue-50 p-3 rounded-lg mb-4">
                    <p className="text-blue-800">
                      Joining meeting hosted by: <strong>{userName}</strong>
                    </p>
                  </div>
                )}
              </div>

              <div className="flex space-x-4">
                <button
                  onClick={() => {
                    setIsHost(true);
                    joinRoom();
                  }}
                  className="bg-blue-500 text-white rounded-lg py-2 px-6 hover:bg-blue-600 focus:outline-none"
                >
                  <FaPhoneAlt className="inline-block mr-2" />
                  Start New Meeting
                </button>

                <button
                  onClick={() => joinRoom(true)}
                  disabled={!room || !name}
                  className={`bg-green-500 text-white rounded-lg py-2 px-6 hover:bg-green-600 focus:outline-none ${
                    !room || !name ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  <FaPhoneAlt className="inline-block mr-2" />
                  Join Meeting
                </button>
              </div>
            </>
          )}
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

        <div
          ref={divRef}
          className="flex justify-center space-x-4 my-6 video-container"
        >
          <div className="relative w-64 h-48 bg-gray-200 rounded-lg overflow-hidden">
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
          {callAccepted && !callEnded && (
            <div className="relative w-64 h-48 bg-gray-200 rounded-lg overflow-hidden">
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
          )}
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
