---
icon: diagram-project
---

# API Reference

Complete documentation of all API endpoints provided by the SentryGate Express.js backend server.

**Backend Implementation**: [`index.js`](/broken/pages/b1724c0a8483ef82a35b32509fcfc9371588b5c1)

**Server Port**: 5000 (configurable via `PORT` env variable)

***

## Base URL

```
http://localhost:5000
```

For production: Replace with deployed backend URL

***

## Endpoints Overview

| Method | Endpoint                        | Auth    | Description                  |
| ------ | ------------------------------- | ------- | ---------------------------- |
| GET    | `/`                             | No      | Health check                 |
| GET    | `/api/config`                   | No      | Get contract addresses       |
| GET    | `/api/status/:walletAddress`    | No      | Check x402 payment status    |
| POST   | `/api/faucet`                   | No      | Claim gasless IDRX tokens    |
| POST   | `/api/upload`                   | **Yes** | Upload encrypted document    |
| POST   | `/api/scan`                     | **Yes** | AI-powered document analysis |
| GET    | `/api/documents/:walletAddress` | No      | Retrieve user's documents    |

**Auth**: Requires active x402 subscription or credits (verified via smart contract)

***

## 1. Health Check

Check if the backend server is running.

### Request

```http
GET /
```

### Response

```json
{
  "message": "🛡️ SentryGate API is Running!",
  "version": "1.0.0"
}
```

