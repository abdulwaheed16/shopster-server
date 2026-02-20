import { PrismaClient, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export async function seedUsers() {
  console.log("🌱 Seeding users...");

  const password = await bcrypt.hash("Guest123!", 10);

  const guestUser = {
    email: "guest@shopster.com",
    name: "Guest User",
    password,
    role: UserRole.GUEST,
    emailVerified: new Date(),
    isActive: true,
  };

  const existing = await prisma.user.findUnique({
    where: { email: guestUser.email },
  });

  if (existing) {
    await prisma.user.update({
      where: { id: existing.id },
      data: guestUser,
    });
    console.log(`✅ Updated user: ${guestUser.email}`);
  } else {
    await prisma.user.create({
      data: guestUser,
    });
    console.log(`✅ Created user: ${guestUser.email}`);
  }

  // Also ensure demo user exists with correct role
  const demoUserEmail = "demo@shopster.com";
  const demoUser = await prisma.user.findUnique({
    where: { email: demoUserEmail },
  });

  if (!demoUser) {
    await prisma.user.create({
      data: {
        email: demoUserEmail,
        name: "Demo User",
        password,
        role: UserRole.USER,
        emailVerified: new Date(),
        isActive: true,
      },
    });
    console.log(`✅ Created demo user: ${demoUserEmail}`);
  }

  console.log("✨ User seeding completed!");
}
