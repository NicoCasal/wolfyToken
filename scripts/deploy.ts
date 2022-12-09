const { ethers, upgrades } = require("hardhat");
async function main() {
  // DEPLOY ERC20
  const ERC20 = await ethers.getContractFactory("MyToken2");
  const erc20 = await ERC20.deploy();

  await erc20.deployed();

  console.log("ERC20 deployed to:", erc20.address);
  //address "0x3ab007bf80819D606BED310EDfa283732C531ba0"

  //DEPLOY ERC721
  const ERC721 = await ethers.getContractFactory("ERC721");
  const erc721 = await ERC721.deploy("ARG", "AR");

  await erc721.deployed();

  console.log("ERC721 deployed to:", erc721.address);

  //DEPLOY AuctionV2
  const AuctionV2 = await ethers.getContractFactory("AuctionV2");
  const auctionv2 = await AuctionV2.deploy(erc20.address);

  await auctionv2.deployed();

  console.log("Auctionv2 deployed to:", auctionv2.address);

  const ERC721UUPS = await ethers.getContractFactory("ERC721UUPS");
  const ercuups721 = await upgrades.deployProxy(ERC721UUPS, [
    "wolfy",
    "WOL",
    "pepito",
    1,
    1,
    "0xc321a621be6f429747b245fddc6859ee84271606",
  ]);

  await ercuups721.deployed();

  console.log("ERC721UUPS deployed to:", ercuups721.address);
  await ercuups721.deployed();
  //DEPLOY MARKET
  const MArket = await ethers.getContractFactory("Market");
  const market = await MArket.deploy(ercuups721.address);

  await market.deployed();

  console.log("market deployed to:", market.address);

  //DEPLOY clone
  const clone = await ethers.getContractFactory("NFTFactory");
  const clonar = await clone.deploy();

  await clonar.deployed();

  console.log("clonar deployed to:", clonar.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
