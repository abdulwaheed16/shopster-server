import { PrismaClient, SubscriptionStatus, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";
import { creditsService } from "../modules/billing/credits.service";

const prisma = new PrismaClient();

export async function seedUsers() {
  console.log("🌱 Seeding users...");

  const password = await bcrypt.hash("Guest123!", 10);
  const guestEmail = "guest@shopster.com";

  // 1. Ensure Guest User exists
  const guestUser = await prisma.user.upsert({
    where: { email: guestEmail },
    create: {
      email: guestEmail,
      name: "Guest User",
      password,
      role: UserRole.GUEST,
      emailVerified: new Date(),
      isActive: true,
    },
    update: {
      role: UserRole.GUEST,
    },
  });

  // 2. Assign Guest Plan
  const guestPlan = await prisma.plan.findUnique({
    where: { slug: "guest" },
  });

  if (guestPlan) {
    await prisma.subscription.upsert({
      where: { userId: guestUser.id },
      create: {
        userId: guestUser.id,
        planId: guestPlan.id,
        status: SubscriptionStatus.ACTIVE,
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
      },
      update: {
        planId: guestPlan.id,
        status: SubscriptionStatus.ACTIVE,
      },
    });
    console.log(`✅ Assigned Guest plan to: ${guestEmail}`);
  }

  // 3. Initialize Credits (if wallet balance is 0 or missing)
  const wallet = await prisma.creditWallet.findUnique({
    where: { userId: guestUser.id },
  });

  if (!wallet || wallet.balance === 0) {
    await creditsService.setCredits(guestUser.id, 10, "Guest initial credits");
    console.log(`✅ Initialized 10 credits for: ${guestEmail}`);
  }

  // 4. Ensure demo user exists
  const demoEmail = "demo@shopster.com";
  await prisma.user.upsert({
    where: { email: demoEmail },
    create: {
      email: demoEmail,
      name: "Demo User",
      password,
      role: UserRole.USER,
      emailVerified: new Date(),
      isActive: true,
    },
    update: {},
  });
  console.log(`✅ Ensured demo user exists: ${demoEmail}`);

  console.log("✨ User seeding completed!");
}
