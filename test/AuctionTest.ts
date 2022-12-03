import { expect } from "chai";
import { ethers } from "hardhat";
import { setupAddresses, setupEnvironment } from "./utils";
import { time } from "@nomicfoundation/hardhat-network-helpers";

let wllt;
let cnt;
describe("AuctionV2", function () {
  beforeEach(async () => {
    wllt = await setupAddresses();
    cnt = await setupEnvironment(wllt.owner);
  });

  describe("TARIFAS", function () {
    it("no hace falta alctualizar", async function () {
      await expect(
        cnt.auctionv2.connect(wllt.owner).setFeeTakerFee(10)
      ).to.be.revertedWith("Not need update");
    });
    it("actualizar valor", async function () {
      await expect(cnt.auctionv2.connect(wllt.owner).setFeeTakerFee(9)).to.not
        .be.reverted;
    });
  });
  describe("TARIFAS", function () {
    it("tarifa acorde", async function () {
      await expect(
        cnt.auctionv2.connect(wllt.owner).setFeeTakerFee(10000)
      ).to.be.revertedWith("Taker percent must be less than 10000");
    });
    it("valor superior de tarifas", async function () {
      await expect(cnt.auctionv2.connect(wllt.owner).setFeeTakerFee(100)).to.not
        .be.reverted;
    });
    describe("TARIFAS de transaccion", function () {
      it("no hace falta alctualizar", async function () {
        await expect(
          cnt.auctionv2
            .connect(wllt.owner)
            .transferFeeAddress(wllt.owner.address)
        ).to.be.revertedWith("Not need update");
      });
      it("hace falta actualizar", async function () {
        await expect(
          cnt.auctionv2
            .connect(wllt.owner)
            .transferFeeAddress(wllt.seller.address)
        ).to.not.be.reverted;
      });
    });
  });
  describe("SUBASTAS", function () {
    describe("SUBASTA SIMPLE", function () {
      it("timpo minimo no aprobado", async function () {
        await expect(
          cnt.auctionv2
            .connect(wllt.seller)
            .createAuctionSingle(cnt.erc721.address, [1], 10, 30, true)
        ).to.be.revertedWith("Duration must be greater than MMINIMAL_DURATION");
      });
      it("tiempo minimo aprobado", async function () {
        await cnt.erc20
          .connect(wllt.owner)
          .approve(cnt.auctionv2.address, 10000);
        await expect(
          cnt.auctionv2
            .connect(wllt.seller)
            .createAuctionSingle(cnt.erc721.address, [1], 1, 60, true)
        ).to.not.be.reverted;
      });
    });
    describe("tiempo maximo superado", function () {
      it("timpo de subaste", async function () {
        await expect(
          cnt.auctionv2
            .connect(wllt.seller)
            .createAuctionSingle(cnt.erc721.address, [1], 10, 700, true)
        ).to.be.reverted;
      });
      it("timpo maximo aprobado", async function () {
        // await cnt.erc20.connect(wllt.owner);
        //  .approve(cnt.auctionv2.address, 10000);
        await expect(
          cnt.auctionv2
            .connect(wllt.seller)
            .createAuctionSingle(cnt.erc721.address, [1], 1, 600, true)
        ).to.not.be.reverted;
      });
    });
    describe("OFERTAS", function () {
      describe("subasta activa", function () {
        it("subasta no esta activa", async function () {
          await expect(
            cnt.auctionv2.connect(wllt.owner).bid(1, 10)
          ).to.be.revertedWith("Auction is not active");
        });
        it("subasta si esta activa", async function () {
          await cnt.erc721.connect(wllt.owner).safeMint(wllt.seller.address);
          await cnt.erc721
            .connect(wllt.seller)
            .approve(cnt.auctionv2.address, 1);
          await cnt.auctionv2
            .connect(wllt.seller)
            .createAuctionSingle(cnt.erc721.address, [1], 1, 60, true);

          await cnt.erc20
            .connect(wllt.owner)
            .approve(cnt.auctionv2.address, 10000);
          await expect(cnt.auctionv2.connect(wllt.owner).bid(1, 10)).to.not.be
            .reverted;
        });
      });
      describe("se espera que la subasta haya terminado", function () {
        it("subasta finalizada", async function () {
          await cnt.erc721.connect(wllt.owner).safeMint(wllt.seller.address);
          await cnt.erc721
            .connect(wllt.seller)
            .approve(cnt.auctionv2.address, 1);
          await cnt.auctionv2
            .connect(wllt.seller)
            .createAuctionSingle(cnt.erc721.address, [1], 1, 60, true);

          const newOrder = await cnt.auctionv2.currentOrder();
          //console.log(newOrder);

          await time.increase(61 * 60 * 60);

          await expect(
            cnt.auctionv2.connect(wllt.owner).bid(newOrder, 1)
          ).to.be.revertedWith("Auction is over");
        });
        it("subasta no finalizada", async function () {
          await cnt.erc721.connect(wllt.owner).safeMint(wllt.seller.address);
          await cnt.erc721
            .connect(wllt.seller)
            .approve(cnt.auctionv2.address, 1);
          await cnt.auctionv2
            .connect(wllt.seller)
            .createAuctionSingle(cnt.erc721.address, [1], 1, 60, true);

          const newOrder = await cnt.auctionv2.currentOrder();
          await cnt.erc20
            .connect(wllt.owner)
            .approve(cnt.auctionv2.address, 10000);
          await expect(cnt.auctionv2.connect(wllt.owner).bid(newOrder, 2)).to
            .not.be.reverted;

          //acepta la oferta
          //rechaza
          //expira el tiem[po
        });
      });
      describe("se espera que la subasta no haya comenzado", function () {
        it("subasta sin comenzar", async function () {
          await cnt.erc721.connect(wllt.owner).safeMint(wllt.seller.address);
          await cnt.erc721.connect(wllt.owner).safeMint(wllt.seller.address);
          await cnt.erc721
            .connect(wllt.seller)
            .approve(cnt.auctionv2.address, 1);
          await cnt.erc721
            .connect(wllt.seller)
            .approve(cnt.auctionv2.address, 2);

          await cnt.auctionv2
            .connect(wllt.seller)
            .createAuctionSingle(cnt.erc721.address, [1, 2], 1, 60, true);

          const newOrder = await cnt.auctionv2.currentOrder();

          await expect(
            cnt.auctionv2.connect(wllt.seller).bid(newOrder, 2)
          ).to.be.revertedWith("Auction is not started");
        });
        it("subasta comenzo", async function () {
          await cnt.erc721.connect(wllt.owner).safeMint(wllt.seller.address);

          await cnt.erc721
            .connect(wllt.seller)
            .approve(cnt.auctionv2.address, 1);

          await cnt.auctionv2
            .connect(wllt.seller)
            .createAuctionSingle(cnt.erc721.address, [1], 1, 60, true);

          const newOrder = await cnt.auctionv2.currentOrder();
          await cnt.erc20
            .connect(wllt.owner)
            .approve(cnt.auctionv2.address, 10000);
          // await time.increase(60 * 60 * 60);

          await expect(cnt.auctionv2.connect(wllt.owner).bid(newOrder, 2)).to
            .not.be.reverted;
        });
      });
      describe("precio de oferta", function () {
        it("ofe", async function () {
          await cnt.erc721.connect(wllt.owner).safeMint(wllt.seller.address);
          await cnt.erc721
            .connect(wllt.seller)
            .approve(cnt.auctionv2.address, 1);
          await cnt.erc20
            .connect(wllt.owner)
            .approve(cnt.auctionv2.address, 1000);
          await cnt.auctionv2
            .connect(wllt.seller)
            .createAuctionSingle(cnt.erc721.address, [1], 1, 60, true);

          const newOrder = await cnt.auctionv2.currentOrder();

          await expect(
            cnt.auctionv2.connect(wllt.owner).bid(newOrder, 2)
          ).to.be.revertedWith("Bid must be equal to current price");
        });

        it("precio menor a la oferta", async function () {
          await cnt.erc721.connect(wllt.owner).safeMint(wllt.seller.address);
          await cnt.erc721
            .connect(wllt.seller)
            .approve(cnt.auctionv2.address, 1);
          await cnt.auctionv2
            .connect(wllt.seller)
            .createAuctionSingle(cnt.erc721.address, [1], 3, 60, true);

          const newOrder = await cnt.auctionv2.currentOrder();
          //console.log(newOrder);

          //await time.increase(61 * 60 * 60);

          await expect(
            cnt.auctionv2.connect(wllt.owner).bid(newOrder, 1)
          ).to.be.revertedWith("Bid must be greater than current price Token");
        });
        it("precio = oferta", async function () {
          await cnt.erc721.connect(wllt.owner).safeMint(wllt.seller.address);
          await cnt.erc721
            .connect(wllt.seller)
            .approve(cnt.auctionv2.address, 1);
          await cnt.auctionv2
            .connect(wllt.seller)
            .createAuctionSingle(cnt.erc721.address, [1], 3, 60, true);

          const newOrder = await cnt.auctionv2.currentOrder();
          //console.log(newOrder);

          //await time.increase(61 * 60 * 60);
          await cnt.erc20
            .connect(wllt.owner)
            .approve(cnt.auctionv2.address, 10000);

          await expect(cnt.auctionv2.connect(wllt.owner).bid(newOrder, 4)).to
            .not.be.reverted;
        });
      });
    });
  });
});
