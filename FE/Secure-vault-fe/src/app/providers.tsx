"use client";

import { PropsWithChildren } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { PrivyProvider, type PrivyClientConfig } from "@privy-io/react-auth";
import { WagmiProvider } from "@privy-io/wagmi";

import { OnchainKitProvider } from "@coinbase/onchainkit";
import { wagmiConfig, chain } from "@/lib/wagmi";

const queryClient = new QueryClient();

const privyConfig: PrivyClientConfig = {
  // bikin embedded wallet otomatis untuk user awam
  embeddedWallets: {
    ethereum: {
      createOnLogin: "users-without-wallets",
    },
    showWalletUIs: true,
  },

  // biar ada opsi email + external wallet
  loginMethods: ["email", "wallet", "google"],
  appearance: {
    // optional: atur UI modal privy
    // showWalletLoginFirst: false,
  },
};

export default function Providers({ children }: PropsWithChildren) {
  return (
    <PrivyProvider
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID!}
      config={privyConfig}
    >
      <QueryClientProvider client={queryClient}>
        <WagmiProvider config={wagmiConfig}>
          <OnchainKitProvider chain={chain}>{children}</OnchainKitProvider>
        </WagmiProvider>
      </QueryClientProvider>
    </PrivyProvider>
  );
}
