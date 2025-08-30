# User Service

A robust TypeScript-based user authentication and profile management microservice built with Express.js, Prisma, and PostgreSQL. This service handles user registration, authentication, profile management, and provides a complete JWT-based authentication system.

## 🚀 Features

- **User Authentication**: Registration, login, logout with JWT tokens
- **Profile Management**: User profile CRUD operations
- **Security**: Password hashing with bcrypt, JWT token management
- **Database**: PostgreSQL with Prisma ORM
- **Validation**: Comprehensive input validation with express-validator
- **Rate Limiting**: Configurable request throttling
- **Health Checks**: Built-in health monitoring endpoints
- **Logging**: Structured logging with file and console output
- **Error Handling**: Centralized error handling with custom error types
- **Docker Ready**: Multi-stage Docker builds with non-root user
- **TypeScript**: Full type safety with strict TypeScript configuration

## 📋 API Endpoints

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - User login
- `POST /auth/refresh` - Refresh JWT token
- `POST /auth/logout` - User logout

### User Management
- `GET /users/:id` - Get user profile
- `PUT /users/:id` - Update user profile (authenticated)
- `GET /users/:id/stats` - Get user statistics
- `GET /users/search` - Search users

### Health & Monitoring
- `GET /health` - Basic health check
- `GET /health/detailed` - Detailed health information
- `GET /health/live` - Liveness probe (Kubernetes)
- `GET /health/ready` - Readiness probe (Kubernetes)

## 🛠️ Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 12+
- Docker & Docker Compose (optional)
- npm or yarn

### 1. Installation
```bash
# Clone the repository
git clone <your-repo>
cd user-service

# Install dependencies
npm install

# Copy environment file
cp .env.example .env
```

### 2. Database Setup
```bash
# Update DATABASE_URL in .env file
DATABASE_URL="postgresql://username:password@localhost:5432/user_service_db"

# Generate Prisma client
npm run db:generate

# Run database migrations
npm run db:migrate

# Seed the database (optional)
npm run db:seed
```

### 3. Development
```bash
# Start development server
npm run dev

# Or build and start
npm run build
npm start
```

### 4. Docker Deployment
```bash
# Start with Docker Compose (includes PostgreSQL)
docker-compose up --build

# Start with admin tools
docker-compose --profile tools up

# View logs
docker-compose logs -f user-service
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `development` |
| `PORT` | Server port | `3002` |
| `DATABASE_URL` | PostgreSQL connection string | Required |
| `JWT_SECRET` | JWT signing secret | Required |
| `JWT_EXPIRES_IN` | JWT expiration time | `1h` |
| `REFRESH_TOKEN_EXPIRES_IN` | Refresh token expiration | `7d` |
| `ALLOWED_ORIGINS` | CORS allowed origins | `http://localhost:3000` |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window | `900000` (15 min) |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests per window | `100` |
| `LOG_LEVEL` | Logging level | `info` |
| `LOG_FILE` | Log file name | Optional |

### Database Schema

```sql
-- Users table
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  display_name TEXT,
  bio TEXT,
  avatar TEXT,
  is_active BOOLEAN DEFAULT true,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_login_at TIMESTAMP,
  login_count INTEGER DEFAULT 0
);

-- Refresh tokens table
CREATE TABLE refresh_tokens (
  id TEXT PRIMARY KEY,
  token TEXT UNIQUE NOT NULL,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  is_revoked BOOLEAN DEFAULT false
);

-- User sessions table  
CREATE TABLE user_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  session_id TEXT UNIQUE NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## 🔐 Security Features

### Password Security
- bcrypt hashing with 12 salt rounds
- Password strength validation (minimum 8 chars, uppercase, lowercase, number)
- Password change functionality with old password verification

### JWT Security
- Secure JWT token generation with configurable expiration
- Refresh token system with automatic rotation
- Token revocation on logout
- Token verification middleware

### Rate Limiting
- Configurable rate limiting per IP address
- Protection against brute force attacks
- Graceful error responses

### Input Validation
- Comprehensive request validation using express-validator
- SQL injection prevention via Prisma
- XSS protection with security headers

## 📊 API Usage Examples

### User Registration
```bash
curl -X POST http://localhost:3002/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "johndoe",
    "email": "john@example.com",
    "password": "SecurePassword123"
  }'
