const ERC721Service = require('./ERC721_services/erc721_service');
const EVMNodeService = require('./evm_services/evm_node_service');
const SCConstants = require('../util/contracts/constants/sc_constants');
const {Web3} = require("web3");


class BAYCScrapperService {
    #primary_provider;
    #providers;
    #erc721Service;
    #evmNodeService;

    constructor(primaryProvider, providers) {
        this.#primary_provider = primaryProvider;
        this.#providers = providers;
        this.#erc721Service = new ERC721Service(primaryProvider, providers);
        this.#evmNodeService = new EVMNodeService(primaryProvider, providers);
    }


    async getBAYCHoldersWalletTotalETHValueGivenAnEpoch(epoch) {
        epoch = this.#convertToSecondsEpoch(epoch) // handle cases when epoch received accuracy is up to miliseconds

        console.log('========== STEP #1: CONVERT EPOCH TO BLOCK NUMBER ==========')
        const block = await this.#evmNodeService.getBlockByEpoch(epoch)
        const blockNumber = block.number
        console.log('block number found')
        console.log('========== END OF STEP #1 ==========')

        console.log('\n\n')

        console.log('========== STEP #2: FIND ALL BAYC HOLDER\'S ADDRESSES AT GIVEN BLOCK NUMBER ==========')
        const holderMap = await this.#erc721Service.getOwners(SCConstants.ethereum.mainnet.ERC721.BAYC.address, blockNumber) // map of token id -> owner address
        console.log('all holders\' addresses found')
        console.log('total unique address:', (new Set(holderMap.values())).size)
        console.log('========== END OF STEP #2 ==========')

        console.log('\n\n')

        console.log('========== STEP #3: FIND ALL ADDRESSES ETH VALUE AT GIVEN BLOCK NUMBER ==========')
        const listOfHolderAddresses = holderMap.values()
        const addressBalanceMap = await this.#evmNodeService.getBatchBalance(listOfHolderAddresses)
        console.log('all addresses\' ETH balance found')
        console.log('========== END OF STEP #3 ==========')

        console.log('\n\n')

        console.log('========== STEP #4: CALCULATE TOTAL ETH VALUE OF ALL ADDRESSES ==========')
        const total = this.#calculateTotal(addressBalanceMap.values());
        console.log('total calculated')
        console.log('========== END OF STEP #4 ==========')

        console.log('\n\n')

        console.log(`FINAL ANSWER: The total ETH across all UNIQUE BAYC holders (each address balance only counted only once, regardless of how many tokens held) at epoch ${epoch} is ${Web3.utils.fromWei(total, 'ether')} ETH.\n`);
    }

    #calculateTotal(listOfBalance) {
        let total = BigInt(0)
        for (const balance of listOfBalance) {
            total += balance

        }
        return total
    }

    #convertToSecondsEpoch(epoch) {
        if (epoch.toString().length === 13) {
            return Math.floor(epoch / 1000);
        }
        return epoch;
    }
}

module.exports = BAYCScrapperService