# RIPS-Auto-Import-CExt

**Latest Stable Version: 2.4.2**

**Version in progress: 2.4.3 (none)**

## Instructions for useage:

1. Install the [RIPS Auto Import - Chrome Extension](https://chrome.google.com/webstore/detail/rips-extension-auto-clien/pocojahdkeglomgiciopcfcheoffdaoa).
2. Log in to RIPS (talk to RIPS guy if you need the link) in only 1 tab on Google Chrome.
    - If you have more than 1 RIPS tab open, even in multiple Google Chrome windows, the import will get confused and send an error!
    - If you NEED to work on RIPS at the same time as the import, you can open RIPS using a different browser like Safari, Firefox, Bing, etc.
3. Open the extension's "Options page" by clicking on the extension icon labeled "Ri" in the upper-right corner of Google Chrome.
4. For any data you want to import into RIPS, make sure the column header matches an appropriate column below.
5. Copy all contents of client data spreadsheet (including column headers), and paste data into main textbox.
6. Click "Create Table!" -> A table with parsed data should appear below the button.
7. Make sure the import settings are set as you need.
8. If everything looks good, click "Import Clients" to start the import!

## Client search analysis - How the extension searches for clients:

Client search analysis is done using the library [fusejs.io](http://fusejs.io/). The docs are on the website, but here are some of the special settings that I thought needed extra effort / specific explanation:

1. _location_ - Where the search should start looking for a match (0 = beginning of the string)
2. _distance_ - How far away from "Location" the search should look for the match (0 = only right at the location, 100 = 100 characters in either direction)

## _Exact_ Fields required for Registration page, and example data:

| Full Name\* | Gender\* | Date of Birth\* | Nationality\* | Main Language\* | Phone Number\* | UNHCR number\* |
| ----------- | -------- | --------------- | ------------- | --------------- | -------------- | -------------- |
| Test Bob 1  | Male     | 1-Mar-2000      | -STATELESS-   | Arabic          | 01234567890    | 123-99C12345   |
| Test Jill   | Female   | 19-Feb-1943     | Iraq          | Fur, English    | 01112223333    | 000-00C00000   |
| Test Bob 2  | Other    | .14/04/2001     | Sudan         | Amharic         | 05555555555    | 1234/1234      |

Notes about Registration table:

1. _Full name_ - can be broken into columns "First Name" and "Last Name" if preferred.
1. _Full name_ - first name in column goes into "First name" box in RIPS, all other names go into "Surname" box (last name).
1. _Gender_ - Needs to be full gender type, not just "M" / "F".
1. _Date of Birth_ - Preferred format for dates is "DD-Mon-YYYY" where DD and YYYY are numbers, and Mon is a 3-letter string for the month name. Other allowed format is "DD/MM/YYYY - for this format, the '.' in front of the DOB is not necessary, but can be included for formattting (it will be removed before being imported).
1. _Nationality_ - Needs to be country name (ex: Sudan), not actually nationality (ex: Sudanese).
1. _Nationality_ - Text in parenthises excluded (ex: "Egypt (misr)" -> input into RIPS as "Egypt").
1. _Main Language_ - If there are multiple languages spoken by client, 2nd language will be placed in 'Second Language' dropdown. 3rd and following languages cannot be added to RIPS.
1. _Phone Number_ - Should be 11 digits (Validation handled by RIPS Validation Extension).
1. _UNHCR Number_ - Variety of formats allowed (Validation handled by RIPS Validation Extension).

## Fields available for Client Basic Information page, and example data: (_incomplete_)

Current Contact Details (free text):

| Address1 | Address2 | Other Phone Number | Email Address           |
| -------- | -------- | ------------------ | ----------------------- |
| Street   | Zip      | 01234567890        | spamalotmucho@gmail.com |

Background (Dropdown boxes):

| Country of Origin | Ethnic Origin | Second Language | Marital Status |
| ----------------- | ------------- | --------------- | -------------- |
| Bahrain           | Bari          | Nuer            | Single         |

Other Information (Text boxes):

| Passport Number | Caritas Number | IOM Number | CRS Number | StARS Student Number | MSF Number |
| --------------- | -------------- | ---------- | ---------- | -------------------- | ---------- |
| 10070005        | ?              | ?          | ?          | ?                    | ?          |

Other Information (Dropdown boxes):

| Religion | UNHCR Status | Source of Referral | City of Origin / Village of Origin | Employment Status | Neighborhood | Highest Education |
| -------- | ------------ | ------------------ | ---------------------------------- | ----------------- | ------------ | ----------------- |


Other Information (Checkboxes):

| CARE | CRS | EFRRA/ACSFT | IOM | MSF | PSTIC | Refuge Egypt | Save the Children | UNICEF/TdH | Other Service Provider |
| ---- | --- | ----------- | --- | --- | ----- | ------------ | ----------------- | ---------- | ---------------------- |


Other Information (Dates):

| Date of Arrival in Egypt | Date of UNHCR Registration | RSD Date | Last RSD Update (from dropdown box) |
| ------------------------ | -------------------------- | -------- | ----------------------------------- |


Fields in separate tabs:

| Urgent Notes | Important Information | Family Size | UNHCR Case Size | Direct Beneficiaries | Indirect Beneficiaries |
| :----------: | :-------------------: | :---------: | :-------------: | :------------------: | :--------------------: |
| _Free Text_  |      _Free Text_      |  _number_   |    _number_     |       _number_       |        _number_        |

Vulnerability Data:

| Vulnerability Notes | Vulnerability Names             |
| ------------------- | ------------------------------- |
| Test vulnerability! | Homeless; Mental health         |
| ...                 | Single female head of household |

Notes about "Optional" tables above:

1. _Vulnerability Names_ - make sure vulnerability is spelled exactly correct
2. _Vulnerability Names_ - if you import multiple vulnerabilities on one client, separate the vulnerability names with a semi-colon **`;`**

## Fields available for Services page, and example data:

| Service Code\*     | Service Caseworker | Service Start Date |
| ------------------ | ------------------ | ------------------ |
| MAP, RST, UCY, etc | abeaman            | 1-Mar-2017         |

Notes about Services table:

1. _Service Code_ - To determine the correct service code for each service, see table "Service Code -> Description Table" below.
2. _Service Code_ - The only required column for this page.
3. _Service Caseworker_ - RIPS defaults to adding logged-in user as caseworker for new services. If import user would like a different user added to new services, this column is where the caseworker should be specified.
4. _Service Start Date_ - Should always be in format above: Day-Month-Year, where Day and Month are numbers and Month is a 3-letter string.

**Service Code -> Description Table**

| Service Code |             Service Description             |
| :----------: | :-----------------------------------------: |
|     AEP      |           Adult Education Program           |
|     AFP      |       PS Adults and Families Program        |
|     CEP      |         Children Education Program          |
|      DA      |        PS Direct Assistance Program         |
|     DIER     |      PS Drop in and Emergency Response      |
|     EACB     |   Education Access and Capacity Building    |
|     ECW      |          Early Childhood Wellbeing          |
|    GROUPS    |          PS Groups and Activities           |
|     MAN      |                 Management                  |
|     MED      |          PS Medical Access Program          |
|     MHP      |          PS Mental Health Program           |
|     MONT     |            Montessori Preschool             |
|     OUT      |             Community Outreach              |
|     PDC      |      Professional Development Courses       |
|     PRO      |               RLAP Protection               |
|     RSD      |                  RLAP RSD                   |
|     RST      |              RLAP Resettlement              |
|     UCY      | PS Unaccompanied Children and Youth Program |
|     UYBP     |   PS Unaccompanied Youth Bridging Program   |

## Fields available for Add Action page, and example data:

|     Service Code\*     | Action Name\*                   | Action Date (not ready) | Action Caseworker | Action Notes                        |
| :--------------------: | ------------------------------- | ----------------------- | ----------------- | ----------------------------------- |
| RSD, UYBP, GROUPS, etc | Other                           |                         | abeaman           |                                     |
|          MAN           | Referred for food & hygiene box |                         | Staff             | Awww giggidy, let's get some boxes! |
|                        |                                 |                         |                   |                                     |

Notes about Add Action table:

1. _Service Code_ - If populated but "Action Name" column is omitted, service will be added, then action data will be skipped.
2. _Service Code_ - This is the same column as above for Services -> don't add 2 columns with "Service Code" title.

## Testing Scenarios:

|  #  |                                    Client Data Description (list)                                     |         Client Creation Settings          |                            Expected Outcome                             | Last Pass (Version #) |
| :-: | :---------------------------------------------------------------------------------------------------: | :---------------------------------------: | :---------------------------------------------------------------------: | :-------------------: |
| 1.1 |                                Only Reg data (1 exact matching client)                                |               All settings                |            No new client created, no error, client selected             |        v2.3.0         |
| 1.2 |                        Only Reg data (> 1 matching UNHCR #s, 1 matching name)                         |               All Settings                |        No new client created, no error, matching client selected        |        v2.3.0         |
| 1.3 |                       Only Reg data (> 1 matching UNHCR #s, no matching names)                        | Skip Client Creation / Skip Conditionally |  No new client created, skip error thrown, next client is searched for  |        v2.3.0         |
| 1.4 |                       Only Reg data (> 1 matching UNHCR #s, no matching names)                        |             Create Client(s)              |                           New client created                            |        v2.3.0         |
| 1.5 |                                  Only Reg data (0 matching UNHCR #s)                                  |           Skip Client Creation            |  No new client created, skip error thrown, next client is searched for  |        v2.3.0         |
| 1.6 |                                  Only Reg data (0 matching UNHCR #s)                                  |   Skip Conditionally / Create Client(s)   |                           New client created                            |        v2.3.0         |
| 1.7 |                     Only Reg data (0 matching UNHCR #s, missing a required field)                     |   Skip Conditionally / Create Client(s)   | Error in Registration page, client skipped, error added to options page |        v2.3.0         |
| 2.1 |                                      Reg data, UNHCR File Status                                      |        Default - 1 matching client        |         CBI data updated, Passes dependent / vuln swal warning          |        v2.3.0         |
| 2.2 |               Reg data, UNHCR Case Size, _Vulnerability Notes / Names - NOT READY YET_                |        Default - 1 matching client        |                            CBI data updated                             |        v2.4.3         |
| 2.3 |               Reg data, Vulnerability Names only (no previous vulnerability data saved)               |        Default - 1 matching client        |                              Vulns updated                              |        v2.4.3         |
|  3  |                    Reg data, Service start date, Service code, Service caseworker                     |        Default - 1 matching client        |                           Service data added                            |        v2.3.0         |
| 4.1 | Reg data, Service data (code / caseworker), Action name, Action caseworker, Action notes, Action date |        Default - 1 matching client        |                  NEW Service added, Action data added                   |        v2.3.0         |
| 4.2 |    Reg data, Service data (code / caseworker), Action data (service matches pre-existing service)     |        Default - 1 matching client        |    Service matches old service, moves directly to adding action data    |        v2.3.0         |
| 10  |                    Only Reg data - Duplicate UNHCR #s AND duplicate matching names                    |        Default - 1 matching client        |            Client added to error list, no new client created            |        v2.3.0         |

**Note**: Although these testing scenarios should be run before releasing a new version, please still test a few clients in your spreadsheet before completely trusting that this import will work for you! We don't want to add lots of bad data to the database.
