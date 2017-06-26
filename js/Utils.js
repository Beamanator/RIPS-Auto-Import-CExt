// =====================================================================================
//                                    PUBLIC FUNCTIONS
// =====================================================================================

/**
 * Function gets Field Translator from FieldTranslator.js - if file doesn't exist or function
 * is named something else, cancel import and display error.
 * 
 * Called by: MainContent.js, Registration.js
 * 
 * @returns Field Translator object, or undefined
 */
function Utils_GetFieldTranslator() {
	if (FT_getFieldTranslator)
		return FT_getFieldTranslator(); // TODO: add this code to local store & make it part of popup?
	
	// if Field Translator doesn't exist, can't add any clients, so cancel!
	else {
		// set action state to error state
		var mObj = {
			action: 'stopped_via_error'
		};
		
		// send message config (stop auto import) then display an error
		chrome.runtime.sendMessage(mObj, function(response) {
			ThrowError({
				message: 'Field Translator not found! Cancelling import',
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
 * Called by: AdvancedSearch.js, MainContent.js
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
 * Called by: MainContent.js
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
 * Called by: MainContent.js, Utils.js
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
 * Called By: AdvancedSearch.js
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

// =====================================================================================
//                                 PRIVATE FUNCTIONS
// =====================================================================================
