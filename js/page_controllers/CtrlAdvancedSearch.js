// ============================== PAGE CONTROLLER =======================
/**
 * Controller function for AdvancedSearch.js - decides what to do based off of
 * passed in action.
 * 
 * Called by: Run_AdvancedSearch [in MainContent.js]
 * 
 * @param {any} action 
 */
function AdvancedSearch_Controller( action ) {
	switch(action) {
		// Enter client UNHCR and press 'search'
		case 'SEARCH_FOR_CLIENT':
			searchForDuplicates();
			break;

		// Analyze search results
		case 'ANALYZE_CLIENT_DUPLICATES':
			processSearchResults();
			break;

		// Action not handled by AdvancedSearch.js!
		default:
			console.error('invalid action found in AdvancedSearch.js:', action);
	}
}

// ============================== MAIN FUNCTIONS =======================

/**
 * Function gets client index and data, takes the current client's UNHCR number,
 * sticks it in the UNHCR textbox, and then clicks "search"
 * 
 * Before the click, set action state to the next step - 'ANALYZE_CLIENT_DUPLICATES'
 * 
 */
function searchForDuplicates() {
	// setup config obj for background.js - get client data & client index
	var mObj = {
		action: 'get_data_from_chrome_storage_local',
		keysObj: {
			'CLIENT_INDEX': '',
			'CLIENT_DATA': ''
		}
	};

	chrome.runtime.sendMessage(mObj, function(response) {
		// successes should come back in the same order, so:
		var clientIndex = response['CLIENT_INDEX'];
		var clientData = response['CLIENT_DATA'];

		// check if client index is out of range of client data array [done!]
		if ( clientIndex >= clientData.length ) {
			var mObj = {
				action: 'finish_import'
			};

			chrome.runtime.sendMessage(mObj);
			return;
		}

		// now get UNHCR number & put it in #HoRefNo
		var client = clientData[clientIndex];
		var FT = FT_getFieldTranslator();
		
		// put UNHCR number into textbox
		$("#HoRefNo").val( client[FT['UNHCR_CASE_NO']] );

		// store next action state before clicking 'search'
		var mObj2 = {
			action: 'store_data_to_chrome_storage_local',
			dataObj: {
				'ACTION_STATE': 'ANALYZE_CLIENT_DUPLICATES'
			}
		};
	
		// send message obj, then click 'save' (refreshes page)
		chrome.runtime.sendMessage(mObj2, function(response) {
			$('input[value="Search"]').click();
		});
	});
}

