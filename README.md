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
- [ ] User creation page
- [ ] User password change if that user is viewing the page
- [ ] Dates colors that make sense: due date red if overdue. Completed date red if overdue. In all pages
- [ ] Make an admin menu with dropdowns for Tasks, Users, Departments, and Statuses
- [ ] Replace the React Icon logo with an actual generic .png
- [ ] Add a favicon
- [ ] Scheduled function to check for overdue tasks and set the status to Overdue
- [ ] Add toast notifications for changes
- [ ] Design a dashboard with statistics on top, my pending tasks and tasks to review for managers
- [ ] Comments @ mentions
- [ ] Email notifications for comment @mentions, re-opened tasks, task completion, task assigned
- [ ] Sonner toast notifications when emails are sent
- [ ] Email notifications for overdue tasks (10 days)
