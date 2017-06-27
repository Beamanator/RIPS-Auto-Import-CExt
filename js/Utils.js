// =====================================================================================
//                                    PUBLIC FUNCTIONS
// =====================================================================================

/**
 * Function gets Field Translator from FieldTranslator.js - if file doesn't exist or function
 * is named something else, cancel import and display error.
 * 
 * Called by: MainController.js, CtrlRegistration.js
 * 
 * @returns Field Translator object, or undefined
 */
function Utils_GetFieldTranslator() {
	if (FT_getFieldTranslator)
		return FT_getFieldTranslator(); // TODO: add this code to local store & make it part of popup?
	
	// if Field Translator doesn't exist, can't add any clients, so cancel!
	else {
		var errorMessage = 'Field Translator not found! Cancelling import';
		
		// set action state to error state
		var mObj = {
			action: 'stopped_via_error',
			message: errorMessage
		};
		
		// send message config (stop auto import) then display an error
		chrome.runtime.sendMessage(mObj, function(response) {
			ThrowError({
				message: errorMessage,
				errMethods: ['mSwal', 'mConsole']
			});
		});

		return;
	}
}

/**
 * Function navigates import to specific RIPS tab by clicking on the anchor with
 * specified href / URL
 * 
 * Called by: CtrlAdvancedSearch.js, MainController.js, CtrlServices
 * 
 * @param {string} tab_href - url piece that is contained within an anchor tag on the
 *                            left-hand navigation menu
 */
function Utils_NavigateToTab(tab_href) {
	$('a[href="' + tab_href + '"]')[0].click();
}

/**
 * Function gets current page url (using jQuery) and returns it.
 * 
 * Called by: MainController.js
 * 
 * @returns gurrent page's url [as string]
 */
function Utils_GetPageURL() {
	return $(location).attr('href');
}

/**
 * Function takes a URL as an input and returns a 'url piece' as output. This output
 * is the last two slices of a URL (a slice is some text between '/' characters)
 * -> example: 'Registration/Registration'
 * 
 * If url doesn't have '/' characters, returns url
 * 
 * Called by: MainController.js, Utils.js
 * 
 * @param {string} url a full URL
 * @returns {string} 'urlslice1/urlslice2' - the final 2 slices of a url
 */
function Utils_GetUrlPiece( url ) {
	// convert input to a string and split it!
	var urlArr = String(url).split('/');
	var urlLen = urlArr.length;

	if (urlLen === 1)
		return url; 

	return urlArr[urlLen - 2] + '/' + urlArr[urlLen - 1];
}

/**
 * Function checks if a given piece of a URL is contained within the current page's
 * url string.  
 * 
 * Called By: CtrlAdvancedSearch.js
 * 
 * @param {string} urlPiece checks if this piece is within the current page url
 * @returns {boolean} true / false depending on if urlPiece is contained within current url
 */
function Utils_UrlContains(urlPiece) {
	var url = Utils_GetUrlPiece();

	if (url.indexOf(urlPiece) === -1) {
		// error & quit if the import is not on the right page.
		ThrowError({
			message: urlPiece + ' not found on page: ' + url,
			errMethods: ['mConsole']
		});
		return false;
	}

	return true;
}

/**
 * Function returns the description of the service for the given id
 * Purpose = for service controller to match to list of services on page
 * 
 * Called by: CtrlServices.js
 * 
 * @param {number} id - id of service (from Matters and Actions -> Matters) page
 * @returns - string description of service, or undefined
 */
function Utils_GetServiceDescFromID( id ) {
	var map = {
		65:		'Adult Education Program',			// AEP
		56: 	'PS Adults and Families Program',	// AFP
		64: 	'Children\'s Education Program', 	// CEP
		57:		'PS Direct Assistance Program',		// DAP
		58:		'PS Drop in and Emergency Response',		// DIER
		66:		'Education Access and Capacity Building',	// EACB
		59:		'PS Groups and Activities',			// GROUPS
		67:		'Management',						// MAN
		60:		'PS Medical Access Program',		// MED
		63:		'Montessori Preschool',				// MONT
		39:		'Non Client Time',					// NONCLN
		69:		'Professional Development Courses',	// PDC
		68:		'RLAP Protection',					// PRO
		45:		'RLAP RSD',							// RSD
		55:		'RLAP Resettlement', 				// RST
		61:		'PS Unaccompanied Children and Youth Program',	// UCY
		62:		'PS Unaccompanied Youth Bridging Program'		// UYBP
	};

	return map[id];
}

// =====================================================================================
//                                 PRIVATE FUNCTIONS
// =====================================================================================
