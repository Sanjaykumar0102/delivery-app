# API Reference - Logistics & Fleet Management System

## Base URL
```
http://localhost:5000/api
```

## Authentication
All protected routes require JWT token in either:
- **Cookie:** `token=YOUR_JWT_TOKEN`
- **Header:** `Authorization: Bearer YOUR_JWT_TOKEN`

---

## 🔐 Authentication Endpoints

### Register User
```http
POST /users/register
```

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "Customer",  // Customer | Driver | Admin
  "adminCode": "secret123"  // Required only for Admin role
}
```

**Response (201):**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "name": "John Doe",
  "email": "john@example.com",
  "role": "Customer",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

### Login User
```http
POST /users/login
```

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "name": "John Doe",
  "email": "john@example.com",
  "role": "Customer",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

### Get User Profile
```http
GET /users/profile
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "name": "John Doe",
  "email": "john@example.com",
  "role": "Customer",
  "createdAt": "2024-01-15T10:00:00.000Z"
}
```

---

## 📦 Order Endpoints

### Create Order (Customer Only)
```http
POST /orders
Authorization: Bearer {token}
Role: Customer
```

**Request Body:**
```json
{
  "pickup": {
    "address": "123 Main St, New York, NY",
    "lat": 40.7128,  // Optional
    "lng": -74.0060  // Optional
  },
  "dropoff": {
    "address": "456 Park Ave, Brooklyn, NY",
    "lat": 40.6782,  // Optional
    "lng": -73.9442  // Optional
  },
  "items": [
    {
      "name": "Laptop",
      "quantity": 1
    },
    {
      "name": "Mouse",
      "quantity": 2
    }
  ]
}
```

**Response (201):**
```json
{
  "_id": "507f1f77bcf86cd799439012",
  "customer": "507f1f77bcf86cd799439011",
  "pickup": {
    "address": "123 Main St, New York, NY",
    "lat": 40.7128,
    "lng": -74.0060
  },
  "dropoff": {
    "address": "456 Park Ave, Brooklyn, NY",
    "lat": 40.6782,
    "lng": -73.9442
  },
  "items": [
    {"name": "Laptop", "quantity": 1},
    {"name": "Mouse", "quantity": 2}
  ],
  "status": "Pending",
  "distance": 10,
  "fare": 150,
  "paymentMethod": "Cash",
  "isPaid": false,
  "createdAt": "2024-01-15T10:00:00.000Z",
  "updatedAt": "2024-01-15T10:00:00.000Z"
}
```

---

### Get Orders (All Roles)
```http
GET /orders
Authorization: Bearer {token}
```

**Behavior:**
- **Customer:** Returns only their orders
- **Driver:** Returns only assigned orders
- **Admin:** Returns all orders

**Response (200):**
```json
[
  {
    "_id": "507f1f77bcf86cd799439012",
    "customer": {
      "_id": "507f1f77bcf86cd799439011",
      "name": "John Doe",
      "email": "john@example.com"
    },
    "driver": {
      "_id": "507f1f77bcf86cd799439013",
      "name": "Mike Driver",
      "email": "mike@driver.com"
    },
    "vehicle": {
      "_id": "507f1f77bcf86cd799439014",
      "plateNumber": "ABC-1234",
      "type": "Van",
      "capacity": 1000
    },
    "pickup": {
      "address": "123 Main St, New York, NY"
    },
    "dropoff": {
      "address": "456 Park Ave, Brooklyn, NY"
    },
    "items": [
      {"name": "Laptop", "quantity": 1}
    ],
    "status": "Assigned",
    "distance": 10,
    "fare": 150,
    "paymentMethod": "Cash",
    "isPaid": false,
    "createdAt": "2024-01-15T10:00:00.000Z"
  }
]
```

---

### Assign Order (Admin Only)
```http
PUT /orders/:id/assign
Authorization: Bearer {token}
Role: Admin
```

**Request Body:**
```json
{
  "driverId": "507f1f77bcf86cd799439013",
  "vehicleId": "507f1f77bcf86cd799439014"
}
```

**Response (200):**
```json
{
  "_id": "507f1f77bcf86cd799439012",
  "driver": "507f1f77bcf86cd799439013",
  "vehicle": "507f1f77bcf86cd799439014",
  "status": "Assigned",
  ...
}
```

**Error (409) - Conflict:**
```json
{
  "message": "Driver is currently busy with another delivery"
}
```

---

### Update Order Status (Driver Only)
```http
PUT /orders/:id/status
Authorization: Bearer {token}
Role: Driver
```

**Request Body:**
```json
{
  "status": "In-Progress"  // In-Progress | Delivered | Cancelled
}
```

**Response (200):**
```json
{
  "_id": "507f1f77bcf86cd799439012",
  "status": "In-Progress",
  "pickupTime": "2024-01-15T10:30:00.000Z",
  ...
}
```

**Note:** 
- When status changes to "In-Progress", `pickupTime` is automatically set
- When status changes to "Delivered", `deliveredAt` is automatically set

---

### Track Order (Customer/Driver/Admin)
```http
GET /orders/:id/track
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "orderId": "507f1f77bcf86cd799439012",
  "status": "In-Progress",
  "pickup": {
    "address": "123 Main St, New York, NY",
    "lat": 40.7128,
    "lng": -74.0060
  },
  "dropoff": {
    "address": "456 Park Ave, Brooklyn, NY",
    "lat": 40.6782,
    "lng": -73.9442
  },
  "driver": {
    "_id": "507f1f77bcf86cd799439013",
    "name": "Mike Driver",
    "email": "mike@driver.com"
  },
  "vehicle": {
    "_id": "507f1f77bcf86cd799439014",
    "plateNumber": "ABC-1234",
    "type": "Van"
  },
  "tracking": {
    "lat": 40.7000,
    "lng": -74.0100,
    "lastUpdated": "2024-01-15T10:35:00.000Z"
  },
  "estimatedTime": "In transit"
}
```

---

### Pay for Order (Customer/Admin)
```http
PUT /orders/:id/pay
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "message": "✅ Payment successful",
  "order": {
    "_id": "507f1f77bcf86cd799439012",
    "isPaid": true,
    "paidAt": "2024-01-15T10:40:00.000Z",
    ...
  }
}
```

---

### Confirm Cash Payment (Driver Only)
```http
PUT /orders/:id/confirm-cash
Authorization: Bearer {token}
Role: Driver
```

**Requirements:**
- Order must be delivered
- Payment method must be "Cash"
- Only assigned driver can confirm

**Response (200):**
```json
{
  "message": "💰 Cash payment confirmed",
  "order": {
    "_id": "507f1f77bcf86cd799439012",
    "isPaid": true,
    "paidAt": "2024-01-15T11:00:00.000Z",
    ...
  }
}
```

---

## 🚗 Vehicle Endpoints

### Add Vehicle (Admin Only)
```http
POST /vehicles
Authorization: Bearer {token}
Role: Admin
```

**Request Body:**
```json
{
  "plateNumber": "ABC-1234",
  "type": "Van",  // Van | Truck | Bike | Car
  "capacity": 1000
}
```

**Response (201):**
```json
{
  "_id": "507f1f77bcf86cd799439014",
  "plateNumber": "ABC-1234",
  "type": "Van",
  "capacity": 1000,
  "status": "Available",
  "createdAt": "2024-01-15T10:00:00.000Z"
}
```

---

### Get All Vehicles (Admin/Driver)
```http
GET /vehicles
Authorization: Bearer {token}
```

**Response (200):**
```json
[
  {
    "_id": "507f1f77bcf86cd799439014",
    "plateNumber": "ABC-1234",
    "type": "Van",
    "capacity": 1000,
    "status": "Available",
    "createdAt": "2024-01-15T10:00:00.000Z"
  }
]
```

---

### Update Vehicle (Admin Only)
```http
PUT /vehicles/:id
Authorization: Bearer {token}
Role: Admin
```

**Request Body:**
```json
{
  "status": "Maintenance"  // Available | In-Use | Maintenance
}
```

**Response (200):**
```json
{
  "_id": "507f1f77bcf86cd799439014",
  "plateNumber": "ABC-1234",
  "type": "Van",
  "capacity": 1000,
  "status": "Maintenance",
  "updatedAt": "2024-01-15T11:00:00.000Z"
}
```

---

### Delete Vehicle (Admin Only)
```http
DELETE /vehicles/:id
Authorization: Bearer {token}
Role: Admin
```

**Response (200):**
```json
{
  "message": "Vehicle removed successfully"
}
```

---

## 📊 Report Endpoints

### Driver Performance Report (Admin Only)
```http
GET /reports/driver-performance
Authorization: Bearer {token}
Role: Admin
```

**Response (200):**
```json
[
  {
    "_id": "507f1f77bcf86cd799439013",
    "driverName": "Mike Driver",
    "totalDeliveries": 10,
    "avgDeliveryTime": 45.5
  }
]
```

**Calculation:**
- `avgDeliveryTime` = Average minutes between `pickupTime` and `deliveredAt`
- Only includes completed deliveries

---

### Vehicle Utilization Report (Admin Only)
```http
GET /reports/vehicle-utilization
Authorization: Bearer {token}
Role: Admin
```

**Response (200):**
```json
[
  {
    "_id": "507f1f77bcf86cd799439014",
    "plateNumber": "ABC-1234",
    "type": "Van",
    "totalDeliveries": 15,
    "completedDeliveries": 12,
    "utilizationRate": 80
  }
]
```

**Calculation:**
- `utilizationRate` = (completedDeliveries / totalDeliveries) * 100

---

## 🔌 WebSocket Events (Socket.io)

### Connection
```javascript
const socket = io('http://localhost:5000');

