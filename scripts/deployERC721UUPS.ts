import { ethers } from "hardhat";

async function main() {
  const ERC721UUPS = await ethers.getContractFactory("ERC721UUPS");
  const ercuups721 = await ERC721UUPS.deploy();

  await ercuups721.deployed();

  console.log("ERC721UUPS deployed to:", ercuups721.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
