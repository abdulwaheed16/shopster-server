import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function test() {
  console.log("Starting database diagnostic...");
  try {
    console.log("Attempting to connect to MongoDB...");
    await prisma.$connect();
    console.log("Connected successfully!");

    console.log("Querying user collection...");
    const userCount = await prisma.user.count();
    console.log(`Number of users in database: ${userCount}`);

    if (userCount > 0) {
      const users = await prisma.user.findMany({ take: 1 });
      console.log("Sample user email:", users[0].email);
    } else {
      console.log("No users found in database.");
    }

    console.log("All checks passed!");
  } catch (error) {
    console.error("Diagnostic failed:");
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

test();
