/*
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const { FileSystemWallet, Gateway } = require('fabric-network');
const path = require('path');

const ccpPath = path.resolve(__dirname, '..', '..', 'first-network', 'connection-org1.json');

if (process.argv.length != 3) {
    console.log('Require one argument: Farmer');
    return;
}

const farmer = process.argv[2];

async function main() {
    try {

        // Create a new file system based wallet for managing identities.
        const walletPath = path.join(process.cwd(), 'wallet');
        const wallet = new FileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);

        // Check to see if we've already enrolled the user.
        const userExists = await wallet.exists('user1');
        if (!userExists) {
            console.log('An identity for the user "user1" does not exist in the wallet');
            console.log('Run the registerUser.js application before retrying');
            return;
        }

        // Create a new gateway for connecting to our peer node.
        const gateway = new Gateway();
        await gateway.connect(ccpPath, { wallet, identity: 'user1', discovery: { enabled: true, asLocalhost: true } });

        // Get the network (channel) our contract is deployed to.
        const network = await gateway.getNetwork('mychannel');

        // Get the contract from the network.
        const contract = network.getContract('farm'); 
         
        const result = await contract.submitTransaction('queryCowsByFarmer', farmer);

        console.log(`Querying ${farmer}\' cows`);
        console.log(`${result.toString()}`);

        // Disconnect from the gateway.
        await gateway.disconnect();

    } catch (error) { 
        console.error(`Failed to evaluate transaction: ${error}`);
        process.exit(1);
    }
}   
    
main();
