// SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableMap.sol";
import "@openzeppelin/contracts/token/ERC721/utils/ERC721Holder.sol";
import "./Interfaces/IERC721UUPS.sol";
import "./Interfaces/IMarket.sol";

contract Market is ERC721Holder, Ownable, IMarket {
    using SafeMath for uint256;
    using EnumerableSet for EnumerableSet.UintSet;
    using EnumerableMap for EnumerableMap.UintToAddressMap;

    uint256 private order;
    // a fee of 1 equals 0.1%, 10 to 1%, 100 to 10%, 1000 to 100%
    uint16 public makerFee;
    uint16 public takerFee;
    uint16 public constant PERCENTS_DIVIDER = 1000;

    IERC20 token;
    address payable public feeAddr;

    mapping(uint256 => Order) private _tokenSellers;
    mapping(uint256 => Order) private AllOrder_;
    EnumerableSet.UintSet internal _asksMap;
    mapping(address => EnumerableSet.UintSet) private _userSellingOrder;

    event Buy(
        address seller,
        address buyer,
        address nftAddress,
        uint256 order_,
        uint256 deltaQuantity
    );
    event NewOrder(
        address seller,
        address nftAddress,
        uint256 order_,
        uint256 _quantity
    );
    event CancelOrder(address seller, address nftAddress, uint256 order_);

    constructor(address _token) {
        token = IERC20(_token);
        feeAddr = payable(msg.sender);
        takerFee = 200;
        makerFee = 200;
    }

    function setMakerFee(uint16 makerFee_) external onlyOwner {
        makerFee = makerFee_;
    }

    function setTakerFee(uint16 takerFee_) external onlyOwner {
        takerFee = takerFee_;
    }

    function buyToken(uint256 _order, uint256 _quantity) external payable {
        _buyTokenTo(_order, _msgSender(), _quantity);
    }

    function _buyTokenTo(
        uint256 _order,
        address _to,
        uint256 _quantity
    ) internal {
        require(_to != address(0) && (_to != address(this)), "Wrong buyer");
        require(_asksMap.contains(_order), "Token not in sell book");
        require(_quantity > 0, "Insufficient quantity");
        Order storage nft_ = _tokenSellers[_order];
        IERC721UUPS currentNFT = IERC721UUPS(nft_.NFTAddress);
        uint256 quantityOrder = nft_.quantity;
        require(quantityOrder >= _quantity, "Excessive quantity");
        uint256 price = nft_.tokenPrices;
        bool byToken = true;
        if (price == 0) {
            price = nft_.ethPrice;
            require(price > 0, "Token not valid");
            byToken = false;
        }
        price = price.mul(_quantity);
        uint256 feeAmount = price.mul(takerFee).div(PERCENTS_DIVIDER);
        uint256 artFee = price.mul(currentNFT.fee()).div(PERCENTS_DIVIDER);
        address artaddress = currentNFT.owner();
        if (!byToken) {
            require(msg.value == price, "Invalid pay amount");
            if (feeAmount > 0) {
                feeAddr.transfer(feeAmount);
            }
            payable(artaddress).transfer(artFee);
            payable(nft_.owner).transfer(price.sub(feeAmount).sub(artFee));
        } else {
            if (feeAmount > 0) {
                token.transferFrom(_to, feeAddr, feeAmount);
            }
            token.transferFrom(_to, artaddress, artFee);
            token.transferFrom(
                _to,
                nft_.owner,
                price.sub(feeAmount).sub(artFee)
            );
        }
        uint256 deltaQuantity = quantityOrder.sub(_quantity);

        uint256 curentIndex = nft_.currentIndex;
        for (uint256 i; i < _quantity; ) {
            currentNFT.safeTransferFrom(
                address(this),
                _to,
                nft_.tokenID[curentIndex.add(i)],
                "0x"
            );

            unchecked {
                i++;
            }
        }
        nft_.currentIndex = nft_.currentIndex.add(_quantity);
        if (deltaQuantity == 0) {
            _asksMap.remove(_order);
            nft_.quantity = deltaQuantity;
            _userSellingOrder[nft_.owner].remove(_order);
            delete _tokenSellers[_order];
        } else {
            nft_.quantity = deltaQuantity;
        }
        uint256 orderNumber = _order;
        emit Buy(
            nft_.owner,
            msg.sender,
            nft_.NFTAddress,
            orderNumber,
            deltaQuantity
        );
    }

    function cancelSellToken(uint256 _order) external {
        require(
            _userSellingOrder[_msgSender()].contains(_order),
            "Only Seller can cancel sale"
        );
        Order storage order_ = _tokenSellers[_order];

        IERC721 currentNFT = IERC721(order_.NFTAddress);
        for (uint256 i = order_.currentIndex; i < order_.tokenID.length; ) {
            currentNFT.safeTransferFrom(
                address(this),
                order_.owner,
                order_.tokenID[i],
                "0x"
            );
            unchecked {
                i++;
            }
        }
        _asksMap.remove(_order);
        _userSellingOrder[_msgSender()].remove(_order);
        emit CancelOrder(msg.sender, order_.NFTAddress, _order);
        delete _tokenSellers[_order];
    }

    function readyToSellToken(
        uint256[] calldata _tokenIds,
        uint256 _quantity,
        uint256 ethPrice,
        uint256 _prices,
        address nft
    ) public {
        _readyToSellTokenTo(
            _tokenIds,
            _quantity,
            ethPrice,
            _prices,
            msg.sender,
            nft
        );
    }

    function _readyToSellTokenTo(
        uint256[] calldata _tokenIds,
        uint256 _quantity,
        uint256 ethPrice,
        uint256 _prices,
        address _from,
        address nft
    ) internal {
        IERC721 currentNFT = IERC721(nft);
        order++;
        Order storage nft_ = _tokenSellers[order];
        if (_prices == 0) {
            require(ethPrice > 0, "Price must be geater than zero");
        } else {
            require(_prices > 0, "Price must be geater than zero");
        }

        _createOrderHandle(
            nft_,
            _tokenIds,
            _quantity,
            0,
            ethPrice,
            _prices,
            order,
            _from,
            nft
        );

        for (uint256 i; i < _quantity; ) {
            require(
                currentNFT.ownerOf(_tokenIds[i]) == _from,
                "Only Token Owner can sell token"
            );
            currentNFT.safeTransferFrom(
                _from,
                address(this),
                _tokenIds[i],
                "0x"
            );

            unchecked {
                i++;
            }
        }
        emit NewOrder(_from, nft, order, _quantity);
    }

    function _createOrderHandle(
        Order storage nft_,
        uint256[] calldata _tokenId,
        uint256 _quantity,
        uint256 currentIndex,
        uint256 ethPrice,
        uint256 _prices,
        uint256 _order,
        address _from,
        address nft
    ) internal {
        _asksMap.add(order);
        nft_.owner = _from;
        nft_.quantity = _quantity;
        nft_.tokenID = _tokenId;
        nft_.currentIndex = currentIndex;
        nft_.ethPrice = ethPrice;
        nft_.NFTAddress = nft;
        nft_.tokenPrices = _prices;
        nft_.orderId = _order;
        _userSellingOrder[_from].add(order);
        AllOrder_[_order] = nft_;
    }

    function getAskLength() public view returns (uint256) {
        return _asksMap.length();
    }

    function getAsks() external view returns (Order[] memory) {
        Order[] memory asks = new Order[](_asksMap.length());

        for (uint256 i; i < _asksMap.length(); ) {
            uint256 orderNum = _asksMap.at(i);
            asks[i] = _tokenSellers[orderNum];
            unchecked {
                i++;
            }
        }
        return asks;
    }

    function getAsksByUser(address user)
        external
        view
        returns (Order[] memory)
    {
        Order[] memory asks = new Order[](_userSellingOrder[user].length());

        for (uint256 i; i < _userSellingOrder[user].length(); ) {
            uint256 orderNum = _userSellingOrder[user].at(i);
            asks[i] = _tokenSellers[orderNum];
            unchecked {
                i++;
            }
        }
        return asks;
    }

    function getOrder(uint256 _order) external view returns (Order memory) {
        Order memory order_ = _tokenSellers[_order];
        if (order_.quantity == 0) return order_;
        return order_;
    }

    function getOrderByIndex(uint256 _index)
        external
        view
        returns (Order memory)
    {
        uint256 orderNum = _asksMap.at(_index);
        Order memory order_ = _tokenSellers[orderNum];
        return order_;
    }
}
