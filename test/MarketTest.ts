/*import { time, constants } from "@openzeppelin/test-helpers";*/
import { expect } from "chai";
import { ethers } from "hardhat";
import { setupAddresses, setupEnvironment } from "./utils";
import { time } from "@nomicfoundation/hardhat-network-helpers";
let wllt;
let cnt;
describe("MArket", function () {
  beforeEach(async () => {
    wllt = await setupAddresses();
    cnt = await setupEnvironment(wllt.owner);
  });
  //CASOS DE COMPRA

  describe("maker and taker fee", function () {
    it("maker = maker fee", async function () {
      await expect(cnt.Market.connect(wllt.owner).setMakerFee(200)).to.not.be
        .reverted;
    });

    it("taker = maker fee", async function () {
      await expect(cnt.Market.connect(wllt.owner).setTakerFee(200)).to.not.be
        .reverted;
    });
  });

  describe("intento de compra de token", function () {
    describe(" token en venta", function () {
      it("token no listado", async function () {
        await expect(cnt.Market.buyToken(1, 1)).to.be.revertedWith(
          "Token not in sell book"
        );
      });
    });
    it.only("token listado", async function () {
      //Transfer erc20 tokens to seller
      await cnt.erc20.connect(wllt.owner).transfer(wllt.buyer.address, 1000000);
      await cnt.erc20
        .connect(wllt.owner)
        .transfer(wllt.seller.address, 1000000);

      //Approve contracts to move erc20
      await cnt.erc20.connect(wllt.owner).approve(cnt.Market.address, 1000);
      await cnt.erc20.connect(wllt.buyer).approve(cnt.Market.address, 1000);
      await cnt.erc20.connect(wllt.seller).approve(cnt.Market.address, 1000);

      await cnt.ercuups721.connect(wllt.owner).safeMint(wllt.seller.address, 1);

      await cnt.ercuups721.connect(wllt.seller).approve(cnt.Market.address, 2);

      await cnt.Market.connect(wllt.seller).readyToSellToken(
        [2],
        1,
        1,
        1,
        cnt.ercuups721.address
      );

      await expect(cnt.Market.connect(wllt.buyer).buyToken(1, 1)).to.not
        .reverted;
    });
  });
  describe("intento de compra", function () {
    it("cantidad insuficiente", async function () {
      await cnt.erc721.connect(wllt.owner).safeMint(wllt.seller.address);
      await cnt.erc721.connect(wllt.seller).approve(cnt.Market.address, 1);
      await cnt.Market.connect(wllt.seller).readyToSellToken(
        [1],
        1,
        ethers.utils.parseEther("1"),
        1,
        cnt.erc721.address
      );
      await expect(cnt.Market.buyToken(1, 0)).to.be.revertedWith(
        "insufficient quantity"
      );
    });
  });
  describe("intento de compra", function () {
    it("cantidad suficiente", async function () {
      await cnt.erc721.connect(wllt.owner).safeMint(wllt.seller.address);
      await cnt.erc721.connect(wllt.seller).approve(cnt.Market.address, 1);
      await cnt.Market.connect(wllt.seller).readyToSellToken(
        [1],
        1,
        ethers.utils.parseEther("1"),
        1,
        cnt.erc721.address
      );
      await expect(cnt.Market.buyToken(1, 1)).to.not.be.reverted;
    });
  });

  describe("intento de compra en catidad", function () {
    it("exeso de cantidad", async function () {
      await cnt.erc721.connect(wllt.owner).safeMint(wllt.seller.address);
      await cnt.erc721.connect(wllt.seller).approve(cnt.Market.address, 1);
      await cnt.Market.connect(wllt.seller).readyToSellToken(
        [1],
        1,
        ethers.utils.parseEther("10"),
        5,
        cnt.erc721.address
      );
      await expect(cnt.Market.buyToken(1, 2)).to.be.revertedWith(
        "excessive quantity"
      );
    });
    it("cantidad aprobada", async function () {
      await cnt.erc721.connect(wllt.owner).safeMint(wllt.seller.address);
      // await cnt.erc721.connect(wllt.owner).safeMint(wllt.seller.address);
      await cnt.erc721.connect(wllt.seller).approve(cnt.Market.address, 1);
      //  await cnt.erc721.connect(wllt.seller).approve(cnt.Market.address, 2);
      await cnt.Market.connect(wllt.seller).readyToSellToken(
        [1],
        1,
        ethers.utils.parseEther("1"),
        1,
        cnt.erc721.address
      );
      await cnt.erc20.connect(wllt.owner).approve(cnt.auctionv2.address, 10000);

      await expect(cnt.Market.buyToken(1, 1)).to.not.be.reverted;
    });
  });

  //CASOS DE VENTA
  describe("intento de venta en valor 0", function () {
    it("precio del token < 1", async function () {
      await cnt.erc721.connect(wllt.owner).safeMint(wllt.seller.address);
      await cnt.erc721.connect(wllt.seller).approve(cnt.Market.address, 1);
      await expect(
        cnt.Market.connect(wllt.seller).readyToSellToken(
          [1],
          1,
          0 /*
          ethers.utils.parseEther("10")*/,
          0,
          cnt.erc721.address
        )
      ).to.be.revertedWith("Price must be granter than zero");
    });
  });
  describe("cancelar la venta", function () {
    it("cancelando", async function () {
      await cnt.erc721.connect(wllt.owner).safeMint(wllt.seller.address);
      await cnt.erc721.connect(wllt.seller).approve(cnt.Market.address, 1);
      await cnt.Market.connect(wllt.seller).readyToSellToken(
        [1],
        1,
        ethers.utils.parseEther("10"),
        5,
        cnt.erc721.address
      );

      await expect(
        cnt.Market.connect(wllt.owner).cancelSellToken(1)
      ).to.be.revertedWith("Only Seller can cancel sell token");
    });
  });
  describe("cancelar la venta", function () {
    it("cancelando", async function () {
      await cnt.erc721.connect(wllt.owner).safeMint(wllt.seller.address);
      await cnt.erc721.connect(wllt.seller).approve(cnt.Market.address, 1);
      await cnt.Market.connect(wllt.seller).readyToSellToken(
        [1],
        1,
        ethers.utils.parseEther("1"),
        1,
        cnt.erc721.address
      );

      await expect(cnt.Market.connect(wllt.seller).cancelSellToken(1)).to.not.be
        .reverted;
    });
  });
  describe("intento de compra en catidad", function () {});
});
