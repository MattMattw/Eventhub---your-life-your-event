# EventHub API Documentation

## Base URL
```
http://localhost:3000/api
```

## Authentication
Most endpoints require authentication via JWT token. Include the token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

## Endpoints

### Users
#### Register User
- **POST** `/users/register`
- Body:
  ```json
  {
    "username": "string",
    "email": "string",
    "password": "string",
    "firstName": "string",
    "lastName": "string"
  }
  ```

#### Login User
- **POST** `/users/login`
- Body:
  ```json
  {
    "email": "string",
    "password": "string"
  }
  ```

#### Get User Profile
- **GET** `/users/profile`
- *Requires Authentication*

#### Update User Profile
- **PUT** `/users/profile`
- *Requires Authentication*
- Body:
  ```json
  {
    "firstName": "string",
    "lastName": "string",
    "email": "string"
  }
  ```

### Events
#### Create Event
- **POST** `/events`
- *Requires Authentication*
- Body:
  ```json
  {
    "title": "string",
    "description": "string",
    "date": "date",
    "location": "string",
    "category": "string",
    "capacity": "number",
    "price": "number",
    "image": "string"
  }
  ```

#### Get All Events
- **GET** `/events`
- Query Parameters:
  - category (optional)
  - date (optional)
  - search (optional)

#### Get Single Event
- **GET** `/events/:id`

#### Update Event
- **PUT** `/events/:id`
- *Requires Authentication (Event Organizer Only)*

#### Delete Event
- **DELETE** `/events/:id`
- *Requires Authentication (Event Organizer Only)*

### Registrations
#### Create Registration
- **POST** `/registrations`
- *Requires Authentication*
- Body:
  ```json
  {
    "eventId": "string",
    "ticketQuantity": "number"
  }
  ```

#### Get User Registrations
- **GET** `/registrations/my-registrations`
- *Requires Authentication*

#### Get Event Registrations
- **GET** `/registrations/event/:eventId`
- *Requires Authentication (Event Organizer Only)*

#### Update Registration
- **PUT** `/registrations/:id`
- *Requires Authentication*

#### Cancel Registration
- **PATCH** `/registrations/:id/cancel`
- *Requires Authentication*

## Real-time Chat
WebSocket connection is available for real-time chat features:

### Connection
```javascript
const socket = io('http://localhost:3000', {
  auth: {
    token: 'your_jwt_token'
  }
});
```

### Events
- `joinEventChat`: Join event-specific chat room
- `leaveEventChat`: Leave event-specific chat room
- `sendMessage`: Send a message in the event chat
- `message`: Receive messages from the event chat