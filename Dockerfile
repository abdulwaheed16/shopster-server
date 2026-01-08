# -------- BUILDER STAGE --------
FROM node:20-alpine AS builder

WORKDIR /app

# Install system dependencies (needed for some node modules)
# libc6-compat is often needed for alpine + prisma
RUN apk add --no-cache libc6-compat

# Copy dependency manifests
COPY package.json yarn.lock ./
COPY prisma ./prisma/

# Install ALL dependencies (including devDependencies for building)
RUN corepack enable && yarn install --frozen-lockfile

# Copy source code
COPY tsconfig.json ./
COPY src ./src/

# Generate Prisma Client & Build TypeScript
# We run prisma generate here so the client is built into node_modules
RUN yarn prisma:generate
RUN yarn build

# Remove devDependencies to shrink image size for the next stage
RUN yarn install --production --frozen-lockfile --ignore-scripts --prefer-offline

# -------- RUNNER STAGE --------
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Install dumb-init (Handling Kernel Signals correctly is critical for Docker)
# It prevents the "Zombie Process" problem where Docker can't stop your app.
RUN apk add --no-cache dumb-init

# Create a non-root user for security (Best Practice)
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Copy vital files from builder
# We copy ONLY what is needed for production
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
# Prisma engine binary is vital
COPY --from=builder /app/prisma ./prisma

# Change ownership to non-root user
CHOWN nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose the API port
EXPOSE 3000

# Use dumb-init as the entrypoint manager
ENTRYPOINT ["/usr/bin/dumb-init", "--"]

# Default Command (Can be overridden by docker-compose)
# For API: CMD ["node", "dist/server.js"]
# For Worker: CMD ["node", "dist/worker.js"]
CMD ["node", "dist/server.js"]