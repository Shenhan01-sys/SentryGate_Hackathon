import { hexToBytes, ensureArrayBufferBytes } from "./base64";
import { sha256Bytes } from "./hash";

const INFO = new TextEncoder().encode("SecureOnchainVault/v1");

export async function deriveAesKeyFromSignature(params: {
  signatureHex: string;
  salt: Uint8Array;
}): Promise<CryptoKey> {
  // signature hex -> bytes (copy to ensure ArrayBuffer backing)
  const sigBytes = ensureArrayBufferBytes(hexToBytes(params.signatureHex));

  // hash signature bytes -> IKM
  const ikm = await sha256Bytes(sigBytes);

  const hkdfKey = await crypto.subtle.importKey(
    "raw",
    ensureArrayBufferBytes(ikm) as Uint8Array<ArrayBuffer>, // Uint8Array is BufferSource
    "HKDF",
    false,
    ["deriveKey"]
  );

  const saltBytes = ensureArrayBufferBytes(params.salt);

  return crypto.subtle.deriveKey(
    {
      name: "HKDF",
      hash: "SHA-256",
      salt: saltBytes as Uint8Array<ArrayBuffer>, // BufferSource
      info: INFO,
    },
    hkdfKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}
