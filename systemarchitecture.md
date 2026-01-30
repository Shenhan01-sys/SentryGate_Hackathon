---
icon: list-tree
---

# SystemArchitecture

SentryGate is built upon a modern, three-tier architecture that prioritizes security, scalability on the Base L2, and user privacy.

## Architecture Overview

<figure><img src=".gitbook/assets/Screenshot 2026-01-30 165322.png" alt=""><figcaption></figcaption></figure>

{% stepper %}
{% step %}
### Frontend: The Security Perimeter

Built with **Next.js 15 (App Router)** and **TypeScript**, the frontend is the only environment where unencrypted data exists.

#### Cryptography Engine

Powered by the native **Web Crypto API** for high-performance AES operations.

Implementation:

* Client-side encryption before upload
* AES-256-GCM algorithm
* PBKDF2 key derivation from wallet signature

#### State Management

Uses **Wagmi/Viem** for real-time synchronization with the Base blockchain state.

Implementation:

* Frontend dependencies: [`package.json`](/broken/pages/5567c356e3b115715c9bdc3ca27d5b3f866234eb)
  * `wagmi`: ^2.19.5
  * `viem`: ^2.45.0
  * `@tanstack/react-query`: ^5.90.20
* Providers configuration: [`providers.tsx`](/broken/pages/5c4a7f85b8559776c434887a9bd7016497283dbe)

#### UX Layer

Integrated with **Privy** for seamless social and wallet login, and **Lottie React** for interactive feedback during payment and encryption phases.

Implementation:

* `@privy-io/react-auth`: ^3.12.0
* `@privy-io/wagmi`: ^4.0.0
* `lottie-react`: ^2.4.1
* Login component: [`PrivyLoginButton.tsx`](/broken/pages/32f442610b875fde3d10b573f9b4ddd976baee44)
{% endstep %}

{% step %}
### Backend: The Orchestration Layer

The backend serves as a **stateless bridge** between the user interface and the decentralized storage network.

#### Runtime

**Express.js 5.2.1** - Modern, fast, minimalist web framework for Node.js.

Implementation:

* Backend: [`Backend_SentryGuard`](/broken/pages/515ef9abe91cc016b2068ec3bbc9d82843b776c7)
* Express version: 5.2.1
* Main server: [`index.js`](/broken/pages/2f4f0bb493051be3876f919e859224405c1bb53d) (213 lines)
* Database migration: [`migrate.js`](/broken/pages/6a4c1193671558aa40f7a1acd7bafc5d3e0a6f59)

API Endpoints:

* `GET /` - Health check
* `GET /api/config` - Contract address configuration
* `GET /api/status/:walletAddress` - x402 status verification
* `POST /api/faucet` - **NEW**: Gasless IDRX minting
* `POST /api/upload` - Upload encrypted documents (with Multer)
* `POST /api/scan` - **NEW**: AI-powered document analysis (Gemini 2.5 Flash)
* `GET /api/documents/:walletAddress` - Retrieve user documents

#### Database

**MySQL** with direct connection pool for storing metadata.

Implementation:

* `mysql2`: ^3.16.2 (promise-based driver)
* Connection pool: 10 concurrent connections
* Tables:
  * `documents` - Stores CID, owner address, filename, category, timestamps
  * `faucet_claims` - Tracks gasless faucet usage (one-time per address)

Schema (from `migrate.js`):

```sql
CREATE TABLE documents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    owner_address VARCHAR(42) NOT NULL,
    cid VARCHAR(255) NOT NULL,
    filename VARCHAR(255) NOT NULL,
    category VARCHAR(50) DEFAULT 'Uncategorized',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX (owner_address)
);

CREATE TABLE faucet_claims (
    id INT AUTO_INCREMENT PRIMARY KEY,
    wallet_address VARCHAR(42) NOT NULL UNIQUE,
    amount DECIMAL(20, 2) DEFAULT 0,
    tx_hash VARCHAR(66) NOT NULL,
    claimed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### File Upload Handler

**Multer 2.0.2** for multipart/form-data handling.

Implementation:

* Memory storage: `multer.memoryStorage()` - Files stored in RAM temporarily
* No disk writes - direct streaming to IPFS
* Supports encrypted binary blobs from frontend

#### IPFS Connector

Utilizes **Axios + Pinata JWT** to manage file pinning operations on the global IPFS network.

Implementation:

* Direct HTTP API calls to Pinata: `https://api.pinata.cloud/pinning/pinFileToIPFS`
* FormData multipart uploads
* Metadata tagging: owner address, category, timestamps
* Returns CID for on-chain anchoring

#### AI Integration (NEW)

**Google Gemini 2.5 Flash** for intelligent document analysis.

Implementation:

* `@google/generative-ai`: ^0.24.1
* Model: `gemini-2.5-flash`
* Capabilities:
  * Document summarization
  * Risk assessment (Low/High)
  * Document type detection
* Response format: JSON (structured output)

Use Case: Scan documents for compliance verification before storage.

#### Smart Contract Integration

**Ethers.js 6.16.0** for blockchain interactions.

Implementation:

* Provider: `JsonRpcProvider` connected to Base Sepolia
* Admin wallet for gasless faucet operations
* Contract interfaces:
  * `SentryGate.sol` - Access verification via `verifyPayment()`
  * `MockIDRX.sol` - Token minting via `mint()`
