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

		// New / View Action ctrls
		'MatterAction/CreateNewAction': 'Run_CtrlAddAction',
		'MatterAction/MatterActionsList': 'Run_CtrlViewActions'
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

		console.log('ACTION!', action);

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

console.log('setting up main-controller message listener');
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
function Run_CtrlServices( action  ) {
	if (Services_Controller)
		Services_Controller( action );
}

// run controller code in CtrlAddAction.js
function Run_CtrlAddAction( action ) {
	if (AddAction_Controller)
		AddAction_Controller( action );
}

// run controller code in CtrlViewActions.js
function Run_CtrlViewActions( action ) {
	if (ViewActions_Controller)
		ViewActions_Controller( action );
}

// ======================================= OTHER FUNCTIONS ========================================

/**
 * Function is called when "Import Clients" is hit, so figure out where to go now
 * based on url. If we're not on Advanced Search page, get there. Otherwise, let 
 * Run_CtrlAdvancedSearch figure out what to do
 * 
 */
function BeginClientImport() {
	var url = Utils_GetPageURL();

	if ( url.indexOf('SearchClientDetails/AdvancedSearch') === -1 ) {
		Utils_NavigateToTab( Utils_GetTabHref('AdvancedSearch') );
	} else {
		// first action in advanced search is to search for clients
		Run_CtrlAdvancedSearch('SEARCH_FOR_CLIENT');
	}
}

// ======================================= PUBLIC FUNCTIONS ========================================

/**
 * Function will decide the next step to take AFTER client has been created (or found)
 * - if SERVICE_CODE is found in client data, go to services page.
 * - else, go back to advanced search page and to next client.
 * 
 * Called by: ClientBasicInformation.js
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
		var FTs = Utils_GetFieldTranslator( 'Service' );
		if (!FTs) return; // basically quit doing anything else!

		// 2) get service code column from spreadsheet data
		// (service code is only required field for any service or action entering)
		var serviceCode = client['SERVICE CODE'];

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
				Utils_NavigateToTab( Utils_GetTabHref('AdvancedSearch') );
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
				Utils_NavigateToTab(Utils_GetTabHref( 'Services' ));
			});
		}
	});
}
