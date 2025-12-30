import { PrismaClient } from "@prisma/client";
import { config } from "./env.config";

// Prisma Client singleton
const prismaClientSingleton = () => {
  return new PrismaClient({
    log: config.server.isDevelopment
      ? ["query", "info", "warn", "error"]
      : ["error"],
    errorFormat: "pretty",
  });
};

declare global {
  var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>;
}

export const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

if (config.server.isDevelopment) {
  globalThis.prismaGlobal = prisma;
}

// Graceful shutdown
export const disconnectDatabase = async () => {
  await prisma.$disconnect();
};

// Database connection test
export const testDatabaseConnection = async (): Promise<boolean> => {
  try {
    await prisma.$connect();
    console.log("✅ Database connected successfully");
    return true;
  } catch (error) {
    console.error("❌ Database connection failed:", error);
    return false;
  }
};
