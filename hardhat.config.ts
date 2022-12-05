import * as dotenv from "dotenv";

import { HardhatUserConfig, task } from "hardhat/config";
import "@nomiclabs/hardhat-etherscan";
import "@nomiclabs/hardhat-waffle";
import "@typechain/hardhat";
import "hardhat-gas-reporter";
import "solidity-coverage";
import "@openzeppelin/hardhat-upgrades";
require("@nomiclabs/hardhat-waffle");
require("dotenv").config();
require("solidity-coverage");

/*
const config: HardhatUserConfig = {
  defaultNetwork:'localhost',
  solidity:{
    version: "0.8.4",
  settings: {
    optimizer: {
      enabled: true
    }
   }},
  networks: {
    localhost: {
      url: "http://127.0.0.1:8545",
      accounts: {mnemonic: process.env.MNEMONIC,
        count:10,              
      },      

    },
    hardhat: {
    },
    testnet: {
      url: "https://data-seed-prebsc-1-s1.binance.org:8545",
      chainId: 97,
      gasPrice: 20000000000,
      accounts: {mnemonic: process.env.MNEMONIC}
    },
    mainnet: {
      url: "https://bsc-dataseed.binance.org/",
      chainId: 56,
      gasPrice: 20000000000,
      accounts: {mnemonic: process.env.MNEMONIC}
    }
  },  
};

export default config;
*/
module.exports = {
  defaultNetwork: "hardhat",
};
module.exports = {
  solidity: "0.8.4",
  networks: {
    arbitrum: {
      url: process.env.ARBITRUM_RPC,
      accounts: [process.env.PRIVKEY],
    },
    optimism: {
      url: process.env.OPTIMISM_RPC,
      accounts: [process.env.PRIVKEY],
    },
  },
};
