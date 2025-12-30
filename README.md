# Shopster Backend API

Complete MERN stack backend built with Node.js, Express, TypeScript, Prisma, and MongoDB.

## Features

- ✅ **JWT Authentication** - Access & Refresh tokens with HTTP-only cookies
- ✅ **Role-Based Authorization** - USER and ADMIN roles
- ✅ **Email Verification** - Secure email verification flow
- ✅ **Password Reset** - Forgot password functionality
- ✅ **Swagger Documentation** - Complete API documentation at `/api-docs`
- ✅ **Rate Limiting** - Protection against brute force attacks
- ✅ **Error Handling** - Comprehensive error handling with custom error codes
- ✅ **Validation** - Request validation using Zod
- ✅ **Security** - Helmet, CORS, and other security best practices
- ✅ **Cloudinary Integration** - Image upload and management
- ✅ **Prisma ORM** - Type-safe database access
- ✅ **MongoDB** - NoSQL database with Prisma
- ✅ **Docker Support** - Containerized deployment

## Tech Stack

- **Runtime**: Node.js 20+
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: MongoDB
- **ORM**: Prisma
- **Validation**: Zod
- **Authentication**: JWT (jsonwebtoken)
- **Password Hashing**: bcryptjs
- **File Upload**: Cloudinary
- **Documentation**: Swagger/OpenAPI
- **Security**: Helmet, CORS, Rate Limiting

## Getting Started

### Prerequisites

- Node.js 20 or higher
- MongoDB database (local or cloud)
- Cloudinary account (for image uploads)

### Installation

1. **Clone the repository**

   ```bash
   cd server
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   ```bash
   cp .env.example .env
   ```

   Then edit `.env` with your configuration:

   - `DATABASE_URL`: MongoDB connection string
   - `JWT_ACCESS_SECRET` & `JWT_REFRESH_SECRET`: Strong secret keys (min 32 chars)
   - `CLOUDINARY_*`: Cloudinary credentials
   - Other optional configurations

4. **Generate Prisma Client**

   ```bash
   npm run prisma:generate
   ```

5. **Push database schema**
   ```bash
   npm run prisma:push
   ```

### Development

Start the development server with hot reload:

```bash
npm run dev
```

The server will start on `http://localhost:5000` (or your configured PORT).

- **API Documentation**: http://localhost:5000/api-docs
- **Health Check**: http://localhost:5000/health

### Production

1. **Build the project**

   ```bash
   npm run build
   ```

2. **Start the production server**
   ```bash
   npm start
   ```

## API Endpoints

### Authentication (`/api/v1/auth`)

- `POST /register` - Register new user
- `POST /login` - Login user
- `POST /refresh` - Refresh access token
- `POST /logout` - Logout user (protected)
- `POST /verify-email` - Verify email address
- `POST /request-password-reset` - Request password reset
- `POST /reset-password` - Reset password

### Users (`/api/v1/users`)

- `GET /profile` - Get current user profile (protected)
- `PUT /profile` - Update current user profile (protected)
- `GET /` - Get all users (admin only)
- `GET /:id` - Get user by ID (protected)
- `PUT /:id` - Update user (admin only)
- `DELETE /:id` - Delete user (admin only)

### Health (`/health`)

- `GET /` - Public health check
- `GET /protected` - Protected health check

## Project Structure

```
server/
├── src/
│   ├── config/              # Configuration files
│   │   ├── env.config.ts
│   │   ├── database.config.ts
│   │   ├── jwt.config.ts
│   │   ├── cloudinary.config.ts
│   │   └── swagger.config.ts
│   │
│   ├── common/              # Shared utilities
│   │   ├── constants/       # Constants
│   │   ├── errors/          # Error handling
│   │   ├── middlewares/     # Express middlewares
│   │   ├── utils/           # Utility functions
│   │   ├── validations/     # Shared validations
│   │   └── types/           # TypeScript types
│   │
│   ├── modules/             # Feature modules
│   │   ├── auth/            # Authentication
│   │   └── users/           # User management
│   │
│   ├── routes/              # Route aggregator
│   ├── health/              # Health check
│   ├── app.ts               # Express app setup
│   └── server.ts            # Server bootstrap
│
├── prisma/
│   └── schema.prisma        # Prisma schema
│
├── .env.example             # Environment variables template
├── tsconfig.json            # TypeScript configuration
├── nodemon.json             # Nodemon configuration
└── package.json             # Dependencies
```

## Environment Variables

See `.env.example` for all available environment variables.

### Required Variables

- `DATABASE_URL` - MongoDB connection string
- `JWT_ACCESS_SECRET` - Secret for access tokens (min 32 chars)
- `JWT_REFRESH_SECRET` - Secret for refresh tokens (min 32 chars)
- `CLOUDINARY_CLOUD_NAME` - Cloudinary cloud name
- `CLOUDINARY_API_KEY` - Cloudinary API key
- `CLOUDINARY_API_SECRET` - Cloudinary API secret

### Optional Variables

- `NODE_ENV` - Environment (development/production)
- `PORT` - Server port (default: 5000)
- `CORS_ORIGIN` - Allowed CORS origins
- `EMAIL_*` - Email service configuration
- `N8N_WEBHOOK_URL` - n8n webhook URL for ad generation

## Prisma Commands

```bash
# Generate Prisma Client
npm run prisma:generate

# Push schema to database
npm run prisma:push

# Open Prisma Studio (database GUI)
npm run prisma:studio
```

## Security Features

- **Helmet**: Security headers
- **CORS**: Cross-origin resource sharing
- **Rate Limiting**: Prevents brute force attacks
- **JWT**: Secure token-based authentication
- **Password Hashing**: bcrypt with salt rounds
- **HTTP-only Cookies**: Secure refresh token storage
- **Input Validation**: Zod schema validation
- **Error Handling**: No sensitive data in error responses

## Testing with Postman

1. Import the Swagger documentation into Postman
2. Set up environment variables for your base URL and tokens
3. Test the authentication flow:
   - Register a new user
   - Verify email (check console for token)
   - Login with credentials
   - Use the access token for protected routes

## Docker Deployment

```bash
# Build the image
docker build -t shopster-backend .

# Run the container
docker run -p 5000:5000 --env-file .env shopster-backend
```

## Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## License

MIT
# shopster-server
