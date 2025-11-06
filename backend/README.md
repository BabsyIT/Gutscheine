# Babsy Voucher System - Backend API

Express.js REST API with PostgreSQL (Supabase) and Prisma ORM.

## 🚀 Quick Start

### Prerequisites

- Node.js >= 18
- npm or yarn
- Supabase account (free tier works)

### Local Development

```bash
# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env and add your DATABASE_URL

# Initialize database
npx prisma db push
npx prisma generate

# Migrate existing data (optional)
node scripts/migrate-json-to-db.js

# Start development server
npm run dev
```

Server runs on: http://localhost:3000

### Docker

```bash
# From project root
docker-compose up -d backend
```

## 📁 Project Structure

```
backend/
├── src/
│   ├── config/          # Database and app configuration
│   ├── controllers/     # Request handlers (future)
│   ├── services/        # Business logic
│   │   ├── authService.js
│   │   └── voucherService.js
│   ├── routes/          # API endpoints
│   │   ├── auth.js      # Authentication
│   │   ├── vouchers.js  # Voucher management
│   │   └── partners.js  # Partner management
│   ├── middleware/      # Express middleware
│   │   ├── auth.js
│   │   ├── errorHandler.js
│   │   └── requestLogger.js
│   ├── utils/           # Utilities
│   │   └── logger.js
│   ├── app.js          # Express app setup
│   └── server.js       # HTTP server
├── prisma/
│   └── schema.prisma   # Database schema
├── scripts/
│   └── migrate-json-to-db.js  # Data migration
├── logs/               # Application logs
├── package.json
├── Dockerfile
└── .env.example
```

## 🔌 API Endpoints

### Authentication

```
POST   /api/auth/register  - Register new user
POST   /api/auth/login     - Login user
POST   /api/auth/refresh   - Refresh access token
POST   /api/auth/logout    - Logout user
GET    /api/auth/me        - Get current user profile
```

### Vouchers

```
GET    /api/vouchers           - Get user's vouchers
POST   /api/vouchers           - Generate new voucher
GET    /api/vouchers/:id       - Get voucher details
POST   /api/vouchers/:id/redeem - Redeem voucher
POST   /api/vouchers/validate  - Validate QR code
GET    /api/vouchers/stats/overview - Get statistics
```

### Partners

```
GET    /api/partners        - Get all partners (public)
GET    /api/partners/:id    - Get partner details
PUT    /api/partners/:id    - Update partner (admin)
GET    /api/partners/:id/stats - Get partner stats (admin)
```

## 🔐 Authentication

Uses JWT Bearer tokens:

```bash
# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "demo", "password": "demo123"}'

# Response
{
  "user": { ... },
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc..."
}

# Use token in requests
curl http://localhost:3000/api/vouchers \
  -H "Authorization: Bearer eyJhbGc..."
```

## 🗄️ Database Schema

### Users
- id, username, email, passwordHash
- userType: 'member' | 'partner' | 'employee'
- Relations: vouchers, sessions, partner

### Partners
- id, userId, partnername, category
- lat, lng (GPS coordinates)
- Relations: user, vouchers

### Vouchers
- id, code, partnerId, userId
- isRedeemed, redeemedAt, redeemedById
- Relations: partner, user, redeemedBy

### Sessions
- id, userId, tokenHash, expiresAt
- For JWT refresh tokens

### AuditLog
- Tracks all important actions
- entityType, entityId, action, changes

## 🛠️ Available Scripts

```bash
# Development
npm run dev              # Start with nodemon
npm start                # Production start

# Database
npm run prisma:generate  # Generate Prisma client
npm run prisma:migrate   # Run migrations (dev)
npm run prisma:push      # Push schema to DB
npm run prisma:studio    # Open Prisma Studio

# Testing
npm test                 # Run tests

# Linting
npm run lint             # Run ESLint
```

## 🔧 Environment Variables

```bash
# Database
DATABASE_URL="postgresql://..."

# JWT
JWT_SECRET="minimum-32-characters"
JWT_REFRESH_SECRET="minimum-32-characters"

# Server
PORT=3000
NODE_ENV="development"
ALLOWED_ORIGINS="http://localhost:8080"

# Security
BCRYPT_ROUNDS=12
SESSION_DURATION_DAYS=7
ACCESS_TOKEN_DURATION="15m"

# Logging
LOG_LEVEL="info"
```

## 📊 Logging

Logs are written to:
- `logs/error.log` - Errors only
- `logs/combined.log` - All logs
- Console (development only)

## 🧪 Testing

```bash
# Run tests
npm test

# With coverage
npm test -- --coverage
```

Example test:

```javascript
const request = require('supertest');
const app = require('../src/app');

describe('Auth API', () => {
  test('POST /api/auth/login', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ username: 'demo', password: 'demo123' });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('accessToken');
  });
});
```

## 🐳 Docker

### Build

```bash
docker build -t babsy-backend .
```

### Run

```bash
docker run -d \
  --name babsy-backend \
  -p 3000:3000 \
  -e DATABASE_URL="postgresql://..." \
  -e JWT_SECRET="..." \
  babsy-backend
```

### Docker Compose

See `docker-compose.yml` in project root.

## 📝 Migration from JSON

The system can migrate existing JSON data:

```bash
node scripts/migrate-json-to-db.js
```

Migrates:
- `data/partners.json` → partners table
- `data/mitglieder-auth.json` → users table (members)
- `data/users.json` → users table (employees)
- `data/vouchers.json` → vouchers table

## 🔒 Security

- ✅ Password hashing with bcrypt (12 rounds)
- ✅ JWT authentication with short-lived tokens
- ✅ Rate limiting on auth endpoints
- ✅ CORS configuration
- ✅ Helmet security headers
- ✅ Request validation
- ✅ SQL injection prevention (Prisma ORM)
- ✅ Audit logging

## 📈 Monitoring

### Health Check

```bash
curl http://localhost:3000/health
```

Response:
```json
{
  "status": "ok",
  "timestamp": "2025-01-15T10:30:00.000Z",
  "uptime": 123.45,
  "environment": "development"
}
```

### Logs

```bash
# Tail error log
tail -f logs/error.log

# Tail all logs
tail -f logs/combined.log
```

## 🚨 Troubleshooting

### Database Connection Error

```bash
# Check DATABASE_URL
echo $DATABASE_URL

# Test connection
npx prisma db pull

# Regenerate client
npx prisma generate
```

### Port Already in Use

```bash
# Change PORT in .env
PORT=3001

# Or kill process
lsof -ti:3000 | xargs kill -9
```

### Migration Errors

```bash
# Reset database (WARNING: Deletes all data)
npx prisma db push --force-reset

# Re-run migrations
node scripts/migrate-json-to-db.js
```

## 📚 Documentation

- [Prisma Docs](https://www.prisma.io/docs)
- [Express Docs](https://expressjs.com/)
- [JWT Docs](https://jwt.io/)
- [Supabase Docs](https://supabase.com/docs)

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing`)
5. Open Pull Request

## 📄 License

© 2025 Babsy. All rights reserved.
