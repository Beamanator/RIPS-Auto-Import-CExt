// ============================== PAGE CONTROLLER =======================
/**
 * Controller function for ClientBasicInformation.js - decides what to do based off of
 * passed in action
 * 
 * Called by: Run_ClientBasicInformation [in MainContent.js]
 * 
 * FIXME: Make sure Client Basic Information is accurate before moving to next step
 * 
 * @param {string} action 
 */
function ClientBasicInformation_Controller( action ) {
	switch(action) {
		// client created, now decide what to do next
		case 'CHECK_CLIENT_BASIC_DATA':
			checkClientBasicData();
			break;

		// figure out next step
		case 'DO_NEXT_STEP':
			MainContent_DoNextStep();
			break;

		// Action not handled by ClientBasicInformation.js!
		default:
			console.error('invalid action found in CtrlClientBasicInformation.js:', action);
	}
}

/**
 * Main function to run for checking of clients have more data to save (from
 * chrome local storage). This function gets current client, checks if there is
 * more data to save, then saves data (if needed), then redirects to
 * MainContent_DoNextStep()
 * 
 */
function checkClientBasicData() {
	// goal = check client data, see if we need to update / add any new data to
	// the client!

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

		if (clientIndex == undefined) clientIndex = 0;

		var client = clientData[clientIndex];

		// NEXT: put optional client data in form
		var saveNext = insertOptionalClientDetails( client );

		// if saveNext is true, save action state then go to MainContent_DoNextStep()
		if ( saveNext ) {
			// save action state then click save
			var mObj = {
				action: 'store_data_to_chrome_storage_local',
				dataObj: {
					'ACTION_STATE': 'DO_NEXT_STEP'
				}
			};

			// save action state in local storage
			chrome.runtime.sendMessage(mObj, function(response) {
				// Here we click the 'save button'
				$('input[value="Save"]').click();

				// Deciding what to do happens on next action state!
			});
		}

		// If there isn't data to save, just skip to MainContent_DoNextStep()
		else {
			MainContent_DoNextStep();
		}
	});
}

/**
 * Function inserts as much 'optional' client details as can be found in
 * given client object. If any data is added to the form, sets a flag to
 * save client before moving on (and returns this flag)
 * 
 * FIXME: TODO: figure out how to allow multiple keys for client items such
 * as name (client name / applicant name / full name)
 * 
 * @param {object} client - client data object 
 * @returns {boolean} true / false if save is needed or not
 */
function insertOptionalClientDetails( client ) {
	var needSave = false;
	
	// =============== get FieldTranslator ================
	var FTo = Utils_GetFieldTranslator( 'Optional' );

	// if FT (optional) wasn't found, return false (quit).
	if (!FTo)
		return false;

	// loop through FTo keys, check if each key is an element populated in 
	//    client data object - if it is:
	// 1) add data to form
	// 2) set needSave to true
	Object.keys( FTo ).forEach(function(key, index) {
		// check if client has specific key populated
		if ( client[key] !== undefined && client[key] !== '') {
			// translation is available, so:
			// 1 - add data to form
			Utils_InsertValue( client[key], FTo[key] );

			// 2 - set needSave to true
			needSave = true;
		}

		// else, client[key] is undefined or empty string, so do nothing
	});

	// tell caller if save needs to happen
	return needSave;	
}



// TODO: figure out how to check the below data automatically (not manually)
// ================ Textboxes: ================

// Utils_InsertValue( client[FT['OTHER_PHONE_NO']],	'CDAdrTelLabel' 		);
// Utils_InsertValue( client[FT['ADDRESS1']],		'LADDRESS1' 		);
// Utils_InsertValue( client[FT['ADDRESS2']],		'LADDRESS2' 		);
// Utils_InsertValue( client[FT['ADDRESS3']],		'LADDRESS3' 		);
// Utils_InsertValue( client[FT['ADDRESS4']],		'LADDRESS4' 		);
// Utils_InsertValue( client[FT['EMAIL']],			'CDLongField1' 		);
// Utils_InsertValue( client[FT['APPT_SLIP_NO']],	'CDIdentifier1' 		);
// Utils_InsertValue( client[FT['CARITAS_NO']],		'CDIdentifier2' 		);
// Utils_InsertValue( client[FT['CRS_NO']],			'CDIdentifier3' 		);
// Utils_InsertValue( client[FT['IOM_NO']],			'CDIdentifier4' 		);
// Utils_InsertValue( client[FT['MSF_NO']],			'CDIdentifier5' 		);
// Utils_InsertValue( client[FT['STARS_STUDENT_NO']],'CDIdentifier6' 		);

