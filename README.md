# RIPS-Auto-Import-CExt
## Instructions for useage:
1) For any data you want to import into RIPS, make sure the column header matches an appropriate column below.
2) Install Auto Import Extension.
3) Open the "Options page" by clicking on the extension icon in the upper-right corner of Google Chrome.
4) Copy all contents of client data spreadsheet (including column headers), and paste data into main textbox.
5) Click "Create Table!" -> A table with parsed data should appear below the button.
6) Make sure you are logged into RIPS in only 1 tab on Google Chrome.
7) If everything looks good, click "Import Clients" to start the import!

## *Exact* Fields required for Registration page, and example data:

| Full Name\* | Gender\* | Date of Birth\* | Nationality\* | Main Language\* | Phone Number\* | UNHCR number\* |
|-----------|--------|---------------|-------------|---------------|-----------|------------|
|Test Bob 1 | Male   |   1-Mar-2000  | -STATELESS- | Arabic        |01234567890|123-99C12345|
|Test Jill  | Female |  19-Feb-1943  |    Iraq     | Fur, English  |01112223333|000-00C00000|
|Test Bob 2 | Other  |  .14/04/2001  |    Sudan    | Amharic       |05555555555|1234/1234|

Notes about Registration table:
1) *Full name* - can be broken into columns "First Name" and "Last Name" if preferred.
1) *Full name* - first name in column goes into "First name" box in RIPS, all other names go into "Surname" box (last name).
2) *Gender* - Needs to be full gender type, not just "M" / "F".
3) *Date of Birth* - Preferred format for dates is "DD-Mon-YYYY" where DD and YYYY are numbers, and Mon is a 3-letter string for the month name. Other allowed format is "DD/MM/YYYY - for this format, the '.' in front of the DOB is not necessary, but can be included for formattting (it will be removed before being imported).
4) *Nationality* - Needs to be country name (ex: Sudan), not actually nationality (ex: Sudanese).
4) *Nationality* - Text in parenthises excluded (ex: "Egypt (misr)" -> input into RIPS as "Egypt").
5) *Main Language* - If there are multiple languages spoken by client, 2nd language will be placed in 'Second Language' dropdown. 3rd and following languages cannot be added to RIPS.
6) *Phone Number* - Should be 11 digits (Validation handled by RIPS Validation Extension).
7) *UNHCR Number* - Variety of formats allowed (Validation handled by RIPS Validation Extension).

## Fields available for Client Basic Information page, and example data: (*incomplete*)

Current Contact Details (free text):

| Address1 | Address2 | Other Phone Number | Email Address |
|----------|----------|--------------------|---------------|
| Street   | Zip      | 0123456789         | spamalotmucho@gmail.com|

Background (Dropdown boxes):

| Country of Origin | Ethnic Origin | Second Language | Marital Status |
|-------------------|---------------|-----------------|----------------|
| Bahrain           |    Bari       |   Nuer          |  Single        |

Other Information (Text boxes):

| Appointment Slip Number | Caritas Number | IOM Number | CRS Number | StARS Student Number | MSF Number |
|-------------------------|-----------------|------------|-----------|-----------------------|-----------|
| 555-AP12345678          |      ?          |    ?       |    ?     |        ?               |    ?     |

Other Information (Dropdown boxes):

| Religion | UNHCR Status| Source of Referral | City of Origin / Village of Origin | Employment Status | Neighborhood | Highest Education |
|-----------|------------|-------------------|--------------------------------------|-----------------|--------------|-----------------------------|

Other Information (Checkboxes):

| CARE | CRS | EFRRA/ACSFT | IOM | MSF | PSTIC | Refuge Egypt | Save the Children | UNICEF/TdH | Other Service Provider |
|------|------|-------------|-----|----|-------|--------------|-------------------|------------|------------------------|

Other Information (Dates):

| Date of Arrival in Egypt | Date of UNHCR Registration | RSD Date | Last RSD Update (from dropdown box) |
|--------------------------|----------------------------|----------|-------------------------------------|

