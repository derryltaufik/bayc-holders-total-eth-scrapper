module.exports = {
    ethereum: {
        primary_provider: 'https://eth-mainnet.public.blastapi.io',
        // all_providers is used for parallel call to improve query speed and for failover mechanism
        // find free provider at https://ethereumnodes.com/
        all_providers: [
            'https://eth.llamarpc.com',
            'https://eth-mainnet.public.blastapi.io',
            'https://rpc.ankr.com/eth',
            'https://rpc.flashbots.net/',
            'https://cloudflare-eth.com/',
            'https://ethereum.publicnode.com',
            'https://nodes.mewapi.io/rpc/eth',
            'https://eth-mainnet.nodereal.io/v1/1659dfb40aa24bbb8153a677b98064d7'
        ]
    }
};