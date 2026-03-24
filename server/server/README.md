# Travio Backend API

A Node.js, Express.js, and MongoDB backend for a cab and travel partner finding website.

## Tech Stack

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - MongoDB object modeling

## Features

- User management (CRUD operations)
- Ride management (CRUD operations)
- RESTful API design
- Input validation
- Error handling
- CORS enabled

## Installation

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the server directory:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/travio
NODE_ENV=development
```

3. Make sure MongoDB is running on your system

4. Start the server:
```bash
# Development mode
npm run dev

# Production mode
npm start
```

## API Endpoints

### Users

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users` | Get all users |
| GET | `/api/users/:id` | Get user by ID |
| POST | `/api/users` | Create new user |
| PUT | `/api/users/:id` | Update user |
| DELETE | `/api/users/:id` | Delete user |

#### User Schema
```json
{
  "name": "string (required, max 50 chars)",
  "phone": "string (required, unique, 10 digits)",
  "address": "string (required, max 200 chars)"
}
```

### Rides

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/rides` | Get all rides |
| GET | `/api/rides/:id` | Get ride by ID |
| GET | `/api/rides/user/:user_name` | Get rides by user name |
| POST | `/api/rides` | Create new ride |
| PUT | `/api/rides/:id` | Update ride |
| DELETE | `/api/rides/:id` | Delete ride |

#### Ride Schema
```json
{
  "user_name": "string (required, max 50 chars)",
  "pickup_location": "string (optional, max 200 chars)",
  "destination": "string (optional, max 200 chars)",
  "status": "string (optional: pending, confirmed, in_progress, completed, cancelled)"
}
```

## Example API Calls

### Create a User
```bash
POST /api/users
Content-Type: application/json

{
  "name": "John Doe",
  "phone": "1234567890",
  "address": "123 Main St, City, State"
}
```

### Create a Ride
```bash
POST /api/rides
Content-Type: application/json

{
  "user_name": "John Doe",
  "pickup_location": "Airport Terminal 1",
  "destination": "Downtown Hotel",
  "status": "pending"
}
```

## Response Format

All API responses follow this format:

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... },
  "count": 10
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error message"
}
```

## Database Models

### User Model
- `name`: User's full name
- `phone`: Unique phone number (10 digits)
- `address`: User's address
- `createdAt`: Timestamp when user was created
- `updatedAt`: Timestamp when user was last updated

### Ride Model
- `user_name`: Name of the user requesting the ride
- `timestamp`: When the ride was created (auto-generated)
- `pickup_location`: Where to pick up the passenger
- `destination`: Where to drop off the passenger
- `status`: Current status of the ride
- `createdAt`: Timestamp when ride was created
- `updatedAt`: Timestamp when ride was last updated

## Development

The server runs on port 5000 by default. You can change this by setting the `PORT` environment variable.

For development, use `npm run dev` which will automatically restart the server when files change.
