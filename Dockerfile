# Use Node.js LTS (Lightweight)
FROM node:20-slim

# Install OpenSSL for Prisma
RUN apt-get update && apt-get install -y openssl libssl-dev && rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN yarn install --ignore-scripts

# Copy source code
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build TypeScript
RUN yarn build

# Expose backend port
EXPOSE 5000

# Start the application
CMD ["yarn", "start"]