* x402 middleware: [`checkX402Status()`](/broken/pages/2f4f0bb493051be3876f919e859224405c1bb53d#L65-L76) helper function
{% endstep %}

{% step %}
### Blockchain: The Trust & Economic Layer

The **"Ground Truth"** of SentryGate resides on the Base network.

#### Smart Contract

**SentryGate.sol** written in Solidity 0.8.24.

Implementation: [`SentryGate.sol`](/broken/pages/8f7d667bff6b594e05950d98c48f26e8a2bf7c4b)

Key Features:

* Inherits `Ownable` and `ReentrancyGuard` from OpenZeppelin
* Custom errors for gas efficiency
* Event emissions for transparency

#### x402 Middleware

Implements a transparent, duration-based access control system.

Implementation:

* [`paySubscription()`](/broken/pages/8f7d667bff6b594e05950d98c48f26e8a2bf7c4b#L49-L63) - 30 days for 50,000 IDRX
* [`buyCredits()`](/broken/pages/8f7d667bff6b594e05950d98c48f26e8a2bf7c4b#L65-L71) - 5 uploads for 10,000 IDRX
* [`verifyPayment()`](/broken/pages/8f7d667bff6b594e05950d98c48f26e8a2bf7c4b#L103-L106) - public verification
* [`PaymentRequired()` error](/broken/pages/8f7d667bff6b594e05950d98c48f26e8a2bf7c4b#L18) - enforcement

#### IDRX Integration

Handles the logic for receiving Indonesian Rupiah stablecoins, allowing for predictable and localized protocol revenue.

Implementation:

* Token contract: [`MockIDRX.sol`](/broken/pages/9fe275369883135e39112c0a4aa45c8e596a6a4e)
* 2 decimal places matching Rupiah
* ERC20 standard with faucet function
* Payment token reference: [`paymentToken`](/broken/pages/8f7d667bff6b594e05950d98c48f26e8a2bf7c4b#L10)

#### Integrity Anchoring

Stores document hashes to provide immutable proof of existence.

Implementation:

* [`Document` struct](/broken/pages/8f7d667bff6b594e05950d98c48f26e8a2bf7c4b#L22-L27) with `docHash` and `timestamp`
* [`userDocuments` mapping](/broken/pages/8f7d667bff6b594e05950d98c48f26e8a2bf7c4b#L29)
* [`DocumentAdded` event](/broken/pages/8f7d667bff6b594e05950d98c48f26e8a2bf7c4b#L35)
{% endstep %}
{% endstepper %}

***

## Data Flow Diagram

The relationship between components is defined by the following path.

### User Action → Frontend (Capture + Encrypt)

1. User scans document via [`Scanner.tsx`](/broken/pages/99604bb939f787d4960227d906a73a88d1f11f60)
2. Document encrypted client-side with AES-256-GCM
3. Master key derived from wallet signature (PBKDF2)

### Frontend → Backend API (Encrypted Blob Transfer)

4. Encrypted blob sent to Express `POST /api/upload` endpoint: [`index.js:130-168`](/broken/pages/2f4f0bb493051be3876f919e859224405c1bb53d#L130-L168)
5. Backend validates x402 payment status via [`checkX402Status()`](/broken/pages/2f4f0bb493051be3876f919e859224405c1bb53d#L65-L76)
6. No plaintext data touches backend

### Backend → IPFS/Pinata (Content Pinning)

7. Backend pins encrypted blob to IPFS via Axios POST to Pinata API
8. Receives CID (Content Identifier)
9. Stores CID in MySQL `documents` table with user address mapping

### Blockchain → Frontend (Access Validation via x402)

10. Frontend calls [`verifyPayment()`](/broken/pages/8f7d667bff6b594e05950d98c48f26e8a2bf7c4b#L103-L106)
11. Smart contract returns access status
12. Upload gated by [`addDocument()`](/broken/pages/8f7d667bff6b594e05950d98c48f26e8a2bf7c4b#L74-L100) payment check

***

## Technology Stack Summary

| Layer      | Technology   | Version | Purpose                         |
| ---------- | ------------ | ------- | ------------------------------- |
| Frontend   | Next.js      | 16.1.5  | React framework with App Router |
|            | TypeScript   | ^5      | Type safety                     |
|            | Wagmi        | ^2.19.5 | Ethereum interactions           |
|            | Viem         | ^2.45.0 | Low-level Ethereum library      |
|            | Privy        | ^3.12.0 | Web3 authentication             |
|            | TailwindCSS  | ^4      | Styling                         |
| Backend    | Express.js   | 5.2.1   | Web framework                   |
|            | MySQL2       | ^3.16.2 | Database driver                 |
|            | Multer       | ^2.0.2  | File upload middleware          |
|            | Axios        | ^1.13.4 | HTTP client (Pinata)            |
|            | Ethers.js    | ^6.16.0 | Blockchain interaction          |
|            | Gemini AI    | ^0.24.1 | Document analysis               |
| Blockchain | Solidity     | 0.8.24  | Smart contract language         |
|            | Foundry      | Latest  | Development framework           |
|            | OpenZeppelin | Latest  | Security primitives             |
|            | Base Sepolia | -       | L2 network                      |
| Storage    | IPFS         | -       | Decentralized storage           |
|            | Pinata       | -       | IPFS gateway/pinning            |

***

> Separation of Concerns: Each layer has a clear responsibility, ensuring security through isolation and cryptographic guarantees rather than relying on access control alone.
