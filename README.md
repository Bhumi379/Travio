# Travio

Travio is a web platform for Banasthali Vidyapith students to find travel partners, share rides, and manage trip-related communication in one place.

## Features

### Student Experience
- Sign up with college details and a `@banasthali.in` email address.
- Verify accounts with OTP and support resend OTP flow.
- Log in, log out, request password reset, and update passwords.
- View available rides, search rides, and open ride details.
- Create new rides with pickup, destination, timing, and ride information.
- View previous rides and ride history.
- Manage profile details such as name, contact number, guardian number, course, email, and profile photo.
- Use real-time chat with text and media messages.
- Upload chat media that is stored in Cloudinary and saved in the chat message as a URL.
- Receive and manage notifications.
- Leave, view, update, and delete ride reviews.

### Admin Experience
- Admin login and protected admin dashboard.
- Create additional admins.
- View and manage rides, users, and admins.
- Manage about-page content from the admin side.

### Public Pages
- Login
- Signup
- OTP verification
- Forgot password
- Reset password
- Home
- Search results
- Ride details
- Create a ride
- Chat
- Profile
- Previous rides
- About
- Admin login
- Admin dashboard

## Tech Stack

- Frontend: HTML5, CSS3, Vanilla JavaScript
- Backend: Node.js, Express.js
- Database: MongoDB with Mongoose
- Real-time messaging: Socket.IO
- File uploads: Multer + Cloudinary
- Mail delivery: Nodemailer

## Requirements

Before running the project, make sure you have:

- Node.js installed
- npm installed
- Python 3 installed for the frontend static server
- MongoDB Atlas or a local MongoDB instance
- A Cloudinary account for file uploads
- SMTP credentials for email-based OTP and password reset flows

## Environment Variables

Create a `server/.env` file with the values below:

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
TOKEN_KEY=your_user_jwt_secret
ADMIN_JWT_SECRET=your_admin_jwt_secret

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

SMTP_HOST=your_smtp_host
SMTP_PORT=587
SMTP_USER=your_smtp_username
SMTP_PASS=your_smtp_password
FROM_EMAIL=your_sender_email

NODE_ENV=development
```

Optional admin bootstrap variables:

```env
BOOTSTRAP_ADMIN_NAME=Admin Name
BOOTSTRAP_ADMIN_EMAIL=admin@banasthali.in
BOOTSTRAP_ADMIN_PASSWORD=strongpassword
```

## Installation

Install dependencies for the root project and the server:

```bash
npm install
cd server
npm install
```

The client uses Python's built-in HTTP server, so no additional npm install is required in `client/`.

## Running The Project

### Run both frontend and backend

From the repository root:

```bash
npm start
```

This starts:

- Backend server on `http://localhost:5000`
- Frontend static server on `http://localhost:3000`

### Run backend only

```bash
cd server
npm start
```

### Run frontend only

```bash
cd client
npm start
```

## Create The First Admin

If you need to bootstrap the first admin account, run this from the `server/` folder:

```bash
node scripts/createFirstAdmin.js "Full Name" "you@banasthali.in" "YourPassword8+"
```

You can also use the optional `BOOTSTRAP_ADMIN_*` environment variables instead of command-line arguments.

## Main API Areas

- `/api/auth` - signup, login, OTP verification, resend OTP, forgot password, reset password, logout
- `/api/users` - user profile and user-related operations
- `/api/rides` - ride creation, listing, updates, deletion, uploads, and ride participation actions
- `/api/ride-requests` - ride request handling
- `/api/chats` - chat creation, retrieval, messages, and unread/read tracking
- `/api/reviews` - ride reviews
- `/api/notifications` - notification list and read/delete actions
- `/api/admin` - admin login, dashboard, user and ride management, and about content management
- `/api/content` - public about-page content

## Project Structure

- `client/` - frontend pages, styles, and browser-side JavaScript
- `server/` - Express app, routes, controllers, models, middleware, and scripts
- `server/uploads/` - local upload directory used by the backend when files are not sent to Cloudinary

## Notes

- The app serves the frontend directly from the backend server in local development.
- Chat media should be stored as Cloudinary URLs in the chat message record rather than as raw files in the database.
- The user-facing email flow expects `@banasthali.in` addresses.

## Screens And Pages

The frontend includes the following pages:

- `index.html`
- `login.html`
- `signup.html`
- `verify.html`
- `forgot-password.html`
- `reset-password.html`
- `profile.html`
- `create_a_ride.html`
- `search-results.html`
- `ride_details.html`
- `chat.html`
- `previous_ride.html`
- `about.html`
- `admin/adminlogin.html`
- `admin/admindashboard.html`

## Troubleshooting

- If the server fails to start, verify that `MONGODB_URI` is set correctly in `server/.env`.
- If file uploads fail, confirm that the Cloudinary credentials are valid.
- If emails are not sending, check the SMTP settings and sender address.
- If the frontend does not load, confirm that Python 3 is installed and available in your PATH.
