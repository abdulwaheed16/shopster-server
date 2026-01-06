# Shopster Vercel Deployment Guide

This guide provides instructions for deploying both the Frontend (Vite) and Backend (Express) of Shopster to Vercel.

## 1. Prerequisites

- [Vercel CLI](https://vercel.com/docs/cli) installed: `npm i -g vercel`
- [Cloudinary](https://cloudinary.com/) account for image storage.
- [MongoDB Atlas](https://www.mongodb.com/atlas) account for the database.
- [Stripe](https://stripe.com/) account for payments.

## 2. Backend (Server) Deployment

The backend is an Express application using Prisma and MongoDB.

### Steps:

1. Navigate to the `server` directory: `cd server`
2. Login to Vercel: `vercel login`
3. Initialize Vercel project: `vercel`
4. Configure environment variables in Vercel Dashboard (see below).
5. Deploy: `vercel --prod`

### Required Environment Variables (Server):

| Variable                | Description                                  |
| :---------------------- | :------------------------------------------- |
| `DATABASE_URL`          | MongoDB Atlas Connection String              |
| `JWT_ACCESS_SECRET`     | Secret for Access Token                      |
| `JWT_REFRESH_SECRET`    | Secret for Refresh Token                     |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary Cloud Name                        |
| `CLOUDINARY_API_KEY`    | Cloudinary API Key                           |
| `CLOUDINARY_API_SECRET` | Cloudinary API Secret                        |
| `STRIPE_SECRET_KEY`     | Stripe Restricted/Secret Key                 |
| `STRIPE_WEBHOOK_SECRET` | Stripe Webhook Secret (from Vercel listener) |
| `FRONTEND_URL`          | URL of the deployed frontend                 |
| `SHOPIFY_API_KEY`       | Shopify App Client ID                        |
| `SHOPIFY_API_SECRET`    | Shopify App Client Secret                    |

---

## 3. Frontend (Client) Deployment

The frontend is a Vite + React application.

### Steps:

1. Navigate to the `client` directory: `cd client`
2. Initialize Vercel project: `vercel`
3. Configure environment variables in Vercel Dashboard.
4. Deploy: `vercel --prod`

### Required Environment Variables (Client):

| Variable                     | Description                                                      |
| :--------------------------- | :--------------------------------------------------------------- |
| `VITE_API_URL`               | URL of the deployed backend (e.g., `https://api.yourdomain.com`) |
| `VITE_CLOUDINARY_CLOUD_NAME` | same as server                                                   |
| `VITE_STRIPE_PUBLIC_KEY`     | Stripe Publishable Key                                           |

---

## 4. Useful Commands

- **Local Development**: `npm run dev` in both directories.
- **Pulling Vercel Envs**: `vercel env pull .env.local`
- **Manual Build Check**: `npm run build`
- **Prisma Generate**: `prisma generate` (handled automatically in `npm run build`)

> [!NOTE]
> Make sure to update the `CORS_ORIGIN` in the backend `.env` or Vercel Environment Variables to include your deployed frontend domain.
