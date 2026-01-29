import type { EncryptedPayloadV1 } from "@/lib/crypto/encrypt";

export async function uploadEncrypted(params: {
  walletAddress: string;
  docHash: string;
  payload: EncryptedPayloadV1;
}) {
  const res = await fetch("/api/upload", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(params),
  });

  if (res.status === 402) throw new Error("402 Payment Required");
  if (!res.ok) throw new Error(`Upload failed: ${res.status}`);

  return res.json() as Promise<{ cid: string; receivedAt: number }>;
}
