# Shopster Server

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

# shopster-server
