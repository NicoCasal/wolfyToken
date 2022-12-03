// SPDX-License-Identifier: Apache-2.0

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/proxy/Clones.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableMap.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import "./ERC721UUPS.sol";


contract NFTFactory is Ownable{
using EnumerableMap for EnumerableMap.UintToAddressMap;
using EnumerableSet for EnumerableSet.AddressSet;
using EnumerableSet for EnumerableSet.UintSet;
using Clones for address;

uint id;
address public NFT_Origin;
address[] public clones_;
mapping(address => EnumerableSet.UintSet) addressMAp;

EnumerableMap.UintToAddressMap listToken;

constructor(){
    ERC721UUPS token  = new ERC721UUPS();
    NFT_Origin = address(token);    
    }
function cloneLength() public view returns(uint){    
    return clones_.length;    
}

function clone(
    string calldata name_,
    string calldata symbol_,
    address owner_,
    uint256 amount,    
    uint256 fee_,
    string memory uri
  ) public returns(address) {
    id++;
    address newNFT = NFT_Origin.clone();            
    
    ERC721UUPS(newNFT).initialize(
    name_,
    symbol_,
    uri,
    amount,
    fee_,
    owner_
  );   
    addressMAp[owner_].add(id);
    listToken.set(id,newNFT);
    clones_.push(newNFT);    
    return newNFT;
    
}

function getOwnerToken(address users_, uint index) public view returns(uint){
    return addressMAp[users_].at(index);
}


function getAddressForAddress(address users_) public view returns(uint[] memory){
    uint[] memory data = new uint[](addressMAp[users_].length());
    for(uint i=0;i< data.length; i++){
        data[i]= addressMAp[users_].at(i);
    }
    return data;
}

function getTokenMintForAddress(address user_) public view returns(uint){
    return addressMAp[user_].length();
}

function getAllTokenAddress() public view returns(address[] memory){
    return clones_;
}

function getAllTokenAddressForUser(address user_) public view returns(address[] memory){
    address[] memory data = new address[](addressMAp[user_].length());
    for(uint i=0;i< data.length; i++){
        uint index= addressMAp[user_].at(i);
        data[i]=listToken.get(index);
    }
    return data;
}
}
