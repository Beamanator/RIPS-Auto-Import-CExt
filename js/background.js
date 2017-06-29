// Initialize firebase:
// var config = {
//     apiKey: "AIzaSyDRulUofq1zYX7Z1J2t--A2CRzObthoIDc",
//     authDomain: "fedenaimportconfig.firebaseapp.com",
//     databaseURL: "https://fedenaimportconfig.firebaseio.com",
//     // storageBucket: "fedenaimportconfig.appspot.com",
//     messagingSenderId: "197993359621"
// };
// firebase.initializeApp(config);

// ================================================================================================
//                                  MAIN EVENT LISTENERS
// ================================================================================================

// React when a browser action's icon is clicked.
chrome.browserAction.onClicked.addListener(function(tab) {
    // do something
});

// React when a tab is closed
chrome.tabs.onRemoved.addListener(function(tabId, removeInfo) {
    // do stuff
});

/* mObj             object containing config and data
 *                  {
 *               		action: "get_data_...",
 *               		dataObj: {
 *                          'key1': value1,
 *                          'key2': value2
 *                      },
 *                      noCallback: false
 *               	}
 * MessageSender    chrome object that holds information about message sender (ex: tab id)
 * sendResponse     callback function for message sender
 */
chrome.runtime.onMessage.addListener(function(mObj, MessageSender, sendResponse) {
    var action = mObj.action;
    var async = false;
    var noCallback = mObj.noCallback;

    // kill callback if noCallback flag is true
    if (noCallback) sendResponse = undefined;

    switch(action) {
        // gets data from chrome's local storage and returns to caller via sendResponse
        case 'get_data_from_chrome_storage_local':
            getValuesFromChromeLocalStorage(mObj, sendResponse);
            // async because uses promises
            async = true;
            break;

        // save data to chrome's local storage
        case 'store_data_to_chrome_storage_local':
            storeToChromeLocalStorage(mObj, sendResponse);
            // async because uses promises
            async = true;
            break;

        // clear data from keys in mObj.dataObj [clear by setting keys to '']
        case 'clear_data_from_chrome_storage_local':
            clearDataFromChromeLocalStorage(mObj, sendResponse);
            // async because uses promises
            async = true;
            break;

        // import has finished successfully, do 'finishing' things:
        case 'finish_import':
            finishClientImport();
            break;

        // import should be stopped due to an error
        case 'stopped_via_error':
            stopViaError(mObj, sendResponse);
            break;

        // ---- NEW ACTIONS GO ABOVE THIS LINE ----
        
        // to use open / close tab, look in Fedena extension code
        case 'open/close_tab':
            console.error('opening / closing tabs not handled yet');
            break;

        // Firebase functions can look to Fedena code for reference
        case 'firebase_*':
            console.error('Firebase action code entered and not handled');
            break;

        // send message back saying no response found:
        default:
            broadcastActionHandleError(mObj);
    } 

    // returns true if asyncronous is needed
    if (async) return true;
});

// Listener tracks any changes to local storage in background's console 
// Got code here: https://developer.chrome.com/extensions/storage
chrome.storage.onChanged.addListener(function(changes, namespace) {
	for (key in changes) {
		var storageChange = changes[key];
		console.log('Storage key "%s" in namespace "%s" changed. ' +
			'Old value was "%s", new value is: ',
			key,
			namespace,
			storageChange.oldValue,
			storageChange.newValue
		);
	}
});

// ===============================================================
//                       main functions
// ===============================================================

/**
 * Function sets action state as "ERROR_STATE", effectively shutting down the import
 * Then sendResponse is called, letting the caller display an error or anything
 * 
 * Also, client index and client data are cleared and message (from mObj) is
 * saved as ERROR_MESSAGE (if it exists)
 * 
 * @param {object} mObj - message config object from caller
 * @param {function} sendResponse callback function for caller to use to display specific error
 */
function stopViaError(mObj, sendResponse) {
    // setup mObj:
    var mObj2 = {
        dataObj: {
            'ACTION_STATE': 'ERROR_STATE',
            'CLIENT_DATA': '',
            'CLIENT_INDEX': 0
        }
    };

    // if mObj has a message attached, add ERROR_MESSAGE
    if (mObj.message)
        mObj2['dataObj']['ERROR_MESSAGE'] = mObj.message;

    // store / clear data:
    storeToChromeLocalStorage(mObj2, sendResponse);
}

/**
 * Function gets chrome local data and sends data back to caller
 * 
 * Expects mObj to look like this:
 * {
 *      action: '...',
 *      keysObj: {
 *          'key1', '',
 *          'key2', '',
 *          ...
 *      }
 * }
 * 
 * @param {object} mObj message object with key data
 * @param {function} responseCallback callback function where gathered data will be sent
 */
