# Student Onboarding for Pisa Students

Most steps depend on the status of the student in Airtable 'Students' table, so they are activated when this status changes.
In all cases (EXCEPT the last 2 steps, 4th and 5th), the email has been condition to be sent only when **Pisa University** is the Student's institution. 

## Step 1: When a Form of Interest is Sent

1. The student fills up the form and indicates **'Pisa University'** as their institution.
2. 'Status' column needs to be **empty** at this point.
3. Airtable sends an email to asking the student to book a meeting with Isotta (see [this template](https://secure.helpscout.net/settings/inbox/348355/saved-replies/3932399) as reference) with education@wordpressfoundation.org in copy. 

## Step 2: After the Individual Meeting with Isotta

1. Isotta applies the status **'Interested'** in the 'Status' column.
2. Airtable sends the email asking for all information needed for the Agreement (see [this template](https://secure.helpscout.net/settings/inbox/348355/saved-replies/3910748) as reference) with education@wordpressfoundation.org in copy.

## Step 3: Agreement Signature and Process

1. Students provide all needed information.
2. Isotta prepares the agreement, sign it, and send it to the student and ask the student to sign it and to complete the signature round (tutor + send to the internship office).
3. The students needs to confirm Isotta that the internship office has activated the project. 
4. **When the project has been activated on the internship portal**, Isotta assigns the status **In Sensei** to the student's 'Status' column.

## Step 4: Mentor Assignment and Welcome Email to the Course 

1. After assigning **In Sensei** to the student's 'Status' column, we need to assign a mentor to the student. 
2. When the student's 'Status' column is **In Sensei** + **'Mentor' column is not empty**:
   -  Airtable sends the welcome email with the mentor and education@wordpressfoundation.org in copy (see [this template](https://secure.helpscout.net/settings/inbox/348355/saved-replies/3934763) as reference).
   -  Airtable creates a record for the student in 'Students Reports' and 'Feedback'.


## Step 5: Status changes to Graduate (Automation)

1. When the student completes the third feedback form in the course (last form), an automation makes their **status column** change to **'Graduate'**.
