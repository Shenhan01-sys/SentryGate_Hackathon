// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/SentryGate.sol";
import "../src/MockIDRX.sol";

// Interface untuk menangkap Error bawaan OpenZeppelin
interface IERC20Errors {
    error ERC20InsufficientAllowance(address spender, uint256 allowance, uint256 needed);
}

contract SentryGateTest is Test {
    SentryGate public gate;
    MockIDRX public token;

    address public alice = address(0xA11CE); 
    address public bob = address(0xB0B);     
    address public feeRecipient = address(0x99);

    // PENTING: Kita pakai 2 Desimal sesuai kontrak kamu
    uint256 constant DECIMALS = 10**2; 

    function setUp() public {
        // 1. Deploy Token & Gate
        token = new MockIDRX();
        gate = new SentryGate(address(token), feeRecipient);

        // 2. Setup Saldo Alice (1 Juta IDRX)
        token.mint(alice, 1_000_000 * DECIMALS);
        
        // 3. Alice Approve SentryGate
        vm.prank(alice);
        token.approve(address(gate), 1_000_000 * DECIMALS);
    }

    // --- TEST 1: Langganan ---
    function testSubscriptionFlow() public {
        vm.startPrank(alice);
        gate.paySubscription(); // Bayar 50.000
        
        // Cek Expired Date harusnya > timestamp sekarang
        (bool isActive, uint256 expiry, ) = gate.verifyPayment(alice);
        assertTrue(isActive);
        assertGt(expiry, block.timestamp);
        
        // Coba Upload
        gate.addDocument("QmCid123", "Hash123", "EncName123");
        
        SentryGate.Document[] memory docs = gate.getMyDocs();
        assertEq(docs.length, 1);
        vm.stopPrank();
    }

    // --- TEST 2: Kredit Eceran ---
    function testCreditFlow() public {
        vm.startPrank(alice);
        gate.buyCredits(); // Beli 5 Kredit
        
        (, , uint256 credits) = gate.verifyPayment(alice);
        assertEq(credits, 5, "Harusnya dapat 5 kredit");

        gate.addDocument("QmCidA", "HashA", "EncNameA"); // Pakai 1
        
        (, , credits) = gate.verifyPayment(alice);
        assertEq(credits, 4, "Harusnya sisa 4 kredit");
        vm.stopPrank();
    }

    // --- TEST 3: Revert PaymentRequired (x402) ---
    function testRevertAccessDenied() public {
        vm.startPrank(bob);
        // Bob gak bayar apa-apa, harusnya ditolak
        vm.expectRevert(SentryGate.PaymentRequired.selector);
        gate.addDocument("QmMaling", "HashMaling", "EncNameMaling");
        vm.stopPrank();
    }

    // --- TEST 4: Revert Allowance (Lupa Approve) ---
    function testRevertPaymentWithoutAllowance() public {
        vm.startPrank(bob);
        token.mint(bob, 100_000 * DECIMALS); // Punya duit
        
        // Tapi Lupa Approve -> Error dari Token
        vm.expectRevert(
            abi.encodeWithSelector(
                IERC20Errors.ERC20InsufficientAllowance.selector,
                address(gate),       // Spender
                0,                   // Allowance 0
                50_000 * DECIMALS    // Butuh 50.000
            )
        );

        gate.paySubscription();
        vm.stopPrank();
    }

    // --- TEST 5: Cek Uang Masuk ke Admin ---
    function testFeeTransfer() public {
        uint256 awal = token.balanceOf(feeRecipient);
        
        vm.prank(alice);
        gate.paySubscription(); 
        
        uint256 akhir = token.balanceOf(feeRecipient);
        // Pastikan nambah 50.000 (2 desimal)
        assertEq(akhir - awal, 50_000 * DECIMALS);
    }
}