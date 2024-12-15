const EVMNodeFetcher = require('../../data_source/external/evm_nodes/ethereum_node_fetcher');

class EVMNodeService {
    constructor(provider, providers) {
        this.primary_provider = provider;
        this.providers = providers;
        this.MAXIMUM_BATCH_SIZE = 100;
    }

    // find the closest block BEFORE (or exactly at) given epoch using binary search.
    // time complexity O(log(n)) where n is the number of current block
    async getBlockByEpoch(epochTime) {
        console.log('Finding block for given epoch:', epochTime);

        const fetcher = new EVMNodeFetcher(this.primary_provider);
        const latestBlock = await fetcher.getCurrentBlock();

        if (epochTime > latestBlock.timestamp) {
            throw new Error('Epoch time is greater than the latest block timestamp.');
        }

        let lower = 0;
        let upper = Number(latestBlock.number);
        let resultBlock = null;

        while (lower <= upper) {
            const mid = Math.floor((lower + upper) / 2);

            console.log(`Checking timestamp for block number: ${mid}.`);

            // try to get block using primary provider
            let block = await fetcher.getBlock(mid);

            // if failed, retry until found by using random provider.
            while (!block) {
                const randomProvider = this.providers[Math.floor(Math.random() * this.providers.length)];
                const randomFetcher = new EVMNodeFetcher(randomProvider);
                try {
                    block = await randomFetcher.getBlock(mid);
                } catch (err) {
                    console.warn(`Error fetching block ${mid}:`, err);
                }
            }

            console.log(`Timestamp: ${block.timestamp} (${new Date(Number(block.timestamp) * 1000).toLocaleString()})`);

            if (block.timestamp === epochTime) {
                // Exact match found
                resultBlock = block;
                break;
            } else if (block.timestamp < epochTime) {
                lower = mid + 1;
                resultBlock = block; // Potential result, but keep searching
            } else {
                upper = mid - 1;
            }
        }

        if (!resultBlock) {
            throw new Error('No block found for the given epoch time.');
        }

        console.log(`[FOUND] Block number at or right before epoch: ${resultBlock.number}`);
        return resultBlock;
    }


    async getBatchBalance(listOfAddresses, blockNumber) {
        const uniqueAddresses = new Set(listOfAddresses);
        const totalUniqueAddress = uniqueAddresses.size;
        const addressBalanceMap = new Map();
        let processed = 0

        console.log('finding addresses ETH balance...')

        // retry until all owners are found
        while (uniqueAddresses.size > 0) {
            const promises = [];

            let batchSize = Math.floor(uniqueAddresses.size / this.providers.length) + 1;
            batchSize = Math.min(batchSize, this.MAXIMUM_BATCH_SIZE)

            // split token id to each provider equally
            for (const provider of this.providers) {

                const addresses = []

                for (const address of uniqueAddresses) {
                    if (addresses.length >= batchSize) {
                        break
                    }
                    addresses.push(address)
                    uniqueAddresses.delete(address);
                }

                if (addresses.length > 0) {
                    promises.push(this.#getSubBatchBalance(provider, addresses, blockNumber));
                }
            }

            const listOfAddressBalanceMap = await Promise.all(promises);

            for (const tempAddressBalanceMap of listOfAddressBalanceMap) {
                for (const [address, balance] of tempAddressBalanceMap.entries()) {
                    if (balance !== null) {
                        processed+=1
                        addressBalanceMap.set(address, balance);
                    } else {
                        uniqueAddresses.add(address); // retry mechanism if owner not found due to fetching issue
                    }
                }
            }
            console.log(`finding balance progress: ${processed}/${totalUniqueAddress}`);
        }


        return addressBalanceMap
    }

    async #getSubBatchBalance(provider, listOfAddresses, blockNumber) {
        // console.log('getSubBatchBalance', provider, listOfAddresses);

        const fetcher = new EVMNodeFetcher(provider);

        const addressesPromises = listOfAddresses.map(address =>
            fetcher.getBalance(address, blockNumber)
                .then(balance => {
                    return {address, balance};
                })
                .catch(error => {
                    // console.error(`Error fetching owner for Token ID ${tokenId}:`, error);
                    return {address, balance: null}; // Handle error and continue
                })
        );

        const results = await Promise.all(addressesPromises);

        // Create a Map from list
        return new Map(
            results.map(({address, balance}) => [address, balance])
        );
    }
}

module.exports = EVMNodeService;