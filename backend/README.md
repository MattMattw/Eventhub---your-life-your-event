# EventHub Backend API

Backend server for EventHub - Your Life, Your Event. A complete event management platform with real-time chat, user authentication, and admin capabilities.

## Features

- **User Management**: Registration, login, authentication with JWT, password reset
- **Event Management**: Create, read, update, delete events with advanced filtering
- **Registrations**: Register for events with capacity management and real-time updates
- **Real-time Chat**: WebSocket-based chat per event with message persistence
- **Admin Dashboard**: Manage users, events, and handle reports
- **Email Notifications**: Send confirmation and notification emails to organizers
- **Role-based Access**: User and Admin roles with appropriate permissions

## Prerequisites

- Node.js 14+ and npm
- MongoDB database
- SMTP server credentials for email (optional for development)

## Installation

1. **Clone the repository**
```bash
git clone https://github.com/MattMattw/Eventhub---your-life-your-event.git
cd backend
```

2. **Install dependencies**
```bash
npm install
```

3. **Create `.env` file** (copy from `.env.example`)
```bash
cp .env.example .env
```

4. **Configure environment variables**
```env
# Database
MONGODB_URI=mongodb://localhost:27017/eventhub

# JWT
JWT_SECRET=your_super_secret_jwt_key_change_this
JWT_EXPIRE=7d

# SMTP (for email)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM=noreply@eventhub.com

# CORS
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000

# Frontend URL (for password reset links)
FRONTEND_URL=http://localhost:5173

# Server
PORT=3000
NODE_ENV=development
```

5. **Start the server**
```bash
npm start
```

Server runs on `http://localhost:3000`

## API Documentation

### Quick Start

The API uses JWT for authentication. After login, include the token in the Authorization header:
```bash
Authorization: Bearer YOUR_JWT_TOKEN
```

### Authentication Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/users/register` | No | Register new user |
| POST | `/users/login` | No | Login and get JWT token |
| GET | `/users/profile` | Yes | Get user profile |
| PUT | `/users/profile` | Yes | Update user profile |
| POST | `/users/forgot-password` | No | Request password reset email |
| POST | `/users/reset-password` | No | Reset password with token |
| POST | `/users/logout` | Yes | Logout (client-side removal recommended) |

### Event Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/events` | No | Get all published events (with filters) |
| POST | `/events` | Yes | Create new event |
| GET | `/events/:id` | No | Get event details |
| PUT | `/events/:id` | Yes | Update event (owner only) |
| DELETE | `/events/:id` | Yes | Delete event (owner only) |
| GET | `/events/user` | Yes | Get user's created events |

### Registration Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/registrations` | Yes | Register for event |
| GET | `/registrations` | Yes | Get user's registrations |
| GET | `/registrations/event/:eventId` | Yes | Get event registrations (organizer only) |
| DELETE | `/registrations/:id` | Yes | Cancel registration |

### Admin Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/admin/users` | Yes (Admin) | Get all users |
| PUT | `/admin/users/:id/block` | Yes (Admin) | Block user |
| PUT | `/admin/events/:id/block` | Yes (Admin) | Block event |
| GET | `/admin/reports` | Yes (Admin) | Get all reports |
| POST | `/admin/reports` | Yes | Report event/user |

### Query Parameters

**Events Filtering:**
- `search`: Search in title and description
- `category`: Filter by category
- `minPrice`, `maxPrice`: Filter by price range
- `startDate`, `endDate`: Filter by date range
- `tags`: Filter by tags (comma-separated)
- `page`: Pagination page (default: 1)
- `limit`: Results per page (default: 10)
- `sort`: Sort field (default: date)

Example:
```bash
GET /events?category=tech&minPrice=0&maxPrice=100&page=1&limit=20
```

## WebSocket Events (Real-time Chat)

### Connection
```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000', {
  auth: { token: JWT_TOKEN }
});
```

### Events

**Join Event Chat:**
```javascript
socket.emit('joinEventChat', { eventId: '123' });
```

