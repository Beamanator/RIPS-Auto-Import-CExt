// ============================== PAGE CONTROLLER =======================
/**
 * Controller function for View Actions pages - decides what to do based off of
 * passed in action.
 * 
 * @param {string} action 
 */
function Services_Controller( action ) {
	switch(action) {
		// redirect to advanced search to start importing next client
		case 'NEXT_CLIENT_REDIRECT':
			nextClientRedirect();
			break;

		// Action not handled by controller!
		default:
			console.error('invalid action found in CtrlViewAction.js:', action);
	}
}

function nextClientRedirect() {
	// store action state (searching for next client), then redirect
	var mObj = {
		action: 'store_data_to_chrome_storage_local',
		dataObj: {
			'ACTION_STATE': 'SEARCH_FOR_CLIENT',
			'CLIENT_INDEX': '' // auto increment client index
		}
	};
	
	// saves action state, then redirects to Advanced Search page
	chrome.runtime.sendMessage(mObj, function(response) {
		Utils_NavigateToTab( Utils_GetTabHref( 'AdvancedSearch' ) );
	});
}