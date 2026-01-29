export function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

export function base64ToBytes(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function hexToBytes(hex: string): Uint8Array {
  const clean = hex.startsWith("0x") ? hex.slice(2) : hex;
  if (clean.length % 2 !== 0) throw new Error("Invalid hex length");
  const bytes = new Uint8Array(clean.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

export function randomBytes(length: number): Uint8Array {
  const b = new Uint8Array(length);
  crypto.getRandomValues(b);
  return b;
}

/**
 * TS workaround: make sure returned Uint8Array is backed by a real ArrayBuffer
 * (not ArrayBufferLike / SharedArrayBuffer).
 */
export function ensureArrayBufferBytes(bytes: Uint8Array): Uint8Array {
  // copy into a fresh Uint8Array -> guaranteed ArrayBuffer backing
  return new Uint8Array(bytes);
}

/**
 * Convert ArrayBuffer or TypedArray into Uint8Array with ArrayBuffer backing.
 */
export function toU8(data: ArrayBuffer | ArrayBufferView): Uint8Array {
  if (data instanceof ArrayBuffer) return new Uint8Array(data);
  const view = new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
  return ensureArrayBufferBytes(view);
}

