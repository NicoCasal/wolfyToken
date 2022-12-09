import { expect } from "chai";
import { setupAddresses, setupEnvironment, minteadoAlAuction } from "./utils";
import { time } from "@nomicfoundation/hardhat-network-helpers";

let wllt;
let cnt;

describe("AuctionV2", function () {
  beforeEach(async () => {
    wllt = await setupAddresses();
    cnt = await setupEnvironment(wllt.owner);
    await minteadoAlAuction(
      wllt.owner,
      wllt.buyer,
      wllt.seller,
      cnt.erc20,
      cnt.ercuups721,
      cnt.auctionv2
    );
  });
  describe("Fees", function () {
    it("should revert if same fee", async function () {
      await expect(
        cnt.auctionv2.connect(wllt.owner).setFeeTakerFee(10)
      ).to.be.revertedWith("Not need update");
    });
    it("should update value", async function () {
      await expect(cnt.auctionv2.connect(wllt.owner).setFeeTakerFee(9)).to.not
        .be.reverted;
    });

    it("should revert if over fee limit", async function () {
      await expect(
        cnt.auctionv2.connect(wllt.owner).setFeeTakerFee(10000)
      ).to.be.revertedWith("Percent must be less than 10000");
    });
    it("should set if under limit", async function () {
      await expect(cnt.auctionv2.connect(wllt.owner).setFeeTakerFee(100)).to.not
        .be.reverted;
    });
  });
  describe("Transfer Fees", function () {
    it("should not update if same value", async function () {
      await expect(
        cnt.auctionv2.connect(wllt.owner).transferFeeAddress(wllt.owner.address)
      ).to.be.revertedWith("Not need update");
    });
    it("should update with new value", async function () {
      await expect(
        cnt.auctionv2
          .connect(wllt.owner)
          .transferFeeAddress(wllt.seller.address)
      ).to.not.be.reverted;
    });
  });
  describe("Auctions", function () {
    describe("Simple Auction", function () {
      it("should revert if duration is less than minimum", async function () {
        await expect(
          cnt.auctionv2
            .connect(wllt.seller)
            .createAuctionSingle(cnt.ercuups721.address, [2], 10, 30, true)
        ).to.be.revertedWith("Must be over MINIMUM_DURATION");
      });
      it("should create auction if over minimum duration", async function () {
        await expect(
          cnt.auctionv2
            .connect(wllt.seller)
            .createAuctionSingle(cnt.ercuups721.address, [2], 10, 60, true)
        ).to.not.be.reverted;
      });
    });
    it("should revert if over maximum duration", async function () {
      await expect(
        cnt.auctionv2
          .connect(wllt.seller)
          .createAuctionSingle(cnt.ercuups721.address, [2], 10, 700, true)
      ).to.be.revertedWith("Must be under MAXIMUM_DURATION");
    });
    it("should not revert if under maximum duration", async function () {
      await expect(
        cnt.auctionv2
          .connect(wllt.seller)
          .createAuctionSingle(cnt.ercuups721.address, [2], 1, 500, true)
      ).to.not.be.reverted;
    });
    describe("Bidding", function () {
      describe("Active Auction", function () {
        it("should revert if auction is not active", async function () {
          await expect(
            cnt.auctionv2.connect(wllt.buyer).bid(1, 10)
          ).to.be.revertedWith("Auction is not active");
        });
        it("should accept bid on active auction", async function () {
          await cnt.auctionv2
            .connect(wllt.seller)
            .createAuctionSingle(cnt.ercuups721.address, [2], 1, 60, true);

          await expect(cnt.auctionv2.connect(wllt.buyer).bid(1, 10)).to.not.be
            .reverted;
        });
        it("should revert if bidding on own auction", async function () {
          await cnt.auctionv2
            .connect(wllt.seller)
            .createAuctionSingle(cnt.ercuups721.address, [2], 1, 60, true);

          const newOrder = await cnt.auctionv2.currentOrder();

          await expect(
            cnt.auctionv2.connect(wllt.seller).bid(newOrder, 2)
          ).to.be.revertedWith("Cannot bid on own auction");
        });
      });
      describe("Ended Auction", function () {
        it("should revert if auction is over", async function () {
          await cnt.auctionv2
            .connect(wllt.seller)
            .createAuctionSingle(cnt.ercuups721.address, [2], 1, 60, true);

          const newOrder = await cnt.auctionv2.currentOrder();
          const OrderId = await cnt.auctionv2.getAllAuctionsID();
          await time.increase(61 * 60 * 60);

          await expect(
            cnt.auctionv2.connect(wllt.buyer).bid(newOrder, 2)
          ).to.be.revertedWith("Auction is over");
        });
        it("should not revert if auction is active", async function () {
          await cnt.auctionv2
            .connect(wllt.seller)
            .createAuctionSingle(cnt.ercuups721.address, [2], 1, 60, true);

          const newOrder = await cnt.auctionv2.currentOrder();

          await expect(cnt.auctionv2.connect(wllt.buyer).bid(newOrder, 2)).to
            .not.be.reverted;
        });
      });
      describe("Auction not started", function () {
        it("should revert when trying to bid", async function () {
          await cnt.ercuups721
            .connect(wllt.owner)
            .safeMint(wllt.seller.address, 1);
          await cnt.ercuups721
            .connect(wllt.seller)
            .approve(cnt.auctionv2.address, 3);
          await cnt.auctionv2
            .connect(wllt.seller)
            .createAuctionSingle(cnt.ercuups721.address, [2, 3], 1, 60, true);
          const newOrder = await cnt.auctionv2.currentOrder();

          await expect(
            cnt.auctionv2.connect(wllt.buyer).bid(newOrder, 3)
          ).to.be.revertedWith("Auction is not started");
        });
        it("should accept bid on started auction", async function () {
          await cnt.auctionv2
            .connect(wllt.seller)
            .createAuctionSingle(cnt.ercuups721.address, [2], 1, 60, true);

          const newOrder = await cnt.auctionv2.currentOrder();
          await expect(cnt.auctionv2.connect(wllt.buyer).bid(newOrder, 2)).to
            .not.reverted;
        });
      });
      describe("Auction Price", function () {
        it("should not revert if bid is higher", async function () {
          await cnt.auctionv2
            .connect(wllt.seller)
            .createAuctionSingle(cnt.ercuups721.address, [2], 1, 60, true);

          const newOrder = await cnt.auctionv2.currentOrder();

          await expect(cnt.auctionv2.connect(wllt.buyer).bid(newOrder, 2)).to
            .not.reverted;
        });

        it("should revert if bid is lower", async function () {
          await cnt.auctionv2
            .connect(wllt.seller)
            .createAuctionSingle(cnt.ercuups721.address, [2], 3, 60, true);

          const newOrder = await cnt.auctionv2.currentOrder();

          await expect(
            cnt.auctionv2.connect(wllt.buyer).bid(newOrder, 1)
          ).to.be.revertedWith("Bid must be greater than price");
        });
        it("should revert if bid is the same", async function () {
          await cnt.auctionv2
            .connect(wllt.seller)
            .createAuctionSingle(cnt.ercuups721.address, [2], 3, 60, true);

          const newOrder = await cnt.auctionv2.currentOrder();

          await expect(
            cnt.auctionv2.connect(wllt.buyer).bid(newOrder, 3)
          ).to.be.revertedWith("Bid must be greater than price");
        });
      });
      describe("Accepting Offer", function () {
        it("should accept offer", async function () {
          await cnt.auctionv2
            .connect(wllt.seller)
            .createAuctionSingle(cnt.ercuups721.address, [2], 1, 61, true);

          const newOrder = await cnt.auctionv2.currentOrder();
          await cnt.auctionv2.connect(wllt.buyer).bid(newOrder, 5);

          await cnt.auctionv2.connect(wllt.buyer).bid(newOrder, 10);
          await time.increase(60 * 60 * 60);
          await expect(cnt.auctionv2.connect(wllt.seller).acceptOffer(newOrder))
            .to.not.reverted;
        });
      });
      describe("Auction Finish", function () {
        it("should revert if auction is not active", async function () {
          await expect(
            cnt.auctionv2.connect(wllt.owner).finishAuction(1)
          ).to.be.revertedWith("Auction is not active");
        });
        it("should not revert if auction is active", async function () {
          await cnt.auctionv2
            .connect(wllt.seller)
            .createAuctionSingle(cnt.ercuups721.address, [2], 1, 60, true);
          const newOrder = await cnt.auctionv2.currentOrder();
          await time.increase(61 * 60 * 60);

          await expect(
            cnt.auctionv2.connect(wllt.seller).finishAuction(newOrder)
          ).to.not.reverted;
        });
        it("should finish auction with no bids", async function () {
          await cnt.auctionv2
            .connect(wllt.seller)
            .createAuctionSingle(cnt.ercuups721.address, [2], 1, 60, true);

          const newOrder = await cnt.auctionv2.currentOrder();

          await time.increase(60 * 60 * 60);

          await expect(
            cnt.auctionv2.connect(wllt.seller).finishAuction(newOrder)
          ).to.not.reverted;
        });
        it("should finish auction with more than one bid", async function () {
          await cnt.auctionv2
            .connect(wllt.seller)
            .createAuctionSingle(cnt.ercuups721.address, [2], 1, 60, true);

          const newOrder = await cnt.auctionv2.currentOrder();

          await cnt.auctionv2.connect(wllt.buyer).bid(newOrder, 5);

          await cnt.auctionv2.connect(wllt.buyer).bid(newOrder, 10);
          await time.increase(60 * 60 * 60);
          await expect(
            cnt.auctionv2.connect(wllt.buyer).finishAuction(newOrder)
          ).to.not.reverted;
        });
        it("should revert if auction duration has not finished", async function () {
          await cnt.auctionv2
            .connect(wllt.seller)
            .createAuctionSingle(cnt.ercuups721.address, [2], 1, 60, true);

          const newOrder = await cnt.auctionv2.currentOrder();

          await expect(
            cnt.auctionv2.connect(wllt.owner).finishAuction(newOrder)
          ).to.be.revertedWith("Auction is not over");
        });

        it("should revert if auction does not exist", async function () {
          await cnt.auctionv2
            .connect(wllt.seller)
            .createAuctionSingle(cnt.ercuups721.address, [2], 1, 60, true);

          const newOrder = await cnt.auctionv2.currentOrder();
          await expect(
            cnt.auctionv2.connect(wllt.owner).finishAuction(newOrder)
          ).to.be.revertedWith("Auction is not over");
        });
      });
      describe("Removing Bids", function () {
        it("should remove offer", async function () {
          await cnt.auctionv2
            .connect(wllt.seller)
            .createAuctionSingle(cnt.ercuups721.address, [2], 1, 60, true);

          const newOrder = await cnt.auctionv2.currentOrder();

          await expect(cnt.auctionv2.connect(wllt.seller).removeOffer(newOrder))
            .to.not.reverted;
        });
        it("should remove best bid", async function () {
          await cnt.auctionv2
            .connect(wllt.seller)
            .createAuctionSingle(cnt.ercuups721.address, [2], 1, 60, true);

          const newOrder = await cnt.auctionv2.currentOrder();
          await cnt.auctionv2.connect(wllt.buyer).bid(newOrder, 5);

          await cnt.auctionv2.connect(wllt.buyer).bid(newOrder, 10);
          await time.increase(60 * 60 * 60);

          await expect(cnt.auctionv2.connect(wllt.seller).removeOffer(newOrder))
            .to.not.reverted;
        });
      });
      describe("Bidding not byToken", function () {
        it("should accept non-token bid", async function () {
          await cnt.auctionv2
            .connect(wllt.seller)
            .createAuctionSingle(cnt.ercuups721.address, [2], 1, 60, false);

          const newOrder = await cnt.auctionv2.currentOrder();
          await cnt.auctionv2
            .connect(wllt.buyer)
            .bid(newOrder, 2, { value: 2 });

          await expect(
            cnt.auctionv2.connect(wllt.buyer).bid(newOrder, 2, { value: 4 })
          ).to.not.reverted;
        });
      });
    });
    describe("Indefinite Auction", function () {
      it("should create infinite auction", async function () {
        await expect(
          cnt.auctionv2
            .connect(wllt.seller)
            .createAuctionTimeLong(cnt.ercuups721.address, [2], 1, true)
        ).to.not.reverted;
      });
      describe("Bidding", function () {
        it("should accept bid", async function () {
          await cnt.auctionv2
            .connect(wllt.seller)
            .createAuctionTimeLong(cnt.ercuups721.address, [2], 1, true);

          const newOrder = await cnt.auctionv2.currentOrder();
          await cnt.auctionv2.connect(wllt.buyer).bid(newOrder, 5);

          await cnt.auctionv2.connect(wllt.buyer).bid(newOrder, 10);

          await expect(cnt.auctionv2.connect(wllt.buyer).removeBid(newOrder)).to
            .not.reverted;
        });
      });
    });
  });
});
