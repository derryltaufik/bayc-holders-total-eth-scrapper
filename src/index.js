const config = require('./config/config');
const BAYCScrapperService = require('./services/bayc_scrapper_services')
const baycScrapperService = new BAYCScrapperService(config.ethereum.primary_provider, config.ethereum.all_providers)

async function main(epoch) {
    try {
        await baycScrapperService.getBAYCHoldersWalletTotalETHValueGivenAnEpoch(epoch)
    } catch (error) {
        console.error('error', error);
    }
}

main(1619844605); // REPLACE THE EPOCH HERE
