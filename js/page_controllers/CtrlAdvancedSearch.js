// ============================== PAGE CONTROLLER =======================
/**
 * Controller function for Advanced Search pages - decides what to do based off of
 * passed in config object.
 * 
 * Called by: Run_AdvancedSearch [in MainContent.js]
 * 
 * @param {object} config 
 */
function AdvancedSearch_Controller( config ) {
	var action = config.action;
	var clientIndex = config.clientIndex;
	var clientData = config.clientData;

	var importSettings = config.importSettings;

	// TODO: do stuff with import settings
	// like phone number searching
	
	switch(action) {
		// Enter client UNHCR and press 'search'
		case 'SEARCH_FOR_CLIENT':
			searchForDuplicates(clientIndex, clientData);
			break;

		// Analyze search results
		case 'ANALYZE_CLIENT_DUPLICATES':
			processSearchResults(clientIndex, clientData, importSettings);
			break;

		// Action not handled by AdvancedSearch.js!
		default:
			console.error('Unhandled action found in AdvancedSearch.js:', action);
	}
}

// ============================== MAIN FUNCTIONS =======================

/**
 * Function gets client index and data, takes the current client's UNHCR number,
 * sticks it in the UNHCR textbox, and then clicks "search"
 * 
 * Before the click, set action state to the next step - 'ANALYZE_CLIENT_DUPLICATES'
 * 
 * @param {number} clientIndex - index of client in all client data
 * @param {object} clientData - all client data
 */
function searchForDuplicates(clientIndex, clientData) {
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
}

/**
 * Function is called after Search button has been clicked - analyze new state of
 * the page.
 * 
 * @param {number} clientIndex - index of client in all client data
 * @param {object} clientData - all client data
 * @param {object} importSettings - configurable import settings from options page
 */
function processSearchResults(clientIndex, clientData, importSettings) {
	// First check if the window is at the Advanced Search page in RIPS
	// -> Note: we shouldn't be on the search results page.
	if ( !Utils_UrlContains( Utils_GetTabHref('AdvancedSearch-Result'))) {

		// Add extra check for Advanced Search, just to be more cautious.
		if ( Utils_UrlContains( Utils_GetTabHref('AdvancedSearch'))) {
			// timeout wait is 1 second (1000 ms)
			let waitTime = 1000;

			// After a bit of time, then check for presence of popup on page
			Utils_WaitTime(waitTime)
			.then(function() {
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

					// 0 results! No error, decide if we need to create client
					if (sweetAlertText === mNoResults) {
						decideNextStep(importSettings, clientIndex);
						return;
					}

					// > 100 results! Throw error, skip client
					if (sweetAlertText === mManyResults) {
						Utils_SkipClient('Too many clients with ' +
							'same UNHCR #<Not given>', clientIndex);
					}

					// WHAT HAPPENED??? Somehow there is a popup but the text
					// isn't handled here, so we must error!
					else {
						Utils_SkipClient('Error! Unhandled popup text found on ' +
							`search page: "${sweetAlertText}"`, clientIndex);
					}
				}
				
				// No alert is visible, but we're on the 'AdvancedSearch' page, so
				// obviously we missed something.
				else {
					// Note: as of August 7, 2017
					// - Popups occur when > 100 results AND when 0 results, so
					// - there shouldn't be any situation when popup doesn't occur
					// - and URL is still .../AdvancedSearch
					// BUT just in case, decide what to do now
					decideNextStep(importSettings, clientIndex);
				}
			});

		// Apparently page isn't 'AdvancedSearch' or 'AdvancedSearch-Result', so
		// not sure where we are anymore... throw an error and stop import please :)
		} else {
			let errMessage = 'Moved from Advanced Search page too abruptly :(\n' +
				'It is recommended to clear data & start over';

			Utils_StopImport( errMessage, function(response) {
				ThrowError({
					message: errMessage,
					errMethods: ['mConsole', 'mAlert']
				});
			});
		}
	}

	// page IS 'AdvancedSearch-Results' -> There ARE results :)
	else {
		// get client variables
		let client = clientData[clientIndex];
		let clientFirstName = client['FIRST NAME'],
			clientLastName = client['LAST NAME'],
			clientFullName = client['FULL NAME'],
			clientUnhcrNo = client['UNHCR NUMBER'];

		let clientImportNames = getClientImportNames({
			firstName: clientFirstName,
			lastName: clientLastName,
			fullName: clientFullName
		});

		// if names object didn't return correctly, throw error and skip client
		if (Object.keys(clientImportNames).length === 0) {
			let errMessage = `Somehow found a weird mix of first name ` +
				`<${clientFirstName}>, last name <${clientLastName}>, ` +
				`and full name <${clientFullName}> data from import.`

			Utils_SkipClient(errMessage, clientIndex);
			return;
		}

		// get row data
		let resultRows = $('.table.table-striped.grid-table')
			.find('tr.grid-row');
		let clientsToSearch = [];

		// properties of each row (in HTML "data-name" attribute):
		let rowData = {
			Stars_No: 			"NRU_NO",
			Unhcr_No: 			"HO_REF_NO",
			First_Name: 		"ForeName",
			Last_Name: 			"SurName",
			Caseworker: 		"CASEWORKER",
			Nationality: 		"NATIONALITY",
			Country_Of_Origin: 	"TownBirthDesc"
		};
		
		// for every row element, push name data to array
		for (let i = 0; i < resultRows.length; i++) {
			let $this = $(resultRows[i]);

			// get data from search results
			let rowStarsNo =
				$this.find(`td[data-name="${rowData.Stars_No}"]`).text();
			let rowFirstName =
				$this.find(`td[data-name="${rowData.First_Name}"]`).text();
			let rowLastName =
				$this.find(`td[data-name="${rowData.Last_Name}"]`).text();
			let rowUnhcrNo =
				$this.find(`td[data-name="${rowData.Unhcr_No}"]`).text();

			// instead of matching here, just get names (push to array)
			// 	then use fuse.js to search through names after loop
			clientsToSearch.push({
				'resultIndex': i,
				starsNo: rowStarsNo,
				firstName: rowFirstName,
				lastName: rowLastName,
				elem: $this
			});
		}

		// set up first & last name fuse searches.
		var options_firstName = Utils_GetBasicFuseSettings(
			['firstName'],
			clientImportNames.firstName.length
		);
		var options_lastName = Utils_GetBasicFuseSettings(
			['lastName'],
			clientImportNames.lastName.length
		);

		options_firstName.id = 'resultIndex';
		options_lastName.id = 'resultIndex';
		
		var fuse_firstName = new Fuse(clientsToSearch, options_firstName);
		var fuse_lastName = new Fuse(clientsToSearch, options_lastName);

		/**
		 * 	search for matching names!
		 * 	Fuse results below should look like this:
		 * 	[
		 * 		{
		 * 			"item": 0, (id of search objs -> resultIndex key)
		 * 			"score": 0.25 (how well this item matched)
		 * 		},
		 * 		{...}
		 * 	]
		 */
		var result_firstName = fuse_firstName.search(clientImportNames.firstName);
		var result_lastName = fuse_lastName.search(clientImportNames.lastName);

		let matches = [];

		// loop through search results of first name
		for (let i = 0; i < result_firstName.length; i++) {
			let f_resultIndex = result_firstName[i].item;

			// try to find same resultIndex in result_lastName
			for (let j of result_lastName) {
				let l_resultIndex = j.item;

				// if indices match, add to matches array
				if (l_resultIndex === f_resultIndex) {
					matches.push(clientsToSearch[f_resultIndex].elem);
					break;
				}
			}
		}


		debugger;

		// Check length of matchedRows array, decide next step from there
		if (matches.length > 1) {
			let errMessage = `Duplicate matching clients found: StARS #`;

			// TODO: loop through matches, pull out objects from clientsToSearch's
			// StARS numbers
			for (let rowMatch of matches) {
				debugger;
			}

			// Add client to error stack
			Utils_SkipClient(errMessage, clientIndex);
		}
		
		// 1 exact match -> this is our client!
		else if (matches.length === 1) {
			// click the client row:
			matches[0].click();

			// Client is already available, redirect to Client Basic Information
			// to check if extra client data needs to be saved
			var mObj = {
				action: 'store_data_to_chrome_storage_local',
				dataObj: {
					'ACTION_STATE': 'CHECK_CLIENT_BASIC_DATA'
				}
			};

			// once action state is stored, navigate to CBI (there decide what to do)
			chrome.runtime.sendMessage(mObj, function(response) {
				Utils_NavigateToTab( Utils_GetTabHref('ClientBasicInformation') );
			});
		}
		
		// no name matches, but unhcr # matched something, so throw error
		else {
			Utils_SkipClient('Found client with matching UNHCR, but not matching name. ' +
				'Needs human intervention.', clientIndex);
		}
	}
	// NOTE: as of March 15, 2017 - I haven't seen any alerts on this page recently
	// NOTE: as of August 7, 2017 - Popups occur when > 100 results AND when 0 results
}

