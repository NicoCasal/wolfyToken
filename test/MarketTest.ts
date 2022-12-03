/*import { time, constants } from "@openzeppelin/test-helpers";*/
import { expect } from "chai";
import { ethers } from "hardhat";
import { setupAddresses, setupEnvironment } from "./utils";
let wllt;
let cnt;
describe("MArket", function () {
  beforeEach(async () => {
    wllt = await setupAddresses();
    cnt = await setupEnvironment(wllt.owner);
  });
  //CASOS DE COMPRA
  describe("intento de compra de token", function () {
    describe("cuando no hay token en venta", function () {
      it("should reverse", async function () {
        await expect(cnt.Market.buyToken(1, 1)).to.be.revertedWith(
          "Token not in sell book"
        );
      });
    });
    describe("intento de compra", function () {
      it("cantidad insuficiente", async function () {
        await cnt.erc721.connect(wllt.owner).safeMint(wllt.seller.address);
        await cnt.erc721.connect(wllt.seller).approve(cnt.Market.address, 1);
        await cnt.Market.connect(wllt.seller).readyToSellToken(
          [1],
          1,
          ethers.utils.parseEther("10"),
          1,
          cnt.erc721.address
        );
        await expect(cnt.Market.buyToken(1, 0)).to.be.revertedWith(
          "insufficient quantity"
        );
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
      /*it("cantidad aprobada", async function () {
        await cnt.erc721.connect(wllt.owner).safeMint(wllt.seller.address);
        await cnt.erc721.connect(wllt.owner).safeMint(wllt.seller.address);
        await cnt.erc721.connect(wllt.seller).approve(cnt.Market.address, 1);
        await cnt.erc721.connect(wllt.seller).approve(cnt.Market.address, 2);
        await cnt.Market.connect(wllt.seller).readyToSellToken(
          [1, 2],
          1,
          ethers.utils.parseEther("1"),
          1,
          cnt.erc721.address
        );
        await cnt.erc20
          .connect(wllt.owner)
          .approve(cnt.auctionv2.address, 10000);

        await expect(cnt.Market.buyToken(1, 2)).to.not.be.reverted;
      });*/
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
    describe("intento de compra en catidad", function () {});
  });
});
