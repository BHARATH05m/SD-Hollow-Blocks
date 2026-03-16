# MongoDB Setup for SD Bookings

## Database Configuration

- **Connection String**: `mongodb://localhost:27017/`
- **Database Name**: `sd bookings`
- **Collections**:
  1. `products` - Product inventory
  2. `orders` - Customer orders
  3. `userlogins` - User authentication

## Installation

1. Install MongoDB dependencies:
```bash
cd backend
npm install mongoose
```

2. Make sure MongoDB is running on your local machine:
```bash
# Windows (if installed as service, it should auto-start)
# Or start manually:
mongod
```

3. Start the backend server:
```bash
npm start
```

## Collections Structure

### Products Collection
- `name` (String, required) - Product name
- `amount` (Number, required) - Price per unit
- `units` (Number, required) - Available stock
- `image` (String) - Image path
- `dateAdded` (Date) - When product was added
- `createdAt`, `updatedAt` (auto-generated timestamps)

### Orders Collection
- `userId` (String, required) - User email/ID
- `status` (String) - pending, approved, rejected, completed
- `items` (Array) - Order items with product details
- `baseTotal` (Number) - Products total
- `total` (Number) - Total including delivery
- `distanceKm` (String) - Delivery distance
- `deliveryCharge` (Number) - Delivery fee
- `withDelivery` (Boolean) - Delivery option
- `deliveryTime` (String) - Scheduled delivery time
- `requestedAt`, `approvedAt` (Date)
- `createdAt`, `updatedAt` (auto-generated timestamps)

### UserLogins Collection
- `email` (String, required, unique) - User email
- `password` (String, required, hashed) - Hashed password
- `role` (String) - user or owner
- `registeredAt` (Date) - Registration date
- `lastLogin` (Date) - Last login timestamp
- `createdAt`, `updatedAt` (auto-generated timestamps)

## API Endpoints (to be implemented)

The models are ready. You can now create API endpoints to:
- CRUD operations for products
- Create and manage orders
- User registration and login
