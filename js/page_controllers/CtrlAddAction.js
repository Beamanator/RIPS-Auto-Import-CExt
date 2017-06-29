// ============================== PAGE CONTROLLER =======================
/**
 * Controller function for Add Actions page
 * 
 * Called by: Run_CtrlAddAction [in MainContent.js]
 * 
 * @param {string} action - from chrome storage ACTION_STATE
 */
function AddAction_Controller( action ) {
	switch(action) {
		// Add action data :)
		case 'CLIENT_ADD_ACTION_DATA':
			startAddActionData();
			break;

		// Action not handled by controller!
		default:
			console.error('invalid action found in CtrlAddAction.js:', action);
	}
}

// ============================== MAIN FUNCTIONS =======================

/**
 * Function starts the process of adding action data - get client data and index
 * then call setServiceDrodown
 * 
 */
function startAddActionData() {
	// get client data and index from store
	var mObj = {
		action: 'get_data_from_chrome_storage_local',
		keysObj: {
			'CLIENT_DATA': '',
			'CLIENT_INDEX': ''
		}
	};

	chrome.runtime.sendMessage(mObj, function(response) {
		// responses come back as serializable obj
		var clientData = response['CLIENT_DATA'];
		var clientIndex = response['CLIENT_INDEX'];

		var client = clientData[clientIndex];

		var FT = Utils_GetFieldTranslator();
		if (!FT) return; // let Utils handle everything - and quit!

		// first have to set service dropdown, so get service code.
		var serviceCode = client[FT['SERVICE_CODE']];

		// then populate dropdown & wait for action dropdowns to fill in
		setServiceDropdown( serviceCode );
	});
}

/**
 * Function populates the "service" dropdown based off serviceCode, then
 * adds action data
 * 
 * @param {string} serviceCode - code that corresponds to a service description
 */
function setServiceDropdown( serviceCode ) {
	// translate service code into service description:
	var serviceDesc = Utils_GetServiceDescFromCode( serviceCode );

	// loop through options on page to find the desired option value
	$('#ddlServices > option').each(function(index, optionElem) {
		// get service description from current option element
		var optionServiceDesc = optionElem.innerText.trim().toUpperCase();

		// if this option service desc matches desired service desc:
		// 1) get id (option value), 2) put it in, 3) and break loop!
		if (optionServiceDesc === serviceDesc.toUpperCase()) {
			var optionVal = optionElem.value; // 1 - get id
			$('#ddlServices').val( optionVal ).change(); // 2 - put val in dropdown
			return false; // 3 - break loop
		}
	});

	console.log('here - service dropdown val: ', $('#ddlServices').val());
	debugger;

	// FIXME: next = add action (in separate function)
	// then add caseworker, date of action, and notes

		// if ($(this).text() === "Children's Education Program") {
			// get service 'id' from dropdown
			// var historyID = $(this).val();

			// $('#ddlServices').val(historyID);
			
			// call this from RIPS code:
			// [also seen in the html - onchange function]
			// this specific function populates the action dropdown based off service
			// location.href="javascript:updateDdlActiontype();";
			
	// 		setTimeout(function() {
	// 			// $('#ddlActions').val('32'); // just an example action to add
	// 			$('.cke_show_borders p').innerText="test note (11/20/16)";

	// 			updateStorageLocal([
	// 				{'CLIENT_INDEX': ''},
	// 				{'ACTION_STATE': 'CLIENT_ACTION_ADDED'}
	// 			])
	// 			.then(function(results) {
	// 				$('input[value="Save"]').click();
	// 			});
	// 		}, 400);
	// 	}
	// })
}

// populates the 'Action' dropdown with [256] - Spreadsheet inquiry: added to inquiry spreadsheet
// function setActionDropdown() {
// 	$('#ddlActions').val('256');

// 	// TODO: remove later!
// 	// $('#notes').val('Test Notes'); // -> doesn't work now that notes were replaced
// 	//	with an iFrame thing (changed some time before 11/20/16)
// 	$('.cke_show_borders p').innerText="hi";

// 	// TODO: change caseworker if needed!

// 	updateStorageLocal([{'ACTION_STATE': 'CLIENT_ACTION_ADDED'}])
// 	.then(function(results) {
// 		$('input[value="Save"]').click();
// 	});
// }

// navigate to next part of the workflow - searching for the next client.
function navigate(url) {
	updateStorageLocal([{'ACTION_STATE': 'SEARCH_FOR_CLIENT'}])
	.then(function(results) {
		Utils_NavigateToTab(url);
	});
}

// $(document).ready(function(){
// 	getValueFromStorage('ACTION_STATE')
// 	.then(function(action) {
// 		switch(action) {
// 			case 'CLIENT_SERVICE_ADDED':
// 				setServiceDropdown();
// 				break;
// 			// case 'CLIENT_ACTION_SERVICE_SELECTED':
// 				// setActionDropdown();
// 				// break;
// 			case 'CLIENT_ACTION_ADDED':
// 				navigate('/Stars/SearchClientDetails/AdvancedSearch');
// 				break;
// 			default:
// 				message('current ACTION_STATE ('+ action +')is preventing script from running');
// 		}
// 	})
// 	.catch(function(err) {
// 		message(err);
// 	});
// });