/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright Farmership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

/*
 * The sample smart contract for documentation topic:
 * Writing Your First Blockchain Application
 */

 package main

 /* Imports
  * 4 utility libraries for formatting, handling bytes, reading and writing JSON, and string manipulation
  * 2 specific Hyperledger Fabric specific libraries for Smart Contracts
  */
 import (
		 "bytes"
		 "encoding/json"
		 "fmt"
		 "strconv"
 
		 "github.com/hyperledger/fabric/core/chaincode/shim"
		 sc "github.com/hyperledger/fabric/protos/peer"
 )
 
 // Define the Smart Contract structure
 type SmartContract struct {
 }
 
 // Define the Cow structure, with 4 properties.  Structure tags are used by encoding/json library
 type Cow struct {
		 Breed   string `json:"Breed"`
		 Sex  string `json:"Sex"`
		 Age string `json:"Age"`
		 Farmer  string `json:"Farmer"`
 }

 /*
 * The Init method is called when the Smart Contract "fabCow" is instantiated by the blockchain network
 * Best practice is to have any Ledger initialization in separate function -- see initLedger()
 */
func (s *SmartContract) Init(APIstub shim.ChaincodeStubInterface) sc.Response {
	return shim.Success(nil)
}

/*
* The Invoke method is called as a result of an application request to run the Smart Contract "fabCow"
* The calling application program has also specified the particular smart contract function to be called, with arguments
*/
func (s *SmartContract) Invoke(APIstub shim.ChaincodeStubInterface) sc.Response {

	// Retrieve the requested Smart Contract function and arguments
	function, args := APIstub.GetFunctionAndParameters()
	// Route to the appropriate handler function to interact with the ledger appropriately
	if function == "queryCow" {
			return s.queryCow(APIstub, args)
	} else if function == "initLedger" {
			return s.initLedger(APIstub)
	} else if function == "addCow" {
			return s.addCow(APIstub, args)
	} else if function == "queryAllCows" {
			return s.queryAllCows(APIstub)
	} else if function == "changeCowFarmer" {
			return s.changeCowFarmer(APIstub, args)
	}

	return shim.Error("Invalid Smart Contract function name.")
}

func (s *SmartContract) queryCow(APIstub shim.ChaincodeStubInterface, args []string) sc.Response {

	if len(args) != 1 {
			return shim.Error("Incorrect number of arguments. Expecting 1")
	}

	cAsBytes, _ := APIstub.GetState(args[0])
	return shim.Success(cAsBytes)
}

func (s *SmartContract) initLedger(APIstub shim.ChaincodeStubInterface) sc.Response {
	cows := []Cow{
			Cow{Breed: "Holstein", Sex: "F", Age: "2", Farmer: "Tomoko"},
			Cow{Breed: "Angus", Sex: "F", Age: "3", Farmer: "Brad"},
			Cow{Breed: "Wagyu", Sex: "M", Age: "6", Farmer: "Tomoko"},
			Cow{Breed: "Angus", Sex: "F", Age: "6", Farmer: "Max"},
			Cow{Breed: "Holstein", Sex: "M", Age: "4", Farmer: "Brad"},
			Cow{Breed: "Guernsey", Sex: "M", Age: "2", Farmer: "Brad"},
			Cow{Breed: "Guernsey", Sex: "M", Age: "2", Farmer: "Brad"},
			Cow{Breed: "Wagyu", Sex: "F", Age: "7", Farmer: "Max"},
			Cow{Breed: "Polish", Sex: "F", Age: "5", Farmer: "Tomoko"},
			Cow{Breed: "Polish", Sex: "M", Age: "3", Farmer: "Max"},
	}

	i := 0
	for i < len(cows) {
			fmt.Println("i is ", i)
			cAsBytes, _ := json.Marshal(cows[i])
			APIstub.PutState("Cow"+strconv.Itoa(i), cAsBytes)
			fmt.Println("Added", cows[i])
			i = i + 1
	}

	return shim.Success(nil)
}

func (s *SmartContract) addCow(APIstub shim.ChaincodeStubInterface, args []string) sc.Response {

	if len(args) != 5 {
			return shim.Error("Incorrect number of arguments. Expecting 5")
	}

	var Cow = Cow{Breed: args[1], Sex: args[2], Age: args[3], Farmer: args[4]}

	cAsBytes, _ := json.Marshal(Cow)
	APIstub.PutState(args[0], cAsBytes)

	return shim.Success(nil)
}

func (s *SmartContract) queryAllCows(APIstub shim.ChaincodeStubInterface) sc.Response {

	startKey := "Cow0"
	endKey := "Cow999"

	resultsIterator, err := APIstub.GetStateByRange(startKey, endKey)
	if err != nil {
			return shim.Error(err.Error())
	}
	defer resultsIterator.Close()

	// buffer is a JSON array containing QueryResults
	var buffer bytes.Buffer
	buffer.WriteString("[")

	bArrayMemberAlreadyWritten := false
	for resultsIterator.HasNext() {
			queryResponse, err := resultsIterator.Next()
			if err != nil {
					return shim.Error(err.Error())
			}
			// Add a comma before array members, suppress it for the first array member
			if bArrayMemberAlreadyWritten == true {
					buffer.WriteString(",")
			}
			buffer.WriteString("{\"Key\":")
			buffer.WriteString("\"")
			buffer.WriteString(queryResponse.Key)
			buffer.WriteString("\"")

			buffer.WriteString(", \"Record\":")
			// Record is a JSON object, so we write as-is
			buffer.WriteString(string(queryResponse.Value))
			buffer.WriteString("}")
			bArrayMemberAlreadyWritten = true
	}
	buffer.WriteString("]")

	fmt.Printf("- queryAllCows:\n%s\n", buffer.String())

	return shim.Success(buffer.Bytes())
}

func (s *SmartContract) changeCowFarmer(APIstub shim.ChaincodeStubInterface, args []string) sc.Response {

	if len(args) != 2 {
			return shim.Error("Incorrect number of arguments. Expecting 2")
	}

	cAsBytes, _ := APIstub.GetState(args[0])
	Cow := Cow{}

	json.Unmarshal(cAsBytes, &Cow)
	Cow.Farmer = args[1]

	cAsBytes, _ = json.Marshal(Cow)
	APIstub.PutState(args[0], cAsBytes)

	return shim.Success(nil)
}

// The main function is only relevant in unit test mode. Only included here for completeness.
func main() {

	// Create a new Smart Contract
	err := shim.Start(new(SmartContract))
	if err != nil {
			fmt.Printf("Error creating new Smart Contract: %s", err)
	}
}
