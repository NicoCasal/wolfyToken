import { ethers } from "hardhat";

const ERC721UUPS_ADDRESS = "0x0";

async function main() {
  const Market = await ethers.getContractFactory("Market");
  const market = await Market.deploy(ERC721UUPS_ADDRESS);

  await market.deployed();

  console.log("Market deployed to:", market.address);
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
