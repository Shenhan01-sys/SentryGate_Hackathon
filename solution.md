---
icon: lightbulb-gear
---

# Solution

## Multi-Dimensional High-Security Response

SentryGate provides a multi-dimensional, high-security response to the current document management crisis. By merging advanced client-side cryptography with the transparency of the Base blockchain, SentryGate transforms the concept of a digital vault from a custodial service into a **Self-Sovereign Security Protocol**.

Our solution is architected around **five strategic technical pillars**:

## Pillar 1: Client-Side Zero-Knowledge Encryption

SentryGate operates on a **Zero-Knowledge (ZK) architecture**. This ensures that the platform provides its service without ever having access to the unencrypted content of the data.

### Standardized Security

We implement the **AES-256-GCM** (Advanced Encryption Standard with Galois/Counter Mode). This specific mode is chosen because it provides both **confidentiality** and **authenticated integrity**. If an encrypted file is tampered with on the storage layer, the decryption process will instantly fail, alerting the user to a security breach.

### The "Raw" Data Boundary

All encryption operations occur within the user's browser (client-side) using the **WebCrypto API**. Raw document data never touches the network; only encrypted ciphertext blobs are transmitted.

Implementation reference:

* Frontend encryption implementation in scanner/upload components
* WebCrypto API usage for AES-256-GCM encryption
* Scanner component: [`Scanner.tsx`](/broken/pages/51c60684178987bcb1cc7ecfa7672ba4fe416024)

## Pillar 2: Deterministic Key Derivation (KDF)

To eliminate "Password Fatigue" and the risks associated with storing master passwords, SentryGate derives encryption keys directly from the user's blockchain identity.

### Signature-as-Seed

Upon login, the user provides a deterministic `personal_sign` signature via their wallet (e.g., "Authorize SentryGate Vault").

### Technical Implementation

This signature acts as the input for a **PBKDF2** (Password-Based Key Derivation Function 2) implementation. We use:

* **HMAC-SHA256** algorithm
* **100,000+ iterations** for key strengthening
* **Unique cryptographic salt** per user

### Device Independence

This ensures that the encryption key is:

* **Unique to the user** — derived from their wallet signature
* **Consistent across devices** — same signature produces same key
* **Completely invisible to SentryGate's servers** — true zero-knowledge

Implementation reference:

* Privy authentication: [`PrivyLoginButton.tsx`](/broken/pages/388c482f49324659d99cad0b7e2113c6b6148811)
* Auth provider configuration: [`providers.tsx`](/broken/pages/8c936631e8f20dbf5f89e3b7b504dc60ebe8f983)

## Pillar 3: On-Chain Access Management (x402 Middleware)

We replace traditional, opaque billing databases with the **x402 Protocol** — a transparent on-chain gatekeeping logic.

### The Smart Gatekeeper

Access rights are managed by the **SentryGate.sol** smart contract on the Base network.

Implementation: [`SentryGate.sol`](/broken/pages/4869e85afa8d9ca7b5661354ccf1802cdac368cf)

### Automated Enforcement

{% stepper %}
{% step %}
### Subscription model

* `subExpiry` mapping tracks expiration timestamp
* 30-day duration per payment
* Price: 50,000 IDRX (with 2 decimals = 50,000 \* 10^2 units)
* Implementation: [`paySubscription()`](/broken/pages/4869e85afa8d9ca7b5661354ccf1802cdac368cf#L49-L63)
{% endstep %}

{% step %}
### Credit model

* `uploadCredits` mapping tracks remaining uploads
* 5 uploads per purchase
* Price: 10,000 IDRX (with 2 decimals = 10,000 \* 10^2 units)
* Implementation: [`buyCredits()`](/broken/pages/4869e85afa8d9ca7b5661354ccf1802cdac368cf#L65-L71)
{% endstep %}

{% step %}
### Access verification

* Frontend and backend query [`verifyPayment()`](/broken/pages/4869e85afa8d9ca7b5661354ccf1802cdac368cf#L103-L106) view function
* If session expired, app triggers Paywall Modal
* Access is a **verifiable on-chain state**
{% endstep %}

{% step %}
### Upload enforcement

* [`addDocument()`](/broken/pages/4869e85afa8d9ca7b5661354ccf1802cdac368cf#L74-L100) checks payment status
* Reverts with [`PaymentRequired()` error](/broken/pages/4869e85afa8d9ca7b5661354ccf1802cdac368cf#L18) if unauthorized
* Deducts credit if using credit mode
{% endstep %}
{% endstepper %}

## Pillar 4: Localized Economic Stability (IDRX Integration)

Recognizing the volatility of native crypto assets, SentryGate is designed as a **"Retail-Ready" product** for the Indonesian market.

### Stable Pricing

By integrating the **IDRX stablecoin**, we provide predictable pricing pegged to the Rupiah.

Implementation:

* Token: [`MockIDRX.sol`](/broken/pages/2f634951ccfbb28bd2d6dfcaa4f3d190090af9e7)
* Features:
  * 2 decimal places (matching Rupiah)
  * Faucet function for testing: `faucet()` mints 1 MIDRX
  * Mint function for flexibility
  * ERC20 standard compliance

### Bonus Eligibility

The integration of IDRX within our smart contract logic directly addresses the requirements for the **Best Project (IDRX) bonus prize**, showcasing a real-world use case for localized stablecoins on Base.

## Pillar 5: Distributed Persistence & Integrity Anchoring

Our storage strategy ensures that your data is both permanent and verifiable.

### Decentralized Hosting

We utilize **IPFS** (InterPlanetary File System) via the **Pinata gateway**. Documents are retrieved via **CIDs** (Content Identifiers), making the storage layer resistant to takedown requests and server outages.

Implementation reference:

* Backend upload API: Express `POST /api/upload` ([`index.js:130-168`](/broken/pages/b1724c0a8483ef82a35b32509fcfc9371588b5c1#L130-L168))
* Document retrieval: Express `GET /api/documents/:walletAddress` ([`index.js:199-209`](/broken/pages/b1724c0a8483ef82a35b32509fcfc9371588b5c1#L199-L209))

### Integrity Anchoring

For every vaulting operation, a **SHA-256 hash** of the document is generated. This "digital fingerprint" is anchored to the Base mainnet, providing an immutable record of the document's exact state at the time of upload.

Implementation:

* Document struct with hash: [`Document`](/broken/pages/4869e85afa8d9ca7b5661354ccf1802cdac368cf#L22-L27)
* Fields stored on-chain:
  * `cid` - IPFS content identifier
  * `docHash` - SHA-256 hash for integrity verification
  * `encryptedName` - Encrypted filename
  * `timestamp` - Block timestamp for proof of existence

***

## Technical Impact Summary

| Feature     | Technology               | Benefit                                                              |
| ----------- | ------------------------ | -------------------------------------------------------------------- |
| **Privacy** | AES-256-GCM              | Absolute confidentiality; data is unreadable to anyone but the owner |
| **Auth**    | PBKDF2 (100k iterations) | Signature-based keys; no password to remember or lose                |
| **Access**  | x402 Middleware          | Transparent, automated, and immutable access control                 |
| **Economy** | IDRX Stablecoin          | Price stability for the Indonesian retail market                     |
| **Storage** | IPFS (Pinata)            | Decentralized, permanent, and censorship-resistant                   |

***

{% hint style="info" %}
"SentryGate doesn't just store your data; it builds a fortress around your digital legacy."
{% endhint %}
