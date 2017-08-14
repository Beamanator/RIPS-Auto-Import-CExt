# RIPS-Auto-Import-CExt
Adds automatic import functionality to RIPS

*Exact* Fields required for **Registration page**, and example data: (incomplete)

| Full Name | Gender | Date of Birth | Nationality | Main Language | Phone Number | UNHCR number|
|-----------|--------|---------------|-------------|---------------|-----------|------------|
|Test Bob 1 | Male   |   1-Mar-2000  | -STATELESS- | Arabic        |01234567890|123-99C12345|
|Test Jill  | Female |  19-Feb-1943  |    Iraq     | Fur, English   |01112223333|000-00C00000|
|Test Bob 2 | Other  |  .14/04/2001  |    Sudan    | Amharic       |05555555555|1234/1234|

Notes about Registration table:
1) *Full name* - can be broken into columns "First Name" and "Last Name" if preferred.
1) *Full name* - first name in column goes into "First name" box in RIPS, all other names go into "Surname" box (last name).
2) *Gender* - Needs to be full gender type, not just "M" / "F".
3) *Date of Birth* - Preferred format for dates is "DD-Mon-YYYY" where DD and YYYY are numbers, and Mon is a 3-letter string for the month name. Other allowed format is "DD/MM/YYYY - for this format, the '.' in front of the DOB is not necessary, but can be included for formattting (it will be removed before being imported).
4) *Nationality* - Needs to be country name (ex: Sudan), not actually nationality (ex: Sudanese).
5) *Main Language* - If there are multiple languages spoken by client, 2nd language will be placed in 'Second Language' dropdown. 3rd and following languages cannot be added to RIPS.
6) *Phone Number* - Should be 11 digits (Validation handled by RIPS Validation Extension).
7) *UNHCR Number* - Should be format: ###-##C#####  (Validation handled by RIPS Validation Extension).

Fields available for Client Basic Information page, and example data: (incomplete)

** Figure out how best to display CBI data table**

Fields available for **Services** page, and example data: (incomplete)

| Service Code (*) | Service Caseworker | Service Start Date |
|------------------|--------------------|--------------------|
| MAP, RST, UCY    |    abeaman         |  1-Mar-2017        |

Notes about Services table:
1) *Service Code* - The only required column for this page.
2) *Service Caseworker* - RIPS defaults to adding logged-in user as caseworker for new services. If import user would like a different user added to new services, this column is where the caseworker should be specified.
3) *Service Start Date* - Should always be in format above: Day-Month-Year, where Day and Month are numbers and Month is a 3-letter string.

Fields available for **Add Action** page, and example data: (incomplete)

| Service Code (*) | Action Name (*) | Action Date | Action Caseworker | Attendance Notes |
|:----------------:|-----------------|-------------|-------------------|------------------|
| RSD, UYBP, GROUPS, etc| Other      |             | abeaman           |                  |
|                  |                 |             |                   |                  |

Notes about Add Action table:
1) If "Service Code" is populated but "Action Name" column is omitted, service will be added, then action data will be skipped.

# Testing Scenarios:
|#| Client Data Description (list) |Expected Outcome| Last Pass (Version #) |
|-|------------------------------|----------------|-------------|
|0|Full Name, UNHCR Number, UNHCR File Status, Phone Number, Gender, DOB, Nationality, Language, Case Size, Timestamp|RLAP Phase 1 - everything but actions|v0.1.0|
|1|Duplicate UNHCR #s, any other data|client added to duplicate storage, no new clients created||
|2|First Name / Last Name vs Full Name|Scenarios should put names in correct positions||
|3|Full Name has 2 names|First name goes in first name box, all others go in 'surname' box||
|4|Only Reg data, no services / actions|Client created, not redirected to services / actions pages||
|5|Only Reg data (missing name), no services / actions|Error in Registration page, import stopped, ACTION_STATE set to error||
|6|Reg data, Services data, no action data|Client created (if needed), service added (if needed), moves back to Advanced Search|v0.1.0|
|7|Reg data, Services data, action data|Same as 6, but adds action data before moving back to Advanced Search|v0.1.0 - DOB broken|
|99|Reg Data, CBI Data, Services data, Action data|Client created (if needed), optional data added and saved, service added (if needed), action added||
