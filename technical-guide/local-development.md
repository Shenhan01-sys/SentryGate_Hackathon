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

**Token Contract**: [`MockIDRX.sol`](/broken/pages/2f634951ccfbb28bd2d6dfcaa4f3d190090af9e7)

#### Import IDRX to MetaMask

1. **IDRX Contract Address (Testnet)**: Deploy the contract and get its address
2. **Import to MetaMask**: Click "Import Tokens", enter contract address
3. **Decimals**: 2 (matching Rupiah)
4. **Symbol**: IDRX

#### Getting IDRX

If using `MockIDRX`, you can:

* Call the [`faucet()`](/broken/pages/2f634951ccfbb28bd2d6dfcaa4f3d190090af9e7#L17-L20) function to get 1M IDRX
* Use the "Write Contract" tab on BaseScan
{% endstep %}
{% endstepper %}

***

## Phase 1: Smart Contract Configuration (Foundry)

{% stepper %}
{% step %}
#### 1. Navigate to directory

```bash
cd SC/SentryGuard_SmartContracts
```
{% endstep %}

{% step %}
#### 2. Install dependencies

```bash
forge install
```

**Dependencies** ([foundry.toml](/broken/pages/ba49b11848c8d6dd4c2234f98381e1c8f51ad621)):

* OpenZeppelin Contracts
{% endstep %}

{% step %}
#### 3. Compile contracts

```bash
forge build
```

**Contracts**:

* [`SentryGate.sol`](/broken/pages/4869e85afa8d9ca7b5661354ccf1802cdac368cf)
* [`MockIDRX.sol`](/broken/pages/2f634951ccfbb28bd2d6dfcaa4f3d190090af9e7)
* [`Counter.sol`](/broken/pages/a649a7b4c037c81dba69a36dae1f7ef1dd4e3a4c) (template)
{% endstep %}

{% step %}
#### 4. Run Unit Tests

```bash
forge test -vv
```
{% endstep %}

{% step %}
#### 5. Deploy to Base Sepolia

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
#### 1. Navigate to backend directory

```bash
cd BE_Update/Backend_SentryGuard
```

**Project Structure**: [`Backend_SentryGuard`](/broken/pages/3c627564d35d74af5232b2d2214e36284e4f8abd)
{% endstep %}

{% step %}
#### 2. Install packages

```bash
npm install
```

**Key Dependencies** ([package.json](/broken/pages/71010ba9f7bf25e13e623e4b53c7b3aabdc7def8)):

* Express.js 5.2.1
* MySQL2 ^3.16.2
* Multer ^2.0.2
* Ethers.js ^6.16.0
* Google Gemini AI ^0.24.1
* Axios ^1.13.4
{% endstep %}

{% step %}
#### 3. Configure Environment (`.env`)

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
#### 4. Setup MySQL Database

**Install MySQL (if not already installed)**

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

**Run Database Migration**

```bash
npm run migrate
```

**Migration Script**: [`migrate.js`](/broken/pages/d189efcd577a2767d7aba006e35cf4c9d61d0190)

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
#### 5. Run Server

**Development Mode (with auto-reload)**

```bash
npm run dev
```

**Production Mode**

```bash
npm start
```

**API Endpoints** (Full docs: [API\_Reference.md](/broken/pages/1ec8788dc23602f6a2cae2e177b00b704b4b4ec2)):

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
#### 6. Test Backend Endpoints

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
#### 1. Navigate to frontend directory

```bash
cd FE_Update/fe-SentryGuard
```

**Project Structure**: [`fe-SentryGuard`](/broken/pages/cfa25ae5d31e8e8ccc0f6f795347044e7df46a8f)
{% endstep %}

{% step %}
#### 2. Install packages

```bash
npm install
```

**Key Dependencies** ([package.json](/broken/pages/40c0b60ff230ff8f6ee7e19bb02f561822884248)):

* Next.js 16.1.5
* React 19.2.3
* Privy ^3.12.0
* **Coinbase OnchainKit ^1.1.2** - Base ecosystem integration
* **Google Generative AI ^0.24.1** - Client-side AI analysis
* Wagmi ^2.19.5
* Viem ^2.45.0
* TailwindCSS ^4
* Zod ^4.3.6 - Schema validation
{% endstep %}

{% step %}
#### 3. Configure Environment (`.env.local`)

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
#### 4. Run Application

```bash
npm run dev
```

Frontend will run at: `http://localhost:3000`

**Pages**:

* [`/`](/broken/pages/80bb7f4e9c7d53c61ca464a960a136b6a172471f) - Landing page with AuthGate
* [`/scan`](/broken/pages/0c066dba17c6fcae836219c5d9fa4ff00f7145f3) - Scan documents
* [`/vault`](/broken/pages/5d7727fd31d02364db597baf8dc5e92b71bdd0ce) - View uploaded documents

**Components** (Root-level structure):

* [`components/`](/broken/pages/adf0ff63c618ffd07fb2367031434f9aa58ced3e) - AuthGate, Scanner, VaultGallery, PaywallModal
* [`lib/api/`](/broken/pages/738c8653909a7cdd90936c5cac27bdda4c818c28) - Backend API clients
* [`lib/crypto/`](/broken/pages/8f6359292679619102683462bc662270477cac02) - Encryption utilities
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

{% stepper %}
{% step %}
#### Testing Flow

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
{% endstep %}
{% endstepper %}

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
* **Base Mini Apps**: [base.docs.miniapps](https://docs.base.org/mini-apps/quickstart/migrate-existing-apps)

***

{% hint style="info" %}
Inclusive Tip: SentryGate is a community project. If you find any confusing steps, please:

* Open an **Issue** on the GitHub repository
* Contact us on **Discord/Telegram** group
* Send an email to the development team
{% endhint %}

**Happy Building! 🚀**
