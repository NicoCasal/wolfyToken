const { ethers, upgrades } = require("hardhat");

const ERC721_NAME = "MyERC721";
const ERC721_SYMBOL = "ERC721";

const ERC721UUPS_NAME = "MyERC721UUPS";
const ERC721UUPS_SYMBOL = "ERC721U";
const ERC721UUPS_URI = "ipfs://uri";
const ERC721UUPS_AMOUNT = 1;
const ERC721UUPS_FEE = 1;
const ERC721UUPS_ADMIN = "0xc321a621be6f429747b245fddc6859ee84271606";

async function main() {
  // DEPLOY ERC20
  const ERC20 = await ethers.getContractFactory("MyToken2");
  const erc20 = await ERC20.deploy();

  await erc20.deployed();

  console.log("ERC20 deployed to:", erc20.address);

  //DEPLOY ERC721
  const ERC721 = await ethers.getContractFactory("ERC721");
  const erc721 = await ERC721.deploy(ERC721_NAME, ERC721_SYMBOL);

  await erc721.deployed();

  console.log("ERC721 deployed to:", erc721.address);

  //DEPLOY AuctionV2
  const AuctionV2 = await ethers.getContractFactory("AuctionV2");
  const auctionv2 = await AuctionV2.deploy(erc20.address);

  await auctionv2.deployed();

  console.log("Auctionv2 deployed to:", auctionv2.address);

  const ERC721UUPS = await ethers.getContractFactory("ERC721UUPS");
  const ercuups721 = await upgrades.deployProxy(ERC721UUPS, [
    ERC721UUPS_NAME,
    ERC721UUPS_SYMBOL,
    ERC721UUPS_URI,
    ERC721UUPS_AMOUNT,
    ERC721UUPS_FEE,
    ERC721UUPS_ADMIN,
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
