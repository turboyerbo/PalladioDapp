function populateArchitectAccounts() {
    var archSelect = $("#architectAccount");
}

// TODO: Some sort of serious logging
function onError(err) {
    alert("Quick, Call batman! We have a: " + err);
}
function addArchitectAccount(palladioAccount, architectAccount) {

    CBDContractFactory.methods.getPalladioAddress().call().then(function(addr) {
        // First, validate this 
        if (addr != palladioAccount)
        {
            alert("ERROR: Palladio account does not match contract account (" + palladioAccount + " != " + addr);
            return undefined;      
        }
        $("#outputDiv").html("Architect adding now: (awaiting confirmation - please wait...)");        
        return CBDContractFactory.methods.registerArchitect(architectAccount).send({'from':palladioAccount});
    }, onError).then(function(result) {
        $("#onAddArchitectBtn")[0].disabled = false
        // Should we validate this?
        return CBDContractFactory.methods.numArchitects().call();
    }, onError).then(function(value) {
        $("#outputDiv").html("Architect Added: There are " + value + " architects registered");
    }, onError);
}

function onAddArchitect() {

    var palladioAccount = getSelectedAccount("#palladioAccount")
    var architectAccount = $("#architectAccount").val(); 

    if (!validateAccount(palladioAccount))
        return
        
    if (!validateAccount(architectAccount))
        return
    
    $('#onAddArchitectBtn')[0].disabled = true
    addArchitectAccount(palladioAccount, architectAccount);
}

populateSelectWithAccounts("#palladioAccount")

__loadManagerInstance.execWhenReady(function() {
    CBDContractFactory.methods.numArchitects().call()
    .then(function(value){
        $("#outputDiv").html("There are " + value + " architects registered");
    }, onError)
})
