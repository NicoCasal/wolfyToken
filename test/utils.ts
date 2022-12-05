/* eslint-disable no-undef */
/* eslint-disable arrow-body-style */
/* eslint-disable no-await-in-loop */

//---------------------------------------------//
//INTERFAZ DE IMPLEMENTACIONES PARA LOS TESTEOS//
//---------------------------------------------//

import { time } from "@openzeppelin/test-helpers";
import { ethers } from "hardhat";
import "@openzeppelin/hardhat-upgrades";
require("@openzeppelin/hardhat-upgrades");

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
  const { ethers, upgrades } = require("hardhat");

  const ERC721UUPS = await ethers.getContractFactory("ERC721UUPS");
  const ercuups721 = await upgrades.deployProxy(ERC721UUPS, [
    "wolfy",
    "WOL",
    "pepito",
    1,
    200,
    owner.address,
  ]);
  await ercuups721.deployed();

  const ERC20 = await ethers.getContractFactory("MyToken2");
  const erc20 = await ERC20.connect(owner).deploy();
  await erc20.deployed();

  const MArket = await ethers.getContractFactory("Market");
  const Market = await MArket.connect(owner).deploy(erc20.address);
  await Market.deployed();

  const AuctionV2 = await ethers.getContractFactory("AuctionV2");
  const auctionv2 = await AuctionV2.connect(owner).deploy(erc20.address);
  await auctionv2.deployed();

  return {
    ercuups721,
    Market,
    erc20,
    auctionv2,
  };
}

module.exports = {
  setupAddresses,
  setupEnvironment,
};
