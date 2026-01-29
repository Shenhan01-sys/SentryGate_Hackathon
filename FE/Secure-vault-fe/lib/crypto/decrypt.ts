import { base64ToBytes, ensureArrayBufferBytes } from "./base64";
import { deriveAesKeyFromSignature } from "./kdf";
import type { EncryptedPayloadV1 } from "./encrypt";

export async function decryptToBytes(params: {
  payload: EncryptedPayloadV1;
  signatureHex: string;
}): Promise<Uint8Array> {
  // Decode from base64 and force ArrayBuffer-backed Uint8Array (TS-safe)
  const salt = ensureArrayBufferBytes(base64ToBytes(params.payload.saltB64));
  const iv = ensureArrayBufferBytes(base64ToBytes(params.payload.ivB64));
  const ciphertext = ensureArrayBufferBytes(
    base64ToBytes(params.payload.ciphertextB64)
  );

  const key = await deriveAesKeyFromSignature({
    signatureHex: params.signatureHex,
    salt,
  });

  const plaintext = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: new Uint8Array(iv) }, // Uint8Array is valid BufferSource
    key,
    new Uint8Array(ciphertext) // Uint8Array is valid BufferSource
  );

  return new Uint8Array(plaintext);
}
