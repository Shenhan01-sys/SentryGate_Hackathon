// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {MockIDRX} from "../src/MockIDRX.sol";
import {SentryGate} from "../src/SentryGate.sol";

contract DeployVault is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployerAddress = vm.addr(deployerPrivateKey);

        vm.startBroadcast(deployerPrivateKey);

        // 1. Deploy Token (Mock IDRX)
        MockIDRX token = new MockIDRX();
        console.log("MockIDRX Address:", address(token));

        // 2. Deploy SentryGate
        // Parameter: (Token Address, Fee Recipient = Deployer)
        SentryGate gate = new SentryGate(address(token), deployerAddress);
        console.log("SentryGate Address:", address(gate));

        vm.stopBroadcast();
    }
}