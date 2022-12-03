/* eslint-disable no-undef */
/* eslint-disable arrow-body-style */
/* eslint-disable no-await-in-loop */

//---------------------------------------------//
//INTERFAZ DE IMPLEMENTACIONES PARA LOS TESTEOS//
//---------------------------------------------//

import { time } from "@openzeppelin/test-helpers";
import { ethers } from "hardhat";

export async function setupAddresses() {
  const [owner, seller, buyer] = await ethers.getSigners();

  const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

  return {
    owner,
    seller,
    buyer,
    ZERO_ADDRESS,
  };
}

export async function setupEnvironment(owner) {
  const ERC721 = await ethers.getContractFactory("NFT_BASE");
  const erc721 = await ERC721.connect(owner).deploy();
  await erc721.deployed();

  const MArket = await ethers.getContractFactory("Market");
  const Market = await MArket.connect(owner).deploy(erc721.address);
  await Market.deployed();
  await erc721
    .connect(owner)
    .initialize("wolfy", "WOL", owner.address, 1, Market.address);

  const ERC20 = await ethers.getContractFactory("MyToken2");
  const erc20 = await ERC20.connect(owner).deploy();
  await erc20.deployed();

  const AuctionV2 = await ethers.getContractFactory("AuctionV2");
  const auctionv2 = await AuctionV2.connect(owner).deploy(erc20.address);
  await auctionv2.deployed();

  return {
    erc721,
    Market,
    erc20,
    auctionv2,
  };
}

module.exports = {
  setupAddresses,
  setupEnvironment,
};
