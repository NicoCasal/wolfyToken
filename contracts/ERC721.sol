// SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract NFT_BASE is  Ownable, ERC721URIStorage {
     using Counters for Counters.Counter;
    Counters.Counter private _tokenIdCounter;
    constructor() ERC721("MyToken", "MTK") {
        _owner =msg.sender;
    }   
    address private _owner;
    string private  _baseTokenURI;
    bool public _initialized;
    string private _name;
    string private _symbol;
    
    function owner() public view override returns (address) {
        return _owner;
    }
    function name() public view override returns (string memory) {
        return _name;
    }
    
    function symbol() public view override returns (string memory) {
        return _symbol;
    }

    modifier initializer() {        
        require(!_initialized, "Initializable: contract is already initialized");
        _;        
        }
    
    function initialize(string calldata name_,string calldata symbol_, address owner_, uint amount, address market) public initializer {  
        _initialized  =true;
        _name = name_;
        _symbol = symbol_;                
        _owner=owner_;
        super._setApprovalForAll(owner_,market,true);
        safeMint(owner_,amount);        
    }

    function safeMint(address to) public onlyOwner {        
        safeMint_(to);
    }

    function safeMint_(address to) internal {
        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        _safeMint(to, tokenId);
    }

    function safeMint(address to, uint amount) internal {
        for(uint i=0; i<amount;i++){
            safeMint_(to);
        }
    }

    function _baseURI() internal view  override returns (string memory) {
        return _baseTokenURI;
    }

    function setBaseURI(string calldata newBaseTokenURI) public onlyOwner{
        _baseTokenURI = newBaseTokenURI;
    }
    function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
        require(_exists(tokenId), "ERC721Metadata: URI query for nonexistent token");
        return _baseURI();                
    }

    function baseURI() public view returns (string memory) {
        return _baseURI();
    }
     function setTokenURI(uint256 tokenId, string memory _tokenURI) public onlyOwner{
        _setTokenURI(tokenId, _tokenURI);
    }

    function exists(uint256 tokenId) public view returns (bool) {
        return _exists(tokenId);
    }

}