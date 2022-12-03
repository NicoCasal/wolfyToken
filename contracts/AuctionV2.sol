// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/structs/EnumerableMap.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/token/ERC721/utils/ERC721Holder.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./IERC721UUPS.sol";
import "./IMarket.sol";

//create a auction contract
contract AuctionV2 is ERC721Holder, Ownable, Pausable, IMarket {
  using SafeMath for uint256;
  using EnumerableSet for EnumerableSet.UintSet;
  using EnumerableMap for EnumerableMap.UintToAddressMap;
  using Address for address;

  event AuctionCreated(
    address indexed seller,
    uint256 id,
    uint256 _tokenId,
    uint256 _price,
    uint256 _duration
  );
  event BidPlaced(address indexed bidder, uint256 id, uint256 _price);
  event IncrementBid(
    address indexed bidder,
    uint256 id,
    uint256 value,
    uint256 newPrice
  );
  event AuctionFinished(
    address indexed seller,
    address indexed winner,
    uint256 id,
    uint256 _tokenId,
    uint256 _price
  );

  uint256 public currentOrder;
  uint256 public constant MMINIMAL_DURATION = 60; //hours;
  uint256 public constant MAXIMAL_DURATION = 600; // days;
  mapping(address => EnumerableSet.UintSet) private _userSellingAuction;
  mapping(address => EnumerableSet.UintSet) private _userBuyingAuction;
  EnumerableSet.UintSet private activeAuctions;

  uint256 public PERCENT_DIVIDER = 10000;
  IERC20 token;
  mapping(uint256 => Auction) public auctions;
  // a fee of 1 equals 0.1%, 10 to 1%, 100 to 10%, 1000 to 100%
  address payable public feeAddr;
  uint256 public takerFee;
  uint256 public constant PERCENTS_DIVIDER = 1000;

  constructor(address _token) {
    require(_token.isContract(), "token address is not a contract");
    token = IERC20(_token);
    feeAddr = payable(msg.sender);
    takerFee = 10;
  }

  function setFeeTakerFee(uint256 _takerPercent) external onlyOwner {
    require(takerFee != _takerPercent, "Not need update");
    require(
      _takerPercent <= PERCENTS_DIVIDER,
      "Taker percent must be less than 10000"
    );
    emit SetTakerFeeFeePercent(_msgSender(), takerFee, _takerPercent);
    takerFee = _takerPercent;
  }

  function transferFeeAddress(address _feeAddr) external onlyOwner {
    require(_feeAddr != feeAddr, "Not need update");
    feeAddr = payable(_feeAddr);
    emit FeeAddressTransferred(_msgSender(), feeAddr);
  }

  function createAuction(
    address nft,
    uint256[] memory _tokenId,
    uint256 _price,
    uint256 _duration,
    bool _byToken,
    bool _isInfinity
  ) internal {
    for (uint256 i; i < _tokenId.length; i++) {      
      currentOrder++;
      Auction storage auction = auctions[currentOrder];
      auction.tokenId = _tokenId[i];
      auction.startTime = block.timestamp.add(_duration.mul(i));
      auction.endTime = auction.startTime.add(_duration);
      auction.currentPrice = _price;
      auction.initPrice = _price;
      auction.seller = msg.sender;
      auction.orderId = currentOrder;
      auction.byToken = _byToken;
      auction.NFTAddress = nft;
      auction._isInfinity = _isInfinity;
      _userSellingAuction[msg.sender].add(currentOrder);
      activeAuctions.add(currentOrder);

      IERC721(nft).safeTransferFrom(
        msg.sender,
        address(this),
        _tokenId[i],
        "0x"
      );

      emit AuctionCreated(
        msg.sender,
        currentOrder,
        _tokenId[i],
        _price,
        _duration
      );
    }
  }

  function createAuctionSingle
  (
    address nft,
    uint256[] memory _tokenId,
    uint256 _price,
    uint256 _duration,
    bool _byToken
  ) external {
      require(
        _duration >= MMINIMAL_DURATION,
        "Duration must be greater than MMINIMAL_DURATION"
      );
      require(
        _duration <= MAXIMAL_DURATION,
        "Duration must be less than MAXIMAL_DURATION"
      ); 
    createAuction(nft, _tokenId, _price, _duration, _byToken, false);
  }

  function createAuctionTimeLong(
    address nft,
    uint256[] memory _tokenId,
    uint256 _price,
    bool _byToken
  ) external {
    createAuction(nft, _tokenId, _price, 0, _byToken, true);
  }

  function bid(uint256 _order, uint256 _tokenAmount) external payable {
    require(auctionIsActive(_order), "Auction is not active");
    require(!auctionIsOver(_order), "Auction is over");
    require(auctionStarted(_order), "Auction is not started");
    Auction storage auction = auctions[_order];
    bool byToken = auction.byToken;
    if (auction.bestBidder != address(0)) {
      if (!byToken) {
        payable(auction.bestBidder).transfer(auction.currentPrice);
      } else {
        token.transfer(auction.bestBidder, auction.currentPrice);
      }
      _userBuyingAuction[auction.bestBidder].remove(_order);
    }

    if (byToken) {
      require(msg.value == 0, "Bid must be equal to current price");
      require(
        _tokenAmount > auction.currentPrice,
        "Bid must be greater than current price Token"
      );
      token.transferFrom(msg.sender, address(this), _tokenAmount);
    } else {
      require(
        msg.value > auction.currentPrice,
        "Bid must be greater than current price BASE"
      );
      _tokenAmount = msg.value;
    }

    auction.bestBidder = msg.sender;
    auction.currentPrice = _tokenAmount;
    _userBuyingAuction[msg.sender].add(_order);
    emit BidPlaced(msg.sender, _order, msg.value);
  }

  function finishAuction(uint256 _order) external {
    require(auctionIsActive(_order), "Auction is not active");
    require(auctionIsOver(_order), "Auction is not over");
    require(auctionStarted(_order), "Auction is not started");
    Auction storage auction = auctions[_order];
    bool canFinish = false;
    if (_userSellingAuction[msg.sender].contains(_order)) {
      canFinish = true;
    } else {
      if (auction.bestBidder == msg.sender) {
        canFinish = true;
      }
    }
    require(canFinish, "You can't finish this auction");
    if (auction.bestBidder == address(0))
      IERC721(auction.NFTAddress).safeTransferFrom(
        address(this),
        auction.seller,
        auction.tokenId
      );
    else {
      IERC721(auction.NFTAddress).safeTransferFrom(
        address(this),
        auction.bestBidder,
        auction.tokenId,
        "0x"
      );
      _userBuyingAuction[auction.bestBidder].remove(_order);
      payFees(auction.seller, auction.currentPrice,0, auction.byToken);
    }
    auction.finish = true;
    _userSellingAuction[auction.seller].remove(_order);
    activeAuctions.remove(_order);
    emit AuctionFinished(
      auction.seller,
      auction.bestBidder,
      _order,
      auction.tokenId,
      auction.currentPrice
    );
  }

  function acepOffert(uint256 _order) external {
    require(auctionIsActive(_order), "Auction is not active");    
    require(auctionStarted(_order), "Auction is not started");
    require(
      _userSellingAuction[msg.sender].contains(_order),
      "You can't accept this offer"
    );
    Auction storage auction = auctions[_order];
    require(auction.bestBidder != address(0), "You can't accept this offer");
    IERC721(auction.NFTAddress).safeTransferFrom(
      address(this),
      auction.bestBidder,
      auction.tokenId,
      "0x"
    );


    uint artFees = payArtFees(auction.NFTAddress, auction.currentPrice, auction.byToken);
    payFees(auction.seller, auction.currentPrice,artFees,auction.byToken);
    _userBuyingAuction[auction.bestBidder].remove(_order);
    _userSellingAuction[auction.seller].remove(_order);
    activeAuctions.remove(_order);
    emit AuctionFinished(
      auction.seller,
      auction.bestBidder,
      _order,
      auction.tokenId,
      auction.currentPrice
    );
  }

  function removeOffer(uint256 _order) external {
    require(auctionIsActive(_order), "Auction is not active");
    Auction storage auction = auctions[_order];

    require(
      _userSellingAuction[msg.sender].contains(_order),
      "You can't remove this offer"
    );
    IERC721(auction.NFTAddress).safeTransferFrom(
      address(this),
      auction.seller,
      auction.tokenId,
      "0x"
    );
    if (auction.bestBidder != address(0)) {
      if (!auction.byToken) {
        payable(auction.bestBidder).transfer(auction.currentPrice);
      } else {
        token.transfer(auction.bestBidder, auction.currentPrice);
      }
      _userBuyingAuction[auction.bestBidder].remove(_order);
    }
    _userSellingAuction[auction.seller].remove(_order);
    activeAuctions.remove(_order);
  }

  function removeBit(uint256 _order) external {
    require(auctionIsActive(_order), "Auction is not active");
    Auction storage auction = auctions[_order];
    require(auction.bestBidder == msg.sender, "You can't remove this offer");
    require(auction._isInfinity, "anybody can remove this offer");
    require(_userBuyingAuction[msg.sender].contains(_order),"You can't remove this offer");
    if (!auction.byToken) {
        payable(auction.bestBidder).transfer(auction.currentPrice);
      } else {
        token.transfer(auction.bestBidder, auction.currentPrice);
    }
    auction.bestBidder = address(0);
    _userBuyingAuction[msg.sender].remove(_order);
    auction.currentPrice = auction.initPrice;
  }

  function auctionStarted(uint256 _order) public view returns (bool) {
    Auction storage auction = auctions[_order];
    return block.timestamp >= auction.startTime;
  }

  function auctionIsOver(uint256 _order) public view returns (bool) {
    Auction storage auction = auctions[_order];
    if (auction._isInfinity) {
      return false;
    }
    return block.timestamp > auction.endTime;
  }

  function auctionIsActive(uint256 _order) public view returns (bool) {
    return activeAuctions.contains(_order);
  }

  function auctionIsInfinity(uint256 _order) public view returns (bool) {
    Auction storage auction = auctions[_order];
    return auction._isInfinity;
  }

  function payFees(
    address receiver,
    uint256 _amount,
    uint _artFees,
    bool byToken
  ) internal {
    require(feeAddr != address(0), "Fee address is not set");
    uint256 fee = _amount.mul(takerFee).div(PERCENTS_DIVIDER);
    uint256 toReceiver = _amount.sub(fee).sub(_artFees);
    if (byToken) {
      token.transfer(feeAddr, fee);
      token.transfer(receiver, toReceiver);
    } else {
      payable(feeAddr).transfer(fee);
      payable(receiver).transfer(toReceiver);
    }
  }
function payArtFees(    
    address nftAddress,
    uint256 _amount,
    bool byToken
  ) internal returns(uint) {    
    IERC721UUPS currentNFT = IERC721UUPS(nftAddress);
    uint artFee = _amount.mul(currentNFT.fee()).div(PERCENTS_DIVIDER);
    address artaddress = currentNFT.owner();
    if (byToken) {      
      token.transfer(artaddress, artFee);
    } else {      
      payable(artaddress).transfer(artFee);
    }
    return artFee;
  }


   
   

  function getAllSellerOrdersUser(address seller)
    public
    view
    returns (uint256[] memory)
  {
    uint256[] memory result = new uint256[](
      _userSellingAuction[seller].length()
    );
    for (uint256 i = 0; i < _userSellingAuction[seller].length(); i++) {
      result[i] = _userSellingAuction[seller].at(i);
    }
    return result;
  }

  function getSellerOrderLength(address seller) public view returns (uint256) {
    return _userSellingAuction[seller].length();
  }


  function getSellerOrderUserByIndex(address seller, uint256 index)
    public
    view
    returns (uint256)
  {
    return _userSellingAuction[seller].at(index);
  }

  function getAllBuyerOrdersUser(address buyer)
    public
    view
    returns (uint256[] memory)
  {
    uint256[] memory result = new uint256[](_userBuyingAuction[buyer].length());
    for (uint256 i = 0; i < _userBuyingAuction[buyer].length(); i++) {
      result[i] = _userBuyingAuction[buyer].at(i);
    }
    return result;
  }

function getBuyerOrderLength(address buyer) public view returns (uint256) {
    return _userBuyingAuction[buyer].length();
  }

  function getBuyerOrderUserByIndex(address buyer, uint256 index)
    public
    view
    returns (uint256)
  {
    return _userBuyingAuction[buyer].at(index);
  }

  function getAllAuctionsID() public view returns (uint256[] memory) {
    uint256[] memory result = new uint256[](activeAuctions.length());
    for (uint256 i = 0; i < activeAuctions.length(); i++) {
      result[i] = activeAuctions.at(i);
    }
    return result;
  }

  function getAllAuctions() public view returns (Auction[] memory) {
    Auction[] memory result = new Auction[](activeAuctions.length());
    for (uint256 i = 0; i < activeAuctions.length(); i++) {
      uint rest = activeAuctions.at(i);
      result[i]=auctions[rest];
    }
    return result;
  }
  
  function getAuctionLength() public view returns (uint256) {
    return activeAuctions.length();
  }

  function getAuctionByIndex(uint256 index) public view returns (uint256) {
    return activeAuctions.at(index);
  }

  
}
