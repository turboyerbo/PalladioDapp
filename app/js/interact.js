function getSearchParameters() {
  var prmstr = window.location.search.substr(1);
  return prmstr != null && prmstr != "" ? transformToAssocArray(prmstr) : {};
}

function transformToAssocArray( prmstr ) {
  var params = {};
  var prmarr = prmstr.split("&");
  for ( var i = 0; i < prmarr.length; i++) {
      var tmparr = prmarr[i].split("=");
      params[tmparr[0]] = tmparr[1];
  }
  return params;
}

function onError(err)
{
  console.log("Error calling CBD method: " + err);
  ////workaournd////////////////////////////////////////////////////////
  console.log("This Contract doesn't exist or was destroyed.")
  document.getElementById('licensedArchitectFundsInputGroup').hidden = true;
  document.getElementById('updatelicensedArchitectStringInputGroup').hidden = true;
  document.getElementById('updateRecipientStringInputGroup').hidden = true;
  document.getElementById('commitInputGroup').hidden = true;
  document.getElementById('recoverFundsInputGroup').hidden = true;
  document.getElementById('defaultActionInputGroup').hidden = true;
  document.getElementById('delayDefaultActionForm').hidden = true;

  $('.insertAddress').text(CBD.address);
  $('#etherscanLink').attr("href", `${window.etherscanURL}${CBD.address}`);
  $('#CBDInfoOutput').text("Doesn't exist/Destroyed");
  $('#CBDlicensedArchitectOutput').text("None")
  $('#CBDRecipientOutput').text("None")
  $('#CBDlicensedArchitectStringOutput').text("None");
  $('#CBDRecipientStringOutput').text("None");
  $('#CBDBalanceOutput').text("None");
  $('#CBDCommitThresholdOutput').text("None");
  $('#CBDFundsDepositedOutput').text("None");

  $('#CBDFundsReleasedOutput').text("None");
  $('#CBDDefaultActionOutput').text("None");
  $('#CBDDefaultTimeoutLength').text("None");
  $('#CBDTable').css("background-color", "grey");
}

__loadManagerInstance.execWhenReady(function() {
  //window.etherscanURL = "https://etherscan.io/address/"
  //window.etherscanURL = "https://ropsten.etherscan.io/address/";

  params = getSearchParameters();
  address = params["contractAddress"]
  CBDContract.options.address = address

    //getEventsAndParticipants('logs','getLogs','address=' + address);

  window.checkUserAddressesInterval = setInterval(checkForUserAddresses, 1000);
  window.getFullStateInterval = setInterval(function(){
    web3.eth.getCode(address,function(err,res){
      if(res == "0x"){
        onError(err)
      }
      else{
        CBDContract.methods.getFullState().call()
        .then(function(res){
          CBD = parseCBDState(res, address)
          insertInstanceStatsInPage(CBD);
          updateExtraInput(CBD);
        }, onError);
      }
    })
  }, 3000);
});

function insertInstanceStatsInPage(CBD, address){
  $('.insertAddress').text(CBD.address);
  $('#etherscanLink').attr("href", `${window.etherscanURL}${address}`);
  $('#CBDInfoOutput').text(CBD_STATES[CBD.state]);
  $('#CBDlicensedArchitectOutput').text(CBD.licensedArchitect)
  $('#CBDlicensedArchitectStringOutput').text(CBD.initialStatement);
  CBD.recipient == '0x0000000000000000000000000000000000000000' ? $('#CBDRecipientOutput').text("None") : $('#CBDRecipientOutput').text(CBD.associateArchitect);
  $('#CBDRecipientStringOutput').text(CBD.recipientString, 'ether');
  $('#CBDBalanceOutput').text(CBD.balance + ' ETH');
  $('#CBDCommitThresholdOutput').text(CBD.commitThreshold + ' ETH');
  $('#CBDFundsDepositedOutput').text(CBD.amountDeposited + ' ETH');
  $('#CBDFundsReleasedOutput').text(CBD.amountReleased + ' ETH');

  //$('#CBDDefaultActionOutput').text(CBD.defaultAction);
  $('#CBDDefaultTimeoutLength').text(secondsToDhms(CBD.autoreleaseInterval));
  $('#CBDDefaultActionTriggerTime').text(new Date(CBD.autoreleaseTime * 1000).toLocaleString());

  switch(CBD.state)
  {
    case 0:
    $('#CBDTable').css("background-color", "rgb(204, 255, 204)");
    break
    case 1:
    $('#CBDTable').css("background-color", "cyan");
    break;
    case 2:
    $('#CBDTable').css("background-color", "grey");
    break;
  }
}


