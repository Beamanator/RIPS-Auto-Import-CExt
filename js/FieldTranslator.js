// ==================== FIELD TRANSLATOR FILE =======================

/**
 * Purpose of this function is to set an easy place to translate fields from the input
 * textarea (on the popup) into the output format needed in Registration (and possibly
 * CBI and Service / Action pages).
 * 
 * @returns field translator object with specific key : value pairs to map generic field
 * names to spreadsheet
 */
function FT_getFieldTranslator() {
	return uppercaseObjectValues({
		// ====================== REQUIRED FIELDS =====================
		"CLIENT_FIRST_NAME": "First name",
		"CLIENT_FULL_NAME": "Full name",
		"CLIENT_LAST_NAME": "Last name",
		
		"DOB": 				"Date of birth",
		"GENDER": 			"Gender",
		"NATIONALITY": 		"Nationality",

		// Main Language doesn't exist in spreadsheet:
		"MAIN_LANGUAGE": 	"Preferred Language",
		"MAIN_PHONE_NO": 	"Phone number",
		"UNHCR_CASE_NO": 	"UNHCR NO",

		// ===================== OPTIONAL REG ITEMS ===================
		// === TEXTBOXES: ===
		"ADDRESS1": 		"Address1",
		"ADDRESS2": 		"Address2",
		"CARITAS_NO": 		"Caritas Number",
		"OTHER_PHONE_NO": 	"Other Phone Number",

		// === CHECKBOXES: ===
		"CB_CARE": 			"CARE",
		"CB_CRS": 			"CRS",
		"CB_EFRRA_ACSFT": 	"ACSFT",
		// "N/A": "Notes"

		// ================ OPTIONAL SERVICE / ACTION =================
		// === SERVICES: ===
		// "SERVICE_NAME":			"Service Name",
		"SERVICE_CODE":			"Service Code", // REQUIRED!!
		"SERVICE_START_DATE":	"Service Start Date", // TODO: probably not ready yet?
		"SERVICE_CASEWORKER":	"Service Caseworker",

		// === ACTIONS: ===
		"ACTION_NAME":			"Action Name", // REQUIRED!!
		// "ACTION_CODE":			"Action Code", // skipping, see footnote A
		// "ACTION_SERVICE":		"Action Service",
		"ACTION_DATE":			"Action Date", // TODO: probably not ready yet?
		"ACTION_CASEWORKER":	"Action Caseworker",
		"ACTION_NOTES":			"Attendance Notes"

	});
}

/**
 * Function makes all object values uppercase (in a key: value pair)
 * Reason: to make it easier to compare to other values later
 * 
 * @param {object} obj - passed in object will be field translator object
 * @returns - passed in object, with values uppercased
 */
function uppercaseObjectValues(obj) {
	for (var property in obj) {
	    if (obj.hasOwnProperty(property)) {
	        // uppercase all of an object's values
	        obj[property] = obj[property].toUpperCase();
	    }
	}

	return obj;
}

/**
 * Footnote Comments:
 * 
 * A) Action Code - skipping the need for an action code in favor of easability.
 *    -> if this was required, users would have to search for action ids or ask
 *    -> RIPS db admin for codes. Now that this is commented out, they can just
 *    -> enter the exact action name. New possible issue is entering the action
 *    -> incorrectly (spelled wrong).
 * 
 */