// TODO: Some sort of serious logging
function onError(err) {
  alert("Quick, Call batman! We have a: " + err);
  $('#onCreateCBDBtn')[0].disabled = false
}

function toEther(item) {
  return web3.utils.fromWei(Number(item), "ether")
}
function onGetFullState(state, address) {
  cbdObject = parseCBDState(state)
  buildCBDRow(cbdObject, CBDs.length);
  CBDs.push(cbdObject);  
}

function buildCBDRow(cbdObject, index){
  if(index !== 0) $("tbody").append($(".mainTableRow").first().clone());
  switch(cbdObject.state){
    case 0:
      $(`.state:eq(${index})`).parent().css("background-color", "aquamarine");
      break;
    case 1:
      $(`.state:eq(${index})`).parent().css("background-color", "cyan");
      break;
    case 2:
      $(`.state:eq(${index})`).parent().css("background-color", "grey");
      break;
  }
  $(`.state:eq(${index})`).text(CBD_STATES[cbdObject.state]);
  $(`.contractAddress:eq(${index})`).text(cbdObject.contractAddress);
  $(`.contractAddress:eq(${index})`).attr("href", `interact.html?contractAddress=${cbdObject.contractAddress}`);
  $(`.licensedArchitectAddress:eq(${index})`).html(`\n <a href='${window.etherscanURL}${cbdObject.licensedArchitect}'>${cbdObject.licensedArchitect}</a>`);
  // $(`.licensedArchitectAddress:eq(${index})`).text(cbdObject.licensedArchitect);
  if(cbdObject.associateArchitect !== "0x0000000000000000000000000000000000000000"){
    // $(`.associateArchitect:eq(${index})`).text("associateArchitect: \n" + );
    $(`.associateArchitect:eq(${index})`).html(`Associate \n <a href='${window.etherscanURL}${cbdObject.associateArchitect}'>${cbdObject.associateArchitect}</a>`);
  }else{
    $(`.associateArchitect:eq(${index})`).html(`No Associate! <a href='interact.html?contractAddress=${cbdObject.contractAddress}'> Commit ether to become the associateArchitect.</a>`);
  }
  $(`.balance:eq(${index})`).text(cbdObject.balance);
  $(`.commitThreshold:eq(${index})`).text(cbdObject.commitThreshold);
  $(`.fundsDeposited:eq(${index})`).text(cbdObject.amountDeposited);
  $(`.fundsReleased:eq(${index})`).text(cbdObject.amountReleased);
  $(`.defaultAction:eq(${index})`).text(cbdObject.defaultAction);
  $(`.autoreleaseInterval:eq(${index})`).text(cbdObject.autoreleaseInterval/60/60 + " hours");
  if(cbdObject.autoreleaseTime != 0){
    if(cbdObject.autoreleaseTimePassed){
      $(`.autoreleaseTime:eq(${index})`).text(new Date(cbdObject.autoreleaseTime * 1000).toLocaleString());
      $(`.autoreleaseTime:eq(${index})`).css("color","red");
    }
    else{
      $(`.autoreleaseTime:eq(${index})`).text(secondsToDhms(Number(cbdObject.autoreleaseTime - currentTime)));
      $(`.autoreleaseTime:eq(${index})`).css("color","green");
    }
  }
  else{
    $(`.autoreleaseTime:eq(${index})`).text("- Not Committed Yet -");
  }
  $(`.recordBook:eq(${index})`).text(cbdObject.recordBook);
  $(`.initialStatement:eq(${index})`).text(cbdObject.initialStatement);
}

__loadManagerInstance.execWhenReady(function() {

  //get all newCBD events
  window.CBDs = [];

  // TODO: Figure out events
  //window.event = CBDFactory.contractInstance.NewCBD({}, {"fromBlock": CBDFactoryCreationBlock});//NewCBD is an event, not a method; it returns an event object.
  // window.recoverEvent = CBDFactory.contractInstance.FundsRecovered({}, {"fromBlock": 1558897});

  CBDContractFactory.methods.getCBDCount().call()
  .then(function(res){
    var nContracts = Number(res)
    var contractArray = new Array(nContracts);
    for(var contractIdx = 0; contractIdx < nContracts; contractIdx++)
    {
      CBDContractFactory.methods.getCBDContract(contractIdx).call()
      .then(function(address) {
        CBDContract.options.address = address
        CBDContract.methods.getFullState().call()
        .then(function(state) {
          onGetFullState(state, address);
        }, onError)
      }, onError);
    }
  }, onError)
});
