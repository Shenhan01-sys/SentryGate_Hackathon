---
icon: arrow-progress
---

# How It Works

SentryGate is designed to be a **"Zero-Trust" environment**. The platform orchestrates a complex dance between blockchain identity, client-side cryptography, and decentralized storage to ensure that your documents are always secure and always yours.

The lifecycle of a document within SentryGate follows a strict five-stage process:

{% stepper %}
{% step %}
### Decentralized Onboarding & Gatekeeping

The journey begins with authentication via **Privy** or the **Coinbase Smart Wallet**. Unlike traditional apps that use email/password, SentryGate uses your **Base Wallet Address** as your unique identifier.

#### Authentication Flow

Immediately upon connection, the frontend triggers an on-chain query to the SentryGate Smart Contract calling the `checkAccess(address)` function.

Implementation:

* Privy authentication: [`PrivyLoginButton.tsx`](/broken/pages/3715ebda911ed2e71dfd6a29aa8988b40cbb66a1)
* Providers setup: [`providers.tsx`](/broken/pages/0b06cf7b804a53bc526c8380e8147fc1df249f57)
* Privy config with Base Sepolia chain

#### The "Gate"

If the contract returns `false` (meaning no active x402 session), the user is presented with the **PaywallModal**.

Implementation:

* Access verification: [`verifyPayment()` function](/broken/pages/91437dd5da0e9d759eb8550401d70243f80c16d8#L103-L106)
* Returns: `(isActive, expiry, credits)`
* Logic: `isActive = (block.timestamp < subExpiry[user]) || (uploadCredits[user] > 0)`

#### Unlocking

Once a payment in **IDRX** is confirmed on the Base network, the smart contract updates the `userExpiry` mapping, and the app's core features are unlocked.

Implementation:

* Payment functions:
  * [`paySubscription()`](/broken/pages/91437dd5da0e9d759eb8550401d70243f80c16d8#L49-L63) - Updates `subExpiry[msg.sender]`
  * [`buyCredits()`](/broken/pages/91437dd5da0e9d759eb8550401d70243f80c16d8#L65-L71) - Increments `uploadCredits[msg.sender] += 5`
* IDRX token integration: [`MockIDRX.sol`](/broken/pages/6325a8aaa94f29945881a344383281859bda6372)
{% endstep %}

{% step %}
### High-Fidelity Document Capture

Once inside the vault, the user accesses the **Scanner component**.

#### Hardware Interfacing

The component uses the `navigator.mediaDevices.getUserMedia` API to access the camera stream.

Implementation:

* Scanner component: [`Scanner.tsx`](/broken/pages/5ac63d4e94e084caaf86eed60b6b52353a2ea189)
* React-webcam library integration (dependency in package.json)
* Scan page: [`/scan/page.tsx`](/broken/pages/5bce23f5d7ef451c078c3fd1da98d6f545c79537)

#### Optimized Processing

To prevent uploading massive raw image files, SentryGate processes the frame through an internal **HTML5 Canvas**. It performs:

* Real-time cropping
* Compression
* Format conversion (WebP)

This ensures the file is lightweight but remains high-resolution for legal readability.
{% endstep %}

{% step %}
### The Cryptographic Locking (Client-Side)

This is where SentryGate differs from custodial cloud services. **Before a single bit of the document is sent to the internet, it must be locked.**

#### Deterministic Entropy

The user is prompted for a `personal_sign`. The resulting signature is used as the high-entropy seed for our Key Derivation Function (KDF).

#### AES-256-GCM Transformation

Using the **Web Crypto API**, the document blob is encrypted using **AES-256-GCM**. This process produces:

* **Ciphertext** - The encrypted document
* **Initialization Vector (IV)** - Random nonce for encryption
* **Authentication Tag** - Ensures integrity

The **"Raw" document never leaves the user's browser memory**.

Implementation:

* Client-side encryption in frontend
* Web Crypto API (`crypto.subtle`) for AES-256-GCM
* PBKDF2 key derivation from wallet signature
* 100,000+ iterations with unique salt
{% endstep %}

{% step %}
### Distributed Archiving

The encrypted package is sent to the **SentryGate Backend API**.

#### IPFS Pinning

The backend acts as a secure relay to **Pinata**. The file is uploaded to the **InterPlanetary File System (IPFS)**, a peer-to-peer network.

Implementation:

* Upload API endpoint: Express `POST /api/upload` ([`index.js:130-168`](/broken/pages/63951f5c3085e8fbecacbbfbaa74a361a3127370#L130-L168))
* Pinata integration for IPFS pinning
* Returns CID (Content Identifier)

#### CID Generation

IPFS returns a **Content Identifier (CID)**—a unique cryptographic hash representing the file. This CID is then:

* Stored in **MySQL database** via MySQL2 connection pool
* Posted to smart contract via [`addDocument()`](/broken/pages/91437dd5da0e9d759eb8550401d70243f80c16d8#L74-L100)
* Associated with the user's wallet address on-chain

Implementation:

* Backend database: MySQL2 connection pool ([`index.js:25-33`](/broken/pages/63951f5c3085e8fbecacbbfbaa74a361a3127370#L25-L33))
* Database tables: [`migrate.js`](/broken/pages/8a22a254d174942df801d62a60f6a65dd8c298fe)
* On-chain storage in [`userDocuments` mapping](/broken/pages/91437dd5da0e9d759eb8550401d70243f80c16d8#L29)
{% endstep %}

{% step %}
### Secure Retrieval & Decryption

When a user visits their **Vault Gallery**:

#### Retrieval Process

* The app fetches the list of encrypted CIDs from the backend
* The browser downloads the encrypted blob directly from the IPFS gateway
* The app uses the cached master key (from the earlier login signature) to decrypt the blob in-memory
* An ephemeral Blob URL is created for viewing, ensuring that the decrypted file is never stored permanently on the local disk

Implementation:

* My files API: Express `GET /api/documents/:walletAddress` ([`index.js:199-209`](/broken/pages/63951f5c3085e8fbecacbbfbaa74a361a3127370#L199-L209))
* Vault page: [`/vault/page.tsx`](/broken/pages/ff7cd156baa7351435b8874dc28bdb1eb0efad4a)
* On-chain verification via [`getMyDocs()`](/broken/pages/91437dd5da0e9d759eb8550401d70243f80c16d8#L108-L110)
{% endstep %}
{% endstepper %}

***

## Workflow Summary

<figure><img src=".gitbook/assets/Screenshot 2026-01-30 164059.png" alt=""><figcaption></figcaption></figure>

***

{% hint style="info" %}
Zero-Trust Architecture: At no point does SentryGate have access to your unencrypted documents. The platform operates purely on encrypted data and on-chain proofs.
{% endhint %}
