

describe("CBDContractFactory", function() {

    // First, get the array of all accounts on the testnet
    var accounts = null
    var palladio = null
    var architect = null
    var associate = null
    before(function(done) {
        this.timeout(0);
        web3.eth.getAccounts(function(error, result) {
            if(error != null)
                console.log("Couldn't get accounts: " + error);
            accounts = result

            palladio = accounts[0]
            architect = accounts[1]
            associate = accounts[2]
            done()
        });
    });

    // Deploy the contract
    before(function(done) {
        this.timeout(0);
        var contractsConfig = {
            "CBDContractFactory": {
                args: [palladio]
            }
        };
        EmbarkSpec.deployAll(contractsConfig, done);
    });

    // Test we are initialized in a valid state (and that we
    // can call the functions listed)
    it("Should have no contracts after deployment", function(done) {
        CBDContractFactory.getCBDCount(function(err, result) {
            assert.equal(result.toNumber(), 0);
            done();
        });
    });

    it("Should have no architects after deployment", function(done) {
        CBDContractFactory.numArchitects(function(err, result) {
            assert.equal(result.toNumber(), 0);
            done();
        });
    });

    
    it("Registering an architect", function(done) {
        CBDContractFactory.registerArchitect(architect, function(err, accountaddress) {
            CBDContractFactory.numArchitects(function(err, result) {
                assert.equal(result.toNumber(), 1);
                done();
            });
        });
    });

    it("Refuse duplicate architects", function(done) {
        CBDContractFactory.registerArchitect(architect, function(err, accountaddress) {
            CBDContractFactory.numArchitects(function(err, result) {
                assert.equal(result.toNumber(), 1);
                done();
            });
        });
    });

    it("Only Palladio can register architects", function(done) {
        CBDContractFactory.registerArchitect(associate, {value: 30, from: accounts[3]}, function(err, result) {
            CBDContractFactory.numArchitects(function(err, result) {
                assert.equal(result.toNumber(), 1);
                done();
            });
        });
    });

    // Create a new contract
    var cbd = null;
    it("Architect can create contract", function(done) {
        CBDContractFactory.newCBDContract(10, 30, "RecordBook: record", "Some Basic Instructions", {from: architect, gas: 4500000}, function(err, result) {
            assert.equal(result != null, true);
            cbd = CBDContract.at(result)
            CBDContractFactory.getCBDCount(function(err, result) {
                assert.equal(result.toNumber(), 1);
                done();
            });
        });
    });

    // Only architect can create contract
    it("Associate cannot create contract", function(done) {
        CBDContractFactory.newCBDContract(10, 30, "RecordBook: record", "Some Basic Instructions", {from: associate, gas: 4500000}, function(err, result) {
            assert.equal(result, null);
            CBDContractFactory.getCBDCount(function(err, result) {
                assert.equal(result.toNumber(), 1);
                done();
            });
        });
    });
})