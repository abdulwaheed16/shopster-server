import {
  BillingInterval,
  Currency,
  PlanType,
  PrismaClient,
} from "@prisma/client";

const prisma = new PrismaClient();

export async function seedPlans() {
  console.log("🌱 Seeding subscription plans...");

  const plans = [
    {
      name: "Guest",
      slug: "guest",
      type: PlanType.FREE,
      description: "Trial plan for new users",
      creditsPerMonth: 15,
      storesLimit: 1,
      prices: [],
      isActive: true,
      isPublic: false,
    },
    {
      name: "Starter",
      slug: "starter",
      type: PlanType.STARTER,
      description:
        "Perfect for individuals and small businesses getting started",
      creditsPerMonth: 100,
      storesLimit: 2,
      prices: [
        {
          currency: Currency.USD,
          interval: BillingInterval.MONTHLY,
          amount: 29,
          stripePriceId: null,
        },
      ],
      features: {
        templates: "basic",
        support: "email",
        analytics: "basic",
        adGeneration: "standard",
      },
      isActive: true,
      isPublic: true,
    },
    {
      name: "Professional",
      slug: "pro",
      type: PlanType.PRO,
      description: "Ideal for growing businesses with multiple stores",
      creditsPerMonth: 500,
      storesLimit: 10,
      prices: [
        {
          currency: Currency.USD,
          interval: BillingInterval.MONTHLY,
          amount: 99,
          stripePriceId: null,
        },
      ],
      features: {
        templates: "premium",
        support: "priority",
        analytics: "advanced",
        adGeneration: "high-quality",
        customBranding: true,
      },
      isActive: true,
      isPublic: true,
    },
    {
      name: "Enterprise",
      slug: "enterprise",
      type: PlanType.BUSINESS,
      description: "For large businesses requiring unlimited resources",
      creditsPerMonth: 2000,
      storesLimit: 999999,
      prices: [
        {
          currency: Currency.USD,
          interval: BillingInterval.MONTHLY,
          amount: 299,
          stripePriceId: null,
        },
      ],
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
      isPublic: true,
    },
    {
      name: "Custom",
      slug: "custom",
      type: PlanType.CUSTOM,
      description:
        "Tailored plan with custom credits and limits (Admin-assigned only)",
      creditsPerMonth: 0,
      storesLimit: 0,
      prices: [],
      features: {
        customizable: true,
        adminManaged: true,
      },
      isActive: false,
      isPublic: false,
    },
  ];

  for (const planData of plans) {
    try {
      const existingPlan = await prisma.plan.findUnique({
        where: { slug: planData.slug },
      });

      if (existingPlan) {
        await prisma.plan.update({
          where: { id: existingPlan.id },
          data: planData as any,
        });
        console.log(`✅ Updated plan: ${planData.name}`);
      } else {
        await prisma.plan.create({
          data: planData as any,
        });
        console.log(`✅ Created plan: ${planData.name}`);
      }
    } catch (error) {
      console.error(`❌ Error seeding plan "${planData.name}":`, error);
    }
  }

  console.log("✨ Plan seeding completed!");
}
