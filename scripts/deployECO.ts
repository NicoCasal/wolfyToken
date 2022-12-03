// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import { ethers } from "hardhat";

async function main() {
  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  //
  // If this script is run directly using `node` you may want to call compile
  // manually to make sure everything is compiled
  // await hre.run('compile');

  // We get the contract to deploy
  const signer = await ethers.getSigners();
  const TokenERC20 = await ethers.getContractFactory("MyToken2");
  const tokenERC20 = await TokenERC20.deploy();
  await tokenERC20.deployed();

  const Market = await ethers.getContractFactory("Market");
  const market = await Market.deploy(tokenERC20.address);
  await market.deployed();

  const Auction = await ethers.getContractFactory("AuctionV2");
  const auction = await Auction.deploy(tokenERC20.address);
  await auction.deployed();

  const Clone = await ethers.getContractFactory("NFTFactory");
  const clone = await Clone.deploy();
  await clone.deployed();

  const a = await clone.clone(
    "hola",
    "chao",
    signer[0].address,
    10,
    10,
    "TEST_TEST"
  );

  await a.wait();

  const [address_] = await clone.getAllTokenAddressForUser(signer[0].address);
  console.log(address_);

  //await auction.createAuctionTimeLong(address_,[1],100,false)
  //await market.readyToSellToken([1,2,3,4,5],5,100,0,address_)
  //await auction.createAuctionSingle(address_,[1,2,3,4],100,600,false)
  //await auction.createAuctionTimeLong(address_, [1], 100, false);
  //await auction.createAuctionSingle(address_,[2],100,1800,false)
  //await auction.createAuctionSingle(address_,[3],100,3600,false)

  console.log({
    tokenERC20: tokenERC20.address,
    market: market.address,
    auction: auction.address,
    clone: clone.address,
    firstClone: address_,
  });
}
111111111;
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
