# 🩸 Organ Donation Management System

A full-stack web application that connects organ donors, patients, and hospitals. The system manages donor registrations, patient organ requests, hospital verifications, and uses an intelligent matching algorithm based on blood group compatibility and organ type.

---

## 📁 Project Structure

```
organ-donation-system/
├── server/
│   ├── config/db.js              # MySQL connection pool
│   ├── middleware/auth.js         # JWT authentication
│   ├── routes/
│   │   ├── authRoutes.js          # Login / Register
│   │   ├── donorRoutes.js         # Donor CRUD
│   │   ├── patientRoutes.js       # Patient + Organ Requests
│   │   ├── hospitalRoutes.js      # Hospital CRUD
│   │   ├── matchRoutes.js         # Matching Algorithm
│   │   └── adminRoutes.js         # Admin Dashboard
│   ├── database/schema.sql        # SQL tables & seed data
│   └── server.js                  # Express entry point
├── public/
│   ├── css/style.css              # Global styles
│   ├── js/
│   │   ├── api.js                 # API fetch helper
│   │   ├── auth.js                # Login/Register logic
│   │   ├── donor.js               # Donor dashboard
│   │   ├── patient.js             # Patient dashboard
│   │   ├── hospital.js            # Hospital dashboard
│   │   ├── admin.js               # Admin dashboard
│   │   └── match.js               # Matching results
│   ├── index.html                 # Home page
│   ├── login.html                 # Login
│   ├── register.html              # Registration (tabbed)
│   ├── donor-dashboard.html       # Donor panel
│   ├── patient-dashboard.html     # Patient panel
│   ├── hospital-dashboard.html    # Hospital panel
│   ├── admin-dashboard.html       # Admin panel
│   ├── donor-list.html            # Browse donors
│   └── matching-results.html      # View matches
├── .env                           # Environment variables
├── package.json
└── README.md
```

---

## ⚙️ Prerequisites

