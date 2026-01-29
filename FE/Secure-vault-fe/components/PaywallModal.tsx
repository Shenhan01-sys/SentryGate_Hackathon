"use client";

import PaymentRequiredLottie from "@/components/lottie/PaymentRequired";

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function PaywallModal({ open, onClose }: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-zinc-950 p-6 shadow-xl">
        <PaymentRequiredLottie />

        <h2 className="mt-2 text-center text-lg font-semibold text-white">
          Payment Required
        </h2>
        <p className="mt-2 text-center text-sm text-gray-400">
          Akses upload/scan terkunci. Nanti tombol ini akan mengarah ke flow pembayaran di Base.
        </p>

        <div className="mt-6 flex gap-3">
          <button
            className="flex-1 rounded-xl bg-white px-4 py-2 text-sm font-medium text-black"
            onClick={() => alert("Nanti diisi: pay flow")}
          >
            Pay on Base
          </button>
          <button
            className="rounded-xl border border-white/20 px-4 py-2 text-sm text-white"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
