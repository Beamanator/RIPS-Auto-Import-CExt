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
	// get data ready for 
	var client = clientData[clientIndex];

	// TODO: pass in FB config here (future)
	var success = insertClientDetails(client);

	if (success) {
		// setup Client Index key to update
		var mObj = {
			// {'CLIENT_INDEX': ''}, // -> TODO: commented out so index can be updated later?
			'ACTION_STATE': 'CLIENT_CREATED'
		};

		// save keys in local storage
		chrome.runtime.sendMessage(mObj, function(response) {
			// Here we click the 'save button'
			// -> redirects to Client Basic Information
			$('input#regClient').click();

			// Deciding what to do next is not needed because page automatically
			// redirects to CBI
		});
	} else {
		console.error('Unsuccessful insertion of client data on page');
	}
}

/**
 * Function strips a full name into first & last, then adds to form
 * First name = Name 1
 * Last name = Name 2 - End
 * 
 * @param {string} fullName 
 * @returns {number} 1 if fullName doesn't exist (error)
 */
function fullNameInsert(fullName) {
	if (!fullName) return 1;

	// new version
	var firstName = fullName.substr(0, fullName.indexOf(" "));
	var lastName = fullName.substr(fullName.indexOf(" ") + 1);

	// old version:
	// var firstName = fullName.substr(0, fullName.lastIndexOf(" "));
	// var lastName = fullName.substr(fullName.lastIndexOf(" ") + 1);

	$("#LFIRSTNAME").val( firstName );
	$("#LSURNAME").val( lastName );
}

/**
 * Function inserts value into textbox / date fields using jQuery
 * 
 * @param {any} value string or number
 * @param {string} id html id of element 
 */
function insertValue(value, id) {
	// if value exists, throw into field:
	if (value !== undefined) {
		// if value starts with a '.', get rid of it:
		if (value[0] === '.') {
			value = value.substr(1);
		}

		$('#' + id).val(value);
	}
}

/**
 * Function checks boxes that need to be checked!
 * 
 * @param {boolean} value if true, checks box. if false, doesn't do anything
 * @param {string} id html id of element
 */
function checkBox(value, id) {
	if (value === true) 	 {	$("input#" + id).click();	}
}

/**
 * Function adds all available client details (in client object) onto registration page
 * (clicking save is done elsewhere)
 * 
 * @param {object} client - client object to import
 * @returns {boolean} true if successful, false if unsuccessful
 */
