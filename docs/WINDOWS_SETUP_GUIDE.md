# 🖥️ Windows Setup Guide — Organ Donation Management System

A step-by-step guide to run this project on a **Windows laptop**.

---

## 📋 Prerequisites to Install

| # | Software | Download Link |
|---|----------|---------------|
| 1 | **Node.js** (v18+) | https://nodejs.org → Click "Download LTS" |
| 2 | **MySQL** (v8.0+) | https://dev.mysql.com/downloads/installer/ → Download "MySQL Installer" |
| 3 | **Git** | https://git-scm.com/download/win |
| 4 | **VS Code** | https://code.visualstudio.com |

### How to Install Each:

#### 1. Node.js
- Go to https://nodejs.org
- Click the **LTS (Long Term Support)** download button
- Run the installer → Click "Next" through all steps → Finish
- Verify: Open Command Prompt and type `node --version`

#### 2. MySQL
- Go to https://dev.mysql.com/downloads/installer/
- Download "MySQL Installer for Windows"
- Run installer → Choose **"Developer Default"** setup type
- During setup, set a **root password** (remember this! e.g., `root123`)
- Complete installation
- MySQL will run automatically as a Windows service

#### 3. Git
- Go to https://git-scm.com/download/win
- Download and run the installer
- Click "Next" through all steps (default settings are fine)
- Verify: Open Command Prompt and type `git --version`

#### 4. VS Code
- Go to https://code.visualstudio.com
- Download and install
- Open VS Code → Install "MySQL" extension (optional, for viewing database)

---

## 🚀 Step-by-Step: Running the Project

### Step 1: Clone the Repository

Open **Command Prompt** or **Git Bash** and run:

```bash
git clone <GITHUB_REPOSITORY_URL>
cd organ-donation-system
```

### Step 2: Open in VS Code

```bash
code .
```

Or open VS Code manually → File → Open Folder → select `organ-donation-system`

### Step 3: Install Dependencies

Open VS Code terminal (Ctrl + `) and run:

```bash
npm install
```

### Step 4: Setup MySQL Database

**Option A: Using MySQL Command Line Client**
1. Open "MySQL 8.0 Command Line Client" from Start Menu
2. Enter your root password
3. Copy-paste the entire contents of `server/database/schema.sql` and press Enter

**Option B: Using Command Prompt**
```bash
mysql -u root -p < server/database/schema.sql
```
Enter your MySQL password when prompted.

**Option C: Using MySQL Workbench**
1. Open MySQL Workbench
2. Connect to your local MySQL server
3. Open `server/database/schema.sql`
4. Click the ⚡ Execute button

### Step 5: Configure the .env File

1. In the project folder, find the file `.env.example`
2. Create a copy and rename it to `.env`
3. Open `.env` and update your MySQL password:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password_here
DB_NAME=organ_donation_db
DB_PORT=3306
JWT_SECRET=organ_donation_secret_key_2024
PORT=3000
```

⚠️ Replace `your_mysql_password_here` with the password you set during MySQL installation.

### Step 6: Start the Server

In VS Code terminal:

```bash
npm start
```

You should see:
```
✅ MySQL Database connected successfully

    ╔═══════════════════════════════════════════════╗
    ║   Organ Donation Management System            ║
    ║   Server running on http://localhost:3000      ║
    ╚═══════════════════════════════════════════════╝
```

### Step 7: Open in Browser

Open any web browser (Chrome recommended) and go to:

**👉 http://localhost:3000**

---

## 🔐 Login Credentials

| Role | Email | Password |
|------|-------|----------|
| **Admin** | admin@admin.com | admin123 |

For other roles (Donor, Patient, Hospital), register a new account on the Register page.

---

## ⚡ Quick Start (After First Setup)

After the initial setup, you only need 2 steps each time:

1. Open VS Code terminal in the project folder
2. Run `npm start`
3. Open http://localhost:3000 in your browser

MySQL starts automatically on Windows as a background service — no need to start it manually!

---

## ❗ Common Issues

| Problem | Solution |
|---------|----------|
| `npm: command not found` | Restart Command Prompt after installing Node.js |
| `mysql: command not found` | Add MySQL to PATH: Search "Environment Variables" → System Variables → Path → Add `C:\Program Files\MySQL\MySQL Server 8.0\bin` |
| `Access denied for user 'root'` | Check your password in `.env` file |
| `ECONNREFUSED` | Make sure MySQL service is running (Services → MySQL80 → Start) |
| Port 3000 already in use | Change PORT in `.env` to 3001 |
