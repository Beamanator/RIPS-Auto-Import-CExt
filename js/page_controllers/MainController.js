// console.log('loading maincontent.js');

/*
=================================== CONSTANTS AREA =======================================
*/
/**
 * Function returns a config object for handling specific functions to be called, based
 * off a page URL and an action.
 * 
 * @returns config object in this format:
 * {
 * 		'URL_Piece1': 'URL_ControllerFn1',
 * 		'URL_Piece2': 'URL_ControllerFn2'
 * }
 */
function getPageControllerFunctions() {
	return {
		// Advanced Search ctrl
		'SearchClientDetails/AdvancedSearch': 'Run_CtrlAdvancedSearch',
		'SearchClientDetails/ClientListSearchResult': 'Run_CtrlAdvancedSearch',

		// Registration / CBI ctrls
		'Registration/Registration': 'Run_CtrlRegistration',
		'ClientDetails/ClientDetails': 'Run_CtrlClientBasicInformation',

		// Service ctrl
		'ClientDetails/ClientServicesList': 'Run_CtrlServices',
		'MatterAction/CreateNewServices': 'Run_CtrlServices',

		// Action ctrl
		'MatterAction/CreateNewAction': '',
		'MatterAction/MatterActionsList': ''
	}
}

//================================ DOCUMENT FUNCTIONS ======================================
$(document).ready(function(){
	var pageURL = Utils_GetPageURL();

	// setup config obj for background.js
	var mObj = {
		action: 'get_data_from_chrome_storage_local',
		keysObj: {
			'ACTION_STATE': ''
		}
	};

	chrome.runtime.sendMessage(mObj, function(response) {
		// responses should come back in the same order, so:
		var action = response['ACTION_STATE'];

		// if action indicates we're not ready to automatically continue, quit
		if (action === "WAITING" || action === "" || action === undefined) {
			console.log('Action state <' + action + '> indicates time to wait :)');
			return;
		}

		// get url piece string from current page's url
		var urlPiece = Utils_GetUrlPiece( pageURL );

		// get controller function name from config object
		var ctrlFuncName = getPageControllerFunctions()[urlPiece];

		// get controller function from window
		var ctrlFunc = window[ctrlFuncName];

		// call controller function, if exists
		if (ctrlFunc)
			ctrlFunc( action );
		else {
			console.error('controller function for <' + urlPiece + '> is not defined');
		}
	});
});

/*
================================== CHROME LISTENERS ======================================
*/

// Listener tracks any changes to local storage in chrome console 
// From here: https://developer.chrome.com/extensions/storage
chrome.storage.onChanged.addListener(function(changes, namespace) {
	// console.log('storage changes', changes);
	for (key in changes) {
		var storageChange = changes[key];

		console.log('Storage key "%s" in namespace "%s" changed. ' +
			'Old value was "%s", new value is "%s".',
			key,
			namespace,
			storageChange.oldValue,
			storageChange.newValue
		);
	}
});

// Listener for messages from background.js
chrome.runtime.onMessage.addListener( function(request, sender, sendResponse) {
	console.log('heard message in MainContent.js!');
	// Kick things off via request.message in MainContent.js!
	switch( request.message ) {
		// case "clear_client_data":
		// 	clearClientData(); // Clears student data
		// 	break;

		// case will be hit ONLY when "Import Clients" button is clicked from popup
		case "begin_client_import":
			BeginClientImport();
			break;

		default:
			ThrowError({
				message: 'message not handled in MainContent.js: ' + request.message,
				errMethods: ['mConsole']
			});
	}
});

// ======================= PAGE-SPECIFIC CONTROLLER CALLS ===========================
// run controller code in CtrlAdvancedSearch.js
function Run_CtrlAdvancedSearch( action ) {
	if (AdvancedSearch_Controller)
		AdvancedSearch_Controller( action );
}

// run controller code in CtrlRegistration.js
function Run_CtrlRegistration( action ) {
	if (Registration_Controller)
		Registration_Controller( action );
}

// run controller code in CtrlClientBasicInformation.js
function Run_CtrlClientBasicInformation( action ) {
	if (ClientBasicInformation_Controller)
		ClientBasicInformation_Controller( action );
}

