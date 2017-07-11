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
	var success = insertRequiredClientDetails(client);

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
			// redirects to CBI
		});
	} else {
		// TODO: totally stop client import (Utils)?
		console.error('Unsuccessful insertion of client data on page. Error' +
			' in insertRequiredClientDetails()');
	}
}

/**
 * Function adds all available client details (in client object) onto registration page
 * (clicking save is done elsewhere)
 * 
 * @param {object} client - client object to import
 * @returns {boolean} true if successful (no internal errors), false if unsuccessful
 */
function insertRequiredClientDetails(client) {
	// =============== get FieldTranslator ================
	var FTr = Utils_GetFieldTranslator( 'Required' );

	// if FT wasn't found, return false (quit).
	if (!FTr)
		return false;

	// === Add Required fields to form ===
	// Name:
	Utils_InsertValue( client['FIRST NAME'], FTr['FIRST NAME'] );
	Utils_InsertValue( client['LAST NAME'],  FTr['LAST NAME'] );

	// Logic if one column contains full name
	fullNameInsert( client['FULL NAME'], FTr['FIRST NAME'], FTr['LAST NAME'] ); 	// *REQ - Full Name - Custom logic

	Utils_InsertValue( client['UNHCR NUMBER'],	FTr['UNHCR NUMBER'] );
	Utils_InsertValue( client['PHONE NUMBER'],	FTr['PHONE NUMBER'] );
	Utils_InsertValue( client['DATE OF BIRTH'], FTr['DATE OF BIRTH']);

	// Dropdowns:
	Utils_InsertValue( client['GENDER'], 		FTr['GENDER'] );
	Utils_InsertValue( client['NATIONALITY'], 	FTr['NATIONALITY'] );
	Utils_InsertValue( client['MAIN LANGUAGE'], FTr['MAIN LANGUAGE'] );

	return true; // true = didn't run into internal errors
}

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
	if (!fullName) return 1;

	// new version
	var firstName = fullName.substr(0, fullName.indexOf(" "));
	var lastName = fullName.substr(fullName.indexOf(" ") + 1);

	// old version:
	// var firstName = fullName.substr(0, fullName.lastIndexOf(" "));
	// var lastName = fullName.substr(fullName.lastIndexOf(" ") + 1);

	$("#" + firstNameID).val( firstName );
	$("#" + lastNameID).val( lastName );
}