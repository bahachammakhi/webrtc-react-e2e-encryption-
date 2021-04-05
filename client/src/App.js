import React, { useRef, useEffect, useState } from "react";
import adapter from "webrtc-adapter";
import { io } from "socket.io-client";
import VideoPipe from "./utils/peerCreator";
import { checkInsertableSupport } from "./utils/navigatorSupportCheck";
import { start } from "./utils/mediaAccessStart";
import {
  setupReceiverTransform,
  setupSenderTransform,
} from "./utils/mediaTransformers";
import { setCryptoKey } from "./utils/encryptionKeyManagment";
import "./App.css";
import Communication from "./components/Communication";
const worker = new Worker("/worker.js", { name: "E2EE worker" });
function App() {
  const [pc, setPc] = useState();
  const videoLocalRef = useRef();
  const [established, setEstablished] = useState("initial");

  const videoRemoteRef = useRef();

  const socket = io("http://localhost:5000");
  socket.connect();
  useEffect(() => {
    checkInsertableSupport();
    start(localStreamRecieved);
    socket.on("message", onMessage);
    socket.on("hangup", hangup);

    window.worker = worker;
    setTimeout(() => call(), 5000);
    return () => {
      videoLocalRef.getVideoTracks()[0].stop();
      socket.emit("leave");
    };
  }, []);

  function setDescription(offer) {
    console.log("setDescription", offer);
    return startToEnd.pc1.setLocalDescription(offer);
  }
  function sendDescription() {
    console.log("Description sended");
    socket.send(startToEnd.pc1.localDescription);
  }
  function onMessage(message) {
    console.log("message");
    if (message.type === "offer") {
      console.log("Offer recieved", startToEnd);
      // set remote description and answer
      startToEnd.pc1
        .setRemoteDescription(new RTCSessionDescription(message))
        .then(() => startToEnd.pc1.createAnswer())
        .then(setDescription)
        .then(sendDescription)
        .catch((e) => console.log(e)); // An error occurred, so handle the failure to connect
    } else if (message.type === "answer") {
      console.log("Answer recieved");
      // set remote description
      startToEnd.pc1.setRemoteDescription(new RTCSessionDescription(message));
    } else if (message.type === "candidate") {
      // add ice candidate
      console.log("received candidate");
      startToEnd.pc1.addIceCandidate(message.candidate);
    }
  }

  let startToEnd;

  let localStream;
  // eslint-disable-next-line no-unused-vars
  let remoteStream;
  let dc;
  function setupDataHandlers() {
    dc.onmessage = (e) => {
      var msg = JSON.parse(e.data);
      console.log("received message over data channel:" + msg);
    };
    dc.onclose = () => {
      remoteStream.getVideoTracks()[0].stop();
      console.log("The Data Channel is Closed");
    };
  }

  function localStreamRecieved(stream) {
    console.log("Received local stream");
    videoLocalRef.current.srcObject = stream;
    localStream = stream;
  }

  function remoteStreamRecieved(stream) {
    console.log("Received remote stream");
    remoteStream = stream;
    videoRemoteRef.current.srcObject = stream;
    setEstablished("established");
  }

  function call() {
    console.log("Starting call");
    const attachMediaIfReady = () => {
      dc = startToEnd.pc1.createDataChannel("chat");
      setupDataHandlers();
      console.log("attachMediaIfReady");
    };

    startToEnd = new VideoPipe(localStream, true, true, (e) => {
      setupReceiverTransform(e.receiver);
      remoteStreamRecieved(e.streams[0]);
    });
    startToEnd.pc1.getSenders().forEach(setupSenderTransform);
    startToEnd.pc1
      .createOffer()
      .then(setDescription)
      .then(sendDescription)
      .catch((e) => console.log(e)); // An error occurred, so handle the failure to connect
    // startToEnd.negotiate();
    startToEnd.pc1.onicecandidate = (e) => {
      console.log(e, "onicecandidate");
      if (e.candidate) {
        console.log("send candidate");
        socket.send({
          type: "candidate",
          candidate: e.candidate,
        });
      }
    };
    startToEnd.pc1.ontrack = (e) => {
      setupReceiverTransform(e.receiver);
      remoteStreamRecieved(e.streams[0]);
    };
    console.log("Video pipes created");
  }
  function hangup() {
    console.log("Ending call");

    startToEnd.close();
    setEstablished("");
  }

  return (
    <div id="container" className={`${established} videoContainer`}>
      <Communication />
      <div id="videos">
        <video
          className="local-video"
          id="video1"
          ref={videoLocalRef}
          playsInline
          autoPlay
          muted
        />
        <video
          className="remote-video"
          id="video2"
          ref={videoRemoteRef}
          playsInline
          autoPlay
          muted
        />
      </div>
      <br />
      Crypto key:{" "}
      <input
        type="text"
        id="crypto-key"
        onChange={(e) => setCryptoKey(e.target.value)}
      />
    </div>
  );
}

export default App;