// run controller code in CtrlServices.js
function Run_CtrlServices( action  ){
	if (Services_Controller)
		Services_Controller( action );
}

// TODO: handle these functions in AdvancedSearch_Controller!
// function StartImport( clientData ) {
// 	AdvancedSearch_StartImport( clientData );
// }
// function importNextClient() {
// 	AdvancedSearch_ImportNextClient();
// }
// function processAdvancedSearchResults() {
// 	AdvancedSearch_ProcessSearchResults();
// }

// ======================================= OTHER FUNCTIONS ========================================

/**
 * Function is called when "Import Clients" is hit, so figure out where to go now
 * based on url. If we're not on Advanced Search page, get there. Otherwise, let 
 * Run_AdvancedSearch figure out what to do
 * 
 */
function BeginClientImport() {
	var url = Utils_GetPageURL();

	if ( url.indexOf('SearchClientDetails/AdvancedSearch') === -1 ) {
		Utils_NavigateToTab('/Stars/SearchClientDetails/AdvancedSearch');
	} else {
		// first action in advanced search is to search for clients
		Run_AdvancedSearch('SEARCH_FOR_CLIENT');
	}
}

// ======================================= PUBLIC FUNCTIONS ========================================

/**
 * Function will decide the next step to take AFTER client has been created (or found)
 * - if SERVICE_CODE is found in client data, go to services page.
 * - else, go back to advanced search page and to next client.
 * 
 * Called by: AdvancedSearch.js, ClientBasicInformation.js
 */
function MainContent_DoNextStep() {
	// 1) get client data & index again
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

		// get field translator		
		var FT = Utils_GetFieldTranslator();
		if (!FT) return; // basically quit doing anything else!

		// 2) get service code column
		// (service code is only required field for any service or action entering)
		var serviceCode = client[FT['SERVICE_CODE']];

		// 3.A) if there is no service code, go back to advanced search page to process
		// next client.
		if (!serviceCode) {
			// store next action state before redirecting to Advanced Search
			var mObj2 = {
				action: 'store_data_to_chrome_storage_local',
				dataObj: {
					'ACTION_STATE': 'SEARCH_FOR_CLIENT',
					'CLIENT_INDEX': '' // auto increment
				}
			};
		
			// saves action state, then redirects to advanced search
			chrome.runtime.sendMessage(mObj2, function(response) {
				Utils_NavigateToTab('/Stars/SearchClientDetails/AdvancedSearch');
			});
		}

		// 3.B) if there is a service code, set action state and redirect to
		// services page to figure out what data to add
		else {
			var mObj2 = {
				action: 'store_data_to_chrome_storage_local',
				dataObj: {
					'ACTION_STATE': 'CHECK_CLIENT_SERVICES'
				}
			};
		
			// after saving action state, redirect to services page
			chrome.runtime.sendMessage(mObj2, function(response) {
				Utils_NavigateToTab('/Stars/ClientDetails/ClientServicesList');
			});
		}
	});
}



// function to localize where messages are sent
// Options:
// 		1 = console.log (default)
//  	2 = alert()
// 		3 = both (console.log then alert)
// function message(text, option) {
// 	if (!text) return;
// 	else {
// 		if (option === 1) {
// 			console.log(text);
// 		} else if (option === 2) {
// 			alert(text);
// 		} else if (option === 3) {
// 			console.log(text);
// 			alert(text);
// 		} else {
// 			// default message method - no valid 'option' specified
// 			console.log(text);
// 		}
// 	}
// }



// save data to local storage
// @Returns a promise after value(s) have been saved
// format of valueList:
// 	[
// 		{'key1': 'value1'},
// 		{'key2': 'value2'}
// 	]
// function updateStorageLocal(valueList) {
// 	var storePromises = [];
// 	// Check that valueList contains some values.
// 	if (!valueList || valueList.length < 1) {
// 		message('Error: No value specified to update');
// 		// TODO: add null promise here?
// 		return;
// 	}

// 	// loop through array valueList:
// 	for (var i = 0; i < valueList.length; i++) {
// 		var valueObj = valueList[i];

// 		// tempCount counts # of key / value pairs inside valueObj. If there's more than one, error and quit.
// 		var tempCount = 0;