function getValuesFromChromeLocalStorage(mObj, responseCallback) {
    // get object of keys from message object
    var keysObj = mObj.keysObj;

    getValuesFromStorage( keysObj )

    // responses is an array of objects {key:value}
    .then( function( responses ) {
        // turn responses into a serializable object
        var obj = Serialize_ArrayToObj(responses);

        responseCallback( obj );
    });
}

/**
 * Function stores data to chrome local storage based off config object (mObj)
 * 
 * @param {object} mObj message object holding data to store
 * @param {function} responseCallback callback function where success message is sent
 */
function storeToChromeLocalStorage(mObj, responseCallback) {
    var dataObj = mObj.dataObj;

    // if trying to clear 
    if (!dataObj) {
        console.error('data obj in store function doesn\'t exist!');
    }
    
    var storePromises = []; // used to store all key promises below

    // loop through keys in dataObj (turns obj into array of keys)
    // if dataObj is empty, loop will get skipped
    Object.keys( dataObj ).forEach( function(key, index) {
        // key: the name of the object key
        // index: the ordinal position of the key within the object
        var dataValue = dataObj[key]; 

		/* ============== AVAILABLE KEYS =============
            ACTION_STATE    -	holds the on/off (true / false) value for each field
                            ANALYZE_CLIENT_DUPLICATES = analyze search results
                            CHECK_CLIENT_SERVICES   = check if specific service is live for client
                            CLIENT_ADD_ACTION_DATA  = 1) tells service ctrl to redirect to add action page
                                                - 2) tells add action ctrl to add action
                            CLIENT_ADD_SERVICE      = tells service ctrl to add service
                            CLIENT_CREATED          = client created, now decide what's next
                            CLIENT_SKIP_ACTION_DATA = service saved, go to advanced search now
                            ERROR_STATE             = errored state - fix the problem and try again!
                            REGISTER_NEW_CLIENT     = Register new client
                            SEARCH_FOR_CLIENT       = start searching for clients in AdvancedSearch
                                                - enter UNHCR #, click "search"
                            WAITING                 = Waiting for import start (hold off)
            
            CLIENT_DATA     -   array of client objects
            CLIENT_INDEX    -   index of client being imported now
            
            DUPLICATE_CLIENT_UNHCR_NO - array of duplicate unhcr #s

            ERROR_MESSAGE   -   string of latest error message

            TODO: add audit trail just for me?
		*/
		switch (key) {
            // action state tells extension where we're at in the lifecycle
            case 'ACTION_STATE':
				var actionState = dataValue;
				storePromises.push(
					saveValueToStorage('ACTION_STATE', actionState)
				);
				break;

            // stores client data directly to local storage
            case 'CLIENT_DATA':
				var clientArray = dataValue;
				storePromises.push(
					saveValueToStorage('CLIENT_DATA', clientArray)
				);
				break;

            // FIXME: Clean this up / document this better [from old code]
            case 'CLIENT_INDEX':
				// console.log('updating client index with:', value, '<-');
				if (dataValue != undefined && dataValue !== '') {
					storePromises.push( saveValueToStorage('CLIENT_INDEX', dataValue) );
				} else {
					storePromises.push(
						getValFromStorage('CLIENT_INDEX')
						.then(function(results) {
                            var clientIndex = results['CLIENT_INDEX'];

							if (clientIndex === undefined || clientIndex === '') clientIndex = 0;
							else if (typeof clientIndex != 'number') clientIndex = parseInt(clientIndex);
							return saveValueToStorage('CLIENT_INDEX', clientIndex + 1);
						})
					);
				}
				break;
                
            // pushes a duplicate UNHCR number onto an array
            // TODO: maybe push this back to popup somehow later to visualize
            case 'DUPLICATE_CLIENT_UNHCR_NO':
                var newUNHCRnum = dataValue;

                storePromises.push(
                    getValFromStorage('DUPLICATE_CLIENT_UNHCR_NO')
                    .then(function(results) {
                        var newDupeArray = results['DUPLICATE_CLIENT_UNHCR_NO'];

                        // if dupArray was never populated (so undefined), initialize
                        if (newDupeArray == undefined)
                            newDupeArray = [];

                        if (newUNHCRnum == undefined || newUNHCRnum === '')
                            newDupeArray = [];
                        else
                            // push new duplicate UNHCR number into array
                            newDupeArray.push(newUNHCRnum);

                        // store new array of duplicate UNHCR #s
                        return saveValueToStorage('DUPLICATE_CLIENT_UNHCR_NO', newDupeArray);
                    })
                );
                break;

            // store an error message indicating why the import stopped
            case 'ERROR_MESSAGE':
                var message = dataValue;
				storePromises.push(
					saveValueToStorage('ERROR_MESSAGE', message)
				);
                break;

            default:
                // log errored key to background console:
                console.error('unable to handle key when saving to local storage:', key);
		}
    });

	Promise.all(storePromises)
    .then( function(responseMessageArr) {
        // if responseCallback isn't real, just console log the message
        if (responseCallback)
            responseCallback( responseMessageArr );
        else
            console.log('store messages: ',responseMessageArr);
    });
}

