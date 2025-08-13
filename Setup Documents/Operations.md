## Operational Readiness Checklist for WordPress Credits

[Original source](https://docs.google.com/document/d/1C4JMat-tHZyEEOJp_PdhPVPObJ8Pu6gBwYghudAiH5Q/edit?tab=t.0#heading=h.3cjg8buq290e)

### 1\. Core Tracking Systems

* Airtable or equivalent CRM set up for universities, students, and mentors  
* Time tracking tool (e.g. Clockify) set up and tested  
* Workflow to link time logs to student records  
* Access granted to students, mentors, and tutors  
* Scalable structure in place for 100+ interns

### 2\. Consent & Data Privacy

* Consent form drafted and shared with students and tutors (depending on the university’s rule, it may vary)   
* Tools used are GDPR-compliant (and FERPA-aware if applicable)  
* Data retention and deletion policy drafted and followed  
* Recurrent task: review and updates to privacy policies

### 3\. Role-Based Documentation

* Student onboarding guide (incl. logging hours, project tracking, contact points)  
* Mentor onboarding guide (expectations, check-in routine, reporting issues)  
* University tutor guide (monitoring, giving feedback, coordination)

### 4\. Milestone Checkpoints

* Initial check-in after onboarding completed  
* Mid-internship review scheduled  
* Final project review and wrap-up presentation in place  
* Notification/reminder system automated or manually tracked

### 5\. Feedback & Evaluation

* Feedback forms for students, mentors, and tutors  
* Feedback results reviewed and stored  
* Create feedback action plan  
* Testimonials collected for reporting/promotion  
* Annual impact report template created (or planned)

### 6\. Mentor Capacity Planning

* Mentor pool created with contact info and expertise  
* Availability tracked (e.g. per quarter or semester)  
* Backup mentors identified for emergencies

### 7\. Issue Escalation & Support

* Protocol for inactive or struggling interns (e.g., initial check-in by mentor, then program coordinator involvement, potential intervention plan)  
* Contact chain defined for urgent issues (you, mentor, tutor)  
* Conflict resolution pathway outlined  
* Training on conflict resolution for mentors and program staff.

### 8\. Communication & Promotion

* Announcement published on WP Foundation website  
* Email template for universities prepared  
* Follow-up plan for interested universities and companies (e.g., sponsor mentors)

## System Overview: Internship Tracker (Conversion \+ Status)

We need **two connected systems**:

1. **Internship CRM-style tracker** (conversion and status tracking)  
2. **Time tracking tool** (hours logged per intern, accessible by student, university tutor, and WPF)

### **Airtable**

Airtable offers spreadsheet-style simplicity with the structure and scalability of a database. Ideal for managing universities, students, mentors, and internship stages in one place.

* Clean interface, accessible to collaborators with permission control  
* Supports linked records (e.g., students linked to universities)  
* Custom views (per university, student stage, etc.)  
  Scalable (100s–1000s of rows)  
* Automations and integrations (Slack, email, etc.)

### **Suggested Airtable Base Structure:**

**Table 1: Universities**

* Name  
* Contacted (Y/N)  
* Date contacted  
* Confirmed (Y/N)  
* Notes  
* Linked students (linked to Table 2\)

**Table 2: Students**

* Name  
* University (linked to Table 1\)  
* Degree program  
* Interested (Y/N)  
* Signed up (Y/N)  
* Internship start & end dates  
* Project area  
* Completion status (In progress, Completed, Dropped)  
* Linked time tracker (URL)  
* Notes

(NB: We can embed Airtable forms for easy student sign-up per university.)

## System Overview: Time Tracking System

### **Clockify (Free plan suitable to start)**

* Time logs visible to student, tutor, and you  
* Assign projects and tasks  
* Exportable reports  
* Scalable for teams  
* Web \+ mobile apps

### **How to Set It Up:**

* Create a **workspace for WordPress Credits**  
* For each intern, create a **project** named after them (or their university \+ name)  
* Add WPF, the intern, the mentor, and their university tutor as users (free in small numbers, upgradeable for scale)  
* Intern logs hours per task with optional notes (e.g., “translated documentation,” “mentor meeting”)  
* You and the tutor can access weekly reports

### **Roles and Permissions**

| Role | Clockify Role | Permissions | Responsibilities |
| ----- | ----- | ----- | ----- |
| **WPF Program Admin** | **Admin** | Full access (create/edit users, projects, tags, reports) | Set up the workspace, add students/mentors, configure tags and phases, generate reports |
| **Student (Intern)** | **User** | Can track time and assign tags | Log time spent in each program phase |
| **Mentor** | **Manager** (or **User** with specific project rights) | View and **edit** student time entries | Review intern logs weekly, adjust if needed, ensure tagging is accurate |
| **University Tutor** | **Read-Only User** | View only | Observe student participation for academic purposes |

### **Tags / Phases**

Keep the tags clear and minimal for easy filtering and reporting. Recommended **Tags** (or **Task Names**, if you use projects with tasks):

1. **Onboarding** – includes kickoff calls, setting up tools, training  
2. **Project Work** – includes contribution work, meetings, async feedback loops  
3. **Wrap-Up** – includes final report, feedback forms, project presentation, wrap-up call

## **Future Scalability Suggestions:**

* **Zapier** or **Make.com** automation between Airtable and Clockify  
* Automatically update Airtable status when milestones are reached in Clockify  
* Weekly summary emails for tutors  
* Filter by status to detect inactive interns or flagged cases

## **Mock-up outline for Airtable base**

### Base Name: *WordPress Credits Internship Tracker*

This base has **5 interconnected tables**:

### **1\. Universities**

Tracks institutions you contact and partner with.

| Field | Type | Description |
| ----- | ----- | ----- |
| University Name | Single line text | Full official name |
| Contact Person | Single line text | Name of your main contact |
| Email | Email | For quick outreach |
| Status | Single select | Contacted, Confirmed, Declined, In Progress |
| Start Date | Date | When the partnership was confirmed |
| Notes | Long text | Any extra details or context |
| Students (linked) | Linked record (to *Students*) | Auto-generated list of students from this university |

### **2\. Students**

Each student who shows interest or signs up.

| Field | Type | Description |
| ----- | ----- | ----- |
| Full Name | Single line text | Student's full name |
| Email | Email | Preferred contact email |
| University | Linked record (to *Universities*) | Auto-links their institution |
| Degree Program | Single line text | E.g. Linguistics, Computer Science |
| Stage | Single select | Interested, Signed Up, In Progress, Completed, Dropped |
| Project Area | Single select | Translation, Docs, Code, Events, Subtitles, etc. |
| Time Tracker Link | URL | Link to Clockify or other tracker |
| Mentor | Linked record (to *Mentors*) | Assigned mentor |
| Tutor | Linked record (to *Tutors*) | Academic tutor from the university |
| Start Date | Date | Internship start |
| End Date | Date | Internship end |
| Blog URL | URL | Link to personal WP site or blog |
| Final Outcome | Single line text | Project completed, post published, etc. |
| Notes | Long text | Anything relevant for follow-up |

### **3\. Tutors**

University-side tutors assigned to students.

| Field | Type | Description |
| ----- | ----- | ----- |
| Name | Single line text | Full name |
| Email | Email | Contact info |
| University | Linked record (to *Universities*) | Their institution |
| Students | Linked record (to *Students*) | Auto-linked list of students |

### **4\. Mentors**

Internal or external mentors supporting each student.

| Field | Type | Description |
| ----- | ----- | ----- |
| Name | Single line text | Full name |
| Email | Email | Contact info |
| Area of Expertise | Multiple select | Docs, Polyglots, Events, Training, etc. |
| Students Assigned | Linked record (to *Students*) | Interns they’re mentoring |
| Availability | Single select | Available, Assigned, On Break |

### **5\. Projects**

| Field | Type | Description |
| ----- | ----- | ----- |
| **Project Name** | Single line text | Title of the project (e.g., "Learn Redesign UX Audit") |
| **Description** | Long text | Overview of project scope, goals, and context |
| **Project Lead** | Linked record (to Mentors or WPF Staff) | Primary supervisor responsible for the project |
| **Project Area** | Single select (use same values as in Students table, e.g., Documentation, Accessibility, Education, etc.) | Area of focus to help categorize efforts and filter across tables |
| **Linked Students** | Linked record (to Students table) | Students assigned to this project |
| **Mentors** | Linked record (to Mentors table) | All mentors involved (optional if Project Lead is sufficient) |
| **Cohort** | Single select (e.g., Spring 2025, Fall 2025\) | Track when the project is happening |
| **Status** | Single select: Planning, In Progress, Completed, On Hold | Current phase of the project |
| **Start Date** | Date | When the project work begins |
| **Target Completion Date** | Date | Expected end date of the project |
| **Actual Completion Date** | Date | Filled in once completed, useful for retrospectives |
| **Tags** (optional) | Multiple select | Cross-cutting themes like “Openverse,” “Translation,” “Tooling,” etc. |
| **Outcomes / Deliverables** | Long text | Final output expected (or achieved, if completed) |

### **Views & Use Tips**

* **Kanban View** of students by status (great for weekly check-ins)  
* **Filtered Views** per university or mentor  
* **Calendar View** of internship timelines  
* **Form View** for new student sign-ups  
* **Automation (optional)** to notify you when a student moves to "Completed" or is inactive for X days

### **Access Summary Table**

| Role | Airtable Role | Paid? | Permissions |
| ----- | ----- | ----- | ----- |
| **WPF Admin** | Creator | Yes | Full control, including structure and automations |
| **Mentors** | Editor | Yes | View/edit records, no schema control |
| **University Tutors** | Read-only link OR Commenter | No (Read-only) / Yes (Commenter) | View only (or comment if paid) |

