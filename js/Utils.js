// =====================================================================================
//                                    PUBLIC FUNCTIONS
// =====================================================================================

/**
 * Function gets Field Translator from FieldTranslator.js - if file doesn't exist or function
 * is named something else, cancel import and display error.
 * 
 * Called by: MainController.js, CtrlRegistration.js, CtrlServices.js, CtrlAddAction.js
 * 
 * TODO: add field translator code to local store &/ or make it part of popup?
 * TODO: remove flag_getElemID
 * 
 * @param {string} type - type of translator to return: options = 'Required', 'Optional', 'Service', 'Action', 'All'
 * @param {boolean} flag_getElemID - true if caller wants elem ID, false if not (other option = spreadsheet column header)
 * @returns Field Translator object, or undefined
 */
function Utils_GetFieldTranslator( type, flag_getElemID ) {

	// all translators
	if (FT_getAllTranslator && type.toUpperCase() === 'ALL')
		return FT_getAllTranslator( flag_getElemID );

	// 'search' translator
	else if (FT_getSearchTranslator && type.toUpperCase() === 'SEARCH')
		return FT_getSearchTranslator( flag_getElemID );
	
	// required translator
	else if (FT_getRequiredTranslator && type.toUpperCase() === 'REQUIRED')
		return FT_getRequiredTranslator( flag_getElemID );

	// optional translator
	else if (FT_getOptionalTranslator && type.toUpperCase() === 'OPTIONAL')
		return FT_getOptionalTranslator( flag_getElemID );

	// action translator
	else if (FT_getActionTranslator && type.toUpperCase() === 'ACTION')
		return FT_getActionTranslator( flag_getElemID );

	// service translator
	else if (FT_getServiceTranslator && type.toUpperCase() === 'SERVICE')
		return FT_getServiceTranslator( flag_getElemID );

	// if Field Translator doesn't exist, can't add any clients, so cancel!
	else {
		var errorMessage = 'Field Translator [type="' + type 
			+ '"] not found! Cancelling import';

		// stop import and flag error message
		Utils_StopImport( errorMessage, function(response) {
			ThrowError({
				message: errorMessage,
				errMethods: ['mSwal', 'mConsole']
			});
		});

		// TODO: set action state to error state

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
		'ClientBasicInformation': 	'/Stars/ClientDetails/ClientDetails',

		'AddAction': 				'/Stars/MatterAction/CreateNewAction',
		'Services': 				'/Stars/ClientDetails/ClientServicesList',
		// 'ViewActions': 		'/Stars/MatterAction/MatterActionsList', // not used

		'AdvancedSearch': 			'/Stars/SearchClientDetails/AdvancedSearch'
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
 * OR if given 'id' corresponds to a select element, call special
 * insert function
 * 
 * @param {any} value - string or number
 * @param {string} id - html id of element
 * @param {number} searchMethod - method # for searching dropdown boxes
 * @returns true if successfully found something to insert into form, false otherwise
 */
function Utils_InsertValue(value, id, searchMethod) {
	// if value exists, throw into field:
	if (value !== undefined) {
		// if id is for a select element, call special fn
		if ( $('#' + id).is('select') ) {
			return Utils_SetDropdownValue( value, id, searchMethod );
		}

		// else if id is for a checkbox (input[type="checkbox"]) element,
		// call special fn
		else if ( $('#' + id).is('input[type="checkbox"]')  ) {
			return Utils_SetCheckboxValue( value, id );
		}

		// else, we don't need special function
		else {
			// if value starts with a '.', get rid of it:
			if (value[0] === '.') {
				value = value.substr(1);
			}

			$('#' + id).val(value);

			return true;
		}
	}

	// if value is undefined, warn user
	else {
		console.warn('Warning: id <' + id + '> came with undefined value');
		return false;
	}
}

/**
 * Function attempts to match a value to the inner text of all of the options in
 * a dropdown (select) element
 * 
 * If successful match is found, sets that option as 'selected' in dropdown
 * 
 * NOTE: only works for single-select dropdowns!
 * 
 * TODO: provide extra options for select dropdowns? is this possible? (probably not)
 * ex: male = "M" OR "male"
 * ex: sudan = "Sudan" OR "Sudanese"
 * 
 * @param {string} valToMatch - value to look for in dropdown (select) element
 * @param {string} elemID - html id of select element to search through
 * @param {number} [searchMethod=1] - 1 = by innerText, 2 = by elem value
 * @returns success (true / false) in finding the valToMatch variable
 */
function Utils_SetDropdownValue( valToMatch, elemID, searchMethod=1 ) {
	var found = false;

	// find select element (jQuery) and loop through each option element
	$('select#' + elemID + ' option').each(function(rowIndex, optionElem) {
		// get inner text (trimmed and uppercase) from current option element
		let optionText;
		
		// get text via innerText
		if (searchMethod === 1) {
			optionText = optionElem.innerText.trim().toUpperCase();
		}

		// get text via element value
		// Right now removing (.trim()) b/c this search method is used only for
		// service codes, which need the extra spaces to match values properly
		else if (searchMethod === 2) {
			optionText = optionElem.value.toUpperCase();
		}

		// search method doesn't exist, so quit with found = false still
		else {
			return false;
		}

		// if this text matches variable 'valToMatch':
		// 1) get option value,
		// 2) 'select' that value,
		// 3) change 'found' variable
		// 4) and break loop!
		if (optionText === valToMatch.toUpperCase()) {

			let optionVal = optionElem.value; // 1 - get id
			$('select#' + elemID).val( optionVal ).change(); // 2 - put val in dropdown
			found = true; // 3 - change variable
			return false; // 4 - break loop
		}
	});

	return found;
}

/**
 * Function checks or unchecks given checkbox html id to align with passed-in
 * desired value
 * 
 * @param {boolean} value - desired end state of checkbox
 * @param {string} elemID - html element id matching with input[type="checkbox"]
 */
function Utils_SetCheckboxValue( value, elemID ) {
	var isChecked = $('input#' + elemID).is(':checked');

	// checkbox should be 'true' / checked
	if ( value ) {
		// do nothing because already checked
		if ( isChecked ) {}

		// else click it so it becomes checked
		else $("input#" + elemID).click();
	}

	// checkbox should be 'false' / unchecked
	else {
		// click so it becomes unchecked
		if ( isChecked ) $("input#" + elemID).click();

		// else do nothing because already unchecked
		else {}
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