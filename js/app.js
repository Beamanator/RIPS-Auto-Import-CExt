(function() {
	'use strict';

	// Firebase setup:
	// var config = {
	//     apiKey: "AIzaSyDRulUofq1zYX7Z1J2t--A2CRzObthoIDc",
	//     authDomain: "fedenaimportconfig.firebaseapp.com",
	//     databaseURL: "https://fedenaimportconfig.firebaseio.com",
	//     // storageBucket: "fedenaimportconfig.appspot.com",
	//     messagingSenderId: "197993359621"
	// };
	// firebase.initializeApp(config);

    // Angular setup:
	angular.module('RIPSImportPageApp', [])
	.controller('MainController', MainController);

	// controller for popup
	MainController.$inject = ['$q', '$scope'];
	function MainController($q, $scope) {
		var Ctrl = this;

		// Initial page data
		Ctrl.textareaWelcome = 'Client details here (delimited by commas \",\" or tabs)'
			+ ' - Headers must match fields below\n'
			+ 'Required Fields:\n'
				+ '\tFirst / Last / Full name, Date of Birth, Gender, Nationality,\n'
				+ '\Preferred Language, Phone Number, UNHCR No\n'
			+ 'Optional Fields:\n'
				+ '\tDate of UNHCR Reg, Country of Origin, Ethnic origin,\n'
				+ '\tSecond Language, Marital Status, Address 1, Caritas No,\n'
				+ '\tService Code (+ more), Action Code (+ more)';
		Ctrl.clientCount = 0;
		// Ctrl.auto = true;

		// initialize arrays
		Ctrl.headerList = [];
		Ctrl.dataArray = [];
		Ctrl.widthArray = [];

		// Set up Firebase:
		// FB_initFirebase(Ctrl, $scope, firebase);
		// getClientCount();

		// other initial variables:
		// Ctrl.admissionDateFormatError = false;
		// Ctrl.admissionDateFormatWarning = false;
		// Ctrl.admissionDateFormatErrorLocation = "unknown";

		// =================================== IMPORT!!!! =============================
		/**
		 * Function called after "Import Clients" button is clicked in popup
		 * 
		 * Client data from textarea is stored into chrome local storage, then
		 * MainContent.js is told to figure out what to do next
		 * 
		 */
		Ctrl.importClients = function() {
			console.log('data to import:',Ctrl.dataArray);
			// TODO: add some validation for required fields (maybe in "Create Table" function)

			chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
				var activeTab = tabs[0];

				var mObj = {
					action: 'store_data_to_chrome_storage_local',
					dataObj: {
						'ACTION_STATE': 'SEARCH_FOR_CLIENT',
						'CLIENT_DATA': Ctrl.dataArray,
						'CLIENT_INDEX': 0
					}
				};
				
				// send message config (store data) then tell MainContent to GO!
				chrome.runtime.sendMessage(mObj, function(response) {
					debugger;
					chrome.tabs.sendMessage(activeTab.id, {
						"message": "begin_client_import"
					});
				});
			});

			/* 
				If fatal error is present, don't allow user to import clients
				possible fatal errors:
					1) <none>
			*/
			// if (!Ctrl.admissionDateFormatError) {
				// countButtonClick('import_students');
			// } else {
			// 	console.log('FATAL ERROR! No importing allowed. Fix errors!');
			// }
		}
		// ============================================================================

		// ================================ CLEAR DATA ================================
		/**
		 * Function clears some data from chrome local storage, and alerts user after
		 * 
		 */
		Ctrl.clearChromeData = function() {
			var mObj = {
				action: 'clear_data_from_chrome_storage_local',
				noCallback: true,
				dataObj: {
					'CLIENT_DATA': '',
					'CLIENT_INDEX': 0,
					'ACTION_STATE': '',
					'DUPLICATE_CLIENT_UNHCR_NO': ''
				}
			};

			chrome.runtime.sendMessage(mObj, function(response) {
				alert('Chrome data has been cleared');
			});

		}
		// ============================================================================

		// ================================= FIREBASE =================================
		

		// Make sure user is signed in to google / give extension permission! :D
		// Ctrl.Signin = function() {
		// 	// $('button#signin').toggleClass('disabled-button');
		// 	// $('button#signin').prop('disabled', true);

		// 	var currentUser = firebase.auth().currentUser;

		// 	if (currentUser) {
		// 		// set Ctrl.username to username!
		// 		console.log('signed in already, don\'t auth again');
		// 		Ctrl.username = currentUser.displayName;
		// 	} else {
		// 		console.log('not signed in -> ask Google to authenticate');
		// 		userAuth(true);
		// 	}
		// }

		// Sign user out of Google
		// Ctrl.Signout = function() {
		// 	firebase.auth().signOut().then(function() {
		// 		// $('button#signin').toggleClass('disabled-button');
		// 		// $('button#signin').prop('disabled', false);

		// 		// Ctrl.username = '';
		// 	}, function(error) {
		// 	  	ThrowError({
		// 	  		message: error,
		// 	  		errMethods: ['mConsole', 'mAlert']
		// 	  	});
		// 	});
		// }

		// get number of client records changed via firebase databasea:
		// function getClientCount() {

		// 	FB_getClientCount(firebase)
		// 	.then(function(snapshot) {
		// 		var created = snapshot.val();

		// 		Ctrl.clientCount = created;

		// 		// $scope doesn't catch Ctrl change, so call $digest or $apply
		// 		$scope.$digest();
		// 	});
		// }

		/* Start the auth flow and authorizes for Firebase.
		 * @param{boolean} interactive True if the OAuth flow should request with an interactive mode.
		 */
		// function userAuth(interactive) {
		//   	// Request an OAuth token from the Chrome Identity API.
		//   	chrome.identity.getAuthToken({interactive: !!interactive}, function(token) {

		//     	if (chrome.runtime.lastError && !interactive) {
		//     	  	console.log('It was not possible to get a token programmatically.');
		// 	    } else if(chrome.runtime.lastError) {
		// 	      	console.error(chrome.runtime.lastError);
		// 	    } else if (token) {
		//       		// Authrorize Firebase with the OAuth Access Token.
		//       		var credential = firebase.auth.GoogleAuthProvider.credential(null, token);
		    	  	
		//     	  	firebase.auth().signInWithCredential(credential).catch(function(error) {
		// 	        	// The OAuth token might have been invalidated. Lets' remove it from cache.
		// 	        	if (error.code === 'auth/invalid-credential') {
		// 	          		chrome.identity.removeCachedAuthToken({token: token}, function() {
		//             			startAuth(interactive);
		//           			});
		//         		} else {
		//         			// valid credential! user is authenticated.
		//         			//  make sure user data scruture is ready
		//         			// console.log('inside Fb signInWithCredential [app.js], calling buildUserDataStruct');
		//         			FB_buildUserDataStruct(firebase, firebase.auth().currentUser);
		//         		}
		//       		});
		//     	} else {
		//       		console.error('The OAuth Token was null');
		//     	}
		//   	});
		// }

		// count number of button clicks, store in Firebase database:
		// function countButtonClick(buttonCode) {
		// 	chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
		// 		// var activeTab = tabs[0];

		// 		var mObj = {
		// 			action: 'firebase_increment_button_count',
		// 			activeTabId: tabs[0].id,
		// 			buttonCode: buttonCode
		// 		}

		// 		chrome.runtime.sendMessage(mObj);
		// 	});
		// }

		// ============================================================================

		// ============================= EVERYTHING ELSE ==============================
		// Function fills table with pasted client data
		Ctrl.fillTable = function() {
			// countButtonClick('create_table');

			var data = Ctrl.clientData;
			var delim, dataObj;

			delim = getDelim(data);

			// if no delim found, quit.
			if ( delim === undefined ) return;

			if ( foundErrors(data) ) return;
			else {
				// convert data from text to array of objects (json-like)
				dataObj = convertData(data, delim);
			}

			if (dataObj.errors !== 0) return;
			else displayError(""); // remove error message

			// give angular the data from dataObj
			Ctrl.headerList = dataObj.headerList;
			// Ctrl.dataArray = dataObj.dataArray;

			Ctrl.dataArray = dataObj.dataArray

			// initialize width array for columns
			fillWidthArray(dataObj.headerList.length);
		};

		// these functions deal with widths of columns in the table
		Ctrl.increaseWidth = function(index) { Ctrl.widthArray[index] += 20; }
		Ctrl.decreaseWidth = function(index) { Ctrl.widthArray[index] -= 20; }
		Ctrl.getWidth = function(index) { return Ctrl.widthArray[index]; }

		// ====================== INTERNAL FUNCTIONS =======================

		function fillWidthArray(size) {
			for (var i = 0; i < size; i++) {
				Ctrl.widthArray.push(100);
			}
		}

		// convert data from text to array of objects [like json]
		// if there's an error, send that error to the page & return 1
		function convertData(data, delim) {
			// first element in dataArray is # of errors
			var dataArray = [0];
			var returnObj = {
				errors: 0,
				headerList: [],
				dataArray: []
			}

			var rows = data.split("\n");

			// remove final row if it's only a \n  character (rows[index] will just be "")
			if (rows[rows.length - 1] === "") rows.pop();

			/*
				headerKeys will contain headers related to rows like this:
				{
					0: FirstName
					1: LastName
					2: DOB
					3: Nationality
					... etc
				}
			*/
			var headerKeys = {};

			// setup headerKeys:
			var headerRow = rows[0].split(delim);
			returnObj.headerList = headerRow;

			var numColumns = headerRow.length;

			for (var i = 0; i < headerRow.length; i++) {
				headerKeys[i] = headerRow[i].toUpperCase();
			}

			// setup the rest of the data (non-header)
			for (var rowIndex = 1; rowIndex < rows.length; rowIndex++) {
				var row = rows[rowIndex].split(delim);

				if (row.length !== numColumns) {
					// Error in # of delims between this row and header row.
					displayError("ROW " + (rowIndex + 1) + " HAS DIFFERENT # OF COLUMNS THAN HEADER");
					returnObj.errors = returnObj.errors + 1;
				}

				var clientObj = {};

				for (var cellIndex = 0; cellIndex < row.length; cellIndex++) {
					var cell = row[cellIndex];
					var propName = headerKeys[cellIndex];

					clientObj[propName] = cell;
				}

				returnObj.dataArray.push(clientObj);
			}

			return returnObj;
		}

		// look for basic errors (more than 1 line of data)
		function foundErrors(data) {
			// look for "\n" in data. if there aren't any, create an error
			if (data.indexOf("\n") === -1) {
				displayError("ONLY 1 LINE OF DATA - NEED TITLE ROW + DATA ROW!");
				return 1;
			}
		}

		/*
			Return delim from data.
			Priority:
				tab (\t)
				comma (,)
		*/
		function getDelim(data) {

			if (data === undefined) return;

			var tab1 = data.indexOf("\t");
			var com1 = data.indexOf(",");

			if (tab1 === -1 && com1 === -1) {
				displayError("CLIENT DATA MUST HAVE TABS OR COMMAS BETWEEN CELL DATA");
			} else {
				// displayError("");
			}

			if (tab1 !== -1) {
				Ctrl.delim = "tab";
				return "\t";
			} else if (com1 !== -1) {
				Ctrl.delim = "comma";
				return ",";
			}

			return "";
		}

		// display warning message in all uppercase
		function displayError(message) {
			Ctrl.errorMessage = message.toUpperCase();
		}
	};

})();