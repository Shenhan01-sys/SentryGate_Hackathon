---
icon: box-arrow-down-arrow-up
---

# SmartContracts

The **SentryGate smart contract** is the decentralized core of the ecosystem. It serves as the primary enforcement layer for the **x402 Protocol**, managing localized payments via IDRX and providing immutable access control for the digital vault.

Developed using the **Foundry framework** and written in **Solidity 0.8.24**, the contract is optimized for the Base network, ensuring minimal gas consumption for high-frequency access checks.

**Contract File**: [`SentryGate.sol`](/broken/pages/8f7d667bff6b594e05950d98c48f26e8a2bf7c4b)

## Architecture & Core Logic

The contract operates on a **"Gatekeeper" model**. It acts as a bridge between the user's financial commitment and their data sovereignty.

### The x402 Middleware Flow

{% stepper %}
{% step %}
### Approval

User grants allowance to SentryGate to spend IDRX.

Example:

```solidity
// Step 1: User approves IDRX token
IERC20(idrxToken).approve(sentryGateAddress, amount);
```
{% endstep %}

{% step %}
### Commitment

Calling payment functions pulls tokens and updates the on-chain expiry.

Example:

```solidity
// Step 2: User pays for subscription or credits
SentryGate.paySubscription(); // or buyCredits()
```
{% endstep %}

{% step %}
### Verification

Frontend/Backend query access verification to unlock vault features.

Example:

```solidity
// Step 3: App checks access
(bool isActive, uint256 expiry, uint256 credits) = SentryGate.verifyPayment(userAddress);
```
{% endstep %}
{% endstepper %}

## State Management

The contract maintains the following state variables on the Base network:

| Variable        | Type                             | Visibility | Description                                       |
| --------------- | -------------------------------- | ---------- | ------------------------------------------------- |
| `paymentToken`  | `IERC20`                         | `public`   | The address of the IDRX ERC-20 token contract     |
| `feeRecipient`  | `address`                        | `public`   | Address receiving payment fees                    |
| `subPrice`      | `uint256`                        | `public`   | Cost in IDRX for subscription (50,000 \* 10^2)    |
| `creditPrice`   | `uint256`                        | `public`   | Cost in IDRX for credits (10,000 \* 10^2)         |
| `subExpiry`     | `mapping(address => uint256)`    | `public`   | Unix timestamp when each user's subscription ends |
| `uploadCredits` | `mapping(address => uint256)`    | `public`   | Number of upload credits per user                 |
| `userDocuments` | `mapping(address => Document[])` | `private`  | Array of documents per user                       |

**Implementation References**:

