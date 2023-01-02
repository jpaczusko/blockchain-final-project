echo "----- enrolling admin and registering user -----"
node enrollAdmin.js
node registerUser.js
echo "----- node queryAllCows.js -----"
node queryAllCows.js
echo "----- node queryCow.js COW6 -----"
node queryCow.js COW6
echo "----- node addCow.js COW10 M 2 Holstein Max -----"
node addCow.js COW10 M 2 Holstein Max
echo "----- node changeCowFarmer.js COW2 Max -----"
node changeCowFarmer.js COW2 Max
echo "----- node queryCowsByFarmer.js Max -----"
node queryCowsByFarmer.js Max
echo "----- node queryCowPrice.js COW2 -----"
node queryCowPrice.js COW2
echo "----- DONE -----"