function processSearchResults() {
	// First check if the window is at the Advanced Search page in RIPS
	if ( !Utils_UrlContains('SearchClientDetails/ClientListSearchResult') ) {
		// url should have SearchClientDetails/AdvancedSearch
		if ( Utils_UrlContains('SearchClientDetails/AdvancedSearch') ) {
			// no client found, so need to make a new one!
			// -> Next action is REGISTER_NEW_CLIENT
			mObj = {
				action: 'store_data_to_chrome_storage_local',
				dataObj: {'ACTION_STATE': 'REGISTER_NEW_CLIENT'}
			};
			
			// once data returns, navigate to registration page
			chrome.runtime.sendMessage(mObj, function(response) {
				Utils_NavigateToTab('/Stars/Registration/Registration');
			});
		} else {
			// error -> not sure where we're at anymore.
			ThrowError({
				message: 'Moved from Advanced Search page too abruptly :(\n'
					+ 'It is recommended to clear data & start over',
				errMethods: ['mConsole', 'mAlert']
			});
		}
	} else {
		// there are search results!!
		// first find the number of search results:
		var numResults = $('.table.table-striped.grid-table')
			.find('tr.grid-row').length;

		if (numResults > 1) {
			// grab the UNHCR number of the first row
			// [assumes UNHCR number is 1st column]
			var dupUNHCR = $('.table.table-striped.grid-table tbody tr')
				.find('td')[1].innerText;

			// throw it into the duplicate UNHCR No store
			mObj = {
				action: 'store_data_to_chrome_storage_local',
				dataObj: {
					'ACTION_STATE': 'SEARCH_FOR_CLIENT', // start searching anew
					'CLIENT_INDEX': '',	// let background.js increment CLIENT_INDEX by 1
					'DUPLICATE_CLIENT_UNHCR_NO': dupUNHCR
				}
			};
			
			// once data returns, navigate back to advanced search
			// TODO: probably only navigate if there are more clients to run though?
			chrome.runtime.sendMessage(mObj, function(response) {
				Utils_NavigateToTab('/Stars/SearchClientDetails/AdvancedSearch');
			});
		} else {
			// only found 1 client - this is hopefully our client!
			// assuming we want to automatically choose this client as our client:
			$('.table.table-striped.grid-table tbody tr')[0].click();

			// client is already available, ask MainContent what to do next
			MainContent_DoNextStep();
		}
	}

	// wait 1 second and check if alert pops up.
	// NOTE: as of March 15, 2017 - I haven't seen any alerts on this page recently
	/*setTimeout( function(){
		if ( $('.sweet-alert').hasClass('visible') ) {
			// alert was generated, meaning there weren't any clients found.
			// therefore, no duplicates. So now create new client & move to registration page
			
			$('button.confirm').click();

			// navigate to Registration page
			// updateStorageLocal([
			// 	{'ACTION_STATE': 'READY_FOR_CLIENT'}
			// ])
			// .then(function(results) {
			// 	Utils_NavigateToTab('/Stars/Registration/Registration');
			// });
		} else {
			// no alert means there were probably some duplicates
			// add to list and move to next client

			var numDuplicates = $('.table.table-striped.grid-table').find('tr.grid-row').length;

			// debugger;

			if (numDuplicates > 1) {
				// grab the STARS number of the first row, throw it into the duplicate stars id store
				var id = $('.table.table-striped.grid-table tbody tr').find('td')[0].innerText;

				updateStorageLocal([
					{'ACTION_STATE': 'SEARCH_FOR_CLIENT'},
					{'CLIENT_INDEX': ''},	// let MainContent increment CLIENT_INDEX by 1
					{'DUPLICATE_CLIENT_STARS_ID': id}
				])
				.then(function(results) {
					Utils_NavigateToTab('/Stars/SearchClientDetails/AdvancedSearch');
				});
			} else {
				// only found 1 client - this is hopefully our client!
				// assuming we want to automatically choose this client as our client:
				$('.table.table-striped.grid-table tbody tr')[0].click();

				updateStorageLocal([ {'ACTION_STATE': 'CLIENT_CREATED'} ])
				.then(function(results) {
					navigateToTab('/Stars/ClientDetails/ClientServicesList');
				});
			}
		}
	}, 1000);*/
}

// function AdvancedSearch_ImportNextClient() {
// 	// First check if the window is at the Advanced Search page in RIPS
// 	if ( !Utils_UrlContains('SearchClientDetails/AdvancedSearch') )
// 		return;

// 	// Next, get client index and client data:
// 	getMultipleValuesFromStorage(['CLIENT_DATA', 'CLIENT_INDEX'])
// 	.then(function(values) {
// 		// Next, get data & index, then search for client existence
// 		var clientData = values[0];
// 		var clientIndex = values[1];

// 		searchForDuplicates(clientData, clientIndex);
// 	})
// 	.catch(function(err) {
// 		ThrowError({
// 			message: err,
// 			errMethods: ['mConsole', 'mAlert']
// 		});
// 	});
// }

// ===================== INTERNAL FUNCTIONS ========================


// function StartImport( clientData ) {
// 	// set up local variables
// 	// var clientJson;
// 	// Get client Json:
// 	// getClientJson()
// 	// .then(function(result) {
// 		// received client Json.
// 		// clientJson = result;

// 	getValueFromStorage('CLIENT_INDEX')
// 	.then(function(clientIndex) {
// 		if (clientIndex === undefined || clientIndex === '') clientIndex = 0;
// 		if ( clientIndex >= clientData.length) {
// 			updateStorageLocal([
// 				{'ACTION_STATE': 'ERROR_STATE'}
// 			])
// 			.then(function(results) {
// 				('OUT OF BOUNDS! Done searching.');
// 			});	
// 		}
// 		// received CLIENT_INDEX from store. Now look for it in RIPS
// 		checkExistence(clientJson, clientIndex);
// 	})
// 	.catch(function(err) {
// 		message(err);
// 	});
// }