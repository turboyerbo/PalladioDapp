pragma solidity ^0.4.17;

//*Collaborative Blockchain Design (CBD) begins when the Licensed Architect (Ontario Association of Architects)is: 
// (1) digitally-verified using their unique Public Key assigned by the Palladio; 
// (2) creates an open call for submissions; and 
// (3) defines the inital value of the contract.
//
//*A verified Associate "intern" Architect can join the contract, in order to submit work annonymously when
// The Associacte Architect has:

// (1) been accredicted by the Canadian Architecture Certification Board (CACB); 
// (2) authenticated their identity using their unique CACB Public Key to access the form;
// (3) commits to the contract by making a deposit with Palladio Tokens (PAL)

// The constructor is payable, so the contract can be instantiated with initial funds.
// In addition, anyone can add more funds to the Payment by calling addFunds.

// The Licensed Architect controls most functions, but
// the lLicensed Architect can never recover the payment, so they should pay a small disposable amount.
//
// If he calls the recover() function before anyone else commit() the funds will be returned, minus the 2% fee.

// If the CBD is in the Open state, ANYONE can join the contract anonymously by a verified professional. 
// Only a digitally-verified Associate Architect can receive payment in the commited state.
// The Associate Architect MUST be verified or their submission will not be posted and the contract remains OPEN.

// An Associate Architect is digitally-verified, instantly, their Record Book Experience Form 
// is digitally signed with a time-stamp, and the contract state changes from "open()" to "commit()"
// for their eventual license review. 

// This change in the state from Open to Committed is instantaneous and cannot be reversed. 
// The CBD will never revert to the Open state once commited.
// Any associate can join the contract once it's been set via commit().

// In the committed state,
// the Licensed Architect can at any time choose to release any amount of PAL Tokens.
// any Associate Architect and any amount of funds.*

contract CBDContract {
//recordBook will never change and must be one of the following:
//A Design / Construction Documents
// 1 Programming
// 2 Site Analysis
// 3 Schematic Design
// 4 Engineering Systems Coordination
// 5 Building Cost Analysis
// 6 Code Research
// 7 Design Development
// 8 Construction Documents
// 9 Specifications & Materials Research
// 10 Document Checking and Coordination //

    string public recordBook;


	
	//CBD will start with a licensedArchitect but no associateArchitect (associateArchitect==0x0)
	address public licensedArchitect;
	address public associateArchitect;
			
	//Set to true if fundsRecovered is called
	bool recovered = false;

	//Note that these will track, but not influence the CBD logic.
	uint public amountDeposited;
	uint public amountReleased;
	

	//Amount of ether a prospective associateArchitect must pay to permanently become the associateArchitect. See commit().
	uint public serviceDeposit;

	//How long should we wait before allowing the default release to be called?
	uint public autoreleaseInterval;

	//Calculated from autoreleaseInterval in commit(),
	//and recaluclated whenever the licensedArchitect (or possibly the associateArchitect) calls delayhasDefaultRelease()
	//After this time, auto-release can be called by the associateArchitect.
	uint public autoreleaseTime;

	//Most action happens in the Committed state.
	enum State {
		Open,
		Committed,
		Closed
	}
	State public state;
	//Note that a CBD cannot go from Committed back to Open, but it can go from Closed back to Committed
	//(this would retain the committed associateArchitect). Search for Closed and Unclosed events to see how this works.

	modifier inState(State s) {
		require(s == state);
		_;
	}

	modifier onlylicensedArchitect() {
		require(msg.sender == licensedArchitect);
		_;
	}

	modifier onlyassociateArchitect() {
		require(msg.sender == associateArchitect);
		_;
	}
	modifier onlylicensedArchitectOrassociateArchitect() {
		require((msg.sender == licensedArchitect) || (msg.sender == associateArchitect));
		_;
	}

	event Created(address indexed contractAddress, address _licensedArchitect, uint _serviceDeposit, uint _autoreleaseInterval, string _recordBook);
	event FundsAdded(address from, uint amount); //The licensedArchitect has added funds to the CBD.
	event LicensedArchitectStatement(string statement);
	event AssociateArchitectStatement(string statement);
	event FundsRecovered();
	event Committed(address _associateArchitect);
	event RecordBook(string statement);
	event FundsReleased(uint amount);
	event Closed();
	event Unclosed();
	event AutoreleaseDelayed();
	event AutoreleaseTriggered();


	function CBDContract(uint _serviceDeposit, uint _autoreleaseInterval, string _recordBook, string initialStatement)
	payable 
	public
	{
		licensedArchitect = tx.origin;
		
		recordBook = _recordBook;

		state = State.Open;

		serviceDeposit = _serviceDeposit;

		autoreleaseInterval = _autoreleaseInterval;

		if (bytes(initialStatement).length > 0)
		    LicensedArchitectStatement(initialStatement);

		if (msg.value > 0) {
		    FundsAdded(tx.origin, msg.value);
			amountDeposited += msg.value;
		}

		//Created(this, _licensedArchitect, _serviceDeposit, _autoreleaseInterval, _recordBook);		
	}

	function getFullState()
	public
	constant
	returns(address, string, State, address, uint, uint, uint, uint, uint, uint) 
	{
		return (licensedArchitect, recordBook, state, associateArchitect, this.balance, serviceDeposit, amountDeposited, amountReleased, autoreleaseInterval, autoreleaseTime);
	}

	function addFunds()
	public
	payable
	{
		require(msg.value > 0);

		FundsAdded(msg.sender, msg.value);
		amountDeposited += msg.value;
		if (state == State.Closed) {
			state = State.Committed;
			Unclosed();
		}
	}

	function recoverFunds()
	public
	onlylicensedArchitect()
	inState(State.Open) 
	{
	    recovered = true;
		FundsRecovered();
		selfdestruct(licensedArchitect);
	}

	function commit()
	public
	inState(State.Open)
	payable
	{
		require(msg.value == serviceDeposit);

		if (msg.value > 0) {
			FundsAdded(msg.sender, msg.value);
			amountDeposited += msg.value;
		}

		associateArchitect = msg.sender;
		state = State.Committed;
		Committed(associateArchitect);

		autoreleaseTime = now + autoreleaseInterval;
	}


	function internalRelease(uint amount)
	private
	inState(State.Committed)
	{
		associateArchitect.transfer(amount);

		amountReleased += amount;
		FundsReleased(amount);

		if (this.balance == 0) {
			state = State.Closed;
			Closed();
		}
	}

	function release(uint amount)
	public
	inState(State.Committed)
	onlylicensedArchitect() 
	{
		internalRelease(amount);
	}

	function loglicensedArchitectStatement(string statement)
	public
	onlylicensedArchitect() 
	{
	    LicensedArchitectStatement(statement);
	}

	function logassociateArchitectStatement(string statement)
	public
	onlyassociateArchitect() 
	{
		AssociateArchitectStatement(statement);
	}

	function delayAutorelease()
	public
	onlylicensedArchitect()
	inState(State.Committed) 
	{
		autoreleaseTime = now + autoreleaseInterval;
		AutoreleaseDelayed();
	}

// Autorelease function will send all funds to Associate Architect
// Automatically sends 2% (in Wei) to Address; returns false on failure.


	function triggerAutorelease()
	public
	onlylicensedArchitect()
	inState(State.Committed)
	{
		require(now >= autoreleaseTime);
        AutoreleaseTriggered();
		internalRelease(this.balance);
	}



}