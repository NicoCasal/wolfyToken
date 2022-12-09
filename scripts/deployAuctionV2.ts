import { ethers } from "hardhat";

const ERC20_ADDRESS = "0x0";

async function main() {
  const AuctionV2 = await ethers.getContractFactory("AuctionV2");
  const auctionv2 = await AuctionV2.deploy(ERC20_ADDRESS);

  await auctionv2.deployed();

  console.log("Auctionv2 deployed to:", auctionv2.address);
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
