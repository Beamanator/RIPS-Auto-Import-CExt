// ============================== PAGE CONTROLLER =======================
/**
 * Controller function for Add Actions page
 * 
 * Called by: Run_CtrlServices [in MainContent.js]
 * 
 * @param {any} action 
 */
function AddAction_Controller( action ) {
	switch(action) {
		// Add action :)
		case 'CLIENT_ADD_ACTION':
			debugger;
			// FIXME: do this stuff next!!
			// addActionRedirect();
			break;

		// Action not handled by controller!
		default:
			console.error('invalid action found in CtrlAddAction.js:', action);
	}
}

// ============================== MAIN FUNCTIONS =======================

// $(document).ready(function(){
// 	getValueFromStorage('ACTION_STATE')
// 	.then(function(action) {
// 		switch(action) {
// 			case 'CLIENT_SERVICE_ADDED':
// 				setServiceDropdown();
// 				break;
// 			// case 'CLIENT_ACTION_SERVICE_SELECTED':
// 				// setActionDropdown();
// 				// break;
// 			case 'CLIENT_ACTION_ADDED':
// 				navigate('/Stars/SearchClientDetails/AdvancedSearch');
// 				break;
// 			default:
// 				message('current ACTION_STATE ('+ action +')is preventing script from running');
// 		}
// 	})
// 	.catch(function(err) {
// 		message(err);
// 	});
// });

// populates the 'Service' dropdown with service 'Adult Education Program' [AEP]
function setServiceDropdown() {
	$('#ddlServices > option').each(function(option) {

		if ($(this).text() === "Children's Education Program") {
			// get service 'id' from dropdown
			var historyID = $(this).val();

			$('#ddlServices').val(historyID);
			
			// call this from RIPS code:
			// [also seen in the html - onchange function]
			// this specific function populates the action dropdown based off service
			location.href="javascript:updateDdlActiontype();";
			
			setTimeout(function() {
				$('#ddlActions').val('32'); // just an example action to add
				$('.cke_show_borders p').innerText="test note (11/20/16)";

				updateStorageLocal([
					{'CLIENT_INDEX': ''},
					{'ACTION_STATE': 'CLIENT_ACTION_ADDED'}
				])
				.then(function(results) {
					$('input[value="Save"]').click();
				});
			}, 400);
		}
	})
}

// populates the 'Action' dropdown with [256] - Spreadsheet inquiry: added to inquiry spreadsheet
// function setActionDropdown() {
// 	$('#ddlActions').val('256');

// 	// TODO: remove later!
// 	// $('#notes').val('Test Notes'); // -> doesn't work now that notes were replaced
// 	//	with an iFrame thing (changed some time before 11/20/16)
// 	$('.cke_show_borders p').innerText="hi";

// 	// TODO: change caseworker if needed!

// 	updateStorageLocal([{'ACTION_STATE': 'CLIENT_ACTION_ADDED'}])
// 	.then(function(results) {
// 		$('input[value="Save"]').click();
// 	});
// }

// navigate to next part of the workflow - searching for the next client.
function navigate(url) {
	updateStorageLocal([{'ACTION_STATE': 'SEARCH_FOR_CLIENT'}])
	.then(function(results) {
		navigateToTab(url);
	});
}