// 		// vars to store key : value pair from valueObj.
// 		var key, value;

// 		// get key & value in 'valueObj':
// 		for (var k in valueObj) {
// 			tempCount++;
// 			if (tempCount > 1) {
// 				reject('Error: Invalid format of valueList - Cannot store to local storage', 3);
// 				return;
// 			}

// 			key = k; value = valueObj[k];
// 		}

// 		/* ============== EXPLANATION FOR KEYS =============
// 				CLIENT_INDEX  - holds the index of the current client to add
// 				ACTION_STATE  -	holds the current state of the import.
// 								CLIENT_ACTION_ADDED 	= added an action to the client
// 								CLIENT_ACTION_SERVICE_SELECTED
// 														= selected service from dropdown in add action page

// 								CLIENT_CREATED 			= saved a client to the RIPS database

// 								CLIENT_SERVICE_ADDED 	= added service to client
// 								CLIENT_SERVICE_NEEDED	= client needs AEP service.
// 								CLIENT_SERVICE_REOPENED = service 'Adult Education Program' reopened

// 		*/
// 		switch (key) {
// 			case 'CLIENT_INDEX':
// 				// console.log('updating client index with:', value, '<-');
// 				if (value != undefined && value !== '') {
// 					storePromises.push( saveValueToStorage('CLIENT_INDEX', value) );
// 				} else {
// 					storePromises.push(
// 						getValueFromStorage('CLIENT_INDEX')
// 						.then(function(clientIndex) {
// 							if (clientIndex === undefined || clientIndex === '') clientIndex = 0;
// 							else if (typeof clientIndex != 'number') clientIndex = parseInt(clientIndex);
// 							return saveValueToStorage('CLIENT_INDEX', clientIndex + 1);
// 						})
// 					);
// 				}
// 				break;
// 			case 'ACTION_STATE':
// 				var actionState = value;
// 				storePromises.push(
// 					saveValueToStorage('ACTION_STATE', actionState)
// 				);
// 				break;
// 			case 'CLIENT_DATA_LENGTH':
// 				var clientArrayLength = value;
// 				storePromises.push(
// 					saveValueToStorage('CLIENT_DATA_LENGTH', clientArrayLength)
// 				);
// 				break;
// 			case 'CLIENT_DATA':
// 				var clientArray = value;
// 				storePromises.push(
// 					saveValueToStorage('CLIENT_DATA', clientArray)
// 				);
// 				break;
// 			case 'DUPLICATE_CLIENT_STARS_ID':
// 				storePromises.push(
// 					getValueFromStorage('DUPLICATE_CLIENT_STARS_ID')
// 					.then(function(dupClientString) {
// 						if (value === '') {
// 							return saveValueToStorage('DUPLICATE_CLIENT_STARS_ID', '-');
// 						} else {
// 							dupClientString += (value + ',');
// 							return saveValueToStorage('DUPLICATE_CLIENT_STARS_ID', dupClientString);
// 						}
// 					})
// 				);
// 				break;
// 		}
// 	}

// 	return Promise.all(storePromises);
// }

// Function returns a promise w/ a message stating the key / value pair were stored successfully
// maybe do some type of validation on input / output.
// function saveValueToStorage(key, value) {
// 	return new Promise( function(resolve, reject) {
// 		var obj = {};
// 		obj[key] = value;

// 		chrome.storage.local.set(obj, function() {
// 			// successful
// 			resolve('Saved: ' + key + ':' + value);
// 		});
// 	});
// }

// // Function returns a promise w/ the value from chrome data storage key:value pair
// // maybe do some type of validation on input / output.
// // change out from 'value' to {key: 'value'} - REQUIRES LOTS OF REFACTORING
// function getValueFromStorage(key) {
// 	return new Promise( function(resolve, reject) {
// 		chrome.storage.local.get(key, function(item) {
// 			// successful
// 			resolve(item[key]);
// 		});
// 	});
// }

// // Function returns a promise (promise.all) with the returned values from given keys
// function getMultipleValuesFromStorage(keys) {
// 	var promises = [];

// 	for (var i in keys) {
// 		promises.push( getValueFromStorage(keys[i]) );
// 	}

// 	return Promise.all(promises);
// }



