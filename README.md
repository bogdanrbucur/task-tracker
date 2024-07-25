# Task Tracker

A web application to create, assign and manage tasks.

## Features

### Light and dark mode

[gif of mode switching]

### Personalized user dashboard

[ss of dashboard]

### Tasks comments system with user @mentions

[gif of writting comment with @mentions]

### Email notifications for important events

[gif of email toast and screenshot of email]

### Secure user management

[ss of unverified user and ss of welcome page]

### Powerful filtering and search

[gif of searching for user and status]

### Tasks Excel export

[gif of searching for something, exporting and opening Excel]

## Tech stack

- Metaframework: [Next.js](https://nextjs.org/)
- Database: [SQLite](https://www.sqlite.org/index.html)
- ORM: [Prisma](https://www.prisma.io/)
- UI components: [shadcn-ui](https://ui.shadcn.com/)
- CSS framework: [Tailwind CSS](https://tailwindcss.com/)
- Authentication: [Lucia](https://lucia-auth.com/) and [Oslo](https://oslo.js.org/). Thanks to [Robin Wieruch](https://www.robinwieruch.de/) for his [excellent tutorial](https://www.robinwieruch.de/next-authentication/)
- Email: [Resend](https://resend.com/)

## Installation and setup

1. Install [Node.js](https://nodejs.org/en/)
2. Clone the repo `git clone`
3. `npm install` to install all dependencies
4. Create a `.env.local` file with the following content:

```env
`RESEND_API_KEY="re_123"`
`BASE_URL="https://example.com"`
`DAILY_TASKS_TOKEN="f7238d8c2b7da7a72f93de486dtc707f09a184b0f70"`
```

Enter your Resend API key and your base URL.
Use any `DAILY_TASKS_TOKEN` you want. This is a secret key to call the daily tasks API so it cannot be executed remotely.

5. `npm run dev` to run in dev mode
6. `npm run build` to build the app
7. `npm run start` to run the app in production mode on port 3000

### Scheduled daily tasks

Schedule to run `npm run daily` to run all the daily tasks, just after midnight. This will clear unused password reset tokens and check for overdue and due soon tasks and send the email notifications.

#### Linux

You can use a cron job to run the script at a specific interval. For example, to run the script every daily at 01:00, add the following line to your crontab by running `crontab -e`:

```bsh
0 1 * * * cd /path/to/app/task-tracker/ && /usr/bin/npm run daily
```

#### Windows

You can use Task Scheduler to run the script at a specific interval. Create a new basic task with the following settings:

Program/script: "Powershell"
Add arguments (optional): `cd "C:\path\to\script\" | npm run daily`

### Using Primsa with SQLite

#### First-time setup. Unnecessary if you clone the repo

1. `npm install prisma --save-dev`
2. `npx prisma init --datasource-provider sqlite`
3. Configure `./prisma/schema.prisma` to setup some models

#### When making schema changes

1. `npx prisma migrate dev --name init` and `npx prisma migrate --name change` for every new change
2. `npx prisma generate` to generate the client

#### To access and modify the database

`npx prisma studio` to open the studio

## Roadmap

- [x] Allow dashboard viewing without login but nothing else
- [x] Display Sign In button in navbar if user is not siggned in
- [x] Make a proper Sign In page and form validation
- [x] Task view page
- [x] Add Due Date to the Task model
- [x] Task creation page. Access only with rights.
- [x] Add history to the Task model and implement it in the Task view page. Every change should be recorded.
- [x] Task edit page if the user has rights. Cancel option only with rights. Close task only with rights.
- [x] Greeting in upper right corner of the navbar for the user
- [x] Implement comments system for tasks
- [x] Implement close task system with pop-up and optional comment
- [x] Implement Completed On and Closed On fields in the Task model and view page
- [x] Revamp permission system:
- [x] guest: view dashboard;
- [x] user: view dashboard, all tasks, complete his tasks, view his user and change his password
- [x] manager (has active subordinates): create tasks, edit tasks (only for his subordinates and themselves), close his subordinates' tasks, view his subordinates' users, can export tasks to Excel;
- [x] admin: can create/edit users.
- [x] Implement Complete task system with pop-up and mandatory comment
- [x] Nicer alert dialogs
- [x] Implement Re-Open task system with pop-up and mandatory comment
- [x] User view page
- [x] User creation page
- [x] User password change if that user is viewing the page
- [x] User password change pop-up
- [x] Restrict normal users from editing department, manager, email and position
- [x] Avatar saved as BLOB and displayed in the user view page
- [x] Dates colors that make sense: due date red if overdue. Completed date red if overdue. In all pages
- [x] Comment users with avatars
- [x] Provision to deactivate users. Delete the avatar file from local storage when deactivating a user
- [x] Tasks and Users table filters
- [x] Replace the React Icon logo with an actual generic .png
- [x] Make a Department admin page
- [x] Make an admin menu with dropdowns for Users and Departments
- [x] Overdue flag for each task
- [x] Overdue status filter for tasks
- [x] Overdue checking when editing a task
- [x] Design a dashboard with statistics on top, my pending tasks and tasks to review for managers
- [x] Footer: Proudly made in RO by me
- [x] Scheduled function to check for overdue tasks and send due soon and overdue emails
- [x] [feat] Comments @ mentions
- [x] [feat] Email notifications for:
  - [x] [feat] Task assigned
  - [x] [feat] Task due soon
  - [x] [feat] Task overdue to user and manager
  - [x] [feat] Task completed
  - [x] [feat] Task re-opened
  - [x] [feat] @comment mentions
- [x] [fix] Saving user errors
- [x] [feat] User edit avatar change in real-time
- [x] [fix] Fix user Edit button access
- [x] [feat] Add Sonner toast notifications for changes and sent emails
  - [x] [feat] For new task email sent
  - [x] [feat] For task modified, if email sent
  - [x] [feat] For task completed, if email sent
  - [x] [feat] For task re-opened, if email sent
- [x] [feat] Task cancellation
  - [x] [feat] Button in the task view page
  - [x] [feat] Pop-up with mandatory comment
  - [x] [feat] Task close action
  - [x] [feat] Task history entry
  - [x] [feat] Email notification to user and manager
  - [x] [feat] Sonner toast notification for email sending
- [x] [feat] If saving new user as admin, highlight it will be admin
- [x] [feat] Ability to deactivate other admins
- [x] [feat] User name red if the user is inactive
- [x] [feat] Populate user's avatar in the edit page, if available
- [x] [feat] User password reset
  - [x] [feat] Token schema
  - [x] [feat] Password reset button for admins
  - [x] [feat] Password reset action to generate token and send email
  - [x] [feat] Password reset page to validate token and set new password
  - [x] [feat] Email template for password reset
  - [x] [feat] Email template for new user created
  - [x] [feat] Forgot password link in the login page with email input
  - [x] [feat] Server action to create token and send email
  - [x] [feat] Password reset email
  - [x] [feat] User creation automatic email with page to set password
  - [x] [feat] Update user schema to include status active, inactive and unverified and remove status
  - [x] [feat] Show the user status in the user view page
  - [x] [feat] Activate/deactivate user should set the appropriate status
  - [x] [feat] User creation should set the status to unverified
  - [x] [feat] When user sets the password, set the status to active
  - [x] [feat] Give admin the ability to resend welcome email
  - [x] [feat] Give admin the ability delete unverified users
  - [x] [feat] Sonner toast notification that emails are sent
  - [x] [feat] In dailyTasks, check for expired tokens and users without password. Delete expired tokens
  - [x] [feat] Update the user schema to record the user who created the user
  - [x] [feat] In dailyTasks, check for users without password and notify the admin
  - [ ] [feat] MAYBE. Give admin the ability to confirm password themselves
- [x] [feat] Greeting should only say good morning after 5 AM
- [x] [chore] Implement secret key for calling dailyTasks API
- [x] [feat] Add a proper 404 page
- [x] [feat] Add a favicon
- [x] [fix] Fix users page headers links
- [x] [fix] Tasks date sorting
- [x] [feat] Links from User tasks to tasks filtered by user
- [x] [fix] Links to tasks page reordering URL params
- [x] [feat] Nicer looking @mention menu, with (department)
- [x] [feat] Restructure the files/folders
- [x] [fix] New task can be assigned to inactive users
- [x] [feat] Excel export tasks, but with all pages
- [x] [fix] Do not allow cancelling closed tasks
- [x] [feat] Server-side logging
- [x] [feat] Departments delete
- [x] [feat] Make all pages responsive
  - [x] [feat] Dashboard
  - [x] [feat] Departments
  - [x] [feat] Users list
  - [x] [feat] Users view
  - [x] [feat] Task list
  - [x] [feat] Task view
  - [x] [feat] Task edit
  - [x] [feat] User edit
- [x] [fix] Failed to send email when comment is too short
- [x] [feat] Enforce password complexity
- [x] [fix] Avatar not populating while editing user
- [ ] [feat] Optimize db calls. Use Prisma transactions? Cache current user?
- [ ] [feat] Automatic database backups
