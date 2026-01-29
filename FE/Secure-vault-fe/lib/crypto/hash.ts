

import { bytesToHex, toU8 } from "./base64";

export async function sha256Bytes(
  data: ArrayBuffer | ArrayBufferView
): Promise<Uint8Array> {
  const u8 = toU8(data);
  const digest = await crypto.subtle.digest("SHA-256", new Uint8Array(u8));
  return new Uint8Array(digest);
}

export async function sha256Hex(
  data: ArrayBuffer | ArrayBufferView
): Promise<string> {
  const bytes = await sha256Bytes(data);
  return bytesToHex(bytes);
}
