/**
 * Hardhat deploy script for ThreatLogger.sol
 * Run: npx hardhat run scripts/deploy.js --network localhost
 */
const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  const ThreatLogger = await ethers.getContractFactory("ThreatLogger");
  const contract     = await ThreatLogger.deploy();
  await contract.waitForDeployment();

  const addr = await contract.getAddress();
  console.log("✅ ThreatLogger deployed at:", addr);
  console.log("Add to .env: CONTRACT_ADDR=" + addr);
}

main().catch((err) => { console.error(err); process.exit(1); });
