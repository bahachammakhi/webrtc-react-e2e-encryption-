export function setCryptoKey(value) {
  console.log("Setting crypto key to " + value);
  const currentCryptoKey = value;
  // const useCryptoOffset = !cryptoOffsetBox.checked;
  const useCryptoOffset = false;
  if (currentCryptoKey) {
    console.log("Encryption is ON");
  } else {
    console.log("Encryption is OFF");
  }
  window.worker.postMessage({
    operation: "setCryptoKey",
    currentCryptoKey,
    useCryptoOffset,
  });
}
