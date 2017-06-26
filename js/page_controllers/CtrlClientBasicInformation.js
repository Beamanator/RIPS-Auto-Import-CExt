// ============================== PAGE CONTROLLER =======================
/**
 * Controller function for ClientBasicInformation.js - decides what to do based off of
 * passed in action
 * 
 * Called by: Run_ClientBasicInformation [in MainContent.js]
 * 
 * @param {string} action 
 */
function ClientBasicInformation_Controller( action ) {
	switch(action) {
		// client created, now decide what to do next
		case 'CLIENT_CREATED':
			// TODO: add the ability to import dependent / vulnerability info
			MainContent_DoNextStep();
			break;

		// Action not handled by ClientBasicInformation.js!
		default:
			console.error('invalid action found in ClientBasicInformation.js:', action);
	}
}