**Implementation**: [`index.js:83-85`](/broken/pages/b1724c0a8483ef82a35b32509fcfc9371588b5c1#L83-L85)

***

## 2. Get Configuration

Retrieve deployed smart contract addresses for frontend initialization.

### Request

```http
GET /api/config
```

### Response

```json
{
  "contractAddress": "0x80c7776766ec0Fb3bb3e9277F6f5Fe264Cb07Cbe"
}
```

**Implementation**: [`index.js:88-90`](/broken/pages/b1724c0a8483ef82a35b32509fcfc9371588b5c1#L88-L90)

**Use Case**: Frontend fetches this on load to connect to the correct SentryGate contract.

***

## 3. Check x402 Status

Verify if a wallet has active subscription or upload credits.

### Request

```http
GET /api/status/:walletAddress
```

**Parameters**:

* `walletAddress` (path) - Ethereum address (0x...)

### Example

```bash
curl http://localhost:5000/api/status/0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb
```

### Response

**Active**:

```json
{
  "status": "active"
}
```

**Inactive**:

```json
{
  "status": "inactive"
}
```

**Implementation**: [`index.js:93-97`](/broken/pages/b1724c0a8483ef82a35b32509fcfc9371588b5c1#L93-L97)

**Logic**: Calls [`checkX402Status()`](/broken/pages/b1724c0a8483ef82a35b32509fcfc9371588b5c1#L65-L76) which queries `sentryContract.verifyPayment(walletAddress)`

***

## 4. Gasless Faucet 🆕

Mint IDRX tokens directly to user's wallet (testnet only). Limited to **one claim per address**.

### Request

```http
POST /api/faucet
Content-Type: application/json

{
  "walletAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
}
```

### Response

**Success**:

```json
{
  "success": true,
  "tx_hash": "0xabc123..."
}
```

**Already Claimed**:

```json
{
  "error": "Sudah pernah claim!"
}
```

**Implementation**: [`index.js:100-127`](/broken/pages/b1724c0a8483ef82a35b32509fcfc9371588b5c1#L100-L127)

**Details**:

* Amount: 1,000,000 IDRX (1 million tokens with 2 decimals)
* Uses admin wallet to mint tokens gaslessly
* Stores claim in `faucet_claims` table to prevent double-claiming
* Transaction hash recorded for transparency

***

## 5. Upload Document

Upload encrypted document to IPFS and store metadata in database.

**⚠️ Requires x402 authorization** (active subscription OR upload credits)

### Request

```http
POST /api/upload
Content-Type: multipart/form-data

{
  "document": <encrypted_file_blob>,
  "walletAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  "category": "KTP" // optional
}
```

### Example (JavaScript)

```javascript
const formData = new FormData();
formData.append('document', encryptedBlob, 'document.enc');
formData.append('walletAddress', userAddress);
formData.append('category', 'Passport');

const response = await fetch('http://localhost:5000/api/upload', {
  method: 'POST',
  body: formData
});
```

### Response

**Success**:

```json
{
  "success": true,
  "cid": "QmXyZ..."
}
```

**Payment Required**:

```json
{
  "error": "Payment Required"
}
```

_HTTP Status: 402_

**Implementation**: [`index.js:130-168`](/broken/pages/b1724c0a8483ef82a35b32509fcfc9371588b5c1#L130-L168)

Flow:

{% stepper %}
{% step %}
### Validate x402 status

Call the on-chain verification via [`checkX402Status()`](/broken/pages/b1724c0a8483ef82a35b32509fcfc9371588b5c1#L65-L76). If not authorized, return 402 Payment Required.
{% endstep %}

{% step %}
### Upload to IPFS (Pinata)

Send the file as FormData to Pinata via Axios. Receive CID from Pinata.
{% endstep %}

{% step %}
### Store metadata in DB

Insert a record into MySQL `documents` table with owner\_address, cid, filename, category.
{% endstep %}

{% step %}
### Return CID

Respond to the frontend with the CID and success status.
{% endstep %}
{% endstepper %}

**Database Record**:

```sql
INSERT INTO documents (owner_address, cid, filename, category) 
VALUES ('0x742d...', 'QmXyZ...', 'document.enc', 'KTP');
```

***

## 6. AI Document Scan 🆕

Analyze document using Google Gemini 2.5 Flash AI for compliance and risk assessment.

**⚠️ Requires x402 authorization**

### Request

```http
POST /api/scan
Content-Type: multipart/form-data

{
  "document": <file_blob>,
  "walletAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
}
```

### Response

**Success**:

```json
{
  "success": true,
  "data": {
    "summary": "Kartu Tanda Penduduk (KTP) Indonesia yang valid",
    "risk": "Low",
    "type": "National ID Card"
  }
}
```

**Implementation**: [`index.js:171-196`](/broken/pages/b1724c0a8483ef82a35b32509fcfc9371588b5c1#L171-L196)

**AI Model**: `gemini-2.5-flash` with JSON response format

**Prompt**:

```
Analisis dokumen ini. Output JSON valid: 
{ 
  "summary": "...", 
  "risk": "Low/High", 
  "type": "..." 
}
```

**Use Case**: Pre-upload verification to ensure document quality and detect sensitive information before encryption and storage.

***

## 7. Get Documents

Retrieve all documents uploaded by a specific wallet address.

### Request

```http
GET /api/documents/:walletAddress
```

**Parameters**:

* `walletAddress` (path) - Ethereum address (0x...)

### Example

```bash
curl http://localhost:5000/api/documents/0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb
```

### Response

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "owner_address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
      "cid": "QmXyZ123...",
      "filename": "document.enc",
      "category": "KTP",
      "created_at": "2026-01-30T14:30:00.000Z"
    },
    {
      "id": 2,
      "owner_address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
      "cid": "QmAbc456...",
      "filename": "ijazah.enc",
      "category": "Education",
      "created_at": "2026-01-30T15:45:00.000Z"
    }
  ]
}
```

**Implementation**: [`index.js:199-209`](/broken/pages/b1724c0a8483ef82a35b32509fcfc9371588b5c1#L199-L209)

**SQL Query**:

```sql
SELECT * FROM documents 
WHERE owner_address = ? 
ORDER BY created_at DESC
```

***

## Error Responses

<details>

<summary>Common error responses</summary>

#### 400 Bad Request

```json
{
  "error": "No Address"
}
```

#### 402 Payment Required

```json
{
  "error": "Payment Required"
}
```

#### 403 Forbidden

```json
{
  "error": "Sudah pernah claim!"
}
```

#### 500 Internal Server Error

```json
{
  "error": "Upload Failed" // or "AI Failed", "DB Error", "Faucet Failed"
}
```

</details>

***

## Authentication & Authorization

### x402 Middleware

The backend implements a **Gatekeeper pattern** for restricted endpoints.

**Protected Endpoints**:

* `POST /api/upload`
* `POST /api/scan`

**Verification Logic** [`checkX402Status()`](/broken/pages/b1724c0a8483ef82a35b32509fcfc9371588b5c1#L65-L76):

```javascript
async function checkX402Status(walletAddress) {
    if (!ethers.isAddress(walletAddress)) return { isValid: false };
    
    const result = await sentryContract.verifyPayment(walletAddress);
    // result[0] = isActive (boolean)
    return { isValid: result[0] };
}
```

**On-Chain Verification**:

* Calls `SentryGate.verifyPayment(address)` on Base Sepolia
* Returns `(bool isActive, uint256 expiry, uint256 credits)`
* `isActive = true` if `timestamp < expiry OR credits > 0`

***

## Database Schema

### `documents` Table

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
```

### `faucet_claims` Table

```sql
CREATE TABLE faucet_claims (
    id INT AUTO_INCREMENT PRIMARY KEY,
    wallet_address VARCHAR(42) NOT NULL UNIQUE,
    amount DECIMAL(20, 2) DEFAULT 0,
    tx_hash VARCHAR(66) NOT NULL,
    claimed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Migration**: Run [`migrate.js`](/broken/pages/d189efcd577a2767d7aba006e35cf4c9d61d0190)

***

## Environment Variables

Required in `.env` file:

```env
# Server
PORT=5000

# AI
GEMINI_API_KEY=your_gemini_api_key

# IPFS
PINATA_JWT=your_pinata_jwt_token

# Blockchain (Base Sepolia)
RPC_URL=https://sepolia.base.org
SENTRY_GUARD_ADDRESS=0x80c7776766ec0Fb3bb3e9277F6f5Fe264Cb07Cbe
PRIVATE_KEY_ADMIN=your_admin_private_key
IDRX_TOKEN_ADDRESS=0xAe945f3fE3d14DAa788cBEa29343c8Cf33267003

# Database (MySQL)
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=gatesentry
```

***

## Running the Server

```bash
# Install dependencies
npm install

# Run database migration
npm run migrate

# Start development server (with nodemon)
npm run dev

# Start production server
npm start
```

**Dependencies** ([`package.json`](/broken/pages/71010ba9f7bf25e13e623e4b53c7b3aabdc7def8)):

* express: ^5.2.1
* cors: ^2.8.6
* multer: ^2.0.2
* dotenv: ^17.2.3
* ethers: ^6.16.0
* @google/generative-ai: ^0.24.1
* axios: ^1.13.4
* mysql2: ^3.16.2

***

## Testing Examples

### Test Health Check

```bash
curl http://localhost:5000/
```

### Test Faucet

```bash
curl -X POST http://localhost:5000/api/faucet \
  -H "Content-Type: application/json" \
  -d '{"walletAddress":"0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"}'
```

### Test Status Check

```bash
curl http://localhost:5000/api/status/0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb
```

### Test Upload (with file)

```bash
curl -X POST http://localhost:5000/api/upload \
  -F "document=@encrypted.bin" \
  -F "walletAddress=0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb" \
  -F "category=Test"
```

***

## Security Notes

1. **No Encryption Keys Stored**: Backend never sees decryption keys
2. **x402 Verification**: Every upload/scan validated against blockchain
3. **One-Time Faucet**: Prevents abuse via database uniqueness constraint
4. **CORS Enabled**: Configure allowed origins for production
5. **Memory-Only Upload**: Files never touch disk, streamed directly to IPFS
6. **Admin Wallet**: Used only for gasless faucet, not for user operations

***

> **For Frontend Integration**: Use these endpoints to build the SentryGate user interface. All sensitive operations require valid x402 payment status from smart contract.
