// ============================== PAGE CONTROLLER =======================
/**
 * Controller function for Add Actions page
 * 
 * Called by: Run_CtrlAddAction [in MainContent.js]
 * 
 * @param {string} action - from chrome storage ACTION_STATE
 */
function AddAction_Controller( action ) {
	switch(action) {
		// Add action data :)
		case 'CLIENT_ADD_ACTION_DATA':
			startAddActionData();
			break;

		// Action not handled by controller!
		default:
			console.error('invalid action found in CtrlAddAction.js:', action);
	}
}

// ============================== MAIN FUNCTIONS =======================

/**
 * Function starts the process of adding action data - get client data and index
 * then call setServiceDrodown
 * 
 */
function startAddActionData() {
	// get client data and index from store
	var mObj = {
		action: 'get_data_from_chrome_storage_local',
		keysObj: {
			'CLIENT_DATA': '',
			'CLIENT_INDEX': ''
		}
	};

	chrome.runtime.sendMessage(mObj, function(response) {
		// responses come back as serializable obj
		var clientData = response['CLIENT_DATA'];
		var clientIndex = response['CLIENT_INDEX'];

		var client = clientData[clientIndex];

		var FT = Utils_GetFieldTranslator();
		if (!FT) return; // let Utils handle everything - and quit!

		// set correct value in service dropdown
		setServiceDropdown( client, FT );
	});
}

/**
 * Function populates the "service" dropdown based off serviceCode, then calls
 * function that adds action data
 * 
 * @param {object} client - current client data object
 * @param {object} FT - Field translator from Utils_GetFieldTranslator
 */
function setServiceDropdown( client, FT ) {
	// first have to set service dropdown, so get service code.
	var serviceCode = client[FT['SERVICE_CODE']];

	// translate service code into service description:
	var serviceDesc = Utils_GetServiceDescFromCode( serviceCode );

	var matchFound = false;

	// loop through options on page to find the desired option value
	$('select#ddlServices > option').each(function(index, optionElem) {
		// get service description from current option element
		var optionServiceDesc = optionElem.innerText.trim().toUpperCase();

		// if this option service desc matches desired service desc:
		// 1) get id (option value), 2) put it in, 3) and break loop!
		if (optionServiceDesc === serviceDesc.toUpperCase()) {
			matchFound = true;

			var optionVal = optionElem.value; // 1 - get id
			$('#ddlServices').val( optionVal ); // 2 - put val in dropdown
			
			// may have to use this instead of .change():
			location.href="javascript:updateDdlActiontype();";
			
			return false; // 3 - break loop
		}
	});

	// check that the dropdown did get populated (error if it didn't)
	if ( !matchFound ) {
		var errorMessage = 'No match found in Services dropdown - service'
			+ ' code may not be accurate';
		
		// stop import and flag error message
		Utils_StopImport( errorMessage, function(response) {
			ThrowError({
				message: errorMessage,
				errMethods: ['mSwal', 'mConsole']
			});
		});

		return;
	}

	// wait until Actions select box is populated before continuing
	Utils_WaitForCondition(
		Utils_IsSelectElemPopulated, ['select#ddlActions'], 1000, 6
	)
	.then(function(successMessage) {
		// action dropdown has been populated by RIPS function! now move on
		setActionDropdown( client, FT ); 
	})
	.catch(function(err) {
		var errorMessage = err;

		// stop import and flag error message
		Utils_StopImport( errorMessage, function(response) {
			ThrowError({
				message: errorMessage,
				errMethods: ['mSwal', 'mConsole']
			});
		});
	});
}

/**
 * Function puts action data into form, then clicks 'save' if no errors.
 * saving redirect page to "View Actions"
 * 
 * @param {object} client - client object
 * @param {object} FT - field translator object for translating spreadsheet data
 *                      into usable form data
 * @returns - only returns early if an error is found
 */
