"use client";

import { useEffect } from "react";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { useSetActiveWallet } from "@privy-io/wagmi";

export default function PrivyLoginButton() {
  const { ready, authenticated, login, logout } = usePrivy();
  const { wallets } = useWallets();
  const { setActiveWallet } = useSetActiveWallet();

  useEffect(() => {
    if (!authenticated) return;
    if (!wallets?.length) return;

    // Prefer Privy embedded wallet kalau ada
    const embedded = wallets.find((w) => w.walletClientType === "privy");
    const target = embedded ?? wallets[0];

    // Set as active so wagmi hooks (useAccount, useSignMessage) pick it up
    void setActiveWallet(target);
  }, [authenticated, wallets, setActiveWallet]);

  return (
    <button
      className="rounded-xl border border-white/20 px-4 py-2 text-sm text-white disabled:opacity-40"
      disabled={!ready}
      onClick={() => (authenticated ? logout() : login())}
    >
      {authenticated ? "Logout (Privy)" : "Continue with Email/Google"}
    </button>
  );
}