function updateExtraInput(CBD) {
  var userIslicensedArchitect = (CBD.licensedArchitect == web3.eth.defaultAccount);
  var userIsRecipient = (CBD.associateArchitect == web3.eth.defaultAccount);
  var isNullRecipient = (CBD.associateArchitect == '0x0000000000000000000000000000000000000000');

  document.getElementById('licensedArchitectFundsInputGroup').hidden = !userIslicensedArchitect;
  document.getElementById('updatelicensedArchitectStringInputGroup').hidden = !userIslicensedArchitect;
  document.getElementById('updateRecipientStringInputGroup').hidden = !userIsRecipient;
  document.getElementById('commitInputGroup').hidden = !isNullRecipient;
	document.getElementById('recoverFundsInputGroup').hidden = !(userIslicensedArchitect && isNullRecipient);
  web3.eth.getBlock("latest",
    function(err,res){
      if (err) {
          console.log("Error calling CBD method: " + err.message);
      }
      else{
        currentTime = res.timestamp;
      }
      // if(!CBD.defaultAction){
      //   document.getElementById('CBDDefaultActionTriggerTime').hidden = true;
      //   document.getElementById('CBDDefaultTimeoutLengthGroup').hidden = true;
      //   document.getElementById('defaultActionInputGroup').hidden = true;
      //   document.getElementById('delayDefaultActionForm').hidden = true;
      // }
      if(!(userIsRecipient || userIslicensedArchitect)){
        document.getElementById('defaultActionInputGroup').hidden = true;
        document.getElementById('delayDefaultActionForm').hidden = true;
      }
      else if(CBD.autoreleaseTime > 0 && CBD.autoreleaseTime < currentTime && CBD.state === 1 && (userIsRecipient || userIslicensedArchitect)){
        console.log(1)
        document.getElementById('CBDDefaultActionTriggerTime').hidden = false;
        document.getElementById('CBDDefaultTimeoutLengthGroup').hidden = false;
        document.getElementById('defaultActionInputGroup').hidden = false;
        document.getElementById('delayDefaultActionForm').hidden = false;
      }
      else if((CBD.autoreleaseTime > currentTime && CBD.state == 1 && (userIsRecipient || userIslicensedArchitect))){
        document.getElementById('CBDDefaultActionTriggerTime').hidden = false;
        document.getElementById('CBDDefaultTimeoutLengthGroup').hidden = false;
        document.getElementById('defaultActionInputGroup').hidden = true;
        document.getElementById('delayDefaultActionForm').hidden = true;
        differenceTime = Number(CBD.autoreleaseTime) - res.timestamp;
        if(0 < differenceTime && differenceTime <= 86400){
          $('#CBDDefaultActionTriggerTime').text("Remaining Time: " + secondsToDhms(differenceTime));
        }
        else{
          $('#CBDDefaultActionTriggerTime').text(new Date(CBD.autoreleaseTime * 1000).toLocaleString());
          $('#CBDDefaultActionTriggerTime').css("color", "red");
        }
      }
      else if(CBD.autoreleaseTime < currentTime && CBD.state == 1){
        document.getElementById('CBDDefaultActionTriggerTime').hidden = false;
        document.getElementById('CBDDefaultTimeoutLengthGroup').hidden = false;
      }
      else if(CBD.state == 1){
        document.getElementById('CBDDefaultActionTriggerTime').hidden = false;
        document.getElementById('CBDDefaultTimeoutLengthGroup').hidden = false;
      }
      else {
        document.getElementById('CBDDefaultActionTriggerTime').hidden = true;
        document.getElementById('CBDDefaultTimeoutLengthGroup').hidden = false;
      }
  });
}

function checkForUserAddresses() {
  web3.eth.getAccounts(function(err, accounts) {
    if (accounts != undefined && accounts.length > 0)
    if (validateAccount(accounts[0])) {
      clearInterval(checkUserAddressesInterval);
      onUserAddressesVisible(accounts[0]);
    }
    else {
        onUserAddressesNotVisible();
    }
  });
}

function onUserAddressesNotVisible() {
    document.getElementById('userAddress').innerHTML = "Can't find user addresses. If using metamask, are you sure it's unlocked and initialized?<br>";
}
function onUserAddressesVisible(account) {
    document.getElementById('userAddress').innerHTML = "User address:<br>" + account;
}

function recipientStringEditMode(flag) {
	if (flag) {
		$('#recipientStringUpdateStartButton').hide();
		$('#recipientStringUpdateTextarea').show();
		$('#recipientStringUpdateCommitButton').show();
		$('#recipientStringUpdateCancelButton').show();
		$('#CBDRecipientStringOutput').hide();
	}
	else {
		$('#recipientStringUpdateStartButton').show();
		$('#recipientStringUpdateTextarea').hide();
		$('#recipientStringUpdateCommitButton').hide();
		$('#recipientStringUpdateCancelButton').hide();
		$('#CBDRecipientStringOutput').show();
	}
}
function startRecipientStringUpdate() {
	recipientStringEditMode(true);

	$('#recipientStringUpdateTextarea').val(CBD.recipientString);
}
function cancelRecipientStringUpdate() {
	recipientStringEditMode(false);
}
function commitRecipientStringUpdate() {
	callUpdateRecipientString($('#recipientStringUpdateTextarea').val());
	recipientStringEditMode(false);
}