socket.on('connect', () => {
  console.log('Connected:', socket.id);
});
```

---

### Update Location (Driver → Server)
```javascript
socket.emit('updateLocation', {
  driverId: '507f1f77bcf86cd799439013',
  orderId: '507f1f77bcf86cd799439012',
  lat: 40.7128,
  lng: -74.0060
});
```

**Server Action:**
- Updates order's tracking field in database
- Broadcasts to all connected clients

---

### Receive Location Update (Server → All Clients)
```javascript
socket.on('locationUpdate', (data) => {
  console.log('Location update:', data);
  // data = { driverId, orderId, lat, lng }
});
```

---

### Disconnect
```javascript
socket.on('disconnect', () => {
  console.log('Disconnected');
});
```

---

## 🚨 Error Responses

### 400 Bad Request
```json
{
  "message": "Pickup address is required"
}
```

### 401 Unauthorized
```json
{
  "message": "Not authorized, no token"
}
```

### 403 Forbidden
```json
{
  "message": "Not authorized to update this order"
}
```

### 404 Not Found
```json
{
  "message": "Order not found"
}
```

### 409 Conflict
```json
{
  "message": "Driver is currently busy with another delivery"
}
```

### 500 Server Error
```json
{
  "message": "Server error"
}
```

---

## 📝 Status Codes Summary

| Code | Meaning | Usage |
|------|---------|-------|
| 200 | OK | Successful GET, PUT, DELETE |
| 201 | Created | Successful POST |
| 400 | Bad Request | Invalid input data |
| 401 | Unauthorized | Missing or invalid token |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Scheduling conflict |
| 500 | Server Error | Internal server error |

---

## 🔑 Role Permissions

| Endpoint | Customer | Driver | Admin |
|----------|----------|--------|-------|
| POST /orders | ✅ | ❌ | ❌ |
| GET /orders | ✅ (own) | ✅ (assigned) | ✅ (all) |
| PUT /orders/:id/assign | ❌ | ❌ | ✅ |
| PUT /orders/:id/status | ❌ | ✅ | ❌ |
| GET /orders/:id/track | ✅ (own) | ✅ (assigned) | ✅ (all) |
| PUT /orders/:id/pay | ✅ (own) | ❌ | ✅ |
| PUT /orders/:id/confirm-cash | ❌ | ✅ | ❌ |
| POST /vehicles | ❌ | ❌ | ✅ |
| GET /vehicles | ❌ | ✅ | ✅ |
| PUT /vehicles/:id | ❌ | ❌ | ✅ |
| DELETE /vehicles/:id | ❌ | ❌ | ✅ |
| GET /reports/* | ❌ | ❌ | ✅ |

---

## 🧪 Testing with cURL

### Example: Create Order
```bash
curl -X POST http://localhost:5000/api/orders \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "pickup": {
      "address": "123 Main St, New York, NY"
    },
    "dropoff": {
      "address": "456 Park Ave, Brooklyn, NY"
    },
    "items": [
      {"name": "Laptop", "quantity": 1}
    ]
  }'
```

### Example: Get Orders
```bash
curl -X GET http://localhost:5000/api/orders \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Example: Assign Order
```bash
curl -X PUT http://localhost:5000/api/orders/ORDER_ID/assign \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "driverId": "DRIVER_ID",
    "vehicleId": "VEHICLE_ID"
  }'
```

---

## 📚 Additional Resources

- **Postman Collection:** Import API endpoints for easy testing
- **Swagger Documentation:** (To be added)
- **GraphQL API:** (Future enhancement)

---

## 🔄 API Versioning

Current Version: **v1**

All endpoints are prefixed with `/api`

Future versions will use: `/api/v2`, `/api/v3`, etc.

---

## 🛡️ Security Best Practices

1. **Always use HTTPS in production**
2. **Never expose JWT_SECRET**
3. **Implement rate limiting**
4. **Validate all input data**
5. **Use secure cookies in production**
6. **Implement CORS properly**
7. **Log all authentication attempts**
8. **Rotate JWT tokens regularly**

---

## 📞 Support

For API issues or questions:
- Check error messages in response
- Review backend console logs
- Verify token is valid
- Ensure correct role permissions

**Happy Coding! 🚀**