---
icon: star
---

# Core Features

{% stepper %}
{% step %}
### Secure Onchain Digital Vault

Fitur utama SentryGate adalah **brankas digital pribadi** yang berfungsi untuk menyimpan metadata dan bukti kepemilikan dokumen penting di jaringan Base.

#### Identity Anchoring

Setiap dokumen yang diunggah dikaitkan secara permanen dengan alamat dompet pengguna, menciptakan bukti kepemilikan yang tidak dapat dibantah.

Implementation:

* [`userDocuments` mapping](/broken/pages/dd6f1be42d4c58089722ac8567ca8e3b7848353c#L29) - `mapping(address => Document[])` links documents to wallet address
* [`getMyDocs()` function](/broken/pages/dd6f1be42d4c58089722ac8567ca8e3b7848353c#L108-L110) - returns all documents for `msg.sender`

#### Metadata Integrity

Metadata dokumen (nama, kategori, timestamp) dicatat di blockchain untuk memastikan jejak sejarah dokumen tetap utuh dan transparan.

Implementation:

* [`Document` struct](/broken/pages/dd6f1be42d4c58089722ac8567ca8e3b7848353c#L22-L27):
  * `cid` - IPFS content identifier
  * `docHash` - SHA-256 integrity hash
  * `encryptedName` - Encrypted document name
  * `timestamp` - Block timestamp
* [`DocumentAdded` event](/broken/pages/dd6f1be42d4c58089722ac8567ca8e3b7848353c#L35) - emits CID on successful upload
{% endstep %}

{% step %}
### Zero-Knowledge Security (Client-Side Encryption)

Keamanan adalah prioritas mutlak (**Security First**). SentryGate memastikan bahwa data sensitif pengguna tidak pernah menyentuh internet dalam bentuk teks biasa.

#### Encryption on Device

Dokumen dienkripsi secara lokal di perangkat pengguna sebelum proses pengunggahan dimulai.

Implementation:

* Frontend scanner component: [`Scanner.tsx`](/broken/pages/aab320d084ad6d94b1436f89c4a4f9e989de4b00)
* Web Crypto API for AES-256-GCM encryption
* Encryption happens in browser before upload

#### Exclusive Access

Karena enkripsi dilakukan di sisi klien, hanya pemilik private key (pemilik dompet) yang memiliki kemampuan untuk mendekripsi dan melihat isi dokumen asli. **SentryGate tidak menyimpan kunci akses Anda.**
{% endstep %}

{% step %}
### x402 Middleware Integration (The Gatekeeper)

SentryGate mengintegrasikan protokol **x402** sebagai lapisan middleware untuk manajemen akses dan pembayaran yang cerdas.

#### Payment Gatekeeper

Sistem bertindak sebagai penjaga gerbang yang memverifikasi status pembayaran pengguna secara otomatis di jaringan Base sebelum mengizinkan hit API untuk proses upload.

Implementation:

* [`addDocument()` function](/broken/pages/dd6f1be42d4c58089722ac8567ca8e3b7848353c#L74-L100) - enforces payment verification
* Logic checks (lines 78-90):

{% code title="Solidity (snippet)" %}
```solidity
bool isSubscribed = block.timestamp < subExpiry[msg.sender];
bool hasCredits = uploadCredits[msg.sender] > 0;

if (isSubscribed) {
    // Lolos via Langganan
} else if (hasCredits) {
    // Lolos via Kredit (potong 1)
    uploadCredits[msg.sender] -= 1;
} else {
    // GAGAL: Revert dengan Custom Error
    revert PaymentRequired();
}
```
{% endcode %}

#### Seamless Subscription

Memberikan pengalaman pay-per-use atau langganan yang sepenuhnya on-chain, otomatis, dan transparan tanpa perlu verifikasi manual dari admin.

Implementation:

* [`paySubscription()`](/broken/pages/dd6f1be42d4c58089722ac8567ca8e3b7848353c#L49-L63) - 30 days access for 50,000 IDRX
* [`buyCredits()`](/broken/pages/dd6f1be42d4c58089722ac8567ca8e3b7848353c#L65-L71) - 5 uploads for 10,000 IDRX
* [`PaymentSuccess` event](/broken/pages/dd6f1be42d4c58089722ac8567ca8e3b7848353c#L34) - transparent payment tracking
{% endstep %}

{% step %}
### Decentralized Storage (Pinata & IPFS)

Untuk menjamin persistensi data, SentryGate tidak menggunakan server penyimpanan terpusat yang rentan terhadap kebocoran.

#### Web3 Cloud

Menggunakan **Pinata (IPFS)** untuk penyimpanan file yang tahan sensor (censorship-resistant).

Implementation:

* Backend upload API: Express `POST /api/upload` ([`index.js:130-168`](/broken/pages/ec1bab127814221fac6a365d0b346fc39829f66f#L130-L168))
* Uses Pinata API via Axios for IPFS pinning
* MySQL database stores CID mapping to user addresses

#### High Data Integrity

Setiap file diidentifikasi melalui **CID (Content Identifier)** yang unik, menjamin bahwa file yang Anda ambil selalu identik dengan file yang Anda simpan tanpa ada modifikasi pihak ketiga.

Implementation:

* CID stored on-chain in [`Document.cid`](/broken/pages/dd6f1be42d4c58089722ac8567ca8e3b7848353c#L23)
* Document retrieval API: Express `GET /api/documents/:walletAddress` ([`index.js:199-209`](/broken/pages/ec1bab127814221fac6a365d0b346fc39829f66f#L199-L209))
{% endstep %}

{% step %}
### Base Network Efficiency

SentryGate memanfaatkan keunggulan teknis dari jaringan **Base** untuk memberikan pengalaman pengguna yang optimal.

#### Low Gas Fees

Biaya transaksi yang sangat rendah memungkinkan pengguna untuk mencatat metadata dokumen di blockchain tanpa beban biaya yang tinggi.

#### Ethereum-Grade Security

Meskipun efisien, SentryGate tetap mewarisi standar keamanan dan desentralisasi yang setara dengan ekosistem Ethereum.

Implementation:

* Deployed on Base Sepolia testnet
* ReentrancyGuard protection: [`ReentrancyGuard`](/broken/pages/dd6f1be42d4c58089722ac8567ca8e3b7848353c#L8)
* Ownable access control: [`Ownable`](/broken/pages/dd6f1be42d4c58089722ac8567ca8e3b7848353c#L8)
* Custom errors for gas efficiency: [`PaymentFailed()`, `PaymentRequired()`, `InvalidCID()`](/broken/pages/dd6f1be42d4c58089722ac8567ca8e3b7848353c#L16-L19)
{% endstep %}
{% endstepper %}

### Summary

SentryGate combines:

* ✅ Zero-Knowledge Encryption - Client-side AES-256-GCM
* ✅ On-Chain Access Control - x402 middleware with IDRX payments
* ✅ Decentralized Storage - IPFS via Pinata
* ✅ Identity Anchoring - Wallet-based ownership
* ✅ Base Optimization - Low fees, high security