function setActionDropdown( client, FT ) {
	// get action data from client data object
	var actionName = client[FT['ACTION_NAME']];
	// var actionDate = client[FT['ACTION_DATE']]; // TODO: deal with date stuff
	var actionCaseworker = client[FT['ACTION_CASEWORKER']];
	var actionNotes = client[FT['ACTION_NOTES']];

	var foundMatch = false;

	// loop through action dropdown to find action that matches
	$('select#ddlActions > option').each(function(index, optionElem) {
		// get action name from current option element
		var optionActionName = optionElem.innerText.trim().toUpperCase();

		// if this option action name matches desired action name:
		// 1) get id (option value), 2) put it in, 3) and break loop!
		if (optionActionName === actionName.toUpperCase()) {
			foundMatch = true;

			var optionVal = optionElem.value; // 1 - get id
			$('select#ddlActions').val( optionVal ); // 2 - put val in dropdown
			return false; // 3 - break loop
		}
	});

	// check that match was found
	if ( !foundMatch ) {
		var errorMessage = 'No match found in Action dropdown - action name'
			+ ' may not be accurate';
		
		// stop import and flag error message
		Utils_StopImport( errorMessage, function(response) {
			ThrowError({
				message: errorMessage,
				errMethods: ['mSwal', 'mConsole']
			});
		});

		return;
	}

	// add Attendance Notes information:
	$('iframe')
		.contents()
		.find('body')
		.append('<p>' + actionNotes + '</p>');

	// TODO: add date data - id: DATE_OF_ACT

	// --- add caseworker in, if defined in client data ---
	if ( actionCaseworker ) {
		// 1) loop through caseworker dropdown
		$('select#CASEWORKERID option').each(function(rowIndex, optionElem) {
			// get CW from current option element
			var optionCW = optionElem.innerText.trim().toUpperCase();

			// if this cw matches client cw:
			// 1) get id (option value), 2) put it in, 3) and break loop!
			if (optionCW === actionCaseworker.toUpperCase()) {
				var optionVal = optionElem.value; // 1 - get id
				$('select#CASEWORKERID').val( optionVal ); // 2 - put val in dropdown
				return false; // 3 - break loop
			}
		});
	}

	// if select box val is empty, didn't find caseworker
	// -> give user an option to continue or not
	if ( actionCaseworker && $('select#CASEWORKERID').val( ) === '') {
		var message = 'Could not find caseworker from given value "'
			+ actionCaseworker + '" - continue import?\n\nNOTE: This warning'
			+ ' will pop up for every action with this invalid caseworker';
		var moveOn = confirm(message);

		// if user wants to continue, click save and continue import
		if (moveOn)
			clickSave();
		
		// if user doesn't want to move on, stop the import
		else {
			var errorMessage = 'Could not find service caseworker from given value "'
				+ actionCaseworker + '" - chose not to continue';

			// stop auto import, then display an error
			Utils_StopImport( errorMessage, function(response) {
				ThrowError({
					message: errorMessage,
					errMethods: ['mSwal', 'mConsole']
				});
			});
		}
	}

	// caseworker has been successfully added, now click save
	else {
		clickSave();
	}
}

/**
 * Function slightly extrapolates the workflow for clicking save (2 ways this
 * can be called)
 * 
 * Function tells import we're ready to search for the next client, then clicks
 * save automatically! - clicking save redirects to "View Actions" page
 * 
 */
function clickSave() {
	// set action state to advanced search, then click save
	debugger;

	// store action state, then click 'save'
	var mObj = {
		action: 'store_data_to_chrome_storage_local',
		dataObj: {
			'ACTION_STATE': 'SEARCH_FOR_CLIENT',
			'CLIENT_INDEX': '' // auto increment client index
		}
	};
	
	// saves action state, then click save
	chrome.runtime.sendMessage(mObj, function(response) {
		// click 'save' button after a brief timeout
		$('input[value="Save"]').click();
	});
}