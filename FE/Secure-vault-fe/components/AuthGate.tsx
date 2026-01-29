"use client";

import { useMemo, useState } from "react";
import { useAccount } from "wagmi";
import ConnectWallet from "@/components/ConnectWallet";
import PaywallModal from "@/components/PaywallModal";
import { usePaymentStatus } from "@/hooks/usePaymentStatus";
import LoadingLottie from "@/components/lottie/Loading";
import { useRouter } from "next/navigation";

import PrivyLoginButton from "@/src/components/PrivyLoginButton";
import { usePrivy } from "@privy-io/react-auth";

function formatExpiry(ts?: number) {
  if (!ts) return "-";
  return new Date(ts * 1000).toLocaleString();
}

function shortAddress(addr?: string) {
  if (!addr) return "-";
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export default function AuthGate() {
  const { address, isConnected } = useAccount();

  // hanya untuk "user pernah menutup modal"
  const [paywallDismissed, setPaywallDismissed] = useState(false);

  const { data, loading, error } = usePaymentStatus(address);

  //cek auth
  const { authenticated } = usePrivy();

  const isInactive = isConnected && data?.status === "inactive";
  const isActive = isConnected && data?.status === "active";

  // Modal open = derived value (no effect!)
  const paywallOpen = isInactive && !paywallDismissed;

  const shouldLock = useMemo(() => {
    if (!isConnected) return true;
    if (loading) return true;
    if (error) return true;
    if (!data) return true;
    return data.status !== "active";
  }, [isConnected, loading, error, data]);

  const router = useRouter();

  return (
    <div className="mt-6 space-y-4">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <div className="text-xs uppercase tracking-wide text-gray-400">
              Account
            </div>

            <div className="mt-1 flex items-center gap-3">
              <div className="min-w-0">
                <div className="truncate font-mono text-sm text-white">
                  {isConnected ? address : "Not connected"}
                </div>
                <div className="mt-1 text-xs text-gray-400">
                  {isConnected
                    ? `Short: ${shortAddress(address)}${
                        authenticated ? " • Privy" : ""
                      }`
                    : "Login (Privy) atau connect wallet untuk lanjut"}
                </div>
              </div>
            </div>

            <div className="mt-4 text-sm text-gray-300">
              {loading && <LoadingLottie />}

              {!loading && error && (
                <span className="text-red-400">Status error: {error}</span>
              )}

              {!loading && !error && isActive && (
                <span className="inline-flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-green-400" />
                  Active until{" "}
                  <span className="font-mono">{formatExpiry(data.expiry)}</span>
                </span>
              )}

              {!loading && !error && isInactive && (
                <span className="inline-flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-red-400" />
                  Inactive
                </span>
              )}
            </div>
          </div>

          <div className="shrink-0 flex flex-col gap-2 sm:flex-row sm:items-center">
            <PrivyLoginButton />
            <ConnectWallet />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          className="rounded-xl bg-white px-4 py-2 text-sm font-medium text-black disabled:opacity-40"
          disabled={shouldLock}
          onClick={() => router.push("/scan")}
        >
          Scan / Upload
        </button>

        <button
          className="rounded-xl border border-white/20 px-4 py-2 text-sm text-white disabled:opacity-40"
          disabled={shouldLock}
          onClick={() => router.push("/vault")}
        >
          Open Vault
        </button>

        {isInactive && paywallDismissed && (
          <button
            className="ml-auto rounded-xl bg-black px-4 py-2 text-sm text-white"
            onClick={() => setPaywallDismissed(false)}
          >
            Unlock
          </button>
        )}
      </div>

      <PaywallModal
        open={paywallOpen}
        onClose={() => setPaywallDismissed(true)}
      />
    </div>
  );
}