* [`paymentToken`](/broken/pages/8f7d667bff6b594e05950d98c48f26e8a2bf7c4b#L10)
* [`feeRecipient`](/broken/pages/8f7d667bff6b594e05950d98c48f26e8a2bf7c4b#L11)
* [`subPrice` and `creditPrice`](/broken/pages/8f7d667bff6b594e05950d98c48f26e8a2bf7c4b#L13-L14)
* Mappings: [Lines 29-31](/broken/pages/8f7d667bff6b594e05950d98c48f26e8a2bf7c4b#L29-L31)

## Function Reference

### External Write Functions

#### `paySubscription()`

The primary endpoint for users to activate or renew their vault subscription.

Signature:

```solidity
function paySubscription() external nonReentrant
```

Implementation: [Lines 49-63](/broken/pages/8f7d667bff6b594e05950d98c48f26e8a2bf7c4b#L49-L63)

Requirements:

* User must have called `approve()` on the IDRX contract for `subPrice` amount
* Sufficient IDRX balance

Technical Logic:

1. Transfer `subPrice` (50,000 IDRX) from `msg.sender` to `feeRecipient`
2. If `subExpiry[msg.sender] < block.timestamp`: new expiry is `block.timestamp + 30 days`
3. If current session is active: `30 days` is added to the existing expiry (Stacking)

Events: `PaymentSuccess(address indexed user, string pType, uint256 timestamp)`

Reverts: `PaymentFailed()` if token transfer fails

#### `buyCredits()`

Purchase upload credits for pay-per-use model.

Signature:

```solidity
function buyCredits() external nonReentrant
```

Implementation: [Lines 65-71](/broken/pages/8f7d667bff6b594e05950d98c48f26e8a2bf7c4b#L65-L71)

Requirements:

* User must have approved `creditPrice` amount
* Sufficient IDRX balance

Technical Logic:

1. Transfer `creditPrice` (10,000 IDRX) from `msg.sender` to `feeRecipient`
2. Add 5 upload credits: `uploadCredits[msg.sender] += 5`

Events: `PaymentSuccess(address indexed user, string pType, uint256 timestamp)`

#### `addDocument()`

Core function to add a document to the vault. **Requires active payment**.

Signature:

```solidity
function addDocument(string calldata _cid, string calldata _hash, string calldata _encName) external
```

Implementation: [Lines 74-100](/broken/pages/8f7d667bff6b594e05950d98c48f26e8a2bf7c4b#L74-L100)

Parameters:

| Parameter   | Type     | Description                  |
| ----------- | -------- | ---------------------------- |
| `_cid`      | `string` | IPFS Content Identifier      |
| `_hash`     | `string` | SHA-256 hash of the document |
| `_enc Name` | `string` | Encrypted document name      |

Access Control Logic (x402):

```solidity
bool isSubscribed = block.timestamp < subExpiry[msg.sender];
bool hasCredits = uploadCredits[msg.sender] > 0;

if (isSubscribed) {
    // Pass via Subscription
} else if (hasCredits) {
    // Pass via Credits (deduct 1)
    uploadCredits[msg.sender] -= 1;
} else {
    // FAIL: Revert with Custom Error
    revert PaymentRequired();
}
```

Reverts:

* `InvalidCID()` if `_cid` is empty
* `PaymentRequired()` if no active subscription or credits

Events: `DocumentAdded(address indexed user, string cid)`

### View / Read Functions

#### `verifyPayment()`

The main validation endpoint used by frontend and backend.

Signature:

```solidity
function verifyPayment(address user) external view returns (bool isActive, uint256 expiry, uint256 credits)
```

Implementation: [Lines 103-106](/broken/pages/8f7d667bff6b594e05950d98c48f26e8a2bf7c4b#L103-L106)

Returns:

| Field      | Type      | Description                                        |
| ---------- | --------- | -------------------------------------------------- |
| `isActive` | `bool`    | `true` if subscription active OR credits available |
| `expiry`   | `uint256` | Unix timestamp of subscription expiration          |
| `credits`  | `uint256` | Number of remaining upload credits                 |

Logic:

```solidity
isActive = (block.timestamp < subExpiry[user]) || (uploadCredits[user] > 0);
```

#### `getMyDocs()`

Retrieve all documents for the caller.

Signature:

```solidity
function getMyDocs() external view returns (Document[] memory)
```

Implementation: [Lines 108-110](/broken/pages/8f7d667bff6b594e05950d98c48f26e8a2bf7c4b#L108-L110)

Returns: Array of `Document` structs for `msg.sender`

## &#x20;Events & Errors

### Events

**`PaymentSuccess`** [Line 34](/broken/pages/8f7d667bff6b594e05950d98c48f26e8a2bf7c4b#L34):

```solidity
event PaymentSuccess(address indexed user, string pType, uint256 timestamp);
```

Logged every time a payment is confirmed (either subscription or credits).

**`DocumentAdded`** [Line 35](/broken/pages/8f7d667bff6b594e05950d98c48f26e8a2bf7c4b#L35):

```solidity
event DocumentAdded(address indexed user, string cid);
```

Logged when a document is successfully added to the vault.

### Custom Errors

Implementation: [Lines 16-19](/broken/pages/8f7d667bff6b594e05950d98c48f26e8a2bf7c4b#L16-L19)

| Error               | Condition                                    |
| ------------------- | -------------------------------------------- |
| `PaymentFailed()`   | ERC-20 token transfer fails                  |
| `PaymentRequired()` | No active subscription and no upload credits |
| `InvalidCID()`      | Empty CID provided to `addDocument()`        |

## Security & Integrity

### 1. Reentrancy Protection

All token-handling functions use `nonReentrant` modifier.

Implementation:

* Contract inherits [`ReentrancyGuard`](/broken/pages/8f7d667bff6b594e05950d98c48f26e8a2bf7c4b#L8)
* Applied to:
  * [`paySubscription()`](/broken/pages/8f7d667bff6b594e05950d98c48f26e8a2bf7c4b#L49)
  * [`buyCredits()`](/broken/pages/8f7d667bff6b594e05950d98c48f26e8a2bf7c4b#L65)

### 2. Access Control

Critical logic is protected by OpenZeppelin's `Ownable`.

Implementation:

* Contract inherits [`Ownable`](/broken/pages/8f7d667bff6b594e05950d98c48f26e8a2bf7c4b#L8)
* Owner set in constructor: [`Ownable(msg.sender)`](/broken/pages/8f7d667bff6b594e05950d98c48f26e8a2bf7c4b#L37)

### 3. Transparency

Logic is based on `block.timestamp`, ensuring deterministic outcomes that can be verified by anyone.

### 4. Gas Efficiency

* Uses custom errors instead of string reverts (saves \~50 gas per error)
* Efficient storage layout
* View functions for read operations

## Data Structures

### `Document` Struct

Implementation: [Lines 22-27](/broken/pages/8f7d667bff6b594e05950d98c48f26e8a2bf7c4b#L22-L27)

```solidity
struct Document {
    string cid;            // IPFS Content Identifier
    string docHash;        // SHA-256 integrity hash
    string encryptedName;  // Encrypted document name
    uint256 timestamp;     // Block timestamp of upload
}
```

## Contract Deployment

### Dependencies

**OpenZeppelin Contracts**:

* [`Ownable`](/broken/pages/8f7d667bff6b594e05950d98c48f26e8a2bf7c4b#L4) - Access control
* [`IERC20`](/broken/pages/8f7d667bff6b594e05950d98c48f26e8a2bf7c4b#L5) - Token interface
* [`ReentrancyGuard`](/broken/pages/8f7d667bff6b594e05950d98c48f26e8a2bf7c4b#L6) - Security

### Constructor Parameters

```solidity
constructor(address _token, address _recipient) Ownable(msg.sender)
```

* `_token`: Address of IDRX token contract
* `_recipient`: Address receiving payment fees

### Network

* **Base Sepolia Testnet** (Chain ID: 84532)
* Optimized for Base L2 efficiency

## Testing

**Framework**: Foundry

**Test Commands**:

```bash
# Build
forge build

# Test
forge test -vv

# Coverage
forge coverage
```

**Test File**: [`Counter.t.sol`](/broken/pages/204a5f4b808feeff847e9ddbb515899b1388fc50)

> **Security First**: Every function is designed with security and gas efficiency in mind, ensuring that the x402 protocol operates reliably and affordably on Base.
