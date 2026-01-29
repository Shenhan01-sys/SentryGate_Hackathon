// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "openzeppelin-contracts/contracts/access/Ownable.sol";
import {IERC20} from "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import {ReentrancyGuard} from "openzeppelin-contracts/contracts/utils/ReentrancyGuard.sol";

contract SentryGate is Ownable, ReentrancyGuard {
    // --- 1. CONFIGURATION ---
    IERC20 public paymentToken;
    address public feeRecipient;

    uint256 public subPrice;
    uint256 public creditPrice;

    // --- 2. CUSTOM ERRORS ---
    error PaymentFailed();      // Saat transfer token gagal
    error PaymentRequired();    // Error 402: Belum bayar
    error InvalidCID();         // CID kosong
    
    // --- 3. DATA STORAGE ---
    struct Document {
        string cid;
        string docHash;
        string encryptedName;
        uint256 timestamp;
    }

    mapping(address => Document[]) private userDocuments;
    mapping(address => uint256) public subExpiry;
    mapping(address => uint256) public uploadCredits;

    // --- EVENTS ---
    event PaymentSuccess(address indexed user, string pType, uint256 timestamp);
    event DocumentAdded(address indexed user, string cid);

    constructor(address _token, address _recipient) Ownable(msg.sender) {
        paymentToken = IERC20(_token);
        feeRecipient = _recipient;
    
        // --- UPDATE PENTING: Menggunakan 2 Desimal ---
        // Karena IDRX kamu sekarang 2 desimal, pengalinya wajib 10**2
        
        subPrice = 50_000 * 10**2;     // 50.000 IDRX
        creditPrice = 10_000 * 10**2;  // 10.000 IDRX
    }

    // --- 4. PAYMENT LOGIC ---
    function paySubscription() external nonReentrant {
        // Pindahkan Token
        bool success = paymentToken.transferFrom(msg.sender, feeRecipient, subPrice);
        
        // Cek sukses/gagal hemat gas
        if (!success) revert PaymentFailed();

        // Update Logic Langganan
        if (subExpiry[msg.sender] < block.timestamp) {
            subExpiry[msg.sender] = block.timestamp + 30 days;
        } else {
            subExpiry[msg.sender] += 30 days;
        }
        emit PaymentSuccess(msg.sender, "SUBSCRIPTION", block.timestamp);
    }

    function buyCredits() external nonReentrant {
        bool success = paymentToken.transferFrom(msg.sender, feeRecipient, creditPrice);
        if (!success) revert PaymentFailed();

        uploadCredits[msg.sender] += 5;
        emit PaymentSuccess(msg.sender, "CREDITS", block.timestamp);
    }

    // --- 5. CORE LOGIC (x402 Check) ---
    function addDocument(string calldata _cid, string calldata _hash, string calldata _encName) external {
        // Cek input kosong
        if (bytes(_cid).length == 0) revert InvalidCID();

        // Logic x402
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

        userDocuments[msg.sender].push(Document({
            cid: _cid,
            docHash: _hash,
            encryptedName: _encName,
            timestamp: block.timestamp
        }));

        emit DocumentAdded(msg.sender, _cid);
    }

    // --- 6. VIEWS ---
    function verifyPayment(address user) external view returns (bool isActive, uint256 expiry, uint256 credits) {
        isActive = (block.timestamp < subExpiry[user]) || (uploadCredits[user] > 0);
        return (isActive, subExpiry[user], uploadCredits[user]);
    }

    function getMyDocs() external view returns (Document[] memory) {
        return userDocuments[msg.sender];
    }
}