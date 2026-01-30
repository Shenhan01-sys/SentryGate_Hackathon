---
icon: arrow-right-to-arc
---

# Introduction

## SentryGate: On-Chain Digital Vault Ecosystem

SentryGate is a sophisticated **On-chain Mini App ecosystem** architected on the **Base network**, specifically engineered to serve as a high-integrity, decentralized digital vault for vital documents. In an era where digital identity and sensitive records are constantly under threat from centralized breaches, surveillance, and data mismanagement, SentryGate introduces a paradigm shift by merging **Zero-Knowledge (ZK) cryptographic principles** with the immutable ledger of the Base blockchain.

At its core, SentryGate is more than a storage solution—it is a **Self-Sovereign Security Protocol**. By leveraging the **x402 protocol** as a smart middleware and the **IDRX stablecoin** as an economic anchor, SentryGate provides a seamless, retail-ready experience for users who demand absolute control over their digital legacy.

## The Technical Philosophy : "Privacy by Design"

SentryGate is built on the principle that **mathematical proof is superior to institutional trust**. Our architecture is designed to ensure that the platform provides its service without ever having access to the raw content of the data being processed.

### Core Principles

* **Zero-Knowledge Foundation**: We implement **Client-Side Encryption (CSE)** using the Web Crypto API. Before a single byte of a document leaves the user's browser, it is transformed into a cryptographically locked blob.
* **Signature-Based Keys**: By deriving encryption keys deterministically from the user's wallet signature, we eliminate the "Master Password" vulnerability. Your blockchain identity is your key.
* **On-chain Integrity**: Every document's state is anchored to the Base mainnet with a permanent timestamp and a cryptographic hash, creating a "Root of Trust" that is independent of any central authority.

## Strategic Pillars of the Ecosystem

To deliver a product that is both "Military-Grade" in security and "Consumer-Grade" in usability, SentryGate is built upon four strategic pillars:

{% stepper %}
{% step %}
### Base Layer 2 Infrastructure

SentryGate is natively optimized for the **Base ecosystem**. We utilize Base's high throughput and sub-penny transaction costs to record document metadata and verify access rights. This ensures that secure vaulting remains affordable and accessible for retail users, students, and small businesses in Indonesia and globally.

Implementation Reference:

* Smart Contract deployed on Base Sepolia: [`SentryGate.sol`](/broken/pages/245d67e9d4437d2cfbcb760c49dce0c5fa9a3840)
* Frontend Base configuration: [`providers.tsx`](/broken/pages/5c1c3fcad53e89cb6902f5471992557cce4eeef3)
{% endstep %}

{% step %}
### x402-Gated Access Control (Middleware)

We utilize the **x402 protocol** to automate the "Gatekeeping" process. This allows SentryGate to function as a trustless service model where access rights are managed directly by smart contracts.

* **Autonomous Enforcement**: The contract strictly monitors access periods based on on-chain transactions, ensuring transparency in billing and access duration.
* **Middleware Synchronization**: Our backend and frontend act as enforcers that respect the on-chain "Gate," providing a unified experience across the stack.

Implementation Reference:

* Payment verification logic: [`SentryGate.sol:L103-106`](/broken/pages/245d67e9d4437d2cfbcb760c49dce0c5fa9a3840#L103-L106) - `verifyPayment()` function
* Access enforcement: [`SentryGate.sol:L74-90`](/broken/pages/245d67e9d4437d2cfbcb760c49dce0c5fa9a3840#L74-L90) - `addDocument()` with PaymentRequired error
{% endstep %}

{% step %}
### Localized Economic Stability (IDRX Integration)

Recognizing the volatility inherent in native crypto assets, SentryGate integrates the **IDRX stablecoin**. By using a Rupiah-pegged asset, we provide predictable pricing and lower the barrier to entry for the Indonesian market, allowing users to secure their future in a currency they understand.

Implementation Reference:

* IDRX Token Contract: [`MockIDRX.sol`](/broken/pages/75ef4f008bf0a59b3987963fb42e0280aec02105)
* Payment token configuration: [`SentryGate.sol:L10`](/broken/pages/245d67e9d4437d2cfbcb760c49dce0c5fa9a3840#L10) - `IERC20 public paymentToken`
* Pricing (2 decimals): [`SentryGate.sol:L44-45`](/broken/pages/245d67e9d4437d2cfbcb760c49dce0c5fa9a3840#L44-L45)
  * Subscription: 50,000 IDRX (30 days)
  * Credits: 10,000 IDRX (5 uploads)
{% endstep %}

{% step %}
### Decentralized Persistence (IPFS & Pinata)

Our storage layer is as decentralized as our logic. Using **IPFS via Pinata**, we ensure that encrypted document blobs are distributed across a global peer-to-peer network. This eliminates "Single Points of Failure" and ensures your records remain available even if the primary interface is inaccessible.

Implementation Reference:

* Frontend scanner: [`Scanner.tsx`](/broken/pages/e4fc92fb2256b60f62aac281f0e8dae260108c38)
* Backend upload API: Express `POST /api/upload` ([`index.js:130-168`](/broken/pages/b1af46e11e70efc86e3967afef875f6e89cdd805#L130-L168))
{% endstep %}
{% endstepper %}

## Targeted Impact

SentryGate serves the modern digital citizen who requires absolute certainty in their documentation:

* **Academic Sovereignty**: Students and alumni can vault encrypted diplomas and transcripts that are verifiable for life.
* **Freelance Security**: Independent professionals can secure immutable proofs of work and legal agreements.
* **Enterprise Resilience**: Small businesses can safeguard NIBs, deeds, and tax records against local hardware failure or centralized cloud outages.

> "Your digital life is off-chain, but your security should be on-chain. Trust the mathematics. Trust SentryGate."