- **Node.js** (v16 or higher) — [Download](https://nodejs.org)
- **MySQL** (v8.0 or higher) — [Download](https://dev.mysql.com/downloads/)
- **VS Code** (recommended editor)

---

## 🚀 How to Run the Project

### Step 1: Install Dependencies

```bash
cd organ-donation-system
npm install
```

### Step 2: Setup MySQL Database

1. Open MySQL CLI or MySQL Workbench
2. Run the schema file:

```bash
mysql -u root -p < server/database/schema.sql
```

Or copy-paste the contents of `server/database/schema.sql` into MySQL Workbench and execute.

### Step 3: Configure Environment

Edit the `.env` file with your MySQL credentials:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=organ_donation_db
DB_PORT=3306
JWT_SECRET=organ_donation_secret_key_2024
PORT=3000
```

### Step 4: Start the Server

```bash
node server/server.js
```

You should see:
```
✅ MySQL Database connected successfully

    ╔═══════════════════════════════════════════════╗
    ║   Organ Donation Management System            ║
    ║   Server running on http://localhost:3000      ║
    ╚═══════════════════════════════════════════════╝
```

### Step 5: Open in Browser

Go to: **http://localhost:3000**

---

## 👤 Default Admin Login

| Email | Password |
|-------|----------|
| admin@admin.com | admin123 |

---

## 🔗 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Get profile (🔒) |

### Donors
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/donors` | Register donor (🔒 donor) |
| GET | `/api/donors` | List approved donors |
| GET | `/api/donors/all` | All donors (🔒 admin/hospital) |
| GET | `/api/donors/my-profile` | My profile (🔒 donor) |
| PUT | `/api/donors/:id/status` | Update status (🔒 admin/hospital) |

### Patients
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/patients` | Register patient (🔒 patient) |
| GET | `/api/patients` | List patients (🔒 admin/hospital) |
| POST | `/api/patients/organ-requests` | Submit request (🔒 patient) |
| GET | `/api/patients/organ-requests/my-requests` | My requests (🔒 patient) |
| GET | `/api/patients/organ-requests/all` | All requests (🔒 admin/hospital) |

### Hospitals
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/hospitals` | Register hospital (🔒 hospital) |
| GET | `/api/hospitals` | List approved hospitals |
| PUT | `/api/hospitals/:id/verify` | Verify hospital (🔒 admin) |

### Matching
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/matches/find/:requestId` | Run matching (🔒 admin/hospital) |
| GET | `/api/matches` | List matches (🔒 admin/hospital) |
| PUT | `/api/matches/:id/status` | Update match (🔒 admin/hospital) |

### Admin
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/stats` | Dashboard stats (🔒 admin) |
| GET | `/api/admin/users` | List all users (🔒 admin) |
| DELETE | `/api/admin/users/:id` | Delete user (🔒 admin) |
| GET | `/api/admin/pending` | Pending approvals (🔒 admin) |

🔒 = Requires JWT token (login first)

---

## 🧪 Testing with Postman

### 1. Register a Donor
```
POST http://localhost:3000/api/auth/register
Content-Type: application/json

{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123",
    "role": "donor"
}
```

### 2. Login
```
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
    "email": "john@example.com",
    "password": "password123"
}
```
→ Copy the `token` from the response

### 3. Complete Donor Profile
```
POST http://localhost:3000/api/donors
Authorization: Bearer <your-token>
Content-Type: application/json

{
    "blood_group": "O+",
    "organ": "Kidney",
    "age": 30,
    "gender": "Male",
    "phone": "9876543210",
    "city": "Mumbai"
}
```

### 4. Run Matching (as Admin)
```
POST http://localhost:3000/api/matches/find/1
Authorization: Bearer <admin-token>
```

---

## 🧬 Organ Matching Algorithm

The matching algorithm works as follows:

1. **Input**: An open organ request (organ type + blood group)
2. **Search**: Find approved donors matching the same organ type
3. **Filter**: Filter by blood group compatibility using a medical compatibility table
4. **Score**: Calculate compatibility score:
   - 100% = Exact blood group match
   - 75% = Compatible but different blood group
   - 0% = Incompatible
5. **Output**: Ranked list of matching donors

### Blood Group Compatibility Table

| Patient | Can Receive From |
|---------|-----------------|
| O- | O- |
| O+ | O-, O+ |
| A- | O-, A- |
| A+ | O-, O+, A-, A+ |
| B- | O-, B- |
| B+ | O-, O+, B-, B+ |
| AB- | O-, A-, B-, AB- |
| AB+ | All (Universal Receiver) |

---

## 🛡️ Security Features

- **Password Hashing**: bcrypt with 10 salt rounds
- **JWT Authentication**: Tokens expire in 24 hours
- **Role-Based Access Control**: Each route is protected by role middleware
- **SQL Injection Prevention**: Parameterized queries via mysql2
- **Input Validation**: Server-side validation on all endpoints

---

## 📄 Technologies Used

| Component | Technology |
|-----------|-----------|
| Frontend | HTML5, CSS3, JavaScript |
| Backend | Node.js, Express.js |
| Database | MySQL |
| Auth | JWT + bcrypt |
| API | RESTful |
| Editor | VS Code |

---

## 🌍 Deployment Suggestions

- **Backend**: Deploy on [Render](https://render.com), [Railway](https://railway.app), or [Heroku](https://heroku.com)
- **Database**: Use [PlanetScale](https://planetscale.com) or [ClearDB](https://www.cleardb.com) for hosted MySQL
- **Frontend**: Served by Express, so it deploys along with the backend

---

## 📞 Module Explanations

### 1. Authentication Module
Handles user registration and login. Supports 4 roles: admin, donor, patient, hospital. Uses bcrypt for password hashing and JWT for session management.

### 2. Donor Registration Module
Allows donors to register with blood group, organ type, age, gender, phone, and city. Profiles need approval from admin or hospital.

### 3. Patient Organ Request Module
Patients register with their organ needs and urgency level, then submit formal organ requests that enter the matching queue.

### 4. Hospital Verification Module
Hospitals register and await admin approval. Once approved, they can verify donors and manage organ requests.

### 5. Organ Matching Algorithm
Matches donors to patients using blood group compatibility charts and organ type matching, producing scored results.

### 6. Admin Dashboard
Centralized control panel with statistics, user management, pending approvals, and the ability to run the matching algorithm.

---

*Built as a Final Year College Project — Healthcare Domain*