// ===================== INTERNAL FUNCTIONS ========================

/**
 * Function gathers and returns first and last names of client in an object. If
 * the client only has one column - full name, names are split into first and last,
 * then returned.
 * 
 * @param {object} clientNamesObj - object of client name strings (keys: firstName, lastName - all, fullName)
 * @returns {object} - object with client name strings (keys: firstName, lastName)
 * 					- returns empty object if some data found in first / last AND full names
 */
function getClientImportNames(clientNamesObj) {
	let names = {};

	let client1st = clientNamesObj.firstName,
		client2nd = clientNamesObj.lastName,
		clientFull = clientNamesObj.fullName;

	// first and last name columns exist
	if (client1st && client2nd) {
		names.firstName = client1st;
		names.lastName = client2nd;
	}
	
	// full name column exists
	else if (clientFull && (!client1st && !client2nd)) {
		names.firstName = clientFull.split(' ')[0];
		names.lastName = clientFull.substr(
			clientFull.indexOf(' ') + 1
		);
	}

	// some weird combination of first / last / full name columns exists
	// else {} -> do nothing.

	// object of client names (first / last)
	return names;
}

/**
 * Function gets import setting "createNew" and decides if we should create client in
 * registration page or skip registration
 * 
 * @param {object} importSettings - see above
 * @param {number} ci - client Index (see above)
 */
function decideNextStep(importSettings, ci) {
	// if settings don't exist, stop import!
	if (!importSettings) {
		var errorMessage = 'Import Settings not found! Cancelling import';

		// stop import and flag error message
		Utils_StopImport( errorMessage, function(response) {
			ThrowError({
				message: errorMessage,
				errMethods: ['mSwal', 'mConsole']
			});
		});
	}

	// otherwise, get settings and decide what to do
	else {
		let settings = importSettings.otherSettings;
		let createNewClient;

		// if there's no property "createNew", default to false
		if (!settings || !settings.createNew) {
			createNewClient = false;
		}

		// nav to registration of skip client, depending on setting
		if (createNewClient) {
			navigateToRegistration();
		} else {
			Utils_SkipClient('Client not found, skipping registration.', ci);
		}
	}
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
	return rowUnhcr.toUpperCase() === clientUnhcr.toUpperCase();
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