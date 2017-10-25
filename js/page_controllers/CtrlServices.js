// ============================== PAGE CONTROLLER =======================
/**
 * Controller function for Services pages - decides what to do based off of
 * passed in action.
 * 
 * Process:
 * 1) Get current client's service code from input (it should exist)
 * 2) Gets matching service description
 * 3) Looks for service description on "services" list page
 * 4.A) - redirects to add new if doesn't exist
 * 4.B) - reopens (if needed) then redirects to Action controller if does exist
 * 
 * Called by: Run_CtrlServices [in MainContent.js]
 * 
 * @param {any} action 
 */
function Services_Controller( action ) {
	switch(action) {
		// check client services - decide if new or reopen is needed
		case 'CHECK_CLIENT_SERVICES':
			startServiceSearch();
			break;

		// new service needed - add it!
		case 'CLIENT_ADD_SERVICE':
			addNewService();
			break;

		// redirect to add action page
		case 'CLIENT_ADD_ACTION_DATA':
			addActionRedirect();
			break;

		// service was added, but no action data needed - redirect to advanced search
		case 'CLIENT_SKIP_ACTION_DATA':
			importNextClientRedirect();
			break;

		// Action not handled by controller!
		default:
			console.error('Unhandled action found in CtrlServices.js:', action);
	}
}

// ============================== MAIN FUNCTIONS =======================

/**
 * Function begins the search for:
 * 1) if a service needs to be added to the client, and
 * 2) if the service already exists, and
 * 3) if the service already exists and needs to be reopened
 * 
 */
function startServiceSearch() {
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

		// get service code from client object
		var serviceCode = client['SERVICE CODE'];

		// get service description from map - to match with table
		var serviceDesc = Utils_GetServiceDescFromCode( serviceCode );

		// get action name for later
		var actionName = client['ACTION NAME'];

		// if service description doesn't exist, id didn't match mapping
		if (!serviceDesc) {
			var errorMessage = 'client #' + (clientIndex + 1) + ' from import has a'
				+ ' service code that doesn\'t match a real service';
			
			// service code didn't match, so stop import...
			var mObj2 = {
				action: 'stopped_via_error',
				message: errorMessage
			};

			chrome.runtime.sendMessage(mObj2, function(response) {
				// ... then warn user about error
				ThrowError({
					message: errorMessage,
					errMethods: ['mAlert', 'mConsole']
				});
			});
		}
		
		// serviceDesc exists, so try to find it in the services list
		else {
			searchServiceInTable( serviceDesc, actionName );
		}
	});
	
	// console.log('commented out real useful code below [in file]:');
}

/**
 * Function attempts to match a given service description with descriptions
 * shown in the "services" table on Service page.
 * 
 * If service is found, decide if it needs to be reopened
 * Else, redirect to page to add service
 * 
 * @param {string} serviceDesc - description of service to match to table descriptions
 * @param {string} actionName - indicator for where to go next (add action / advanced search)
 */
