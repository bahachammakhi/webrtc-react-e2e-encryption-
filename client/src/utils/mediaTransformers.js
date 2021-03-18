export function setupReceiverTransform(receiver) {
  const receiverStreams = receiver.createEncodedStreams();
  const readableStream =
    receiverStreams.readable || receiverStreams.readableStream;
  const writableStream =
    receiverStreams.writable || receiverStreams.writableStream;
  window.worker.postMessage(
    {
      operation: "decode",
      readableStream,
      writableStream,
    },
    [readableStream, writableStream]
  );
}

export function setupSenderTransform(sender) {
  const senderStreams = sender.createEncodedStreams();
  const readableStream = senderStreams.readable || senderStreams.readableStream;
  const writableStream = senderStreams.writable || senderStreams.writableStream;
  window.worker.postMessage(
    {
      operation: "encode",
      readableStream,
      writableStream,
    },
    [readableStream, writableStream]
  );
}
