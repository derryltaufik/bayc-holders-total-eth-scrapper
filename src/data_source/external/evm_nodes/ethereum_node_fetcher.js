const {Web3} = require('web3');

class EVMNodeFetcher {
    constructor(provider) {
        this.web3 = new Web3(new Web3.providers.HttpProvider(provider));
    }

    async getCurrentBlock() {
        try {
            return await this.web3.eth.getBlock();
        } catch (error) {
            throw error;
        }
    }

    async getBlock(blockNumber) {
        try {
            return await this.web3.eth.getBlock(blockNumber);
        } catch (error) {
            throw error;
        }
    }

    async getBalance(address, blockNumber) {
        try {
            return blockNumber ? await this.web3.eth.getBalance(address, blockNumber) : await this.web3.eth.getBalance(address);
        } catch (error) {
            throw error;
        }
    }
}

module.exports = EVMNodeFetcher;