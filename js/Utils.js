// =====================================================================================
//                                    PUBLIC FUNCTIONS
// =====================================================================================

/**
 * Function gets Field Translator from FieldTranslator.js - if file doesn't exist or function
 * is named something else, cancel import and display error.
 * 
 * Called by: MainController.js, CtrlRegistration.js, CtrlServices.js, CtrlAddAction.js
 * 
 * @returns Field Translator object, or undefined
 */
function Utils_GetFieldTranslator() {
	if (FT_getFieldTranslator)
		return FT_getFieldTranslator(); // TODO: add this code to local store & make it part of popup?
	
	// if Field Translator doesn't exist, can't add any clients, so cancel!
	else {
		var errorMessage = 'Field Translator not found! Cancelling import';

		// stop import and flag error message
		Utils_StopImport( errorMessage, function(response) {
			ThrowError({
				message: errorMessage,
				errMethods: ['mSwal', 'mConsole']
			});
		});

		return;
	}
}

/**
 * Function tells background.js to stop the auto import function via
 * action 'stopped_via_error', and passes an error message to background.js, then
 * the chrome runtime callback to caller
 * 
 * @param {string} errorMessage - error message to pass to background.js
 * @param {function} callback - chrome runtime callback sent to caller. if not given,
 *                              defaults to console.error() fn
 */
