import adapter from "webrtc-adapter";

export function checkInsertableSupport() {
  const supportsInsertableStreams = !!RTCRtpSender.prototype
    .createEncodedStreams;
  let supportsTransferableStreams = false;
  try {
    const stream = new ReadableStream();
    window.postMessage(stream, "*", [stream]);
    supportsTransferableStreams = true;
  } catch (e) {
    console.error("Transferable streams are not supported.");
  }
  if (!(supportsInsertableStreams && supportsTransferableStreams)) {
    if (adapter.browserDetails.browser === "chrome") {
      console.log(
        " Try with Enable experimental Web Platform features enabled from chrome://flags."
      );
    }
    console.error("Your browser does not support Insertable Streams.");
  }
}
