export function isSecureMicContext(): boolean {
  if (typeof window === "undefined") return false;
  return window.isSecureContext;
}

export function canRequestMicrophone(): boolean {
  if (typeof navigator === "undefined") return false;
  if (navigator.mediaDevices && typeof navigator.mediaDevices.getUserMedia === "function") return true;
  const n = navigator as Navigator & {
    webkitGetUserMedia?: (c: MediaStreamConstraints, ok: (s: MediaStream) => void, err: (e: Error) => void) => void;
    mozGetUserMedia?: (c: MediaStreamConstraints, ok: (s: MediaStream) => void, err: (e: Error) => void) => void;
  };
  return typeof n.webkitGetUserMedia === "function" || typeof n.mozGetUserMedia === "function";
}

function stopStream(stream: MediaStream | null | undefined) {
  stream?.getTracks().forEach((t) => t.stop());
}

/** Call directly from a click/tap handler so the browser shows the mic prompt. */
export async function requestMicrophoneStream(keepStream?: {
  current: MediaStream | null;
}): Promise<MediaStream> {
  if (!isSecureMicContext()) {
    throw new Error("insecure");
  }
  if (!canRequestMicrophone()) {
    throw new Error("mic-unavailable");
  }

  stopStream(keepStream?.current);
  if (keepStream) keepStream.current = null;

  const media = navigator.mediaDevices!;
  const tries: MediaStreamConstraints[] = [{ audio: true }, { audio: { echoCancellation: true, noiseSuppression: true } }];

  let lastError: unknown = new Error("mic-failed");
  for (const constraints of tries) {
    try {
      const stream = await media.getUserMedia(constraints);
      if (keepStream) keepStream.current = stream;
      return stream;
    } catch (e) {
      lastError = e;
      const name = e instanceof DOMException ? e.name : "";
      if (name === "NotAllowedError" || name === "SecurityError") throw e;
    }
  }

  throw lastError;
}

export function micErrorMessage(code: string): string {
  switch (code) {
    case "insecure":
      return "Mic sirf secure HTTPS site par kaam karta hai. https://shivdantelclinic.com se open karein.";
    case "mic-unavailable":
      return "Is browser mein mic access nahi mila. Chrome ya Edge update karke try karein.";
    case "NotAllowedError":
      return "Mic block hai. Address bar mein lock icon → Site settings → Microphone → Allow.";
    case "SecurityError":
      return "Browser ne mic rok diya. Settings se is site ke liye Microphone Allow karein.";
    default:
      return "Mic permission nahi mili. Dubara «Mic Allow karein» dabayein aur Allow choose karein.";
  }
}

export function errorToMicCode(err: unknown): string {
  if (err instanceof DOMException) return err.name;
  if (err instanceof Error) return err.message;
  return "unknown";
}
