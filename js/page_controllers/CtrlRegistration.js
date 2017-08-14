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
 * @returns {boolean} true if successful (no internal errors), false if unsuccessful
 */
/**
 * 
 * 
 * @param {any} client 
 * @param {any} ci 
 * @returns 
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

	return Utils_CheckErrors([
		// === Add Required fields to form ===
		[ NameInsert( client, FTr ), 'NAME' ],
		
		[ Utils_InsertValue( client[ f_n='UNHCR NUMBER' ],	FTr[f_n] ), f_n ],
		[ Utils_InsertValue( client[ f_n='PHONE NUMBER' ],	FTr[f_n] ), f_n ],

		// Date:
		[ Utils_InsertValue( client[ f_n='DATE OF BIRTH' ], FTr[f_n], 3 ), f_n ],

		// Dropdowns:
		[ Utils_InsertValue( client[ f_n='GENDER' ], 		FTr[f_n] ), f_n ],
		[ Utils_InsertValue( client[ f_n='NATIONALITY' ], 	FTr[f_n] ), f_n ],
		[ Utils_InsertValue( client[ f_n='MAIN LANGUAGE' ],	FTr[f_n] ), f_n ]
	], ci);

	// TODO: remove below commented out version if above version works
	// Utils_CheckErrors([
	// 	// === Add Required fields to form ===
	// 	// Name:
	// 	[Utils_InsertValue( client['FIRST NAME'], FTr['FIRST NAME'] ),
	// 		'FIRST NAME'],
	// 	[Utils_InsertValue( client['LAST NAME'],  FTr['LAST NAME'] ),
	// 		'LAST NAME'],

	// 	// Logic if one column contains full name
	// 	[fullNameInsert( client['FULL NAME'], FTr['FIRST NAME'], FTr['LAST NAME'] ),
	// 		'FULL NAME'],

	// 	[Utils_InsertValue( client['UNHCR NUMBER'],	FTr['UNHCR NUMBER'] ),
	// 		'UNHCR NUMBER'],
	// 	[Utils_InsertValue( client['PHONE NUMBER'],	FTr['PHONE NUMBER'] ),
	// 		'PHONE NUMBER'],

	// 	// update / format DOB, then inserting into form
	// 	[DOBInsert( client['DATE OF BIRTH'], FTr['DATE OF BIRTH'] ),
	// 		'DATE OF BIRTH'],
	// 	// Utils_InsertValue( client['DATE OF BIRTH'], FTr['DATE OF BIRTH']);

	// 	// Dropdowns:
	// 	[Utils_InsertValue( client['GENDER'], 		FTr['GENDER'] ),
	// 		'GENDER'],
	// 	[Utils_InsertValue( client['NATIONALITY'], 	FTr['NATIONALITY'] ),
	// 		'NATIOINALITY'],
	// 	[Utils_InsertValue( client['MAIN LANGUAGE'], FTr['MAIN LANGUAGE'] ),
	// 		'MAIN LANGUAGE']
	// ], ci);

	// return true; // true = didn't run into internal errors
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