```

### User Login
```bash
curl -X POST http://localhost:3002/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "SecurePassword123"
  }'
```

### Update Profile
```bash
curl -X PUT http://localhost:3002/users/user_id_here \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "displayName": "John Doe",
    "bio": "Software developer"
  }'
```

### Search Users
```bash
curl "http://localhost:3002/users/search?q=john&limit=10&offset=0"
```

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate test coverage
npm run test:coverage
```

## 📈 Monitoring

### Health Checks
- Basic health check: `GET /health`
- Detailed health check: `GET /health/detailed`
- Kubernetes probes: `GET /health/live` and `GET /health/ready`

### Logging
- Structured JSON logging
- Configurable log levels (ERROR, WARN, INFO, DEBUG)
- File and console output
- Request/response logging

### Metrics
The service exposes basic metrics in health endpoints:
- Database connection status and response time
- Memory usage
- User count statistics
- Uptime information

## 🐳 Docker Deployment

### Production Deployment
```yaml
# docker-compose.prod.yml
version: '3.8'
services:
  user-service:
    image: user-service:latest
    ports:
      - "3002:3002"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - JWT_SECRET=${JWT_SECRET}
    deploy:
      replicas: 3
      update_config:
        parallelism: 1
        delay: 10s
      restart_policy:
        condition: on-failure
```

### Kubernetes Deployment
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: user-service
spec:
  replicas: 3
  selector:
    matchLabels:
      app: user-service
  template:
    metadata:
      labels:
        app: user-service
    spec:
      containers:
      - name: user-service
        image: user-service:latest
        ports:
        - containerPort: 3002
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: user-service-secrets
              key: database-url
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: user-service-secrets
              key: jwt-secret
        livenessProbe:
          httpGet:
            path: /health/live
            port: 3002
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health/ready
            port: 3002
          initialDelaySeconds: 5
          periodSeconds: 5
