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

export async function minteado(
  owner,
  buyer,
  seller,
  erc20,
  ercuups721,
  Market
) {
  await erc20.connect(owner).transfer(buyer.address, 1000000);
  await erc20.connect(owner).transfer(seller.address, 1000000);
  await erc20.connect(owner).approve(Market.address, 1000);
  await erc20.connect(buyer).approve(Market.address, 1000);
  await erc20.connect(seller).approve(Market.address, 1000);

  await ercuups721.connect(owner).safeMint(seller.address, 1);

  await ercuups721.connect(seller).approve(Market.address, 2);
}
export async function minteadoAlAuction(
  owner,
  buyer,
  seller,
  erc20,
  ercuups721,
  auctionv2
) {
  await erc20.connect(owner).transfer(buyer.address, 1000000);
  await erc20.connect(owner).transfer(seller.address, 1000000);
  await erc20.connect(owner).approve(auctionv2.address, 1000);
  await erc20.connect(buyer).approve(auctionv2.address, 1000);
  await erc20.connect(seller).approve(auctionv2.address, 1000);
  await ercuups721.connect(owner).safeMint(seller.address, 1);
  await ercuups721.connect(seller).approve(auctionv2.address, 2);
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

  const Market = await ethers.getContractFactory("Market");
  const market = await Market.connect(owner).deploy(erc20.address);
  await market.deployed();

  const AuctionV2 = await ethers.getContractFactory("AuctionV2");
  const auctionv2 = await AuctionV2.connect(owner).deploy(erc20.address);
  await auctionv2.deployed();

  return {
    ercuups721,
    market,
    erc20,
    auctionv2,
  };
}

module.exports = {
  setupAddresses,
  setupEnvironment,
  minteado,
  minteadoAlAuction,
};
