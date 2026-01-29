"use client";

import { Wallet } from "@coinbase/onchainkit/wallet";

export default function ConnectWallet() {
  return (
    <div className="flex items-center gap-3">
      <Wallet />
    </div>
  );
}