function searchServiceInTable( serviceDesc, actionName ) {
	var needsService = true;
	
	// Loop through each row and column of the services table:
	$('table.webGrid tbody tr').each(function(rowIndex) {
		var $serviceRow = $(this);

		// get array of cells in current service row
		var cellList = $serviceRow.find('td');

		// service description is only thing that uniquely describes service on page.
		var isLive = $serviceRow.find('input[type="checkbox"]').is(':checked');
		var rowServiceDescription = cellList[2].innerHTML;

		// check if serviceDesc matches this row
		if (rowServiceDescription.toUpperCase() === serviceDesc.toUpperCase()) {
			
			// no need to add new service if live already
			if (isLive)
				needsService = false;
			
			/*
				If service found but not live: do nothing
					-> needsService stays true, so adds service
					-> still exits loop (via return false)
					-> removing reOpenService($serviceRow); (see Footnote A)
			*/

			return false; // -> break loop
		}

		// return true; -> same as 'continue' in jquery loop
	});

	// serviceDesc wasn't found in table or service is closed (so let's open it!)
	if (needsService) {
		var mObj = {
			action: 'store_data_to_chrome_storage_local',
			dataObj: {
				'ACTION_STATE': 'CLIENT_ADD_SERVICE'
			}
		};
		
		// update action state then click 'new' button
		// -> this will redirect to page to add a new service
		chrome.runtime.sendMessage(mObj, function(response) {
			$('input#NewServices').click();
		});
	}
	
	// service is found and live already, so 1st check if action name exists
	// -> if it does, change action state then go to CreateNewAction
	// -> if not, change action state then go to advanced Search
	else {
		// if actionName exists, set action state and redirect to Add Action page
		if ( actionName ) {
			// goal = store action state, then redirect
			var mObj = {
				action: 'store_data_to_chrome_storage_local',
				dataObj: {
					'ACTION_STATE': 'CLIENT_ADD_ACTION_DATA'
				}
			};

			// saves action state, then redirects to add action page
			chrome.runtime.sendMessage(mObj, function(response) {
				addActionRedirect();
			});
		}

		// if actionName doesn't exist / is empty, skip and go to advanced search
		else
			importNextClientRedirect();
	}
}

/**
 * Function adds a new service and caseworker (if needed) to client, updates
 * ACTION_STATE, then clicks save
 */
function addNewService() {
	// get client data (interested in service data)
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

		// get service field translator
		var FTs = Utils_GetFieldTranslator( 'Service' );
		if (!FTs) return; // let Utils handle everything - and quit!

		// get service data from client object
		var serviceCode = client['SERVICE CODE'].toUpperCase();
		var serviceStart = client['SERVICE START DATE'];
		var serviceCaseworker = client['SERVICE CASEWORKER'];

		// get actionName for future reference
		var actionName = client['ACTION NAME'];

		// get 6-character code (fill with spaces on right)
		var fullServiceCode = fillServiceCode( serviceCode, ' ' );

		// set service dropdown to service (using service code)
		var serviceFound = Utils_CheckErrors([
			[ Utils_InsertValue( fullServiceCode, FTs['SERVICE CODE'], 2 ), 'SERVICE CODE']
		], clientIndex);

		// if match wasn't found, break import and error
		if ( !serviceFound ) {
			var errorMessage = 'No match found in Service Description dropdown - '
				+ 'service code may not be accurate';
		
			// skip client
			Utils_SkipClient(errorMessage, clientIndex);
			return;
		}

		// ======== Service Start Date ========
		// Add service start date
		if (serviceStart) {
			let dateSuccess = Utils_CheckErrors([
				[ Utils_InsertValue( serviceStart, FTs['SERVICE START DATE'], 3 ),
					'SERVICE START DATE' ]
			], clientIndex)
		}
		
		// check if error exists here, but don't do anything exciting about it
		if (!dateSuccess)
			console.warn('Service Start Date not successful');

		// ======== Caseworker ==========
		// --- add caseworker in, if defined in client data ---
		// Note: Caseworker automatically set as logged-in user!
		var caseworkerFound = false;
		if ( serviceCaseworker ) {
			caseworkerFound = Utils_CheckErrors([
				[ Utils_InsertValue( serviceCaseworker, FTs['SERVICE CASEWORKER'], 1 ),
					'SERVICE CASEWORKER']
			], clientIndex);

			// 1) loop through caseworker dropdown
			// $('select#CASEWORKERID option').each(function(rowIndex, optionElem) {
			// 	// get CW from current option element
			// 	var optionCW = optionElem.innerText.trim().toUpperCase();

			// 	// if this cw matches client cw:
			// 	// 1) get id (option value), 2) put it in, 3) and break loop!
			// 	if (optionCW === serviceCaseworker.toUpperCase()) {
			// 		var optionVal = optionElem.value; // 1 - get id
			// 		$('select#CASEWORKERID').val( optionVal ); // 2 - put val in dropdown
			// 		return false; // 3 - break loop
			// 	}
			// });
		}

		// if select box val is empty, didn't find caseworker
		// -> give user an option to continue or not
		if ( serviceCaseworker && !caseworkerFound ) {
			// var message = 'Could not find caseworker from given value "'
			// 	+ serviceCaseworker + '" - continue import?\n\nNOTE: This warning'
			// 	+ ' will pop up for every service with this invalid caseworker';

			// var moveOn = confirm(message);

			// // if user wants to continue, click save and continue import
			// if (moveOn)
			// 	clickSave( actionName );
			
			// // if user doesn't want to move on, stop the import
			// else {
				var errorMessage = 'Could not find service caseworker from given value ' +
					`"${serviceCaseworker}" - skipping client`;

				// skip client
				Utils_SkipClient(errorMessage, clientIndex);

				// stop auto import, then display an error
				// Utils_StopImport( errorMessage, function(response) {
				// 	console.log('error adding service caseworker');
				// 	// ThrowError({
				// 	// 	message: errorMessage,
				// 	// 	errMethods: ['mConsole']
				// 	// });
				// });
			// }
		}

		// caseworker was found and successfully added to dropdown!
		// next = just save!
		// TODO: make sure service dropdown is populated before clicking save
		// -> or move all of this into if statement section above
		else 
			clickSave( actionName );
	});
}