// // ================ Checkboxes: ================ -> Click if client valie is true

// checkBox( client[FT[ 'CB_CARE' 				]], 'IsCBLabel1' ); // CARE
// checkBox( client[FT[ 'CB_CRS' 				]], 'IsCBLabel2' ); // CRS
// checkBox( client[FT[ 'CB_EFRRA_ACSFT' 		]], 'IsCBLabel3' ); // EFRRA/ACSFT
// checkBox( client[FT[ 'CB_IOM' 				]], 'IsCBLabel4' ); // IOM
// checkBox( client[FT[ 'CB_MSF' 				]], 'IsCBLabel5' ); // MSF
// checkBox( client[FT[ 'CB_PSTIC' 			]], 'IsCBLabel6' ); // PSTIC
// checkBox( client[FT[ 'CB_REFUGEE_EGYPT' 	]], 'IsCBLabel7' ); // Refugee Egypt
// checkBox( client[FT[ 'CB_SAVE_THE_CHILDREN'	]], 'IsCBLabel8' ); // Save the Children
// checkBox( client[FT[ 'CB_UNICEF_TDH' 		]], 'IsCBLabel9' ); // UNICEF / TdH
// checkBox( client[FT[ 'CB_OTHER' 			]], 'IsCBLabel10'); // Other Service Provider

// // ================ Dates: ================ -> I think this is all free text

// Utils_InsertValue( client[FT['DATE_REG']],		'CDDateRegisteredLabel' 	);
// Utils_InsertValue( client[FT['DATE_ARRIVAL']],	'CDDateEntryCountryLabel' 	);

// insert Dropdowns eventually (this may not work now!)
// client[FT['COUNTRY_OF_ORIGIN']] !== u ? $("#LCOUNTRYOFORIGIN").val( client[FT['COUNTRY_OF_ORIGIN']] ); // Country of Origin
// client[FT['ETHNIC_ORIGIN']] 		!== u ? $("#LETHNICORIGIN").val( 	client[FT['ETHNIC_ORIGIN']] ); // Ethnic Origin
// client[FT['SECOND_LANGUAGE']] 	!== u ? $("#LSECONDLANGUAGE").val( 	client[FT['SECOND_LANGUAGE']] ); // Second Language
// client[FT['MARITAL_STATUS']] 	!== u ? $("#LMARITALSTATUS").val( 	client[FT['MARITAL_STATUS']] ); // Marital Status
// client[FT['Religion']] 			!== u ? $("#Dropdown1").val( 		client[FT['Religion']] ); // Religion
// client[FT['UNHCR_STATUS']] 		!== u ? $("#Dropdown2").val( 		client[FT['UNHCR_STATUS']] ); // UNHCR Status
// client[FT['SOURCE_OF_REFERRAL']] !== u ? $("#Dropdown3").val( 		client[FT['SOURCE_OF_REFERRAL']] ); // Source of Referral
// client[FT['CITY_OF_ORIGIN']] 	!== u ? $("#Dropdown4").val( 		client[FT['CITY_OF_ORIGIN']] ); // City/Village of Origin
// client[FT['EMPLOYMENT_STATUS']] !== u ? $("#Dropdown5").val( 		client[FT['EMPLOYMENT_STATUS']] ); // Employment Status
// client[FT['NEIGHBORHOOD']] 		!== u ? $("#Dropdown6").val( 		client[FT['NEIGHBORHOOD']] ); // Neighborhood
