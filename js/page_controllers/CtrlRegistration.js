// ============================== PAGE CONTROLLER =======================
/**
 * Controller function for Registration.js - decides what to do based off of
 * passed in action.
 * 
 * Called by: Run_Registration [in MainContent.js]
 * 
 * @param {string} action - action auto import is trying to take next
 */
function Registration_Controller( action ) {
	switch(action) {
		// Enter client UNHCR and press 'search'
		case 'REGISTER_NEW_CLIENT':
			registerNewClient();
			break;

		// Action not handled by Registration.js!
		default:
			console.error('invalid action found in Registration.js:', action);
	}
}

// ============================== MAIN FUNCTIONS =============================

/**
 * Main function to run for registering new clients - gets client data (and index)
 * in preparation for adding to Registration page
 * 
 */
function registerNewClient() {
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

		if (clientIndex == undefined) clientIndex = 0;

		// Now insert new client w/ specified index into RIPS
		addClientData(clientData, clientIndex);
	});
}

// ===================== INTERNAL FUNCTIONS ========================

/**
 * Function adds client data to registration page, then clicks save, 
 * 
 * @param {object} clientData - array of client objects from chrome local store
 * @param {number} clientIndex - index of specific client from clientData array
 */
function addClientData(clientData, clientIndex) {
	var client = clientData[clientIndex];

	// TODO: pass in FB config here (future)
	var success = insertRequiredClientDetails(client, clientIndex);

	if (success) {
		// next check if there is more data to save in CBI
		var mObj = {
			action: 'store_data_to_chrome_storage_local',
			dataObj: {
				'ACTION_STATE': 'CHECK_CLIENT_BASIC_DATA'
			}
		};

		// save action state in local storage
		chrome.runtime.sendMessage(mObj, function(response) {
			// Here we click the 'save button'
			// -> redirects to Client Basic Information
			$('input#regClient').click();

			// Deciding what to do next is not needed because page automatically
			// redirects to CBI, which is where do-next is calculated
			// HOWEVER, at this point, if a field has been skipped OR a field
			// is invalid (decided by RIPS Validation Extension), a swal popup
			// (sweet alert) may show up. Now we will check for it and skip client
			// if it exists.
			checkForSwal(clientIndex);
		});
	} else {
		let msg = 'Client #' + (clientIndex + 1) +
			': Unsuccessful insertion of client data on Registration page.';

		// Note: specific error is thrown in insertRequiredClientDetails
		console.error(msg);

		// add error to stack and navigate back to Advanced Search to import next
		Utils_SkipClient(msg, clientIndex);
	}
}

/**
 * Function adds all available client details (in client object) onto registration page
 * (clicking save is done elsewhere)
 * 
 * @param {object} client - client object to import
 * @param {number} ci - index of specific client being imported
 * @returns {boolean} - true if successful (no internal errors), false if unsuccessful
 */
function insertRequiredClientDetails(client, ci) {
	// =============== get FieldTranslator ================
	var FTr = Utils_GetFieldTranslator( 'Required' );

	// if FT wasn't found, return false (quit).
	if (!FTr) {
		Utils_AddError('"Required" Field Translator not found');
		return false;
	}

	let f_n; // shortener for field_name variables

	let pass = Utils_CheckErrors([
		// === Add Required fields to form ===
		[ NameInsert( client, FTr ), 'NAME' ],
		
		[ Utils_InsertValue( client[ f_n='UNHCR NUMBER' ],	FTr[f_n] ), f_n ],
		[ Utils_InsertValue( client[ f_n='PHONE NUMBER' ],	FTr[f_n] ), f_n ],

		// Date:
		[ Utils_InsertValue( client[ f_n='DATE OF BIRTH' ], FTr[f_n], 3 ), f_n ],

		// Dropdowns:
		[ Utils_InsertValue( client[ f_n='GENDER' ], 		FTr[f_n] ), f_n ],
		[ Utils_InsertValue( client[ f_n='NATIONALITY' ], 	FTr[f_n] ), f_n ],
		[ LanguageInsert( client[ f_n='MAIN LANGUAGE' ],	FTr, ci  ), f_n ]
	], ci);

	return pass;
}

