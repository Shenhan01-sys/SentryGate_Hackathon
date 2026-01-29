"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import Webcam from "react-webcam";
import { useAccount, useSignMessage } from "wagmi";
import { sha256Hex } from "@/lib/crypto/hash";
import { encryptFileWithSignature } from "@/lib/crypto/encrypt";
import { uploadEncrypted } from "@/lib/api/upload";
import { addVaultItem } from "@/lib/storage/vault";

type Capture = {
  dataUrl: string;
  file: File;
};

function dataUrlToFile(dataUrl: string, filename: string) {
  const arr = dataUrl.split(",");
  const mimeMatch = arr[0]?.match(/:(.*?);/);
  const mime = mimeMatch?.[1] ?? "image/jpeg";
  const bstr = atob(arr[1] ?? "");
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) u8arr[n] = bstr.charCodeAt(n);
  return new File([u8arr], filename, { type: mime });
}

export default function Scanner() {
  const webcamRef = useRef<Webcam>(null);

  const { address } = useAccount();
  const { signMessageAsync } = useSignMessage();

  const [capture, setCapture] = useState<Capture | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [cid, setCid] = useState<string | null>(null);

  const videoConstraints = useMemo(
    () => ({
      facingMode: { ideal: "environment" }, // mobile: back camera
      width: { ideal: 1280 },
      height: { ideal: 720 },
    }),
    []
  );

  const onCapture = useCallback(() => {
    setError(null);
    setCid(null);

    const dataUrl = webcamRef.current?.getScreenshot();
    if (!dataUrl) {
      setError("Gagal capture. Coba izinkan akses kamera atau refresh.");
      return;
    }

    const file = dataUrlToFile(
      dataUrl,
      `scan_${new Date().toISOString().replace(/[:.]/g, "-")}.jpg`
    );

    setCapture({ dataUrl, file });
  }, []);

  const onRetake = useCallback(() => {
    setCapture(null);
    setError(null);
    setCid(null);
  }, []);

  const onPickFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    setCid(null);

    const f = e.target.files?.[0];
    if (!f) return;

    const url = URL.createObjectURL(f);
    setCapture({ dataUrl: url, file: f });
  }, []);

  const onUsePhoto = useCallback(async () => {
    if (!capture) return;

    try {
      setProcessing(true);
      setError(null);

      if (!address) {
        throw new Error("Wallet belum connect.");
      }

      // 1) hash plaintext
      const ab = await capture.file.arrayBuffer();
      const docHash = await sha256Hex(ab);

      // 2) sign message deterministik (NO timestamp!)
      // penting untuk decrypt nanti: signature harus bisa diulang.
      const message = `SecureOnchainVault:encrypt:v1:${docHash}`;

      const signatureHex = await signMessageAsync({ message });

      // 3) encrypt file (HKDF -> AES-GCM)
      const payload = await encryptFileWithSignature({
        file: capture.file,
        signatureHex,
      });

      // 4) upload encrypted payload (mock)
      const uploaded = await uploadEncrypted({
        walletAddress: address,
        docHash,
        payload,
      });

      setCid(uploaded.cid);

      // 5) simpan ke localStorage (buat Step 10: Vault)
      addVaultItem({
        id: `${Date.now()}_${Math.random().toString(16).slice(2)}`,
        walletAddress: address,
        cid: uploaded.cid,
        docHash,
        payload,
        createdAt: uploaded.receivedAt,
      });

      console.log("docHash:", docHash);
      console.log("payload:", payload);
      console.log("uploaded:", uploaded);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Encrypt/Upload failed";
      setError(msg);
    } finally {
      setProcessing(false);
    }
  }, [capture, address, signMessageAsync]);

  return (
    <div className="space-y-3">
      {!capture ? (
        <>
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-black">
            <Webcam
              ref={webcamRef}
              audio={false}
              screenshotFormat="image/jpeg"
              screenshotQuality={0.92}
              videoConstraints={videoConstraints}
              className="h-[55vh] w-full object-cover"
              onUserMediaError={() =>
                setError("Kamera tidak bisa diakses. Cek permission browser.")
              }
            />
          </div>

          {error && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
              {error}
            </div>
          )}

          <div className="flex flex-wrap gap-3">
            <button
              className="rounded-xl bg-white px-4 py-2 text-sm font-medium text-black"
              onClick={onCapture}
            >
              Capture
            </button>

            <label className="cursor-pointer rounded-xl border border-white/20 px-4 py-2 text-sm text-white">
              Upload from gallery
              <input
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={onPickFile}
              />
            </label>
          </div>

          <p className="text-xs text-gray-500">
            Jika kamera blank, coba buka lewat HTTPS atau izinkan permission
            kamera.
          </p>
        </>
      ) : (
        <>
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-black">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={capture.dataUrl}
              alt="Preview"
              className="h-[55vh] w-full object-contain"
            />
          </div>

          {error && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
              {error}
            </div>
          )}

          <div className="flex flex-wrap gap-3">
            <button
              className="rounded-xl bg-white px-4 py-2 text-sm font-medium text-black disabled:opacity-40"
              onClick={onUsePhoto}
              disabled={processing}
            >
              {processing ? "Encrypting & Uploading..." : "Use Photo"}
            </button>

            <button
              className="rounded-xl border border-white/20 px-4 py-2 text-sm text-white disabled:opacity-40"
              onClick={onRetake}
              disabled={processing}
            >
              Retake
            </button>
          </div>

          <div className="text-xs text-gray-400">
            File: <span className="font-mono">{capture.file.name}</span> •{" "}
            {Math.round(capture.file.size / 1024)} KB
          </div>

          {cid && (
            <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-xs text-gray-200">
              <div className="text-gray-400">Uploaded CID (mock)</div>
              <div className="mt-1 font-mono break-all">{cid}</div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
