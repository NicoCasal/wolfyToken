/*

import { expect } from "chai";
import { ethers } from "hardhat";

describe("Greeter", function () {
  it("Should return the new greeting once it's changed", async function () {
    const Greeter = await ethers.getContractFactory("Greeter");
    const greeter = await Greeter.deploy("Hello, world!");
    await greeter.deployed();

    expect(await greeter.greet()).to.equal("Hello, world!");

    const setGreetingTx = await greeter.setGreeting("Hola, mundo!");

    // wait until the transaction is mined
    await setGreetingTx.wait();

    expect(await greeter.greet()).to.equal("Hola, mundo!");
  });
});

describe("MArket", function{
  it("la orden se realizo con exito", async function() {
    const MArket = await ethers.getContractFactory("MArket");
    const market = await MArket.deploy(0x4F61A02e3149783404aA8f14fF2810b2dEe2B9de);
    await market.deployed();

    expect(await )

    
  })

});
*/