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
			console.error('Unhandled action found in CtrlClientBasicInformation.js:', action);
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
		var saveNext = insertOptionalClientDetails( client, clientIndex );

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
 * @param {number} ci - index of specific client being imported
 * @returns {boolean} - true / false if save is needed or not
 */
function insertOptionalClientDetails( client, ci ) {
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
			let pass = Utils_CheckErrors([
				[ Utils_InsertValue( client[key], FTo[key] ), key ]
			], ci);

			// 2 - set needSave to true if insert didn't error
			if (pass)
				needSave = true;
		}

		// else, client[key] is undefined or empty string, so do nothing
	});

	// tell caller if save needs to happen
	return needSave;	
}