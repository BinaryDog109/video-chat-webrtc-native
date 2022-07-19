import { useCallback, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { useHistory, useParams } from "react-router-dom";

export const Room = () => {
  const userVideo = useRef();
  const otherVideo = useRef();
  const localStreamRef = useRef(null);
  const socketRef = useRef();
  const otherUserRef = useRef();
  const pcRef = useRef();
  const params = useParams();
  const history = useHistory();

  const createPeer = useCallback((userId) => {
    const pc = new RTCPeerConnection({
      iceServers: [
        {
          urls: [
            "stun:stun1.l.google.com:19302",
            "stun:stun2.l.google.com:19302",
          ],
        },
      ],
      iceCandidatePoolSize: 10,
    });
    pc.onicecandidate = handleCandidateGenerate;
    pc.ontrack = handleRemoteTrack;
    // Fires when pc adds a track, or create a data channel
    pc.onnegotiationneeded = () => handleNegotiationNeeded(userId);

    return pc;
  }, []);

  const callUser = useCallback(
    (userId) => {
      pcRef.current = createPeer(userId);
      const localStream = localStreamRef.current;
      localStream.getTracks().forEach((track) => {
        pcRef.current.addTrack(track, localStream);
      });
    },
    [createPeer]
  );

  const handleReceiveCall = useCallback(
    async (payload) => {
      try {
        pcRef.current = createPeer();
        const remoteDesc = payload.description;
        const localStream = localStreamRef.current;
        const pc = pcRef.current;
        await pc.setRemoteDescription(remoteDesc);
        localStream
          .getTracks() 
          .forEach((track) => pc.addTrack(track, localStream));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        const answerPayload = {
          target: payload.caller,  
          caller: socketRef.current.id,
          description: pc.localDescription,
        };     
        socketRef.current.emit("answer", answerPayload);
      } catch (error) {
        console.log("error in handleReceiveCall: ", error);
      }
    },
    [createPeer]
  );

  async function handleReceiveAnswer(payload) {
    try {
      const remoteDesc = payload.description;
      const pc = pcRef.current;
      await pc.setRemoteDescription(remoteDesc);
    } catch (error) {
      console.log("error in handleReceiveAnswer: ", error);
    }
  }

  function handleCandidateGenerate(event) {
    if (event.candidate) {
      const payload = {
        target: otherUserRef.current,
        candidate: event.candidate,
      };
      socketRef.current.emit("ice-candidate", payload);
    }
  }

  function handleArrivingCandidate(candidate) {
    const rtcCandidate = new RTCIceCandidate(candidate);
    pcRef.current
      .addIceCandidate(rtcCandidate)
      .catch((e) => console.log("Error in handleArrivingCandidate: ", e));
  }

  function handleRemoteTrack(event) {
    otherVideo.current.srcObject = event.streams[0];
  }

  async function handleNegotiationNeeded(userId) {
    try {
      const pc = pcRef.current;
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      const payload = {
        target: userId,
        caller: socketRef.current.id,
        description: pc.localDescription,
      };
      socketRef.current.emit("offer", payload);
    } catch (error) {
      console.err(error);
    }
  }

  const closePeer = useCallback(() => {
    const pc = pcRef.current;
    // Close current webcam
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }

    if (pc) {
      // Remove all its event liseners
      pc.ontrack = null;
      pc.onremovetrack = null;
      pc.onremovestream = null;
      pc.onicecandidate = null;
      pc.oniceconnectionstatechange = null;
      pc.onconnectionstatechange = null;
      pc.onsignalingstatechange = null;
      pc.onicegatheringstatechange = null;
      pc.onnegotiationneeded = null;
      console.log("Removed all its event liseners");
      //   Remove all tracks
      const videos = document.querySelectorAll("video");
      videos.forEach((video) => {
        video.srcObject.getTracks().forEach((track) => track.stop());
        video.removeAttribute("src");
        video.removeAttribute("srcObject");
      });

      console.log("Removed all tracks");
      pc.close();
      pcRef.current = null;
      console.log("Peer closed");
    }
  }, []);

  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        userVideo.current.srcObject = stream;
        localStreamRef.current = stream;
        // Connect to our socket server
        socketRef.current = io("http://localhost:8000");
        const socket = socketRef.current;
        socket.emit("join room", params.roomId);
        // current user B is joining A
        socket.on("other user", (otherUserSocketId) => {
          callUser(otherUserSocketId);
          otherUserRef.current = otherUserSocketId;
        });
        // current user A detects B joining in
        socket.on("user joined", (otherUserSocketId) => {
          otherUserRef.current = otherUserSocketId;
        });

        socket.on("offer", handleReceiveCall);
        socket.on("answer", handleReceiveAnswer);
        socket.on("ice-candidate", handleArrivingCandidate);
      })
      .catch((e) => console.error("Something went wrong in useEffect", e));
    return () => {
      console.log("Unmounting and closing peer...");
      closePeer();
      socketRef.current.disconnect();
    };
  }, [callUser, params.roomId, handleReceiveCall, closePeer]);

  const onHangup = (e) => {
    document.querySelector(".hangup-button").disabled = true;
    closePeer();
    history.replace("/");
  };
  return (
    <>
      <div style={{display: 'flex', gap: '1em'}}>
        <video autoPlay ref={userVideo}></video>
        <video autoPlay ref={otherVideo}></video>
        
      </div>
      <button
          style={{
            padding: "1em",
            fontSize: "1.5em",
            backgroundColor: "orange",
          }}
          onClick={onHangup}
          className="hangup-button"
        >
          Hang up
        </button>
    </>
  );
};
