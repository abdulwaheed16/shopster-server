import { BillingInterval, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Seed subscription plans
 * Creates three standard plans (Starter, Professional, Enterprise) and one Custom plan
 */
export async function seedPlans() {
  console.log("🌱 Seeding subscription plans...");

  const plans = [
    {
      name: "Starter",
      description:
        "Perfect for individuals and small businesses getting started",
      price: 29,
      billingInterval: BillingInterval.MONTHLY,
      creditsPerMonth: 100,
      storesLimit: 2,
      features: {
        templates: "basic",
        support: "email",
        analytics: "basic",
        adGeneration: "standard",
      },
      isActive: true,
      // Note: Add Stripe priceId after creating product in Stripe Dashboard
      priceId: null, // TODO: Replace with actual Stripe Price ID
    },
    {
      name: "Professional",
      description: "Ideal for growing businesses with multiple stores",
      price: 99,
      billingInterval: BillingInterval.MONTHLY,
      creditsPerMonth: 500,
      storesLimit: 10,
      features: {
        templates: "premium",
        support: "priority",
        analytics: "advanced",
        adGeneration: "high-quality",
        customBranding: true,
      },
      isActive: true,
      // Note: Add Stripe priceId after creating product in Stripe Dashboard
      priceId: null, // TODO: Replace with actual Stripe Price ID
    },
    {
      name: "Enterprise",
      description: "For large businesses requiring unlimited resources",
      price: 299,
      billingInterval: BillingInterval.MONTHLY,
      creditsPerMonth: 2000,
      storesLimit: 999999, // Effectively unlimited
      features: {
        templates: "unlimited",
        support: "dedicated",
        analytics: "enterprise",
        adGeneration: "premium",
        customBranding: true,
        apiAccess: true,
        whiteLabel: true,
      },
      isActive: true,
      // Note: Add Stripe priceId after creating product in Stripe Dashboard
      priceId: null, // TODO: Replace with actual Stripe Price ID
    },
    {
      name: "Custom",
      description:
        "Tailored plan with custom credits and limits (Admin-assigned only)",
      price: null, // No public price
      billingInterval: BillingInterval.MONTHLY,
      creditsPerMonth: 0, // Will be set by admin
      storesLimit: 0, // Will be set by admin
      features: {
        customizable: true,
        adminManaged: true,
      },
      isActive: false, // Not available for public selection
      priceId: null, // No Stripe price for custom plans
    },
  ];

  for (const planData of plans) {
    try {
      const existingPlan = await prisma.plan.findUnique({
        where: { name: planData.name },
      });

      if (existingPlan) {
        // Update existing plan
        await prisma.plan.update({
          where: { id: existingPlan.id },
          data: planData,
        });
        console.log(`✅ Updated plan: ${planData.name}`);
      } else {
        // Create new plan
        await prisma.plan.create({
          data: planData,
        });
        console.log(`✅ Created plan: ${planData.name}`);
      }
    } catch (error) {
      console.error(`❌ Error seeding plan "${planData.name}":`, error);
    }
  }

  console.log("✨ Plan seeding completed!");
}
