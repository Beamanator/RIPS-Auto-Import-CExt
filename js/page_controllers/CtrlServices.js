// ============================== PAGE CONTROLLER =======================
/**
 * Controller function for Services pages - decides what to do based off of
 * passed in action.
 * 
 * Process:
 * 1) Get current client's service id from input (it should exist)
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

		// Action not handled by controller!
		default:
			console.error('invalid action found in ClientServicesList.js:', action);
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

		var FT = Utils_GetFieldTranslator();
		if (!FT) return; // let Utils handle everything - and quit!

		// get service id from client object
		var serviceID = client[FT['SERVICE_ID']];

		// TODO: Make sure ids from Utils_GetServiceDescFromID is the same id
		// needed in adding a service!

		// get service description from map - to match with table
		var serviceDesc = Utils_GetServiceDescFromID( serviceID );

		// if service description doesn't exist, id didn't match mapping
		if (!serviceDesc) {
			var errorMessage = 'client #' + (clientIndex + 1) + ' from import has a'
				+ ' service id that doesn\'t match a real service';
			
			// service id didn't match, so stop import...
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
			searchServiceInTable( serviceDesc );
		}
	});
	
	console.log('commented out real useful code below [in file]:');
}

/**
 * Function attempts to match a given service description with descriptions
 * shown in the "services" table on Service page.
 * 
 * If service is found, decide if it needs to be reopened
 * Else, redirect to page to add service
 * 
 * @param {string} serviceDesc - description of service to match to table descriptions 
 */
function searchServiceInTable( serviceDesc ) {
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
			
			if (isLive) {
				// no need to add new service
				needsService = false;
				
				// navigate to add actions page
				Utils_NavigateToTab('/Stars/MatterAction/CreateNewAction');
			}
			
			/*
				If service found but not live: do nothing
					-> needsService stays true, so adds service
					-> still exits loop (via return false)
					-> removing reOpenService($serviceRow); (reasons below)
			*/

			return false; // -> break loop
		}

		// return true; -> same as 'continue' in jquery loop
	});

	// serviceDesc wasn't found in table, so client needs new service added
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
}

// NOTE: Code (reOpenService) removed b/c:
// 1) it looks super ugly, and if internet is bad, maay still break.
// 2) if a service is 'closed', you can still add a new one of the same type
//    -> can't have 2 live servies of the same type, can have two closed of same type