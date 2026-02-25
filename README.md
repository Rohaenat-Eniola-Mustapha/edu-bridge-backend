# Education Bridge Backend API

This is the backend API for the Education Bridge project – an offline-first web application connecting students, teachers, NGOs, and educational stakeholders to improve access to learning resources in underserved communities.

The API is built with Node.js, Express, and Supabase (PostgreSQL). It supports multi‑language content (English, Hausa, Yoruba, Igbo), offline synchronization, and NDPR‑compliant data handling.

##  Live API Base URL

Production: https://edu-bridge-backend-z68e.onrender.com

All endpoints are prefixed with /api. Example: https://edu-bridge-backend-z68e.onrender.com/api/auth/login

## Tech Stack

* Runtime: Node.js

* Framework: Express.js

* Database: Supabase (PostgreSQL)

* Authentication: Supabase Auth + JWT

* Offline Sync: Custom REST + timestamp‑based conflict resolution

* Deployment: Render

## Local Development Setup

### Prerequisites

* Node.js (v18 or later)

* npm

* Supabase account and project

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/Rohaenat-Eniola-Mustapha/edu-bridge-backend.git
   cd edu-bridge-backend/education-bridge-backend   # or your project folder
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a .env file in the root with the following variables:
   ```text
   PORT=5000
   SUPABASE_URL=your_supabase_project_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_KEY=your_supabase_service_role_key
   JWT_SECRET=your_jwt_secret (optional)
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

## API Documentation

### Authentication
#### Sign Up
Create a new user account. The user is created in Supabase Auth and automatically added to the users table via a database trigger.

* URL: /api/auth/signup

* Method: POST

* Headers: Content-Type: application/json

* Body:
   
   ```json
   {
     "email": "teacher@example.com",
     "password": "securepassword",
     "name": "Amina Teacher",
     "role": "teacher",           // teacher, student, admin, ngo
     "language": "ha"              // en, ha, yo, ig
   }
   ```

* Success Response: 201 Created

   ```json
   {
     "user": { ... },
     "session": null
   }
   ```

### Login
Authenticate a user and receive a JWT token.

* URL: /api/auth/login

* Method: POST

* Headers: Content-Type: application/json

* Body:

   ```json
   {
     "email": "teacher@example.com",
     "password": "securepassword"
   }
   ```

* Success Response: 200 OK

   ```json
   {
     "token": "eyJhbGciOiJIUzI1NiIs...",
     "user": { ... }
   }
   ```

### Get Current User
Retrieve the authenticated user's details from the users table.

* URL: /api/auth/me

* Method: GET

* Headers: Authorization: Bearer <token>

* Success Response: 200 OK with user object.

## Lessons
List Lessons
Returns all lessons, optionally filtered by subject and language.

* URL: /api/lessons

* Method: GET

* Headers: Authorization: Bearer <token>

* Query Parameters:

   * lang – language code (en, ha, yo, ig). Default en.
   
   * subject – filter by subject (e.g., Mathematics).

* Success Response: 200 OK with array of lesson objects. Multilingual fields are returned in the requested language.

### Get Single Lesson
Retrieves a specific lesson by ID.

* URL: /api/lessons/:id

* Method: GET

* Headers: Authorization: Bearer <token>

* Query Parameters: lang (optional)

* Success Response: 200 OK with lesson object.

### Assign Lesson (Teacher only)
Assigns a lesson to a class.

* URL: /api/lessons/assign

* Method: POST

* Headers: Authorization: Bearer <token>, Content-Type: application/json

* Body:
   
   ```json
   {
     "class_id": "uuid",
     "lesson_id": "uuid"
   }
   ```

* Success Response: 201 Created with assignment object.

### Get Student Lessons
Returns lessons assigned to the authenticated student (requires proper student‑class mapping).

* URL: /api/lessons/student

* Method: GET

* Headers: Authorization: Bearer <token>

 *Success Response: 200 OK with array of lessons.

## Progress Tracking
Record Progress
Create or update a student's progress on a lesson.

* URL: /api/progress/complete

* Method: POST

* Headers: Authorization: Bearer <token>, Content-Type: application/json

* Body:
  ```json
   {
     "lesson_id": "uuid",
     "progress_percent": 100,
     "completed_at": "2026-02-24T12:00:00Z"
   }
  ```

* Success Response: 200 OK with the updated progress record.

### Teacher Dashboard (Class Progress)
Get aggregated progress for a class (teacher only).

* URL: /api/progress/teacher/:classId

* Method: GET

* Headers: Authorization: Bearer <token>

* Success Response: 200 OK
  ```json
  {
     "class_name": "JSS 1A",
     "total_students": 45,
     "completion_rate": 78.2,
     "students_at_risk": [ ... ]
   }
  ```

## Synchronisation

### Sync Endpoint
Bidirectional sync for offline clients. Clients send local changes and receive server updates since last sync.

* URL: /api/sync

* Method: POST

* Headers: Authorization: Bearer <token>, Content-Type: application/json

* Body:
  ```json
   {
     "last_sync": "2026-02-23T00:00:00Z",
     "changes": [
       {
         "entity": "progress",
         "id": "local-uuid",
         "data": { "lesson_id": "...", "progress_percent": 100 },
         "timestamp": "2026-02-24T09:00:00Z"
       }
     ]
   }
  ```

* Success Response: 200 OK
  ```json
   {
     "sync_token": "2026-02-24T12:00:00Z",
     "changes": [ ... ],
     "conflicts": []
   }
  ```

## Database Schema
The main tables are:
* users – students, teachers, admins, NGOs

* schools

* classes

* lessons (multilingual JSONB fields)

* assignments

* progress

##  Environment Variables

| Variable | Description |
|---|---|
| PORT | Port the server listens on (Render sets this automatically) |
| SUPABASE_URL | Your Supabase project URL |
| SUPABASE_ANON_KEY | Public anon key (for client‑side, not heavily used server‑side) |
| SUPABASE_SERVICE_KEY | Service role key (keep secret, used for admin operations) |
| JWT_SECRET | Optional – used if implementing custom JWT |

## License

This project is for educational purposes as part of the Capstone Project Team 17.

## Contributors