function insertClientDetails(client) {
	console.log('remove this comment when all client details can be imported!');

	// var u = undefined;

	// =============== get FieldTranslator from FieldTranslator.js =============
	var FT = Utils_GetFieldTranslator();

	// if FT wasn't found, return false (quit).
	if (!FT)
		return false;

	// ============= Required Fields: =============

	// Name:
	insertValue( client[FT['CLIENT_FIRST_NAME']],	'LFIRSTNAME' 	); // *REQ
	insertValue( client[FT['CLIENT_LAST_NAME']],	'LSURNAME' 		); // *REQ

	// Logic if one column contains full name
	fullNameInsert( client[FT['CLIENT_FULL_NAME']] ); 	// *REQ - Full Name - Custom logic

	insertValue( client[FT['UNHCR_CASE_NO']],	'UNHCRIdentifier' 	); // *REQ
	insertValue( client[FT['MAIN_PHONE_NO']],	'CDAdrMobileLabel' 	); // *REQ
	insertValue( client[FT['DOB']],				'LDATEOFBIRTH' 		); // *REQ

	// Dropdowns:
	// -> getDC() from DropdownCodeContainer.js

	$("#LGENDER").val( 			getDC( client, FT, 'GENDER' ) 		); // *REQ - Gender
	$("#LNATIONALITY").val( 	getDC( client, FT, 'NATIONALITY' ) 	); // *REQ - Nationality
	$('#LMAINLANGUAGE').val(	getDC( client, FT, 'MAIN_LANGUAGE' )); // *REQ - Main Language

	// ================ Textboxes: ================
	
	insertValue( client[FT['OTHER_PHONE_NO']],	'CDAdrTelLabel' 		);
	insertValue( client[FT['ADDRESS1']],		'LADDRESS1' 		);
	insertValue( client[FT['ADDRESS2']],		'LADDRESS2' 		);
	insertValue( client[FT['ADDRESS3']],		'LADDRESS3' 		);
	insertValue( client[FT['ADDRESS4']],		'LADDRESS4' 		);
	insertValue( client[FT['EMAIL']],			'CDLongField1' 		);
	insertValue( client[FT['APPT_SLIP_NO']],	'CDIdentifier1' 		);
	insertValue( client[FT['CARITAS_NO']],		'CDIdentifier2' 		);
	insertValue( client[FT['CRS_NO']],			'CDIdentifier3' 		);
	insertValue( client[FT['IOM_NO']],			'CDIdentifier4' 		);
	insertValue( client[FT['MSF_NO']],			'CDIdentifier5' 		);
	insertValue( client[FT['STARS_STUDENT_NO']],'CDIdentifier6' 		);

	// ================ Checkboxes: ================ -> Click if client valie is true

	checkBox( client[FT[ 'CB_CARE' 				]], 'IsCBLabel1' ); // CARE
	checkBox( client[FT[ 'CB_CRS' 				]], 'IsCBLabel2' ); // CRS
	checkBox( client[FT[ 'CB_EFRRA_ACSFT' 		]], 'IsCBLabel3' ); // EFRRA/ACSFT
	checkBox( client[FT[ 'CB_IOM' 				]], 'IsCBLabel4' ); // IOM
	checkBox( client[FT[ 'CB_MSF' 				]], 'IsCBLabel5' ); // MSF
	checkBox( client[FT[ 'CB_PSTIC' 			]], 'IsCBLabel6' ); // PSTIC
	checkBox( client[FT[ 'CB_REFUGEE_EGYPT' 	]], 'IsCBLabel7' ); // Refugee Egypt
	checkBox( client[FT[ 'CB_SAVE_THE_CHILDREN'	]], 'IsCBLabel8' ); // Save the Children
	checkBox( client[FT[ 'CB_UNICEF_TDH' 		]], 'IsCBLabel9' ); // UNICEF / TdH
	checkBox( client[FT[ 'CB_OTHER' 			]], 'IsCBLabel10'); // Other Service Provider

	// ================ Dates: ================ -> I think this is all free text

	insertValue( client[FT['DATE_REG']],		'CDDateRegisteredLabel' 	);
	insertValue( client[FT['DATE_ARRIVAL']],	'CDDateEntryCountryLabel' 	);

	// client[FT['COUNTRY_OF_ORIGIN']] !== u ? $("#LCOUNTRYOFORIGIN").val( client[FT['COUNTRY_OF_ORIGIN']] ); // Country of Origin
	// client[FT['ETHNIC_ORIGIN']] 	!== u ? $("#LETHNICORIGIN").val( 	client[FT['ETHNIC_ORIGIN']] ); // Ethnic Origin
	// client[FT['SECOND_LANGUAGE']] 	!== u ? $("#LSECONDLANGUAGE").val( 	client[FT['SECOND_LANGUAGE']] ); // Second Language
	// client[FT['MARITAL_STATUS']] 	!== u ? $("#LMARITALSTATUS").val( 	client[FT['MARITAL_STATUS']] ); // Marital Status
	// client[FT['Religion']] 			!== u ? $("#Dropdown1").val( 		client[FT['Religion']] ); // Religion
	// client[FT['UNHCR_STATUS']] 		!== u ? $("#Dropdown2").val( 		client[FT['UNHCR_STATUS']] ); // UNHCR Status
	// client[FT['SOURCE_OF_REFERRAL']] !== u ? $("#Dropdown3").val( 		client[FT['SOURCE_OF_REFERRAL']] ); // Source of Referral
	// client[FT['CITY_OF_ORIGIN']] 	!== u ? $("#Dropdown4").val( 		client[FT['CITY_OF_ORIGIN']] ); // City/Village of Origin
	// client[FT['EMPLOYMENT_STATUS']] !== u ? $("#Dropdown5").val( 		client[FT['EMPLOYMENT_STATUS']] ); // Employment Status
	// client[FT['NEIGHBORHOOD']] 		!== u ? $("#Dropdown6").val( 		client[FT['NEIGHBORHOOD']] ); // Neighborhood

	return true; // true = successful
}