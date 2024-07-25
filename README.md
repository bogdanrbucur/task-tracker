# 📋 Task Tracker

A web app to create, assign and manage tasks. Users can create tasks, assign them to other users, comment on tasks, close tasks, and more. Managers can see their subordinates' tasks and statistics. Administrators can create and manage users.

## 💎 Features

### 🌛 Light and dark mode

Defaults to the user's system preference and preference is saved in local storage.

![dark-mode](./readme/dark-mode.gif)

### 📈 Personalized user dashboard

Users see their pending tasks and tasks to review if they are managers, as well as company-wide statistics.

<img src="./readme/image.png" alt="dashboard" width="750" height="480">

### 💬 Tasks comments system with user @mentions

Mention users in comments to notify them by email.

![comments](./readme/comments.gif)

### 📩 Email notifications for important events

Assigned tasks, due soon tasks, overdue tasks and more email notifications.

![comments](./readme/toast.gif)

### 🔒 Secure user management

Create and modify users and send password reset emails.
<img src="./readme/user-page.png" alt="user">

Users receive welcome and password reset emails and set their own passwords.

<img src="./readme/welcome-email.png" alt="welcome-email" width="400" height="500">

Administrators cannot set or ever see users' passwords which are hashed using [Argon2id](https://en.wikipedia.org/wiki/Argon2), an [industry-recognized](https://pages.nist.gov/800-63-4/sp800-63b.html) hashing algorithm, thus enforcing nonrepudiation.

<img src="./readme/welcome.png" alt="dashboard" width="280" height="300">

### 🔍 Powerful filtering and search

![search](./readme/search.gif)

### 📃 Tasks Excel export

![excel](./readme/excel.gif)

### 📱 Responsive design

All features available mobile devices.

![mobile](./readme/mobile.png)

### 📅 Task history

See all changes made to tasks, enforcing accountability.

![history](./readme/history.png)

## 🚀 Tech stack

- Metaframework: [Next.js](https://nextjs.org/)
- Database: [SQLite](https://www.sqlite.org/index.html)
- ORM: [Prisma](https://www.prisma.io/)
- UI components: [shadcn-ui](https://ui.shadcn.com/)
- CSS framework: [Tailwind CSS](https://tailwindcss.com/)
- Authentication: [Lucia](https://lucia-auth.com/) and [Oslo](https://oslo.js.org/). Thanks to [Robin Wieruch](https://www.robinwieruch.de/) for his [excellent tutorial](https://www.robinwieruch.de/next-authentication/)
- Email: [Resend](https://resend.com/)

## 🛠️ Installation and setup

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

#### Directly accessing the database

1. `npx prisma studio` to open the studio
2. To generate a password hash to insert in the database, change the `pass` const in `./lib/hashpass.js` and run `node ./lib/hashpass.js` to get the hash printed to the console

## Todo

- [ ] [feat] Automatic database backups
- [ ] [feat] Optimize db calls. Use Prisma transactions? Cache current user?
