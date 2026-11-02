// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @notice LitChat LiteForge MVP: community registry + URI NFTs + fixed-price native-token marketplace.
/// @dev Experimental. NOT ERC-721. Not audited. Testnet only.
contract LitChat {
    struct Community { address creator; string name; string description; uint256 members; }
    struct NFT { address creator; address owner; string name; string uri; }
    struct Listing { uint256 nftId; address seller; uint256 price; bool active; }

    uint256 public communityCount;
    uint256 public nftCount;
    uint256 public listingCount;
    mapping(uint256=>Community) public communities;
    mapping(uint256=>mapping(address=>bool)) public isMember;
    mapping(uint256=>NFT) public nfts;
    mapping(uint256=>Listing) public listings;

    event CommunityCreated(uint256 indexed id,address indexed creator,string name);
    event JoinedCommunity(uint256 indexed id,address indexed member);
    event NFTMinted(uint256 indexed id,address indexed creator,string uri);
    event NFTListed(uint256 indexed listingId,uint256 indexed nftId,address indexed seller,uint256 price);
    event NFTSold(uint256 indexed listingId,uint256 indexed nftId,address buyer,address seller,uint256 price);
    event ListingCancelled(uint256 indexed listingId);

    function createCommunity(string calldata name,string calldata description) external {
        require(bytes(name).length>0,"Name required");
        uint256 id=communityCount++;
        communities[id]=Community(msg.sender,name,description,1);
        isMember[id][msg.sender]=true;
        emit CommunityCreated(id,msg.sender,name);
    }
    function joinCommunity(uint256 id) external {
        require(id<communityCount,"Invalid community");
        require(!isMember[id][msg.sender],"Already joined");
        isMember[id][msg.sender]=true; communities[id].members++;
        emit JoinedCommunity(id,msg.sender);
    }
    function mintNFT(string calldata name,string calldata uri) external {
        require(bytes(name).length>0,"Name required");
        require(bytes(uri).length>0,"URI required");
        uint256 id=nftCount++;
        nfts[id]=NFT(msg.sender,msg.sender,name,uri);
        emit NFTMinted(id,msg.sender,uri);
    }
    function listNFT(uint256 nftId,uint256 priceWei) external {
        require(nftId<nftCount,"Invalid NFT");
        require(nfts[nftId].owner==msg.sender,"Not owner");
        require(priceWei>0,"Price must be > 0");
        uint256 id=listingCount++;
        listings[id]=Listing(nftId,msg.sender,priceWei,true);
        emit NFTListed(id,nftId,msg.sender,priceWei);
    }
    function buyNFT(uint256 listingId) external payable {
        Listing storage l=listings[listingId];
        require(l.active,"Inactive listing");
        require(msg.value==l.price,"Incorrect payment");
        require(msg.sender!=l.seller,"Seller cannot buy");
        l.active=false;
        nfts[l.nftId].owner=msg.sender;
        (bool sent,)=payable(l.seller).call{value:msg.value}("");
        require(sent,"Payment failed");
        emit NFTSold(listingId,l.nftId,msg.sender,l.seller,l.price);
    }
    function cancelListing(uint256 listingId) external {
        Listing storage l=listings[listingId];
        require(l.active,"Inactive listing");
        require(l.seller==msg.sender,"Not seller");
        l.active=false;
        emit ListingCancelled(listingId);
    }
}
