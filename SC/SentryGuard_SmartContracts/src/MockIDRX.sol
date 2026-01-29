// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from "openzeppelin-contracts/contracts/token/ERC20/ERC20.sol";

contract MockIDRX is ERC20 {
    constructor() ERC20("Mock IDRX", "IDRX") {
        // Mint 1 Miliar Token (Desimal 2)
        _mint(msg.sender, 1_000_000_000 * 10**2); 
    }

    // --- UBAH JADI 2 ---
    function decimals() public view virtual override returns (uint8) {
        return 2;
    }

    function faucet() external {
        // Faucet 1 Juta IDRX
        _mint(msg.sender, 1_000_000 * 10**2);
    }

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}