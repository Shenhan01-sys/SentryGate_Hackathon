"use client";

import { useEffect, useMemo, useState } from "react";
import { useAccount, useSignMessage } from "wagmi";
import { readVault, type VaultItem } from "@/lib/storage/vault";
import { decryptToBytes } from "@/lib/crypto/decrypt";

function shortAddress(addr?: string) {
  if (!addr) return "-";
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

function formatTs(ts?: number) {
  if (!ts) return "-";
  return new Date(ts * 1000).toLocaleString();
}

function bytesToObjectUrl(bytes: Uint8Array, mime?: string) {
  const safeBytes = new Uint8Array(bytes); // <-- penting
  const blob = new Blob([safeBytes], {
    type: mime || "application/octet-stream",
  });

  return URL.createObjectURL(blob);
}


export default function VaultGallery() {
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();

  const [items, setItems] = useState<VaultItem[]>([]);
  const [selected, setSelected] = useState<VaultItem | null>(null);

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // load from localStorage
  useEffect(() => {
    setItems(readVault());
  }, []);

  // cleanup objectURL
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const myItems = useMemo(() => {
    if (!address) return items;
    // optional: filter by current wallet (biar ga campur)
    return items.filter((it) => it.walletAddress?.toLowerCase() === address.toLowerCase());
  }, [items, address]);

  async function onOpen(item: VaultItem) {
    setError(null);
    setSelected(item);

    if (!isConnected || !address) {
      setError("Wallet belum connect.");
      return;
    }

    if (item.walletAddress.toLowerCase() !== address.toLowerCase()) {
      setError("Item ini milik wallet lain.");
      return;
    }

    try {
      setBusyId(item.id);

      // Signature message MUST match encryption message
      const message = `SecureOnchainVault:encrypt:v1:${item.docHash}`;
      const signatureHex = await signMessageAsync({ message });

      const bytes = await decryptToBytes({
        payload: item.payload,
        signatureHex,
      });

      if (previewUrl) URL.revokeObjectURL(previewUrl);
      const url = bytesToObjectUrl(bytes, item.payload.mime);
      setPreviewUrl(url);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Decrypt failed";
      setError(msg);
    } finally {
      setBusyId(null);
    }
  }

  function onClosePreview() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setSelected(null);
    setError(null);
  }

  if (!myItems.length) {
    return (
      <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-gray-400">
        Belum ada dokumen. Coba scan dulu dari halaman /scan.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
          {error}
        </div>
      )}

      <div className="grid gap-3">
        {myItems.map((it, idx) => (
          <button
            key={it.id}
            onClick={() => onOpen(it)}
            className="w-full rounded-2xl border border-white/10 bg-black/20 p-4 text-left hover:bg-black/30"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-sm font-medium text-white">
                  Document #{myItems.length - idx}
                </div>
                <div className="mt-1 text-xs text-gray-400">
                  CID: <span className="font-mono break-all">{it.cid}</span>
                </div>
                <div className="mt-1 text-xs text-gray-500">
                  Hash: <span className="font-mono break-all">{it.docHash}</span>
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  Owner:{" "}
                  <span className="font-mono">{shortAddress(it.walletAddress)}</span>{" "}
                  • {formatTs(it.createdAt)}
                </div>
              </div>

              <div className="shrink-0">
                <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[11px] text-gray-300">
                  {busyId === it.id ? "Decrypting..." : "Open"}
                </span>
              </div>
            </div>
          </button>
        ))}
      </div>

      {selected && previewUrl && (
        <div className="rounded-2xl border border-white/10 bg-black/30 p-3">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm text-gray-200">Preview</div>
            <button
              className="rounded-xl border border-white/15 px-3 py-1.5 text-sm text-white"
              onClick={onClosePreview}
            >
              Close
            </button>
          </div>

          <div className="mt-3 overflow-hidden rounded-xl border border-white/10 bg-black">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt="Decrypted preview"
              className="max-h-[60vh] w-full object-contain"
            />
          </div>

          <div className="mt-2 text-xs text-gray-500">
            MIME: <span className="font-mono">{selected.payload.mime}</span> • Size:{" "}
            {Math.round(selected.payload.size / 1024)} KB
          </div>
        </div>
      )}
    </div>
  );
}
