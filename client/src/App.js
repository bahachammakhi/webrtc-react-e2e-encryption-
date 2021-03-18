import React, { useRef, useEffect } from "react";
import adapter from "webrtc-adapter";
import VideoPipe from "./utils/peerCreator";
import { checkInsertableSupport } from "./utils/navigatorSupportCheck";
import { start } from "./utils/mediaAccessStart";
import {
  setupReceiverTransform,
  setupSenderTransform,
} from "./utils/mediaTransformers";
import { setCryptoKey } from "./utils/encryptionKeyManagment";
import "./App.css";
const worker = new Worker("/worker.js", { name: "E2EE worker" });
function App() {
  const videoLocalRef = useRef();
  const videoRemoteRef = useRef();
  const videoMiddleRef = useRef();
  useEffect(() => {
    checkInsertableSupport();
    window.worker = worker;
  }, []);

  let startToMiddle;
  let startToEnd;

  let localStream;
  // eslint-disable-next-line no-unused-vars
  let remoteStream;

  function localStreamRecieved(stream) {
    console.log("Received local stream");
    videoLocalRef.current.srcObject = stream;
    localStream = stream;
  }

  function remoteStreamRecieved(stream) {
    console.log("Received remote stream");
    remoteStream = stream;
    videoRemoteRef.current.srcObject = stream;
  }

  function call() {
    console.log("Starting call");
    startToMiddle = new VideoPipe(localStream, true, false, (e) => {
      // Do not setup the receiver transform.
      videoMiddleRef.current.srcObject = e.streams[0];
    });
    startToMiddle.pc1.getSenders().forEach(setupSenderTransform);
    startToMiddle.negotiate();

    startToEnd = new VideoPipe(localStream, true, true, (e) => {
      setupReceiverTransform(e.receiver);
      remoteStreamRecieved(e.streams[0]);
    });
    startToEnd.pc1.getSenders().forEach(setupSenderTransform);
    startToEnd.negotiate();

    console.log("Video pipes created");
  }
  function hangup() {
    console.log("Ending call");
    startToMiddle.close();
    startToEnd.close();
  }

  return (
    <div id="container">
      <h1>
        <a href="//webrtc.github.io/samples/" title="WebRTC samples homepage">
          WebRTC samples
        </a>{" "}
        <span>Peer connection end to end encryption</span>
      </h1>
      <span id="banner"></span>
      <h2>Sender and receiver</h2>
      <div id="videos">
        Sender and receiver
        <br />
        <video id="video1" ref={videoLocalRef} playsInline autoPlay muted />
        <video id="video2" ref={videoRemoteRef} playsInline autoPlay muted />
      </div>
      <br />
      Crypto key:{" "}
      <input
        type="text"
        id="crypto-key"
        onChange={(e) => setCryptoKey(e.target.value)}
      />
      Encrypt first bytes: <input type="checkbox" id="crypto-offset" />
      <h2>Middlebox</h2>
      <div id="monitor">
        <video
          id="video-monitor"
          ref={videoMiddleRef}
          playsInline
          autoPlay
          muted
        />
        Switch audio to middlebox: <input type="checkbox" id="mute-middlebox" />
      </div>
      <div id="buttons">
        <button onClick={() => start(localStreamRecieved)} id="start">
          Start
        </button>
        <button onClick={() => call()} id="call">
          Call
        </button>
        <button id="hangup" onClick={() => hangup()}>
          Hang Up
        </button>
      </div>
      <div id="status"></div>
      <a
        href="https://github.com/webrtc/samples/tree/gh-pages/src/content/insertable-streams/endtoend-encryption"
        title="View source for this page on GitHub"
        id="viewSource"
      >
        View source on GitHub
      </a>
    </div>
  );
}

export default App;