// ========================= DATA INTERPRETERS ========================

/**
 * Function strips a full name into first & last, then adds to form
 * First name = Name 1
 * Last name = Name 2 - End
 * 
 * @param {string} fullName - client's full name that needs to be parsed
 * @param {string} firstNameID - element ID of first name
 * @param {string} lastNameID - element ID of last name
 * @returns {number} 1 if fullName doesn't exist (error)
 */
function fullNameInsert( fullName, firstNameID, lastNameID ) {
	if (!fullName) return false;

	// new version
	var firstName = fullName.substr(0, fullName.indexOf(" "));
	var lastName = fullName.substr(fullName.indexOf(" ") + 1);

	// old version:
	// var firstName = fullName.substr(0, fullName.lastIndexOf(" "));
	// var lastName = fullName.substr(fullName.lastIndexOf(" ") + 1);

	// TODO: don't user checkErrors b/c that one throws errors too!
	let pass = (
		Utils_InsertValue( firstName, firstNameID ) &&
		Utils_InsertValue( lastName, lastNameID )
	);

	return pass;
}

/**
 * Function attempts to insert a name into RIPS - using either full-name logic
 * or first & last name logic.
 * 
 * @param {object} client - client data object being imported into RIPS
 * @param {object} FTr - required field translator from FieldTranslator.js
 * @returns {boolean} - true / false if inserts succeeded
 */
function NameInsert(client, FTr) {
	if (!client || !FTr) return false;

	let pass = true;

	// if client name comes from ONE column ('FULL NAME')
	if (client['FULL NAME']) {
		// Logic if one column contains full name
		pass = fullNameInsert( client['FULL NAME'],
							FTr['FIRST NAME'], FTr['LAST NAME'] );
	}

	// else, name comes from multiple columns ('FIRST / LAST NAME')
	else {
		let f_n; // shortener for field_name variables

		pass = (
			Utils_InsertValue( client[f_n='FIRST NAME'], FTr[f_n] ) &&
			Utils_InsertValue( client[f_n='LAST NAME'],  FTr[f_n] )
		);
	}

	return pass;
}

/**
 * Function inserts client's language data into RIPS form. Primary goal is to store
 * main language, but if user has main and seconary language data in the cell
 * (separated by a comma), enters both into form.
 * 
 * @param {string} langValue - language(s) that client speaks (only 2 get saved)
 * @param {object} FTr - Field Translator object for Required data
 * @param {number} ci - index of client being imported
 * @returns {boolean} - true/false success of insert(s)
 */
function LanguageInsert(langValue, FTr, ci) {
	// check if langValue has comma in it -> if yes, have to insert second lang into
	// 'Second Language" dropdown.
	if (langValue.indexOf(',') !== -1) {
		let langArr = langValue.split(',');

		let lang1 = langArr[0].trim();
		let lang2 = langArr[1].trim();

		// throw warning error if more than 2 languages were found in column
		if (langArr.length > 2) {
			Utils_AddError('Client #' + (ci + 1) + ' - Warning: Only 2 of ' +
				langArr.length + ' languages from "' + langValue +
				'" will be saved.');
		}

		// return overall success of adding both languages to client
		return (
			Utils_InsertValue( lang1, FTr['MAIN LANGUAGE'] ) &&
			Utils_InsertValue( lang2, FTr['SECOND LANGUAGE'] )
		);
	}

	// if no comma, only 1 language so just insert it straight away.
	else {
		return Utils_InsertValue( langValue, FTr['MAIN LANGUAGE'] );
	}
}

// ============================== OTHER INTERNAL ================================

function checkForSwal(ci, time=1000) {
	setTimeout( function(ci) {
		let $alert = $('.sweet-alert');

		// if alert is visible, skip to next client
		if ( $alert.hasClass('visible') ) {
			// now that we know that alert is visible, get error text and
			// skip to next client.
			let sweetAlertText = $alert.children('p').text();

			let msg = 'Skipping Client #' + (ci + 1) + '. Fatal error occured ' +
			'when registering client: ' + sweetAlertText;

			Utils_SkipClient(msg, ci);
		}

		// if alert isn't visible, don't do anything special
		else {}
	}, time, ci);
}