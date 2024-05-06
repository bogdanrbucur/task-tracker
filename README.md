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
- [ ] Make a proper Sign In page and form validation
- [ ] Task creation page. Access only with rights.
- [ ] Task view page
- [ ] Task edit page if the user has rights. Cancel option only with rights. Close task only with rights.
- [ ] Greeting in upper right corner of the navbar for the user
- [ ] User view page
- [ ] User password change if that user is viewing the page
- [ ] Replace the React Icon logo with an actual generic .png
- [ ] Add a favicon
- [ ] Add Due Date to the Task model
- [ ] Scheduled function to check for overdue tasks and set the status to Overdue
- [ ] Create Admin page to edit Departments and Statuses
