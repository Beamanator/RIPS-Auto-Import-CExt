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
		// get data back from response
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
	// First check if the window is at the Advanced Search page in RIPS
	// -> Note: we shouldn't be on the search results page.
	if ( !Utils_UrlContains(Utils_GetTabHref('AdvancedSearch-Result')) ) {

		// Add extra check for Advanced Search, just to be more cautious.
		if ( Utils_UrlContains(Utils_GetTabHref('AdvancedSearch')) ) {
			// timeout wait is 1 second (1000 ms)
			let waitTime = 1000;

			// After a bit of time (waitTime), check for presence of popup on page
			setTimeout( function(){
				let $alert = $('.sweet-alert');

				if ( $alert.hasClass('visible') ) {
					// alert was generated, meaning there were either 0 clients found
					// or > 100 results
					let sweetAlertText = $alert.children('p').text();
					
					// Aug 7 2017, these are possible popup texts:
					let mNoResults = 'There are 0 result have been found.',
						mManyResults = "Search results more than 100";

					// dismiss popup - not necessary
					// $('button.confirm').click();

					// 0 results! No error, just create new client now
					if (sweetAlertText === mNoResults) {
						navigateToRegistration();
					}

					// > 100 results! Throw error
					else if (sweetAlertText === mManyResults) {
						Utils_SkipClient('Too many clients with ' +
							'same UNHCR #<Not given>');
					}

					// WHAT HAPPENED??? Somehow there is a popup but the text
					// isn't handled here, so we must error!
					else {
						Utils_SkipClient('Error! Unhandled popup text found on ' +
							`search page: "${sweetAlertText}"`);
					}
				}
				
				// No alert is visible, but we're on the 'AdvancedSearch' page, so
				// obviously we missed something.
				else {
					// Note: as of August 7, 2017
					// - Popups occur when > 100 results AND when 0 results, so
					// - there shouldn't be any situation when popup doesn't occur
					// - and URL is still .../AdvancedSearch
					// BUT just in case, still navigate to registration
					navigateToRegistration();
				}
			}, waitTime);

		// Apparently page isn't 'AdvancedSearch' or 'AdvancedSearch-Result', so
		// not sure where we are anymore... throw an error and stop import please :)
		} else {
			let errMessage = 'Moved from Advanced Search page too abruptly :(\n' +
				'It is recommended to clear data & start over';

			ThrowError({
				message: errMessage,
				errMethods: ['mConsole', 'mAlert']
			});
		}
	}

	// page IS 'AdvancedSearch-Results' -> There ARE results :)
	else {
		// get client data, try to match it to row data
		let mObj = {
			action: 'get_data_from_chrome_storage_local',
			keysObj: {
				'CLIENT_INDEX': '',
				'CLIENT_DATA': ''
			}
		};
	
		chrome.runtime.sendMessage(mObj, function(response) {
			// get data back from response
			let clientIndex = response['CLIENT_INDEX'];
			let clientData = response['CLIENT_DATA'];

			// get client and match variables
			let client = clientData[clientIndex];
			let clientFirstName = client['FIRST NAME'],
				clientLastName = client['LAST NAME'],
				clientFullName = client['FULL NAME'],
				clientUnhcrNo = client['UNHCR NUMBER'];

			// get row data
			let resultRows = $('.table.table-striped.grid-table')
				.find('tr.grid-row');
			let matchedRows = [];

			// HTML attributes of each row (in "data-name"):
			let rowData = {
				Stars_No: 			"NRU_NO",
				Unhcr_No: 			"HO_REF_NO",
				First_Name: 		"ForeName",
				Last_Name: 			"SurName",
				Caseworker: 		"CASEWORKER",
				Nationality: 		"NATIONALITY",
				Country_Of_Origin: 	"TownBirthDesc"
			};
			
			// for every row element, find matching client data
			for (let rowElem of resultRows) {
				$this = $(rowElem);

				// get data from results
				let rowFirstName =
					$this.find(`td[data-name="${rowData.First_Name}"]`).text();
				let rowLastName =
					$this.find(`td[data-name="${rowData.Last_Name}"]`).text();
				let rowUnhcrNo =
					$this.find(`td[data-name="${rowData.Unhcr_No}"]`).text();

				// if names and unhcr match, add row to match array
				if (
					matchNames(
						[rowFirstName, rowLastName],
						[clientFirstName, clientLastName, clientFullName]
					)
					&& matchUnhcr(rowUnhcrNo, clientUnhcrNo)
				) {
					matchedRows.push(rowElem);
				}
			}

			// Check length of matchedRows array, decide next step from there
			if (matchedRows.length > 1) {
				// Add client to error stack
				Utils_SkipClient('Duplicate matching clients found', clientIndex);
			}
			
			// 1 exact match -> this is our client!
			else if (matchedRows.length === 1) {
				// click the client row:
				matchedRows[0].click();
	
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
			
			// no name matches, but unhcr # matched mostly, so throw error
			else {
				Utils_SkipClient('Found client with matching UNHCR, but not matching name. ' +
					'Needs human intervention.', clientIndex);
			}
		});
	}
	// NOTE: as of March 15, 2017 - I haven't seen any alerts on this page recently
	// NOTE: as of August 7, 2017 - Popups occur when > 100 results AND when 0 results
}

// ===================== INTERNAL FUNCTIONS ========================

/**
 * Function checks & returns if ALL names match - single first name
 * and ALL last names.
 * Note: not case sensitive
 * 
 * @param {object} rowNames - array of names from search result row (first, last - all)
 * @param {object} clientNames - array of client name strings (first, last - all, full name)
 * @returns {boolean} - true if all names are the same, false otherwise
 */
function matchNames(rowNames, clientNames) {
	let rowF = rowNames[0],
		rowL = rowNames[1];

	// if row data exists, make them uppercase for matching easier
	if (rowF && rowL) {
		rowF = rowF.toUpperCase();
		rowL = rowL.toUpperCase();
	}
	else return false;

	let clientF,
		clientL; // all last names, not just 1st last name

	// clientNames looks like this:
	// -> first, last, full name
	if (clientNames[0])
		clientF = clientNames[0];
	// get first name from first word in client's full name
	else if (clientNames[2])
		clientF = clientNames[2].split(' ')[0];
	else return false;

	if (clientNames[1])
		clientL = clientNames[1];
	// get last name(s) from all words following first name in client's full name
	else if (clientNames[2]) {
		// clientL = clientNames[2].split(' ').slice(1).join(' ');
		clientL = clientNames[2].substr(
			clientNames[2].indexOf(' ') + 1
		);
	}
	else return false;

	clientF = clientF.toUpperCase();
	clientL = clientL.toUpperCase();

	// return true if first AND all last names match
	return (rowF === clientF) && (rowL === clientL);
}

/**
 * Function checks & returns if row and client unhcr number are matches
 * Note: not case specific
 * 
 * @param {string} rowUnhcr - unhcr # from search result row
 * @param {string} clientUnhcr - unhcr # from client data
 * @returns {boolean} - true if match, false if not match
 */
function matchUnhcr(rowUnhcr, clientUnhcr) {
	return rowUnhcr === clientUnhcr;
}

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