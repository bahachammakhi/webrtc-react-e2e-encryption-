let preferredVideoCodecMimeType = undefined;

export default function VideoPipe(stream, forceSend, forceReceive, handler) {
  this.pc1 = new RTCPeerConnection({
    encodedInsertableStreams: forceSend,
  });
  this.pc2 = new RTCPeerConnection({
    encodedInsertableStreams: forceReceive,
  });

  stream.getTracks().forEach((track) => this.pc1.addTrack(track, stream));
  this.pc2.ontrack = handler;
  if (preferredVideoCodecMimeType) {
    const { codecs } = RTCRtpSender.getCapabilities("video");
    const selectedCodecIndex = codecs.findIndex(
      (c) => c.mimeType === preferredVideoCodecMimeType
    );
    const selectedCodec = codecs[selectedCodecIndex];
    codecs.splice(selectedCodecIndex, 1);
    codecs.unshift(selectedCodec);
    const transceiver = this.pc1
      .getTransceivers()
      .find((t) => t.sender && t.sender.track === stream.getVideoTracks()[0]);
    transceiver.setCodecPreferences(codecs);
  }
}

VideoPipe.prototype.negotiate = async function () {
  this.pc1.onicecandidate = (e) => this.pc2.addIceCandidate(e.candidate);
  this.pc2.onicecandidate = (e) => this.pc1.addIceCandidate(e.candidate);

  const offer = await this.pc1.createOffer();
  await this.pc2.setRemoteDescription({
    type: "offer",
    sdp: offer.sdp.replace("red/90000", "green/90000"),
  });
  await this.pc1.setLocalDescription(offer);

  const answer = await this.pc2.createAnswer();
  await this.pc1.setRemoteDescription(answer);
  await this.pc2.setLocalDescription(answer);
};

VideoPipe.prototype.close = function () {
  this.pc1.close();
  this.pc2.close();
};
