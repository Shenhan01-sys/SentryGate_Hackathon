import type { EncryptedPayloadV1 } from "@/lib/crypto/encrypt";

export type VaultItem = {
  id: string; // local id
  walletAddress: string;
  cid: string;
  docHash: string;
  payload: EncryptedPayloadV1;
  createdAt: number;
};

const KEY = "sov_vault_v1";

export function readVault(): VaultItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    return JSON.parse(raw) as VaultItem[];
  } catch {
    return [];
  }
}

export function addVaultItem(item: VaultItem) {
  const curr = readVault();
  curr.unshift(item);
  localStorage.setItem(KEY, JSON.stringify(curr));
}