function licensedArchitectStringEditMode(flag) {
	if (flag) {
		$('#licensedArchitectStringUpdateStartButton').hide();
		$('#licensedArchitectStringUpdateTextarea').show();
		$('#licensedArchitectStringUpdateCommitButton').show();
		$('#licensedArchitectStringUpdateCancelButton').show();
		$('#CBDlicensedArchitectStringOutput').hide();
	}
	else {
		$('#licensedArchitectStringUpdateStartButton').show();
		$('#licensedArchitectStringUpdateTextarea').hide();
		$('#licensedArchitectStringUpdateCommitButton').hide();
		$('#licensedArchitectStringUpdateCancelButton').hide();
		$('#CBDlicensedArchitectStringOutput').show();
	}
}
function startlicensedArchitectStringUpdate() {
	licensedArchitectStringEditMode(true);

	$('#licensedArchitectStringUpdateTextarea').val(CBD.licensedArchitectString);
}
function cancellicensedArchitectStringUpdate() {
	licensedArchitectStringEditMode(false);
}
function commitlicensedArchitectStringUpdate() {
	callUpdatelicensedArchitectString($('#licensedArchitectStringUpdateTextarea').val());
	licensedArchitectStringEditMode(false);
}


//smart contract caller and handler functions
function handleCommitResult(err, res) {
    if (err) console.log(err.message);
}
function callCommit() {
  commitAmountInWei = web3.utils.toWei(CBD.commitThreshold,'ether')
  CBDContract.methods.commit().send({'value':commitAmountInWei, "from":web3.eth.defaultAccount})
  .then(handleCommitResult);
}
function handleRecoverFundsResult(err, res) {
	if (err) console.log(err.message);
}
function callRecoverFunds() {
	CBDContract.methods.recoverFunds().call().then(handleRecoverFundsResult);
}
function handleReleaseResult(err, res) {
    if (err) console.log(err.message);
}
function callRelease(amountInEth) {
    CBDContract.methods.release(web3.utils.toWei(amountInEth,'ether')).send()
    .then(handleReleaseResult);
}
function releaseFromForm() {
    var form = document.getElementById('licensedArchitectFundsInputGroup');
    var amount = Number(form.elements['amount'].value);

    callRelease(amount);
}
function handleBurnResult(err, res) {
    if (err) console.log(err.message);
}
function callBurn(amountInEth) {
    CBDContract.methods.burn(web3.toWei(amountInEth,'ether')).call()
    .then(handleBurnResult);
}
function burnFromForm() {
    var form = document.getElementById('licensedArchitectFundsInputGroup');
    var amount = Number(form.elements['amount'].value);

    callBurn(amount);
}
function handleAddFundsResult(err, res) {
	if (err) console.log(err.message);
}
function callAddFunds(includedEth) {
  CBDContract.methods.addFunds().send({'value':web3.toWei(includedEth,'ether')})
  .then(handleAddFundsResult)
}
function addFundsFromForm() {
	var form = document.getElementById('licensedArchitectFundsInputGroup');
	var amount = Number(form.elements['amount'].value);
	callAddFunds(amount);
}
function callDefaultAction(){
  CBDContract.methods.callDefaultRelease(logCallResult);
}
function delayDefaultRelease(){
  // var delayDefaultActionInHours = Number($('input[type=text]', '#delayDefaultActionForm').val());
  CBDContract.methods.delayAutorelease().call().then(logCallResult);
}
function handleUpdateRecipientStringResult(err, res) {
    if (err) console.log(err.message);
}
function callUpdateRecipientString(newString) {
    CBDContract.methods.setRecipientString(newString, handleUpdateRecipientStringResult);
}
function handleUpdatelicensedArchitectStringResult(err, res) {
    if (err) console.log(err.message);
}
function callUpdatelicensedArchitectString(newString) {
    CBDContract.methods.setlicensedArchitectString(newString, handleUpdatelicensedArchitectStringResult);
}
function callCancel() {
    CBDContract.methods.recoverFunds().call().then(logCallResult);
}

