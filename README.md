# Task Tracker

A task tracker application built with Next.js, Prisma, SQLite, Lucia, Oslo, and shadcn-ui. Work in progress...

## Setup Primsa with SQLite

1. `npm install prisma --save-dev`
2. `npx prisma init --datasource-provider sqlite`
3. Configure `./prisma/schema.prisma` to setup some models
4. `npx prisma migrate dev --name init` and `npx prisma migrate --name change` for every new change
5. `npx prisma generate` to generate the client
6. `npx prisma studio` to open the studio

## Setup shadcn-ui

[Follow instructions](https://ui.shadcn.com/docs/installation/next).

## Setup authentication and authorization with Lucia and Oslo

[Follow instructions](https://www.robinwieruch.de/next-authentication/).

## Scheduled daily tasks

Schedule to run `npm run daily` to run all the daily tasks, just after midnight.

## `.env.local`

`RESEND_API_KEY="re_123"`
`BASE_URL="https://example.com"`

## TODO

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
- [ ] [chore] Implement secret key for calling dailyTasks API
- [ ] [feat] Add a favicon
- [ ] [feat] Add a proper 404 page
- [ ] [feat] Links from Departments users to users filtered by department
- [ ] [feat] Links from User tasks to tasks filtered by user
- [ ] [feat] Excel export tasks, but with all pages
- [ ] [feat] Server-side logging
- [ ] [feat] Make all pages responsive
- [ ] [feat] Restructure the files/folders
- [ ] [feat] Enforce password complexity
- [ ] [feat] Automatic database backups
