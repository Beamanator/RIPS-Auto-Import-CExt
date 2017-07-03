# RIPS-Auto-Import-CExt
Adds automatic import functionality to RIPS

Currently working on converting to more structured file format

Fields required for Registration page, and example data: (incomplete)

| Full Name | Gender | Date of Birth | Nationality | blah |
|-----------|--------|---------------|-------------|------|
|Test Bob 1 |    M   |  .10/28/2010  |             |      |
|           |        |               |             |      |
|           |        |               |             |      |

Notes about Registration table:
1) Full name - first name goes into "First name", all others go into "Surname"
2) Date of Birth - '.' in front of DOB is not necessary, but can be included for formattting (it will be removed before being imported)

Fields required for Add Action page, and example data: (incomplete)

| Service Code (*) | Action Name (*) | Action Date | Action Caseworker | Attendance Notes |
|:----------------:|-----------------|-------------|-------------------|------------------|
|        RSD       | Other           |             | abeaman           |                  |
|                  |                 |             |                   |                  |
|                  |                 |             |                   |                  |

Notes about Service / Action table:
1) If "Service Code" is populated but "Action Name" column is omitted, service will be added, then action data will be skipped.

# Testing Scenarios:
|#| Client Data Description (list) |Expected Outcome| Pass / Fail |
|:-:|------------------------------|----------------|-------------|
|1|Duplicate UNHCR #s, any other data|client added to duplicate storage, no new clients created||
