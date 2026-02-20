# Stage 1: Build
FROM node:20-slim as build

# Install OpenSSL for Prisma
RUN apt-get update && apt-get install -y openssl libssl-dev && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json yarn.lock* ./
RUN yarn install --ignore-scripts

COPY . .
RUN npx prisma generate
RUN yarn build

# Stage 2: Production
FROM node:20-slim

# Install OpenSSL for Prisma (runtime dependency)
RUN apt-get update && apt-get install -y openssl libssl-dev && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy ONLY necessary files from build stage
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json /app/yarn.lock* ./
COPY --from=build /app/prisma ./prisma

EXPOSE 5000

CMD ["node", "dist/server.js"]