//////////////////////////////////Events Part of the interact page////////////////////////////////////////////////
function buildEventsPage(logArray, licensedArchitect, recipient){
  var who;
  var logArrayCounter = 0;
  var eventArray = [];
  logArray.forEach(function(log){
    var eventObject = {};
    (function(log){
      web3.eth.getTransaction(log.transactionHash, function(err,res){
        if(err){
          console.log("Error calling CBD method: " + err.message);
        }
        else{
          var topic = log.topics[0];
          var event = decodeTopic(topic, CBD_ABI);
          if(licensedArchitect === recipient && false){
            who = "contract";
          }
          else if(res.from === licensedArchitect){
            who = "licensedArchitect";
          }
          else if(res.from === recipient){
            who = "recipient";
          }
          eventObject.who = who;
          eventObject.event = event;
          eventObject.timeStamp = log.timeStamp;
          eventObject.arguments = returnEventArguments(log.data, event.inputs)
          eventArray.push(eventObject);

          logArrayCounter += 1;
          if(logArrayCounter === logArray.length){
            eventArray = sortOnTimestamp(eventArray);
            insertAllInChat(eventArray);
          }
        }
      });
    })(log);
  });
}

function returnEventArguments(rawArguments, eventInfo){
  var rawArgumentArray = rawArguments.substring(2).match(/.{1,64}/g);
  var argumentString;
  for(var counter = 0; counter < rawArgumentArray.length; counter++){
    var argumentEncoded = rawArgumentArray[counter];
    switch(eventInfo[counter]){
      case "address":
        argumentString += "0x" + argumentEncoded;
        break;
      case "uint256":
        argumentString += parseInt(argumentEncoded, 16);
        break;
      case "string":
        argumentString += web3.toAscii(argumentString);
        break;
      case "bool":
        argumentString += argumentString === "1";
        break;
      default:
    }
  }
}

// function insertAllInChat(eventArray){
//   eventArray.forEach(function(eventObject){
//     insertChat(eventObject.who, eventObject.event.name, new Date(parseInt(eventObject.timeStamp, 16) * 1000).toLocaleString());
//   });
// }

// function getEventsAndParticipants(moduleParam, actionParam, additionalKeyValue){
//   CBDContract.methods.getFullState(function(err, res){
//     if (err) {
//       console.log("Error calling CBD method: " + err.message);
//     }
//     else{
//       var licensedArchitect = res[1].toString();
//       var recipient = res[3].toString();
//       callEtherscanApi(moduleParam, actionParam, additionalKeyValue, function(resultJSON){
//         buildEventsPage(resultJSON.result, licensedArchitect, recipient)
//       });
//     }
//   });
// }

// function callEtherscanApi(moduleParam, actionParam, additionalKeyValue, callback){
//   var request = new XMLHttpRequest();
//   request.onreadystatechange = function(){
//     if(this.readyState == 4){
//       if(this.status == 200){
//         var resultParsed = JSON.parse(this.responseText);
//         console.log(resultParsed);
//         callback(resultParsed);
//       }
//     }
//   }
//   request.open('GET', `https://ropsten.etherscan.io/api?module=${moduleParam}&action=${actionParam}&${additionalKeyValue}&fromBlock=0&toBlock=latest`, true);
//   request.send();
// }

// function decodeTopic(topic, abi){
//   for (var methodCounter = 0; methodCounter < abi.length; methodCounter++) {
//     var item = abi[methodCounter];
//     if (item.type != "event") continue;
//     var signature = item.name + "(" + item.inputs.map(function(input) {return input.type;}).join(",") + ")";
//     var hash = web3.sha3(signature);
//     if (hash == topic) {
//       return item;
//     }
//   }
// }

// function insertChat(who, text, date){
//   var control = "";
//   if (who === "licensedArchitect"){
//     control =
//     '<li class="list-group-item list-group-item-success" style="width:100%">' +
//       '<div class="row">' +
//         '<div class="col-md-4">' +
//           '<span>' + text + '</span>' +
//           '<p><small>' + date + '</small></p>' +
//         '</div>' +
//         '<div class="col-md-4"></div>' +
//         '<div class="col-md-4"></div>' +
//       '</div>' +
//     '</li>';
//   }
//   else if(who === "recipient"){
//     control =
//       '<li class="list-group-item list-group-item-info" style="width:100%;">' +
//         '<div class="row">' +
//           '<div class="col-md-4"></div>' +
//           '<div class="col-md-4"></div>' +
//           '<div class="col-md-4">' +
//             '<span>' + text + '</span>' +
//             '<p><small>' + date + '</small></p>' +
//           '</div>' +
//         '</div>' +
//       '</li>';
//   }
//   $("ul").append(control);
// }


// function sortOnTimestamp(eventArray){
//   eventArray.sort(function(current, next){
//     if(current.timeStamp < next.timeStamp) return -1;
//     if(current.timeStamp > next.timeStamp) return 1;
//     return 0;
//   });
//   return eventArray;
// }