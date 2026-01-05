# -------- BUILD --------
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json yarn.lock ./
COPY prisma ./prisma
RUN corepack enable && yarn install --frozen-lockfile

COPY tsconfig.json ./
COPY src ./src

RUN yarn prisma:generate
RUN yarn build


# -------- RUNTIME --------
FROM node:20-alpine

WORKDIR /app
ENV NODE_ENV=production

COPY package.json yarn.lock ./
COPY prisma ./prisma
RUN corepack enable && yarn install --production --frozen-lockfile

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

EXPOSE 3000
CMD ["node", "dist/server.js"]