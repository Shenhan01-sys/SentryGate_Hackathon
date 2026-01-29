import { http } from "wagmi";
import { createConfig } from "@privy-io/wagmi";
import { base, baseSepolia } from "wagmi/chains";

const chainEnv = process.env.NEXT_PUBLIC_CHAIN;

export const chain = chainEnv === "base" ? base : baseSepolia;

export const wagmiConfig = createConfig({
  chains: [chain],
  transports: {
    [base.id]: http(),
    [baseSepolia.id]: http(),
  },
  ssr: true,
});