/**
 * Function clears all store data in chrome local storage for passed-in keys
 * 
 * Keys should be pased in serialized, like this:
 * {
 *      'CACHED_DATA': '',
 *      'VALID_PHONE': '',
 *      ... etc
 * }
 * 
 * @param {any} mObj message config object holding data keys object
 * @param {any} responseCallback callback function (may be undefined)
 */
function clearDataFromChromeLocalStorage(mObj, responseCallback) {
    var dataObj = mObj.dataObj;

    storeToChromeLocalStorage({
        dataObj: dataObj
    }, responseCallback);    
}

/**
 * Function is called when we're done importing!! yay!!
 * 
 * TODO: ideas for what to do here:
 * -> open a new tab and display duplicates
 * -> Alert the user that we're done
 * -> Console log we're done
 * -> Clear stored data (if no duplicates)
 * 
 */
function finishClientImport() {
    console.log('WOOT we\'re done');
}

// ===============================================================
//                      helper functions
// ===============================================================

/**
 * Function turns an array into a serializable object
 * Purpose = must send chrome messages as objects, not arrays
 * Note: if arr[i] is undefined, doesn't add to obj!
 * Note2: if arr[i]['key'] is undefined or null, also doesn't add to obj!
 * TODO: think if note2 is good or bad...
 * 
 * @param {array} arr array of objects to convert to single serializable object
 * @param {object} [obj={}] object to add keys to
 * @param {number} [index=0] starting index
 * @returns serializable object made from array
 */
function Serialize_ArrayToObj(arr, obj = {}, index = 0) {
    if (arr.length < 1) {
        console.error('Array not populated');
        return {};
    }

    for (let i = index; i < arr.length; i++) {
        // var nextKey = key + i;
        // // skip undefined values in arr:
        // if ( arr[i] != undefined )
        //     obj[nextKey] = arr[i];

        // get data object from array
        var dataObj = arr[i];

        // check if dataObj is an empty object. if so, skip
        if ( Object.keys( dataObj ).length < 1 )
            continue;

        else {
            Object.keys( dataObj ).forEach( function(nextKey, index) {
                // get next value to serialize from dataObj
                var nextVal = dataObj[nextKey];

                // if nextVal is legit, push into obj
                if (nextVal !== undefined && nextVal !== null)
                    obj[nextKey] = nextVal;
            });
        }
            
    }

    return obj;
}

/**
 * Function gets single key of data from chrome local storage
 * 
 * @param {string} key self-explanatory
 * @returns Promise with data from 1 key
 */
function getValFromStorage(key) {
	return new Promise( function( resolve, reject ) {
		chrome.storage.local.get( key, function( dataObj ) {

			// successful -> return data from database
			resolve( dataObj );
		});
	});
}

/**
 * Function gets multiple keys of data from chrome local storage
 * 
 * @param {object} keysObj object full of keys
 * @returns Promise array with data from all keys
 */
function getValuesFromStorage( keysObj ) {
    var promises = [];

    Object.keys( keysObj ).forEach( function( key, index ) {
        promises.push( getValFromStorage( key ) );
    });

	return Promise.all(promises);
}

/**
 * Function sends messages to console and tabs indicating that an action (mObj.action)
 * was sent to background.js and not handled appropriately.
 * 
 * @param {any} mObj message config object
 */
function broadcastActionHandleError(mObj) {
    var errAction = mObj.action;

    // send err message to tabs
    chrome.tabs.sendMessage(MessageSender.tab.id, {
        message: 'message_not_handled_by_background_script',
        action: errAction
    });

    // log error in background console:
    console.error('error handling action in background.js: action<' + errAction + '>');
}

/**
 * Function stores single key of data into chrome local storage
 * 
 * @param {any} key self-explanatory
 * @param {any} value self-explanatory
 * @returns Promise that resolves with success message
 */
function saveValueToStorage(key, value) {
    return new Promise( function(resolve, reject) {
		var obj = {};
		obj[key] = value;

		chrome.storage.local.set(obj, function() {
            // if value is empty, it's a data clear (not store)
            var message = '';

            if (value === '')
                message = 'Cleared: ' + key;
            else
                message = 'Saved: ' + key + ':' + value;

            // send message back to caller
			resolve(message);
		});
	});
}