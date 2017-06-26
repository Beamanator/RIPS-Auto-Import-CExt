$(document).ready(function(){

	getValueFromStorage('ACTION_STATE')
	.then(function(action) {
		console.log('action passed in:' + action);
		switch(action) {
			case 'CLIENT_SERVICE_NEEDED':
				setServiceDropdown();
				break;
			default:
				message('current ACTION_STATE ('+ action +') is preventing script from running');
		}
	})
	.catch(function(err) {
		message(err);
	});
});

// populates the 'Services Description' dropdown with service 'Adult Education Program' [AEP]
//  or "Children's Education Program" [CEP]
function setServiceDropdown() {
	$('#lscCodeValue').val('CEP   ').change();

	// wait a bit, just in case.
	setTimeout( function(){
		$('input[value="Save"]').click();
	}, 500);
}