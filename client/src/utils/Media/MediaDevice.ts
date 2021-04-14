/**
 * Manage all media devices
 */
class MediaDevice {
  stream: any;
  /**
   * Start media devices and send stream
   */
  start(addToLocalStream: any) {
    const constraints = {
      video: {
        facingMode: "user",
        height: { min: 360, ideal: 720, max: 1080 },
      },
      audio: true,
    };

    navigator.mediaDevices
      .getUserMedia(constraints)
      .then((stream) => {
        this.stream = stream;
        // this.emit("stream", stream);
        addToLocalStream(stream);
      })
      .catch((err) => {
        if (err instanceof DOMException) {
          alert("Cannot open webcam and/or microphone");
        } else {
          console.log(err);
        }
      });

    return this;
  }

  /**
   * Turn on/off a device
   * @param {String} type - Type of the device
   * @param {Boolean} [on] - State of the device
   */
  toggle(type: any, on: any) {
    const len = arguments.length;
    if (this.stream) {
      this.stream[`get${type}Tracks`]().forEach((track: any) => {
        const state = len === 2 ? on : !track.enabled;
        // _.set(track, "enabled", state);
      });
    }
    return this;
  }

  /**
   * Stop all media track of devices
   */
  stop() {
    if (this.stream) {
      this.stream.getTracks().forEach((track: any) => track.stop());
    }
    return this;
  }
}

export default MediaDevice;
