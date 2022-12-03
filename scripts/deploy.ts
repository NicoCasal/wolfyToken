
import { ethers } from "hardhat";

async function main() {

     // DEPLOY GRERTER
  const Greeter = await ethers.getContractFactory("Greeter");
  const greeter = await Greeter.deploy("Hello, Hardhat!");

  await greeter.deployed();
await greeter.deployed();

  console.log("Greeter deployed to:", greeter.address);

     // DEPLOY ERC20
  const ERC20 = await ethers.getContractFactory("ERC20");
  const erc20 = await ERC20.deploy("ARG", "AR");
  
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
    
      console.log("auctionv2 deployed to:", auctionv2.address);
       [0x6615a34F73520D0c7Ad94FED6E0396423b1Edf2b]

       //DEPLOY MARKET
      const MArket = await ethers.getContractFactory("Market");
      const market = await MArket.deploy(erc20.address);
      
      await market.deployed(); 
    
      console.log("market deployed to:", market.address);

      //DEPLOY ERC721UUPS
      const ERC721UUPS = await ethers.getContractFactory("ERC721UUPS");
      const ERC721u = await ERC721UUPS.deploy();
      
      await ERC721u.deployed(); 
    
      console.log("ERC721UUPS deployed to:", ERC721u.address);

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