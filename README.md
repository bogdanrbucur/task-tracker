# 📋 Task Tracker

A web app to create, assign and manage tasks, built with the latest web technologies.

See a live deployment running on my Raspberry Pi [here](https://tasks.tetrabit.dev).

## 💎 Features

### 🚀 Intuitive tasks workflow

- Managers can create and edit tasks for themselves and their subordinates
- Users are notified when new tasks are assigned to them, when they are due soon or overdue
- Using comments, users can ask questions, provide updates and mention other users
- Upon task completion, users mark tasks as Completed and add their remarks
- Managers are notified of Completed tasks, review them and Close the tasks
- Administrators can make any change to any tasks
- All changes are logged and can be viewed by anyone for full transparency

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

### 🔑 Secure user management

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

All features available on mobile devices.

![mobile](./readme/mobile.png)

### 📅 Task history

See all changes made to tasks, enforcing accountability.

![history](./readme/history.png)

### 👍 Other features

- Rate limiting to prevent brute force attacks on both IP and email, with separate limits
- Tasks source and completion attachments with automatic image previews and download links

## 💾 Tech stack

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
`MAX_FAILED_ATTEMPTS_EMAIL=10`
`MAX_FAILED_ATTEMPTS_IP=50`
`LOCKOUT_MINUTES=15`
```

Enter your Resend API key and your base URL.
Use any `DAILY_TASKS_TOKEN` you want. This is a secret key to call the daily tasks API so it cannot be executed remotely.

5. `npm run dev` to run in dev mode
6. `npm run build` to build the app
7. `npm run start` to run the app in production mode on port 3000

### Automatic start

#### Linux - systemd

1. Create a service file `/etc/systemd/system/task-tracker.service` with the following content:

```ini
[Unit]
Description=Task Tracker
After=network.target

[Service]
Type=simple
User=root
Group=root
Restart=always
Restart=on-failure
RestartSec=10
WorkingDirectory=/path/to/app/task-tracker/
StandardOutput=/var/log/task-tracker.log
StandardError=/var/log/task-tracker.log
ExecStart=/usr/bin/npm start

[Install]
WantedBy=multi-user.target
```

2. Create the log file with `sudo touch /var/log/task-tracker.log`
3. Ensure the logfile has the user permissions with `sudo chmod 644 /var/log/task-tracker.log`
4. Restart the systemctl background process with `sudo systemctl daemon-reload`
5. Start the service with `sudo systemctl start task-tracker`
6. Enable the service to start at boot with `sudo systemctl enable task-tracker`
7. Check the status with `sudo systemctl status task-tracker`

#### Windows - Task Scheduler

Create a basic start that will run at start-up with the following settings:

Program/script: "Powershell"
Add arguments (optional): `cd "C:\path\to\script\" | npm start`

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

### Scheduled daily database backups

#### Linux

You can use a cron job to run the script at a specific interval. For example, to run the script every daily at 02:00, add the following line to your crontab by running `crontab -e`:

```bsh
0 1 * * * cd /path/to/app/task-tracker/ && /db_backup.sh
```

### Using Primsa with SQLite

#### First-time setup. Unnecessary if you clone the repo

1. `npm install prisma --save-dev`
2. `npx prisma init --datasource-provider sqlite`
3. Configure `./prisma/schema.prisma` to setup some models

#### When making schema changes

1. `npx prisma migrate dev --name whatever-change` for every change
2. If the migrations were pulled from a commit, run `npx prisma migrate deploy` to apply them
3. `npx prisma generate` to generate the client

#### Directly accessing the database

1. `npx prisma studio` to open the studio
2. To generate a password hash to insert in the database, change the `pass` const in `./lib/hashpass.js` and run `node ./lib/hashpass.js` to get the hash printed to the console

### SFTP VS Code extension setup

Run command pallette `Ctrl+Shift+P` and search for `SFTP: Config` to create a new configuration file. Add the following content:

```json
{
	"name": "Raspberry Pi",
	"host": "",
	"protocol": "sftp",
	"port": 22,
	"username": "",
	"password": "",
	"remotePath": "/path/to/app/task-tracker",
	"uploadOnSave": true
}
```

## Todo

- [ ] [feat] Automatic database backups
- [ ] [feat] Optimize db calls. Use Prisma transactions? Cache current user?