Fields in separate tabs:

| Urgent Notes | Important Information | Family Size | UNHCR Case Size | Direct Beneficiaries | Indirect Beneficiaries |
|--------------|------------------------|------------|-----------------|----------------------|------------------------|

Vulnerability Data:

| Vulnerability Notes | Vulnerability Name |
|---------------------|--------------------|

Notes about "Optional" tables above:
1) *Vulnerability name* - make sure vulnerability is spelled exactly correct

## Fields available for Services page, and example data:

| Service Code\* | Service Caseworker | Service Start Date |
|------------------|--------------------|--------------------|
| MAP, RST, UCY, etc |  abeaman           |  1-Mar-2017        |

Notes about Services table:
1) *Service Code* - To determine the correct service code for each service, see table "Service Code -> Description Table" below.
2) *Service Code* - The only required column for this page.
3) *Service Caseworker* - RIPS defaults to adding logged-in user as caseworker for new services. If import user would like a different user added to new services, this column is where the caseworker should be specified.
4) *Service Start Date* - Should always be in format above: Day-Month-Year, where Day and Month are numbers and Month is a 3-letter string.

**Service Code -> Description Table**

| Service Code | Service Description |
|:------------:|:-------------------:|
|AFP|PS Adults and Families Program|
|DA|PS Direct Assistance Program|
|DIER|PS Drop in and Emergency Response|
|GROUPS|PS Groups and Activities|
|MED|PS Medical Access Program|
|UCY|PS Unaccompanied Children and Youth Program|
|UYBP|PS Unaccompanied Youth Bridging Program|
|RST|RLAP Resettlement|
|PRO|RLAP Protection|
|RSD|RLAP RSD|
|AEP|Adult Education Program|
|CEP|Children's Education Program|
|EACB|Education Access and Capacity Building|
|MONT|Montessori Preschool|
|PDC|Professional Development Courses|
|OUT|Community Outreach|

## Fields available for Add Action page, and example data:

| Service Code\* | Action Name\* | Action Date (not ready) | Action Caseworker | Attendance Notes |
|:----------------:|-----------------|-------------|-------------------|------------------|
| RSD, UYBP, GROUPS, etc| Other      |             | abeaman           |                  |
|   MAN            | Referred for food & hygiene box || Staff | Awww giggidy, let's get some boxes!|
|                  |                 |             |                   |                  |

Notes about Add Action table:
1) *Service Code* - If populated but "Action Name" column is omitted, service will be added, then action data will be skipped.
2) *Service Code* - This is the same column as above for Services -> don't add 2 columns with "Service Code" title.

### Testing Scenarios:
|#| Client Data Description (list) |Expected Outcome| Last Pass (Version #) |
|-|------------------------------|----------------|-------------|
|0|Full Name, UNHCR Number, UNHCR File Status, Phone Number, Gender, DOB, Nationality, Language, Case Size, Service Timestamp|RLAP Phase 1 - everything but actions|v2.0.0|
|1|Duplicate UNHCR #s, any other data|client added to duplicate storage, no new clients created|v2.0.0|
|2|First Name / Last Name vs Full Name|Scenarios should put names in correct positions|v2.0.0|
|3|Full Name has > 2 names|First name goes in first name box, all others go in 'surname' box|v2.0.0|
|4|Only Reg data, no services / actions|Client created, not redirected to services / actions pages|v2.0.0|
|5|Only Reg data (missing name), no services / actions|Error in Registration page, client skipped, error added to options page|v2.0.0|
|6|Reg data, Services data, no action data|Client created (if needed), service added (if needed), moves back to Advanced Search|v2.0.0|
|7|Reg data, Services data (code, caseworker), action data (name, notes, caseworker)|Same as 6, but adds action data before moving back to Advanced Search|v2.0.0|
|99|Reg Data, CBI Data, Services data, Action data|Client created (if needed), optional data added and saved, service added (if needed), action added||
