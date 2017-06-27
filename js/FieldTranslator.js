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
		"SERVICE_NAME":			"Service Name",
		"SERVICE_ID":			"Service ID", // REQUIRED!!
		"SERVICE_START_DATE":	"Service Start Date",
		"SERVICE_CASEWORKER":	"Service Caseworker",

		// === ACTIONS: ===
		"ACTION_NAME":			"Action Name",
		"ACTION_CODE":			"Action Code", // REQUIRED!!
		"ACTION_SERVICE":		"Action Service",
		"ACTION_DATE":			"Action Date",
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