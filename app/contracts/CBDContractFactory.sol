pragma solidity ^0.4.17;

import "./CBDContract.sol";

contract CBDContractFactory {

    // In order to verify incoming orders are from
    // licensed architects, we check the address vs
    // our saved list of users. (Because we need
    // to verify existence of the architect, we 
    // use a mapping instead of an array)
    uint numLicensedArchitects;
    mapping(address => uint) licensedArchitects;


    // contract address array.  Lists all
    // open contracts.  After a contract is
    // complete it will be removed from this
    // list.  The mapping is id->contract
    // mainly used for iterating over all open contracts
    uint totalCBDs;
    uint liveCBDs;
    mapping(uint => address) public CBDs;

    // The management address is the address that is 
    // allowed to register new verified architects
    address palladioManagement;

	event NewCBD(address indexed newCBDAddress);

    // Constructor sets the address of our management account
    // This is the only account able to add new licensedArchitects
    function CBDContractFactory(address _management) public {
        palladioManagement = _management;
    }

    // Add a new architect to the system.  This architect
    // will then be able to register new contracts
    function registerArchitect(address architect)
    public
    payable
    fromPalladio()
    checkArchitect(architect, false)
    {
        // Skip first value (0 represents null)
        numLicensedArchitects += 1;
        licensedArchitects[architect] = numLicensedArchitects;
    }

    // Returns the number of architects registered with Palladio
    function numArchitects()
    public 
    constant
    returns (uint)
    {
        return numLicensedArchitects;
    }

    // Get number of currently active contracts
	function getCBDCount()
	public
	constant
	returns(uint)
    {
		return liveCBDs;
	}

	function newCBDContract(uint serviceDeposit, uint autoreleaseInterval, string recordBook, string initialStatement)
	public
	payable
    checkArchitect(msg.sender, true)
	returns(address) 
    {
		//pass along any ether to the constructor
        CBDContract cbd = (new CBDContract).value(msg.value)(serviceDeposit, autoreleaseInterval, recordBook, initialStatement);
		NewCBD(cbd);

		//save created CBDs in contract array
        CBDs[totalCBDs] = cbd;
        totalCBDs += 1;
        liveCBDs += 1;

		return address(cbd);
	}

    function destructCBDContract(uint contractId)
    public
    contractCompleted(contractId)
    {
        delete CBDs[contractId];
    }
    
    // Modifiers below:
    
    // Ensure function call came from palladio
    modifier fromPalladio() {
        require(palladioManagement == msg.sender);
        _;
    }

    // Check if the address passed is registered as an architect
    modifier checkArchitect(address architect, bool wantArchitect) {
        bool isArchitect = licensedArchitects[architect] != 0;
        require(isArchitect == wantArchitect); 
        _;
    }

    modifier contractExists(uint contractId) {
        require(CBDs[contractId] != 0);
        _;
    }

    modifier contractCompleted(uint contractId) {
        require(CBDs[contractId] != 0);
        CBDContract cbd = CBDContract(CBDs[contractId]);
        require(cbd.state() == CBDContract.State.Closed);
        _;
    }
}