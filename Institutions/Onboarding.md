# Institutions Onboarding

Most steps depend on the status of the Institution in Airtable 'Institutions (Form)' and 'Institution onboarding' tables, so they are activated when this status changes.

## Step 1: When a Form of Interest is Sent

1. The institution fill up the form from 'Institutions (Form)' table.
2. The form sends automatically an email to education@wordpressfoundation.org.
3. Airtable sends an email to asking the student to book a meeting (the person of contact from the team responsible for the calendar link depends on the institution country, see Airtable 'Countries' and 'Team members' tables) or continue as discussed during the previous call (see [this template](https://secure.helpscout.net/settings/inbox/348355/saved-replies/3950163) as reference).

## Step 2: When called scheduled

1. Manually update To Follow Up = Yes in the 'Institutions (Form)' table.
2. A record is created automatically in the 'Institution Onboarding' table. 

## Step 3: After the call

1. Manually update 'Status' column in the 'Institution Onboarding' table to:
   - Interested - 'Agreement Sent'
   - Not interested - 'Not moving forward'
   - Maybe later - 'Revisit Later'

### Step 3.1: 'Agreement Sent' status added





### Step 3.2: 'Not moving forward' status added

1. Nothing else happens.

### Step 3.3: 'Revisit Later' status added

1. An automation set up the 'Days to Follow-Up' column to 60.
2. A 2 months in the future date is set up automatically in the 'Follow-Up date' column.

## Step 4: Agreement signed

### Step 4.1: 

1. Manually update 'Status' column in the 'Institution Onboarding' table to 'Confirmed'