**Send Message:**
```javascript
socket.emit('sendMessage', { 
  eventId: '123',
  message: 'Hello!' 
});
```

**Receive Messages:**
```javascript
socket.on('message', (message) => {
  console.log(`${message.username}: ${message.text}`);
});
```

**Get Message History:**
```javascript
socket.on('messageHistory', (messages) => {
  // Array of last 50 messages
});
```

**Registration Notification:**
```javascript
socket.on('registration', (data) => {
  console.log(`User registered with ${data.ticketQuantity} tickets`);
});
```

## Error Handling

All endpoints return standard HTTP status codes:

- `200`: Success
- `201`: Created
- `400`: Bad Request / Validation Error
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Server Error

Error responses include a message:
```json
{
  "message": "Error description"
}
```

## Email Templates

### Password Reset
Sent when user requests password reset. Includes a link to reset their password (valid for 1 hour).

### Registration Confirmation
Sent to event organizer when a user registers for their event.

## Database Models

### User
- `username` (unique)
- `email` (unique)
- `password` (hashed with bcrypt)
- `firstName`, `lastName`
- `role` (user/admin)
- `isBlocked` (boolean)
- `passwordResetToken`, `passwordResetExpires`

### Event
- `title`, `description`
- `date`, `location`
- `category`, `tags`
- `organizer` (User ref)
- `capacity`, `availableSpots`
- `price`
- `image`
- `status` (draft/published/cancelled/blocked)

### Registration
- `event` (Event ref)
- `user` (User ref)
- `ticketQuantity`
- `totalPrice`
- `status` (pending/confirmed/cancelled)
- `paymentStatus` (pending/completed/failed)

### Message
- `event` (Event ref)
- `user` (User ref)
- `username`
- `text`
- `createdAt` (with TTL: 30 days auto-delete)

## Security

- Passwords hashed with bcrypt (salt rounds: 10)
- JWT tokens with expiration
- CORS protection
- Role-based access control
- Input validation with express-validator
- WebSocket authentication via JWT

## Performance

- Message history limited to last 50 per event
- Automatic message deletion after 30 days
- Indexed fields for fast queries: `event`, `user`, `email`, `username`
- Pagination support for all list endpoints

## Troubleshooting

**MongoDB Connection Error**
- Check MONGODB_URI in .env
- Ensure MongoDB is running

**SMTP Email Not Sending**
- Verify SMTP credentials in .env
- Use app passwords for Gmail, not your actual password

**WebSocket Connection Failed**
- Ensure JWT token is valid
- Check ALLOWED_ORIGINS includes frontend URL
- Browser console for detailed error

**Port Already in Use**
- Change PORT in .env
- Or: `lsof -i :3000` (MacOS/Linux) to find process

## Development

```bash
# Install dependencies
npm install

# Start with nodemon (auto-reload)
npm run dev

# Run tests (if available)
npm test

# Lint code
npm run lint
```

## Deployment

### Render.com
1. Create new service
2. Connect GitHub repository
3. Set environment variables in dashboard
4. Deploy

### Heroku
```bash
heroku create your-app-name
heroku config:set MONGODB_URI=your_mongodb_uri
git push heroku main
```

### Railway
1. Connect GitHub repo
2. Add MongoDB plugin
3. Set environment variables
4. Deploy

## API Documentation (Swagger)

Full OpenAPI documentation available at `/docs/swagger.json`. View in [Swagger UI](https://editor.swagger.io/) by copying the file contents.

## Contributing

1. Fork repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## License

This project is licensed under the MIT License - see LICENSE file for details.

## Support

For issues and questions:
- GitHub Issues: [EventHub Issues](https://github.com/MattMattw/Eventhub---your-life-your-event/issues)
- Documentation: Check `/docs` folder

## Changelog

### v1.0.0 (Initial Release)
- User authentication and profile management
- Event CRUD operations with advanced filtering
- Event registration system with capacity management
- Real-time chat with message persistence
- Admin dashboard
- Email notifications
- Role-based access control
- Password reset functionality
