$(document).ready(function(){
	getValueFromStorage('ACTION_STATE')
	.then(function(action) {
		switch(action) {
			case 'CLIENT_ACTION_ADDED':
				updateStorageLocal([{'ACTION_STATE': 'SEARCH_FOR_CLIENT'}])
				.then(function(results) {
					navigate();
				});
				break;
			default:
				message('current ACTION_STATE ('+ action +') is preventing script from running');
		}
	})
	.catch(function(err) {
		message(err);
	});
});

// navigate to next part of the workflow - back to advanced search.
function navigate() {
	navigateToTab('/Stars/SearchClientDetails/AdvancedSearch');
}