/**
 * Function slightly extrapolates clicking the save button. (2 ways this function
 * can be called)
 * 
 * Also - save click delayed by 500 milliseconds just to give Action dropdown
 * some time to load [last test = results are same if we wait or not]
 * 
 * @param {object} actionName - name of action to be added to client
 */
function clickSave( actionName ) {
	var actionState;

	// if actionName doesn't exist / is empty, skip adding action data
	if (!actionName || actionName === '')
		actionState = 'CLIENT_SKIP_ACTION_DATA';

	// if actionName exists, set action state and click 'save'
	else
		actionState = 'CLIENT_ADD_ACTION_DATA';

	// store action state, then click 'save'
	var mObj = {
		action: 'store_data_to_chrome_storage_local',
		dataObj: {
			'ACTION_STATE': actionState
		}
	};
	
	// saves action state, then click save
	chrome.runtime.sendMessage(mObj, function(response) {
		// click 'save' button after a brief timeout
		setTimeout( function(){
			$('input[value="Save"]').click();
		}, 500);
	});
}

/**
 * Function saves action state (to inform advanced search page we're ready to
 * import the next client), then redirects user to advanced search page
 * 
 */
function importNextClientRedirect() {
	// set up obj to tell advanced search we're ready to import again
	var mObj = {
		action: 'store_data_to_chrome_storage_local',
		dataObj: {
			'ACTION_STATE': 'SEARCH_FOR_CLIENT',
			'CLIENT_INDEX': '' // auto increment
		}
	};

	// saves action state, then redirects to advanced search
	chrome.runtime.sendMessage(mObj, function(response) {
		Utils_NavigateToTab( Utils_GetTabHref('AdvancedSearch') );
	});
}

/**
 * Function redirects user to Add Action page only
 * 
 */
function addActionRedirect() {
	Utils_NavigateToTab( Utils_GetTabHref('AddAction') );
}

/**
 * Function adds character 'char' to string 'serviceCode' until the new produced
 * string is 6 characters long.
 * 
 * @param {string} serviceCode - original code that may need more characters
 * @param {string} char - characters to add at the end of serviceCode
 * @returns - new code that is 6 characters long
 */
function fillServiceCode( serviceCode, char ) {
	var newCode = serviceCode;

	// loop, adding char to newCode on each iteration
	for (var i = newCode.length; i < 6; i++) {
		newCode += char;
	}

	return newCode;
}

/**
 * Footnote Comments:
 * 
 * A) function reOpenService() removed b/c:
 *    -> it looks super ugly, and if internet is bad, maay still break.
 *    -> if a service is 'closed', you can still add a new one of the same type
 *    -> can't have 2 live servies of the same type, can have two closed of same type
 */