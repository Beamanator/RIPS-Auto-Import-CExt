// ============================== PAGE CONTROLLER =======================
/**
 * Controller function for Services pages - decides what to do based off of
 * passed in action.
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

function startServiceSearch() {
	debugger;
	var needsService = true;

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

		var serviceCode = client[FT['SERVICE_CODE']];

		// FIXME: Need to convert service code or description to names that will
		// appear in the table :(
		// -> Either in DropdownCodeContainer or Utils or new file

	});
	
	console.log('commented out real useful code below [in file]:');
	// TODO: uncomment once above FIXME is complete


	// // Loop through each row and column of the services table:
	// $('table.webGrid tbody tr').each(function(rowIndex) {
	// 	var cellList = $(this).find('td');

	// 	// service name is only thing that uniquely describes service.
	// 	// var serviceHistoryID = cellList[0].innerHTML; // <-- not really needed
	// 	var isLive = $(this).find('input[type="checkbox"]').is(':checked');
	// 	var serviceName = cellList[2].innerHTML;

	// 	// console.log(serviceID, isLive, serviceName);
	// 	var serviceRow = $(this);

	// 	// check if service ID matches that of AEP ('Children's Education Program') & it's live
	// 	if (serviceName === "Children's Education Program") {
	// 		needsService = false;
	// 		// console.log('about to store state to client-service-added');
			
	// 		if (isLive) {
	// 			navigate();
	// 			return false;
	// 		} else {
	// 			updateStorageLocal([{'ACTION_STATE': 'CLIENT_SERVICE_REOPENED'}])
	// 			.then(function(results) {
	// 				// not live, so need to reopen service.
	// 				reOpenService(serviceRow);
	// 				return false;
	// 			});
	// 		}
	// 	}
	// });

	// if (needsService) {
	// 	// If the code got here, we need to add the service. So click "New" after updating action-state
	// 	updateStorageLocal([{'ACTION_STATE': 'CLIENT_SERVICE_NEEDED'}])
	// 	.then(function(results) {
	// 		$('input#NewServices').click();
	// 	});
	// }
}

// re-opens service 'Adult Education Program'
// ugly, but the 'reopen' button shows up around 1 second after clicking on the service you want to reopen
// so my only solution is to have options to wait 1 then 10 seconds for it to show up.
function reOpenService(serviceRow) {
	// click on row to bring up options for reopening:
	serviceRow.click();

	var reopenButton = $('input[value="Reopen"]');

	// look for 'reopen' button, and click it.
	if (reopenButton.length < 1) {
		setTimeout( function(){
			reopenButton = $('input[value="Reopen"]');
			if (reopenButton.length < 1) {
				setTimeout( function(){
					reopenButton = $('input[value="Reopen"]');
					if (reopenButton.length < 1) {
						// TODO: potentially set ACTION_STATE to something to continue the
						// process. Also maybe store some error info? stop the import?
						console.log('after 11 seconds, still couldnt reopen the service :(');
					} else {
						reopenButton.click();
					}
				}, 10000);
			} else {
				reopenButton.click();
			}
		}, 1000);
	} else {
		reopenButton.click();
	}
}

// navigate to next part of the workflow - adding actions.
function navigate() {
	updateStorageLocal([{'ACTION_STATE': 'CLIENT_SERVICE_ADDED'}])
	.then(function(results) {
		navigateToTab('/Stars/MatterAction/CreateNewAction');
	});
}