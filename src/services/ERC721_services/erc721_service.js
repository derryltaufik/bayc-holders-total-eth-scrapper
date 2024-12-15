const ERC721Fetcher = require('../../data_source/external/evm_smart_contract/ERC721/erc721_fetcher');


class ERC721Service {
    constructor(provider, providers) {
        this.primary_provider = provider;
        this.providers = providers; // list of providers
        this.MAXIMUM_BATCH_SIZE = 100;
    }

    async getOwners(address, blockNumber) {
        const erc721Fetcher = new ERC721Fetcher(this.primary_provider); // Using the first provider for totalSupply
        const totalSupply = await erc721Fetcher.getTotalSupply(address, blockNumber); // totalSupply is a BigInt
        console.log("total supply:", totalSupply);
        // Create a Set of token IDs from 0 to totalSupply - 1
        const tokenIdSet = new Set(Array.from({length: Number(totalSupply)}, (_, i) => BigInt(i)));
        const tokenIdOwner = new Map(); // Maps tokenId -> owner

        console.log('finding holders address...')
        // retry until all owners are found
        while (tokenIdSet.size > 0) {
            const promises = [];

            let batchSize = Math.floor(tokenIdSet.size / this.providers.length) + 1;
            batchSize = Math.min(batchSize, this.MAXIMUM_BATCH_SIZE)

            // split token id to each provider equally
            for (const provider of this.providers) {

                const tokenIdsBatch = []

                for (const tokenId of tokenIdSet) {
                    if (tokenIdsBatch.length >= batchSize) {
                        break
                    }
                    tokenIdsBatch.push(tokenId)
                    tokenIdSet.delete(tokenId);
                }

                if (tokenIdsBatch.length > 0) {
                    promises.push(this.#getOwnersBatch(provider, tokenIdsBatch, address, blockNumber));
                }
            }

            const listOfOwnerMaps = await Promise.all(promises);

            for (const ownerMap of listOfOwnerMaps) {
                for (const [tokenId, ownerAddress] of ownerMap.entries()) {
                    if (ownerAddress) {
                        tokenIdOwner.set(tokenId, ownerAddress);
                    } else {
                        tokenIdSet.add(tokenId); // retry mechanism if owner not found due to fetching issue
                    }
                }
            }
            console.log(`finding holder progress: ${Number(totalSupply) - tokenIdSet.size}/${totalSupply}`);
        }

        return tokenIdOwner;
    }

    async #getOwnersBatch(provider, listOfTokenIds, contractAddress, blockNumber) {
        // console.log('getOwnersBatch', provider, listOfTokenIds);

        const erc721Fetcher = new ERC721Fetcher(provider);

        const ownerPromises = listOfTokenIds.map(tokenId =>
            erc721Fetcher.getOwnerOf(contractAddress, tokenId, blockNumber)
                .then(owner => {
                    // console.log(`Token ID ${tokenId} owner: ${owner}`);
                    return {tokenId, owner};
                })
                .catch(error => {
                    // console.error(`Error fetching owner for Token ID ${tokenId}:`, error);
                    return {tokenId, owner: null}; // Handle error and continue
                })
        );

        const results = await Promise.all(ownerPromises);

        // Create a Map from list
        return new Map(
            results.map(({tokenId, owner}) => [tokenId, owner])
        );
    }
}

module.exports = ERC721Service;