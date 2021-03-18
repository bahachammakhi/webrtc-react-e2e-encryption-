export function start(callback) {
  console.log("Requesting local stream");
  // startButton.disabled = true;
  const options = { audio: true, video: true };
  navigator.mediaDevices
    .getUserMedia(options)
    .then(callback)
    .catch(function (e) {
      alert("getUserMedia() failed");
      console.log("getUserMedia() error: ", e);
    });
}
