require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.20",
  networks: {
    localhost: {
      url: "http://127.0.0.1:8545"
    },
    // Uncomment for Sepolia testnet:
    // sepolia: {
    //   url: process.env.SEPOLIA_RPC,
    //   accounts: [process.env.PRIVATE_KEY]
    // }
  }
};
