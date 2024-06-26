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
- [ ] Design a dashboard with statistics on top, my pending tasks and tasks to review for managers
- [ ] Footer: Proudly made in RO by me
- [ ] Email notifications for comment @mentions, re-opened tasks, task completion, task assigned
- [ ] Scheduled function to check for overdue tasks and send due soon and overdue emails
- [ ] Add Sonner toast notifications for changes
- [ ] Comments @ mentions
- [ ] Sonner toast notifications when emails are sent
- [ ] If saving new user as admin, pop-up to confirm the action
- [ ] User name red if the user is inactive
- [ ] Add a favicon
- [ ] Links from Departments users to users filtered by department
- [ ] Links from User tasks to tasks filtered by user
