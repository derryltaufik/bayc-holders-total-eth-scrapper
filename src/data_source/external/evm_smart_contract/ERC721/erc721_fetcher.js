const {Web3} = require('web3');
const ERC721_ABI = require('./../../../../util/contracts/ABI/ERC721.json');

class ERC721Fetcher {
    constructor(provider) {
        this.web3 = new Web3(new Web3.providers.HttpProvider(provider));
    }

    async getTotalSupply(erc721Address, blockNumber = null) {
        try {
            const contract = new this.web3.eth.Contract(ERC721_ABI, erc721Address);
            const totalSupply = blockNumber
                ? await contract.methods.totalSupply().call({}, blockNumber)
                : await contract.methods.totalSupply().call();
            return totalSupply;
        } catch (error) {
            throw error;
        }
    }

    async getOwnerOf(erc721Address, tokenId, blockNumber = null) {
        try {
            const contract = new this.web3.eth.Contract(ERC721_ABI, erc721Address);
            return blockNumber ? await contract.methods.ownerOf(tokenId).call({}, blockNumber) : await contract.methods.ownerOf(tokenId).call();
        } catch (error) {
            throw error;
        }
    }

}

module.exports = ERC721Fetcher;