import MediaDevice from "../Media/MediaDevice";
import {
  setupReceiverTransform,
  setupSenderTransform,
} from "../mediaTransformers";
import { checkInsertableSupport } from "../navigatorSupportCheck";
import socket from "../socket";

const PC_CONFIG = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
  encodedInsertableStreams: checkInsertableSupport(),
};
let preferredVideoCodecMimeType = undefined;

export default class PeerConnection {
  /**
   * Create a PeerConnection.
   * @param {String} friendID - ID of the friend you want to call.
   */

  constructor(friendId, onLocalStreamRecieved, onRemoteStreamRecieved) {
    this.mediaDevice = new MediaDevice();
    this.friendID = friendId;
    this.onLocalStreamRecieved = onLocalStreamRecieved;

    this.pc = new RTCPeerConnection(PC_CONFIG);

    console.log(console.log("senders", this.pc.getSenders()));

    this.pc.onicecandidate = (event) => {
      console.log("Candidate event", event);
      if (event.candidate) {
        socket.send({
          // to: this.friendID,
          type: "candidate",
          candidate: event.candidate,
        });
      }
    };
    this.pc.ontrack = (event) => {
      console.log("on track is working");
      setupReceiverTransform(event.receiver);
      // this.emit("peerStream", event.streams[0])
      console.log("recieved hellooo");
      onRemoteStreamRecieved(event.streams[0]);
    };
  }

  /**
   * Starting the call
   * @param {Boolean} isCaller
   * @param {Object} config - configuration for the call {audio: boolean, video: boolean}
   */
  start(isCaller, config) {
    this.mediaDevice.start((stream) => {
      stream.getTracks().forEach((track) => {
        this.pc?.addTrack(track, stream);
      });
      // this.emit("localStream", stream);
      this.onLocalStreamRecieved(stream);
      // if (isCaller) socket.emit("request", { to: this.friendID });
      // else

      this.pc?.getSenders().forEach(setupSenderTransform);
      this.createOffer();
      this.handleTransceiver(stream);
    });

    return this;
  }

  handleTransceiver(stream) {
    if (preferredVideoCodecMimeType) {
      const { codecs } = RTCRtpSender.getCapabilities("video");
      const selectedCodecIndex = codecs.findIndex(
        (c) => c.mimeType === preferredVideoCodecMimeType
      );
      const selectedCodec = codecs[selectedCodecIndex];
      codecs.splice(selectedCodecIndex, 1);
      codecs.unshift(selectedCodec);
      const transceiver = this.pc
        ?.getTransceivers()
        .find((t) => t.sender && t.sender.track === stream.getVideoTracks()[0]);
      transceiver.setCodecPreferences(codecs);
    }
  }

  /**
   * Stop the call
   * @param {Boolean} isStarter
   */
  stop(isStarter) {
    if (isStarter) {
      socket.emit("end", { to: this.friendID });
    }
    this.mediaDevice.stop();
    this?.pc?.close();
    this.pc = null;
    this.off();
    return this;
  }
  createOffer() {
    this.pc
      ?.createOffer()
      .then(this.getDescription.bind(this))
      .catch((err) => console.log(err));
    return this;
  }

  createAnswer() {
    this.pc
      ?.createAnswer()
      .then((value) => this.getDescription(value))
      .catch((err) => console.log(err));
    return this;
  }

  sendDescription(desc) {
    const localDes = desc ? desc : this.pc?.localDescription;
    socket.send(localDes);
  }

  getDescription(desc) {
    this.pc?.setLocalDescription(desc);
    // socket.emit("call", { to: this.friendID, sdp: desc });
    this.sendDescription(desc);
    return this;
  }

  /**
   * @param {Object} sdp - Session description
   */
  setRemoteDescription(sdp) {
    const rtcSdp = new RTCSessionDescription(sdp);
    this.pc?.setRemoteDescription(rtcSdp);
    return this;
  }

  /**
   * @param {Object} candidate - ICE Candidate
   */
  addIceCandidate(candidate) {
    if (candidate) {
      const iceCandidate = new RTCIceCandidate(candidate);
      this?.pc?.addIceCandidate(iceCandidate);
    }
    return this;
  }
}
