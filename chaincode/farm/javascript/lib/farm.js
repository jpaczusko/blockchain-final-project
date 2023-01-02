/*
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const { Contract } = require('fabric-contract-api');

class Farm extends Contract {

    async initLedger(ctx) {
        console.info('============= START : Initialize Ledger ===========');
        const cows = [
            {
                breed: 'Holstein',
                sex: 'F',
                age: '2',
                farmer: 'Tomoko',
            },
            {
                breed: 'Angus',
                sex: 'F',
                age: '3',
                farmer: 'Brad',
            },
            {
                breed: 'Wagyu',
                sex: 'M',
                age: '6',
                farmer: 'Tomoko',
            },
            {
                breed: 'Angus',
                sex: 'F',
                age: '6',
                farmer: 'Max',
            },
            {
                breed: 'Holstein',
                sex: 'M',
                age: '4',
                farmer: 'Brad',
            },
            {
                breed: 'Guernsey',
                sex: 'M',
                age: '2',
                farmer: 'Brad',
            },
            {
                breed: 'Guernsey',
                sex: 'M',
                age: '3',
                farmer: 'Brad',
            },
            {
                breed: 'Wagyu',
                sex: 'F',
                age: '7',
                farmer: 'Max',
                },
            {
                breed: 'Polish',
                sex: 'F',
                age: '5',
                farmer: 'Tomoko',
            },
            {
                breed: 'Polish',
                sex: 'M',
                age: '3',
                farmer: 'Max',
            },
        ];

        for (let i = 0; i < cows.length; i++) {
            cows[i].docType = 'cow';
            await ctx.stub.putState('COW' + i, Buffer.from(JSON.stringify(cows[i])));
            console.info('Added <--> ', cows[i]);
        }
        console.info('============= END : Initialize Ledger ===========');
    }

    async queryCow(ctx, cowNumber) {
        const cowAsBytes = await ctx.stub.getState(cowNumber); // get the cow from chaincode state
        if (!cowAsBytes || cowAsBytes.length === 0) {
            throw new Error(`${cowNumber} does not exist`);
        }
        console.log(cowAsBytes.toString());
        return cowAsBytes.toString();
    }

    async addCow(ctx, cowNumber, sex, age, breed, farmer) {
        console.info('============= START : Create cow ===========');

        const cow = {
            breed,
            docType: 'cow',
            sex,
            age,
            farmer,
        };

        await ctx.stub.putState(cowNumber, Buffer.from(JSON.stringify(cow)));
        console.info('============= END : Create cow ===========');
    }

    async queryAllCows(ctx) {
        const startKey = 'COW0';
        const endKey = 'COW999';

        const iterator = await ctx.stub.getStateByRange(startKey, endKey);

        const allResults = [];
        while (true) {
            const res = await iterator.next();

            if (res.value && res.value.value.toString()) {
                console.log(res.value.value.toString('utf8'));

                const Key = res.value.key;
                let Record;
                try {
                    Record = JSON.parse(res.value.value.toString('utf8'));
                } catch (err) {
                    console.log(err);
                    Record = res.value.value.toString('utf8');
                }
                allResults.push({ Key, Record });
            }
            if (res.done) {
                console.log('end of data');
                await iterator.close();
                console.info(allResults);
                return JSON.stringify(allResults);
            }
        }
    }

    async changeCowFarmer(ctx, cowNumber, newFarmer) {
        console.info('============= START : changeCowfarmer ===========');

        const cowAsBytes = await ctx.stub.getState(cowNumber); // get the cow from chaincode state
        if (!cowAsBytes || cowAsBytes.length === 0) {
            throw new Error(`${cowNumber} does not exist`);
        }
        const cow = JSON.parse(cowAsBytes.toString());
        cow.farmer = newFarmer;

        await ctx.stub.putState(cowNumber, Buffer.from(JSON.stringify(cow)));
        console.info('============= END : changeCowfarmer ===========');
    }

    async calculateCowPrice(breed, sex, age) {
        // Define the base price for each breed
        const breedPrices = {
          Holstein: 500,
          Angus: 700,
          Wagyu: 1200,
          Guernsey: 400,
          Polish: 600,
        };
      
        // Define the price multiplier for each sex
        const sexMultipliers = {
          M: 1.1,
          F: 0.9,
        };
      
        // Define the price multiplier for each age group
        const ageMultipliers = {
          "1-2": 1.2,
          "3-5": 1.0,
          "6+": 0.8,
        };
      
        // Calculate the base price based on the breed
        let price = breedPrices[breed] || 0;
      
        // Apply the sex multiplier
        price *= sexMultipliers[sex] || 1;
      
        // Determine the age group
        let ageGroup = "1-2";
        if (age >= 3 && age <= 5) {
          ageGroup = "3-5";
        } else if (age >= 6) {
          ageGroup = "6+";
        }
      
        // Apply the age multiplier
        price *= ageMultipliers[ageGroup] || 1;
      
        // Return the final price
        return price;
      }

    async queryCowPrice(ctx, cowNumber) {
        const cowAsBytes = await ctx.stub.getState(cowNumber); // get the cow from chaincode state
        if (!cowAsBytes || cowAsBytes.length === 0) {
            throw new Error(`${cowNumber} does not exist`);
        }
        const cow = JSON.parse(cowAsBytes.toString());
        let price = 0;
        if (cow.breed === 'Holstein') {
            price = 1000;
        } else if (cow.breed === 'Angus') {
            price = 800;
        } else if (cow.breed === 'Wagyu') {
            price = 1500;
        } else if (cow.breed === 'Guernsey') {
            price = 500;
        } else if (cow.breed === 'Polish') {
            price = 700;
        }
        if (cow.age > 5) {
            price *= 0.9;
        }
        if (cow.sex === 'F') {
            price *= 1.1;
        }
        return price;
    }

    async queryCowsByFarmer(ctx, farmer) {
        const startKey = 'COW0';
        const endKey = 'COW999';
    
        const iterator = await ctx.stub.getStateByRange(startKey, endKey);
    
        const cows = [];
        while (true) {
            const res = await iterator.next();
    
            if (res.value && res.value.value.toString()) {
                const cow = JSON.parse(res.value.value.toString('utf8'));
                if (cow.farmer === farmer) {
                    cows.push(cow);
                }
            }
            if (res.done) {
                console.log('end of data');
                await iterator.close();
                return cows;
            }
        }
    }

}

module.exports = Farm;
