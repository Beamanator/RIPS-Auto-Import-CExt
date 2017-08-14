// ============================== PAGE CONTROLLER =======================
/**
 * Controller function for AdvancedSearch.js - decides what to do based off of
 * passed in action.
 * 
 * Called by: Run_AdvancedSearch [in MainContent.js]
 * 
 * @param {string} action 
 */
function AdvancedSearch_Controller( action ) {
	// console.log('in advanced search controller');
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
		var FTs = Utils_GetFieldTranslator( 'Search' );
		if (!FTs)
			return; // error handling in Utils function
		
		// put UNHCR number into textbox
		Utils_InsertValue( client['UNHCR NUMBER'], FTs['UNHCR NUMBER'],
			clientIndex )
		// $("#" + FTs['UNHCR NUMBER']).val( client['UNHCR NUMBER'] );

		// store next action state before clicking 'search'
		var mObj2 = {
			action: 'store_data_to_chrome_storage_local',
			dataObj: {
				'ACTION_STATE': 'ANALYZE_CLIENT_DUPLICATES'
			}
		};
	
		// send message obj, then click 'search' (refreshes page)
		chrome.runtime.sendMessage(mObj2, function(response) {
			$('input[value="Search"]').click();
		});
	});
}

/**
 * Function is called after Search button has been clicked - analyze new state of
 * the page.
 * 
 */
function processSearchResults() {
	// TODO: update following 2 URL checks w/ Utils_GetTabHref();
	// First check if the window is at the Advanced Search page in RIPS
	if ( !Utils_UrlContains('SearchClientDetails/ClientListSearchResult') ) {
		// url should have SearchClientDetails/AdvancedSearch
		if ( Utils_UrlContains('SearchClientDetails/AdvancedSearch') ) {
			// TODO: add popup checker
			setTimeout( function(){
				let $alert = $('.sweet-alert');

				if ( $alert.hasClass('visible') ) {
					// alert was generated, meaning there were either 0 clients found
					// or > 100 results
					let sweetAlertText = $alert.children('p').text();
					
					// Aug 7 2017, these are possible popup texts:
					let mNoResults = 'There are 0 result have been found.',
						mManyResults = "Search results more than 100";

					// dismiss popup
					// $('button.confirm').click();

					// 0 results!
					if (sweetAlertText === mNoResults) {
						// no results, so create client on registration page
						navigateToRegistration();
					}

					// > 100 results!
					else if (sweetAlertText === mManyResults) {
						// throw error
						Utils_AddError();
					}

					// WHAT HAPPENED??? Not sure how this text occurred!
					else {
						mObj = {
							action: 'catch_error',
							message: 'error! how did we get here??'
						};

						chrome.runtime.sendMessage(mObj);
					}
				} else {
					// Note: as of August 7, 2017
					// - Popups occur when > 100 results AND when 0 results, so
					// - there shouldn't be any situation when popup doesn't occur
					// - and URL is still .../AdvancedSearch
					// BUT just in case, still navigate to registration
					navigateToRegistration();
				}
			}, 1000);

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
			var mObj = {
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
				Utils_NavigateToTab( Utils_GetTabHref('AdvancedSearch') );
			});
		} else {
			// only found 1 client - this is hopefully our client!
			// assuming we want to automatically choose this client as our client:
			$('.table.table-striped.grid-table tbody tr')[0].click();

			// Client is already available, redirect to Client Basic Information
			// to check if extra client data needs to be saved
			var mObj = {
				action: 'store_data_to_chrome_storage_local',
				dataObj: {
					'ACTION_STATE': 'CHECK_CLIENT_BASIC_DATA'
				}
			};

			// once action state is stored, navigate to CBI
			chrome.runtime.sendMessage(mObj, function(response) {
				Utils_NavigateToTab( Utils_GetTabHref('ClientBasicInformation') );
			});
		}
	}
	// NOTE: as of March 15, 2017 - I haven't seen any alerts on this page recently
	// NOTE: as of August 7, 2017 - Popups occur when > 100 results AND when 0 results
}

// ===================== INTERNAL FUNCTIONS ========================

/**
 * Function extrapolates registration page navigation
 * 
 */
function navigateToRegistration() {
	var mObj = {
		action: 'store_data_to_chrome_storage_local',
		dataObj: {'ACTION_STATE': 'REGISTER_NEW_CLIENT'}
	};
	
	// once data returns, navigate to registration page
	chrome.runtime.sendMessage(mObj, function(response) {
		Utils_NavigateToTab( Utils_GetTabHref('Registration') );
	});
}