function Utils_StopImport( errorMessage, callback ) {
	// take care of defaults
	if ( !errorMessage )
		errorMessage = 'stopping import';
	if ( !callback )
		callback = function(response) { console.error('error: ', errorMessage ); };

	// set action state to error state
	var mObj = {
		action: 'stopped_via_error',
		message: errorMessage
	};

	// send message config (stop auto import) then display an error
	chrome.runtime.sendMessage(mObj, callback);
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
function Utils_NavigateToTab( tab_href ) {
	if ( tab_href !== undefined)
		$('a[href="' + tab_href + '"]')[0].click();
	else
		console.warn('Utils_NavigateToTab received invalid tab href');
}

/**
 * Function converts passed-in tab name to url piece that RIPS holds as a
 * location for each tab in navigation menu (left panel)
 * 
 * @param {string} tabName - name of tab you want url piece for 
 * @returns tab's href (location) - (or undefined if tabName is incorrect)
 */
function Utils_GetTabHref( tabName ) {
	// create map for tab name to url piece
	var map = {
		'Registration': 			'/Stars/Registration/Registration',
		// 'ClientBasicInformation': 	'/Stars/ClientDetails/ClientDetails', // not used

		'AddAction': 			'/Stars/MatterAction/CreateNewAction',
		'Services': 			'/Stars/ClientDetails/ClientServicesList',
		// 'ViewActions': 			'/Stars/MatterAction/MatterActionsList', // not used

		'AdvancedSearch': 		'/Stars/SearchClientDetails/AdvancedSearch'
	};

	// get tab href from map
	var tab_href = map[tabName];

	// error if tabName is incorrect (or map is incorrect)
	if ( tab_href == undefined )
		console.error('tab name not defined in url map');
	
	// return tab href
	return tab_href;
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
	var url = Utils_GetPageURL();

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
 * Function returns the description of the service for the given code
 * Purpose = for service controller to match to list of services on page
 * 
 * Called by: CtrlServices.js
 * 
 * @param {string} code - code of service (from Matters and Actions -> Matters) page
 * 						-> up to 6 characters long
 * @returns - string description of service, or undefined
 */
function Utils_GetServiceDescFromCode( code ) {
	// remove beginning and ending whitespace (spaces, \t, \n) from code
	code = code.trim();

	// set up translation mapping object
	var map = {										// id's below
		AEP:	'Adult Education Program',			// 65
		AFP: 	'PS Adults and Families Program',	// 56
		CEP: 	'Children\'s Education Program', 	// 64
		DAP:	'PS Direct Assistance Program',		// 57
		DIER:	'PS Drop in and Emergency Response',		// 58
		EACB:	'Education Access and Capacity Building',	// 66
		GROUPS:	'PS Groups and Activities',			// 59
		MAN:	'Management',						// 67
		MED:	'PS Medical Access Program',		// 60
		MONT:	'Montessori Preschool',				// 63
		NONCLN:	'Non Client Time',					// 39
		PDC:	'Professional Development Courses',	// 69
		PRO:	'RLAP Protection',					// 68
		RSD:	'RLAP RSD',							// 45
		RST:	'RLAP Resettlement', 				// 55
		UCY:	'PS Unaccompanied Children and Youth Program',	// 61
		UYBP:	'PS Unaccompanied Youth Bridging Program'		// 62
	};

	return map[code];
}

/**
 * Function returns a promise that gets resolved whenever a specified function
 * returns true. Caller passes in a function and possibly a number (time between
 * intervals)
 * 
 * @param {function} Fcondition - function that must eventually return true
 * @param {object} params - array of parameters to pass to Fcondition
 * @param {number} [time=500] - time between each interval call
 * @param {number} [iter=10] - number of iterations allowed before rejecting
 * @returns Promise - resolves when Fcondition returns true
 */
function Utils_WaitForCondition( Fcondition, params, time = 1000, iter = 5 ) {
	return new Promise(function(resolve, reject) {
		var count = 0;
		
		var intervalID = setInterval(function() {
			// -> console logs may not work inside this function
			count++;
			
			// check if condition is true YET
			if ( Fcondition(params) ) {
				clearInterval(intervalID);
				resolve('condition passed');
			}

			// check if we've passed the desired amount of iterations on setInterval
			if (count > iter) {
				clearInterval(intervalID);
				reject('Condition <' + Fcondition.name + '> never returned true over '
					+ iter + ' checks, spaced by ' + time + 'ms.');
			}

		}, time);
	});
}

/**
 * Function inserts value into textbox / date fields using jQuery
 * 
 * @param {any} value string or number
 * @param {string} id html id of element 
 */
function Utils_InsertValue(value, id) {
	// if value exists, throw into field:
	if (value !== undefined) {
		// if value starts with a '.', get rid of it:
		if (value[0] === '.') {
			value = value.substr(1);
		}

		$('#' + id).val(value);
	}

	// if value is undefined, warn user
	else {
		console.warn('Warning: id <' + id + '> came with undefined value');
	}
}

// =====================================================================================
//                                 UNUSED FUNCTIONS
// =====================================================================================

/**
 * Function finds a select element (from input select_selector) using jQuer, then
 * returns true if the select element has an option element selected, and
 * returns false if the select element has not been 'populated' / selected
 * 
 * UNUSED because it's easier to just check while looping through dropdowns...
 * for now
 * 
 * @param {object} selector_arr - single-element array with jQuery selector
 * 								  to locate desired select element
 * @returns {boolean} - if select element has a 'selected' option element
 */
function Utils_IsSelectElemPopulated( selector_arr ) {
	var select_selector = selector_arr[0];

	// if selector_arr has more than 1 element, console log warning (don't quit)
	if (selector_arr.length > 1)
		console.warn('Utils_IsSelectElemPopulated has too many elements in arg array');

	// check to make sure input is valid
	if ( !$(select_selector).is('select') ) {
		// select_selector is not a select element, so processing will fail! - quit
		// error should be thrown by calling function
		return false;
	}

	// get number of selected items out of given select element's selected options
	var selectedOptions = $( select_selector + ' option:selected');

	if ( selectedOptions.length === 0 ) {
		// select element doesn't have any option element selected yet
		return false;
	} else if ( selectedOptions.length === 1 && selectedOptions.val() ) {
		// select element has a selected element populated & it isn't ""
		return true;
	} else {
		console.warn('I think we would be here if more than one option is selected'
			+ ' which we DIDNT PREPARE FOR??');
	}
}