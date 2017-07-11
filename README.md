# RIPS-Auto-Import-CExt
Adds automatic import functionality to RIPS

Currently working on converting to more structured file format

*Exact* Fields required for **Registration page**, and example data: (incomplete)

| Full Name | Gender | Date of Birth | Nationality | Main Language | Phone Number | UNHCR number|
|-----------|--------|---------------|-------------|--------|-----------|------------|
|Test Bob 1 | Male   |  .10/28/2010  | -STATELESS- | Arabic |01234567890|123-99C12345|
|Test Jill  | Female |               |             |        |01112223333|000-00C00000|
|Test Bob 2 | Other  |               |             |        |05555555555|555-55C55555|

Notes about Registration table:
1) *Full name* - can be broken into columns "First Name" and "Last Name" if preferred.
2) *Full name* - first name in column goes into "First name", all other names go into "Surname" box (last name).
3) *Date of Birth* - '.' in front of DOB is not necessary, but can be included for formattting (it will be removed before being imported).
4) *Phone Number* - Should be 11 digits (Validation handled by Validation Extension).
5) *UNHCR Number* - Should be format: ###-##C#####  (Validation handled by Validation Extension).

Fields available for Client Basic Information page, and example data: (incomplete)

** Figure out how best to display CBI data table**

Fields available for **Services** page, and example data: (incomplete)
| Service Code (*) | Service Caseworker |
|------------------|--------------------|
|MAP, RST, UCY     |    abeaman         |

Notes about Services table:
1) *Service Code* - The only required column for this page.

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
|1|Duplicate UNHCR #s, any other data|client added to duplicate storage, no new clients created||
|2|First Name / Last Name vs Full Name|Scenarios should put names in correct positions||
|3|Full Name has 2 names|First name goes in first name box, all others go in 'surname' box||
|4|Only Reg data, no services / actions|Client created, not redirected to services / actions pages||
|5|Only Reg data (missing name), no services / actions|Error in Registration page, import stopped, ACTION_STATE set to error||
|6|Reg data, Services data, no action data|Client created (if needed), service added (if needed), moves back to Advanced Search|v0.1.0|
|7|Reg data, Services data, action data|Same as 6, but adds action data before moving back to Advanced Search|v0.1.0 - DOB broken|
|99|Reg Data, CBI Data, Services data, Action data|Client created (if needed), optional data added and saved, service added (if needed), action added||
