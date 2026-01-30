---
icon: code
---

# Local Development

Welcome to the **SentryGate** local development guide! This guide is designed to help you run the entire SentryGate ecosystem—from Smart Contracts to the User Interface—smoothly on your local machine.

We are committed to making this project inclusive for all developers, so feel free to ask if you encounter any obstacles.

## System Prerequisites

Before starting, ensure your machine has the following software installed:

### Required Software

| Software     | Version | Link                                                                     | Purpose                              |
| ------------ | ------- | ------------------------------------------------------------------------ | ------------------------------------ |
| **Node.js**  | v18.x+  | [Download](https://nodejs.org/)                                          | JavaScript runtime (use LTS version) |
| **Git**      | Latest  | [Download](https://git-scm.com/)                                         | Version control                      |
| **Foundry**  | Latest  | [Install Guide](https://book.getfoundry.sh/getting-started/installation) | Smart contract development           |
| **MySQL**    | Latest  | [Download](https://dev.mysql.com/downloads/mysql/)                       | Database for metadata                |
| **MetaMask** | Latest  | [Extension](https://metamask.io/)                                        | Web3 wallet                          |

## Wallet & Network Configuration

Since SentryGate runs on the **Base Sepolia** network, you need to configure your MetaMask first.

{% stepper %}
{% step %}
### Add Base Sepolia Network

If not already added, manually add the network in MetaMask:

| Field               | Value                          |
| ------------------- | ------------------------------ |
| **Network Name**    | Base Sepolia                   |
| **RPC URL**         | `https://sepolia.base.org`     |
| **Chain ID**        | `84532`                        |
| **Currency Symbol** | ETH                            |
| **Block Explorer**  | `https://sepolia.basescan.org` |
{% endstep %}

{% step %}
### Get Testnet ETH

You need ETH balance to pay gas fees. Use the following faucets:

* [Base Faucet (Official)](https://faucet.quicknode.com/base/sepolia)
* [Alchemy Base Sepolia Faucet](https://www.alchemy.com/faucets/base-sepolia)
{% endstep %}

{% step %}
### Configure IDRX Token

SentryGate uses **IDRX** as the vault payment currency.

**Token Contract**: [`MockIDRX.sol`](/broken/pages/976d2ffeee2e86f47bb727dfc6096077a91d8cb3)

#### Import IDRX to MetaMask

* **IDRX Contract Address (Testnet)**: Deploy the contract and get its address
* **Import to MetaMask**: Click "Import Tokens", enter contract address
* **Decimals**: 2 (matching Rupiah)
* **Symbol**: IDRX

#### Getting IDRX

If using `MockIDRX`, you can:

* Call the [`faucet()`](/broken/pages/976d2ffeee2e86f47bb727dfc6096077a91d8cb3#L17-L20) function to get 1M IDRX
* Use the "Write Contract" tab on BaseScan
{% endstep %}
{% endstepper %}

***

## Phase 1: Smart Contract Configuration (Foundry)

{% stepper %}
{% step %}
### Navigate to directory

```bash
cd SC/SentryGuard_SmartContracts
```
{% endstep %}

{% step %}
### Install dependencies

```bash
forge install
```

**Dependencies** ([foundry.toml](/broken/pages/73726b9f2ce11820e48c14b60eac330edf42a694)):

* OpenZeppelin Contracts
{% endstep %}

{% step %}
### Compile contracts

```bash
forge build
```

**Contracts**:

* [`SentryGate.sol`](/broken/pages/ad38ed5c18808e117da1858db3150b6d07300831)
* [`MockIDRX.sol`](/broken/pages/976d2ffeee2e86f47bb727dfc6096077a91d8cb3)
* [`Counter.sol`](/broken/pages/3403dd9054e832f364f2b8cfa1c2c36a0396bc42) (template)
{% endstep %}

{% step %}
### Run Unit Tests

```bash
forge test -vv
```
{% endstep %}

{% step %}
### Deploy to Base Sepolia

```bash
# Set environment variables
export PRIVATE_KEY=your_private_key
export RPC_URL=https://sepolia.base.org

# Deploy MockIDRX first
forge create --rpc-url $RPC_URL --private-key $PRIVATE_KEY src/MockIDRX.sol:MockIDRX

# Deploy SentryGate
forge create --rpc-url $RPC_URL --private-key $PRIVATE_KEY \
  --constructor-args <IDRX_ADDRESS> <FEE_RECIPIENT_ADDRESS> \
  src/SentryGate.sol:SentryGate
```

**Save the deployed contract addresses for frontend configuration!**
{% endstep %}
{% endstepper %}

***

## Phase 2: Backend Configuration (Express.js & MySQL)

{% stepper %}
{% step %}
### Navigate to backend directory

```bash
cd BE_Update/Backend_SentryGuard
```

**Project Structure**: [`Backend_SentryGuard`](/broken/pages/68623df7e5f034fc62c35acac149f58873b1fc05)
{% endstep %}

{% step %}
### Install packages

```bash
npm install
```

**Key Dependencies** ([package.json](/broken/pages/6a41265d2901aeab62ea5fb8c1982a6292ef4c7c)):

* Express.js 5.2.1
* MySQL2 ^3.16.2
* Multer ^2.0.2
* Ethers.js ^6.16.0
* Google Gemini AI ^0.24.1
* Axios ^1.13.4
{% endstep %}

{% step %}
### Configure Environment (`.env`)

Create `.env` file:

```env
# Server
PORT=5000

# AI (Gemini)
GEMINI_API_KEY="your_gemini_api_key"

# Pinata (IPFS)
PINATA_JWT="your_pinata_jwt_token"

# Blockchain (Base Sepolia)
RPC_URL="https://sepolia.base.org"
SENTRY_GUARD_ADDRESS="deployed_sentrygate_address"
PRIVATE_KEY_ADMIN="your_admin_private_key_for_faucet"
IDRX_TOKEN_ADDRESS="deployed_idrx_address"

# Database (MySQL)
DB_HOST="localhost"
DB_USER="root"
DB_PASSWORD="your_mysql_password"
DB_NAME="gatesentry"
```

**Get Gemini API Key**: [Google AI Studio](https://makersuite.google.com/app/apikey)\
**Get Pinata JWT**: [Pinata Dashboard](https://app.pinata.cloud/developers/api-keys)
{% endstep %}

{% step %}
### Setup MySQL Database

#### Install MySQL (if not already installed)

**Windows**:

* Download from [MySQL Downloads](https://dev.mysql.com/downloads/mysql/)
* Install MySQL Server
* Set root password

**macOS**:

```bash
brew install mysql
brew services start mysql
```

**Linux**:

```bash
sudo apt-get install mysql-server
sudo systemctl start mysql
```

#### Run Database Migration

```bash
npm run migrate
```

**Migration Script**: [`migrate.js`](/broken/pages/e6047c9b495603d1b775ec4ee39afef5e9c919ce)

The script will:

* Create database `gatesentry` (if it doesn't exist)
* Create table `documents` - for vault metadata
* Create table `faucet_claims` - for tracking gasless faucet usage

**Expected Output**:

```
🐘 Starting Database Migration...
✅ Database 'gatesentry' ready.
✅ Table 'documents' ready.
✅ Table 'faucet_claims' ready.
🎉 MIGRATION SUCCESS! SentryGate database is ready to use.
```
{% endstep %}

{% step %}
### Run Server

#### Development Mode (with auto-reload)

```bash
npm run dev
```

#### Production Mode

```bash
npm start
```

**API Endpoints** (Full docs: [API\_Reference.md](/broken/pages/2fb42ace94e543e94c2bc1cbfaa12544e24307af)):

* `GET /` - Health check
* `GET /api/config` - Contract address configuration
* `GET /api/status/:walletAddress` - x402 status verification
* `POST /api/faucet` - **NEW**: Gasless IDRX minting
* `POST /api/upload` - Upload encrypted documents
* `POST /api/scan` - **NEW**: AI document analysis
* `GET /api/documents/:walletAddress` - Retrieve user documents

Server will run at: `http://localhost:5000`
{% endstep %}

{% step %}
### Test Backend Endpoints

```bash
# Test health check
curl http://localhost:5000/

# Test config
curl http://localhost:5000/api/config

# Test faucet (replace with your address)
curl -X POST http://localhost:5000/api/faucet \
  -H "Content-Type: application/json" \
  -d '{"walletAddress":"0xYourAddress"}'
```
{% endstep %}
{% endstepper %}

***

## Phase 3: Frontend Configuration (Next.js & Privy)

{% stepper %}
{% step %}
### Navigate to frontend directory

```bash
cd FE/Secure-vault-fe
```

**Project Structure**: [`Secure-vault-fe`](/broken/pages/a9d1930c1b70639bdcb14dae73fa92deae9b4beb)
{% endstep %}

{% step %}
### Install packages

```bash
npm install
```

**Key Dependencies** ([package.json](/broken/pages/a8858848691843f81ba1384eabd216a1849a368a)):

* Next.js 16.1.5
* React 19.2.3
* Privy ^3.12.0
* Wagmi ^2.19.5
* Viem ^2.45.0
* TailwindCSS ^4
{% endstep %}

{% step %}
### Configure Environment (`.env.local`)

Create `.env.local` file:

```env
# Privy Authentication
NEXT_PUBLIC_PRIVY_APP_ID="your_privy_app_id_from_dashboard"

# Smart Contracts
NEXT_PUBLIC_CONTRACT_ADDRESS="deployed_sentrygate_address"
NEXT_PUBLIC_IDRX_ADDRESS="deployed_idrx_address"

# Backend API
NEXT_PUBLIC_API_URL="http://localhost:5000"

# Network
NEXT_PUBLIC_CHAIN_ID="84532"
NEXT_PUBLIC_RPC_URL="https://sepolia.base.org"
```

**Get Privy App ID**: [Privy Dashboard](https://dashboard.privy.io/)
{% endstep %}

{% step %}
### Run Application

```bash
npm run dev
```

Frontend will run at: `http://localhost:3000`

**Pages**:

* [`/`](/broken/pages/4b2ede33ea340aa0cfa3eb7eb8da4741cd61932f) - Landing page with AuthGate
* [`/scan`](/broken/pages/45f5b481ec86cb3c85d96bb3b4bd0c671ac5b82c) - Scan documents
* [`/vault`](/broken/pages/c71ed465b3a9a2ddf7f35a485f11da8e0eb22039) - View uploaded documents
{% endstep %}
{% endstepper %}

***

## Final Verification

### Checklist

* [ ] **MetaMask**: Connected to Base Sepolia
* [ ] **ETH Balance**: Has testnet ETH for gas fees
* [ ] **IDRX Token**: Token imported and visible in MetaMask
* [ ] **Smart Contracts**: Deployed and addresses saved
* [ ] **MySQL Database**: Migration completed successfully
* [ ] **Backend**: Running at `http://localhost:5000`
* [ ] **Frontend**: Running at `http://localhost:3000`

### Testing Flow

1. Open `http://localhost:3000`
2. Ensure MetaMask is on **Base Sepolia** network
3. Login using Privy (wallet or social)
4. **Test Gasless Faucet**: Claim free IDRX via backend faucet endpoint
5. Check IDRX balance in MetaMask (should show 1,000,000 IDRX)
6. Make payment on smart contract (subscription or buy credits)
7. **Test AI Scan**: Upload document and try AI analysis feature
8. Scan document and upload to vault
9. Verify transaction in MetaMask
10. Check documents in `/vault`

***

## Troubleshooting

<details>

<summary>Insufficient ETH Balance</summary>

**Problem**: Transaction fails due to insufficient gas

**Solution**:

* Use a valid Base Sepolia faucet
* Minimum \~0.01 ETH required for multiple transactions
* Check balance in MetaMask

</details>

<details>

<summary>IDRX Not Detected</summary>

**Problem**: IDRX token doesn't appear in MetaMask

**Solution**:

* Ensure IDRX contract address in `.env.local` is correct
* Re-import token with the correct address
* Check decimals = 2 (not 18)
* Call `faucet()` function to get IDRX

</details>

<details>

<summary>MySQL Connection Error</summary>

**Problem**: Cannot connect to MySQL database

**Solution**:

```bash
# Check if MySQL is running
# Windows
net start MySQL80

# macOS/Linux
sudo systemctl status mysql

# Test connection
mysql -u root -p

# Re-run migration if connection is successful
npm run migrate
```

</details>

<details>

<summary>Port Already in Use</summary>

**Problem**: Port 3000 or 5000 already in use

**Solution**:

```bash
# Frontend - change port
PORT=3002 npm run dev

# Backend - change port  
PORT=5003 npm run dev
```

</details>

<details>

<summary>Privy Login Fails</summary>

**Problem**: Privy authentication error

**Solution**:

* Check `NEXT_PUBLIC_PRIVY_APP_ID` in `.env.local`
* Ensure Base Sepolia is configured in Privy Dashboard
* Clear browser cache and cookies
* Try another wallet or social login

</details>

<details>

<summary>Transaction Reverts</summary>

**Problem**: Smart contract transaction fails

**Solution**:

* Check IDRX balance - must approve first
* Call `IDRX.approve(SentryGate_Address, amount)` before payment
* Ensure connected wallet matches the one in MetaMask
* Verify contract address is correct

</details>

***

## Additional Resources

* **Foundry Book**: [book.getfoundry.sh](https://book.getfoundry.sh/)
* **Privy Docs**: [docs.privy.io](https://docs.privy.io/)
* **Wagmi Docs**: [wagmi.sh](https://wagmi.sh/)
* **Base Docs**: [docs.base.org](https://docs.base.org/)
* **IPFS Docs**: [docs.ipfs.tech](https://docs.ipfs.tech/)
* **Pinata Docs**: [docs.pinata.cloud](https://docs.pinata.cloud/)

***



Happy Building! 🚀