```

## 🏗️ Architecture

### Service Structure
```
src/
├── config/
│   └── database.ts          # Database configuration
├── controllers/
│   ├── auth.controller.ts   # Authentication endpoints
│   └── user.controller.ts   # User management endpoints
├── middleware/
│   ├── auth.middleware.ts   # JWT authentication
│   ├── error.middleware.ts  # Error handling
│   └── logger.middleware.ts # Request logging
├── routes/
│   ├── auth.routes.ts       # Authentication routes
│   ├── user.routes.ts       # User routes
│   └── health.routes.ts     # Health check routes
├── services/
│   ├── auth.service.ts      # Authentication business logic
│   └── user.service.ts      # User management business logic
├── types/
│   ├── auth.types.ts        # Authentication type definitions
│   ├── user.types.ts        # User type definitions
│   └── api.types.ts         # API response types
├── utils/
│   ├── errors.ts            # Custom error classes
│   └── logger.ts            # Logging utility
└── server.ts                # Main server file
```

### Database Design
The service uses a normalized database design with proper relationships:

- **Users**: Core user information and authentication data
- **RefreshTokens**: Secure refresh token management
- **UserSessions**: Session tracking for security monitoring

## 🔄 Integration with API Gateway

This service is designed to work seamlessly with the API Gateway:

### Gateway Configuration
```javascript
// API Gateway service URL configuration
USER_SERVICE_URL=http://user-service:3002
```

### Authentication Flow
1. Client sends credentials to API Gateway (`/auth/login`)
2. Gateway forwards to User Service (`/auth/login`)
3. User Service validates credentials and returns JWT
4. Gateway returns JWT to client
5. Client includes JWT in subsequent requests
6. Gateway validates JWT with User Service

### Profile Management
1. Client sends profile update to Gateway (`/users/:id`)
2. Gateway validates JWT and forwards to User Service
3. User Service updates profile and returns response
4. Gateway forwards response to client

## 🚨 Error Handling

### Error Types
```typescript
// Custom error classes with specific HTTP status codes
- AppError (500) - Generic application error
- ValidationError (400) - Input validation failed
- AuthenticationError (401) - Authentication failed
- AuthorizationError (403) - Access denied
- NotFoundError (404) - Resource not found
- ConflictError (409) - Resource already exists
- RateLimitError (429) - Rate limit exceeded
- DatabaseError (500) - Database operation failed
```

### Error Response Format
```json
{
  "success": false,
  "message": "Error description",
  "errors": ["Detailed validation errors"],
  "timestamp": "2025-08-30T12:00:00.000Z"
}
```

## 📊 Performance Considerations

### Database Optimization
- Indexed columns for fast lookups (email, username, id)
- Connection pooling via Prisma
- Prepared statements for security and performance
- Proper foreign key constraints

### Memory Management
- Streaming for large data sets
- Garbage collection monitoring
- Memory leak prevention

### Caching Strategy
- JWT token caching (in memory)
- Database query result caching (future enhancement)
- Static asset caching via headers

## 🔒 Security Best Practices

### Production Security Checklist
- [ ] Use strong JWT secrets (minimum 256-bit)
- [ ] Enable HTTPS in production
- [ ] Configure proper CORS origins
- [ ] Set up rate limiting
- [ ] Use environment variables for secrets
- [ ] Enable request logging
- [ ] Set up monitoring and alerting
- [ ] Regular security updates
- [ ] Database connection encryption
- [ ] Input sanitization and validation

### Security Headers
```javascript
// Helmet.js security headers
- Content Security Policy
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- X-XSS-Protection: 1; mode=block
- Strict-Transport-Security (HTTPS)
```

## 🧪 Development

### Scripts
```bash
npm run dev          # Development server with hot reload
npm run build        # Build TypeScript to JavaScript
npm start           # Start production server
npm run db:generate # Generate Prisma client
npm run db:push     # Push schema changes to DB
npm run db:migrate  # Run database migrations
npm run db:studio   # Open Prisma Studio
npm run db:seed     # Seed database with test data
npm test            # Run tests
npm run lint        # Run ESLint
npm run lint:fix    # Fix ESLint issues
```

### Database Commands
```bash
# Reset database
npx prisma migrate reset

# View database
npx prisma studio

# Generate migration
npx prisma migrate dev --name your_migration_name

# Deploy to production
npx prisma migrate deploy
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass (`npm test`)
6. Commit your changes (`git commit -m 'Add amazing feature'`)
7. Push to the branch (`git push origin feature/amazing-feature`)
8. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Troubleshooting

### Common Issues

**Database Connection Failed**
```bash
# Check if PostgreSQL is running
docker-compose ps postgres

# Check database URL format
DATABASE_URL="postgresql://user:password@host:port/database?schema=public"
```

**JWT Token Invalid**
```bash
# Ensure JWT_SECRET is set and consistent
# Check token expiration settings
JWT_EXPIRES_IN=1h
```

**Rate Limiting Too Aggressive**
```bash
# Adjust rate limit settings
RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
RATE_LIMIT_MAX_REQUESTS=1000 # Increase limit
```

**Port Already in Use**
```bash
# Change port in .env
PORT=3003

# Or kill process using port
lsof -ti:3002 | xargs kill -9
```

### Support

- Create an issue in the GitHub repository
- Check the health endpoint: `GET /health/detailed`
- Review application logs: `docker-compose logs user-service`
- Enable debug logging: `LOG_LEVEL=debug`