import {
  PrismaClient,
  StorePlatform,
  SyncStatus,
  UserRole,
} from "@prisma/client";

const prisma = new PrismaClient();

export async function seedProducts() {
  console.log("🌱 Seeding products...");

  // Create a demo user if not exists
  let demoUser = await prisma.user.findUnique({
    where: { email: "demo@shopster.com" },
  });

  if (!demoUser) {
    demoUser = await prisma.user.create({
      data: {
        email: "demo@shopster.com",
        name: "Demo User",
        role: UserRole.USER,
        emailVerified: new Date(),
      },
    });
    console.log("✅ Created demo user");
  }

  // Create a demo store
  let demoStore = await prisma.store.findFirst({
    where: {
      userId: demoUser.id,
      name: "Demo Electronics Store",
    },
  });

  if (!demoStore) {
    demoStore = await prisma.store.create({
      data: {
        userId: demoUser.id,
        name: "Demo Electronics Store",
        platform: StorePlatform.SHOPIFY,
        storeUrl: "https://demo-electronics.myshopify.com",
        isActive: true,
        syncStatus: SyncStatus.COMPLETED,
        lastSyncAt: new Date(),
        metadata: {
          currency: "USD",
          timezone: "America/New_York",
        },
      },
    });
    console.log("✅ Created demo store");
  }

  // Get categories
  const electronicsCategory = await prisma.category.findUnique({
    where: { userId_slug: { userId: demoUser.id, slug: "electronics" } },
  });

  const fashionCategory = await prisma.category.findUnique({
    where: { userId_slug: { userId: demoUser.id, slug: "fashion" } },
  });

  const homeCategory = await prisma.category.findUnique({
    where: { userId_slug: { userId: demoUser.id, slug: "home-garden" } },
  });

  const beautyCategory = await prisma.category.findUnique({
    where: { userId_slug: { userId: demoUser.id, slug: "beauty" } },
  });

  const fitnessCategory = await prisma.category.findUnique({
    where: { userId_slug: { userId: demoUser.id, slug: "sports-fitness" } },
  });

  // Create products
  const products = [
    {
      storeId: demoStore.id,
      categoryId: electronicsCategory?.id,
      externalId: "PROD-001",
      sku: "WH-PRO-001",
      title: "Premium Wireless Headphones",
      description:
        "Experience crystal-clear audio with our premium wireless headphones. Features active noise cancellation, 30-hour battery life, and premium comfort.",
      images: [
        {
          url: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&h=800&fit=crop&q=80",
          alt: "Premium Wireless Headphones",
          position: 0,
        },
      ],
      variants: [
        {
          id: "VAR-001-BLACK",
          title: "Black",
          sku: "WH-PRO-001-BLK",
          inStock: true,
          options: { color: "Black" },
        },
        {
          id: "VAR-001-SILVER",
          title: "Silver",
          sku: "WH-PRO-001-SLV",
          inStock: true,
          options: { color: "Silver" },
        },
      ],
      isActive: true,
      inStock: true,
    },
    {
      storeId: demoStore.id,
      categoryId: fashionCategory?.id,
      externalId: "PROD-002",
      sku: "SG-DES-002",
      title: "Designer Sunglasses",
      description:
        "Stylish designer sunglasses with UV protection. Perfect for any occasion, combining fashion and functionality.",
      images: [
        {
          url: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=800&h=800&fit=crop&q=80",
          alt: "Designer Sunglasses",
          position: 0,
        },
      ],
      variants: [
        {
          id: "VAR-002-TORTOISE",
          title: "Tortoise Shell",
          sku: "SG-DES-002-TOR",
          inStock: true,
          options: { color: "Tortoise Shell" },
        },
      ],
      isActive: true,
      inStock: true,
    },
    {
      storeId: demoStore.id,
      categoryId: homeCategory?.id,
      externalId: "PROD-003",
      sku: "TL-MOD-003",
      title: "Modern Table Lamp",
      description:
        "Elegant modern table lamp with adjustable brightness. Perfect for reading or ambient lighting.",
      images: [
        {
          url: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800&h=800&fit=crop&q=80",
          alt: "Modern Table Lamp",
          position: 0,
        },
      ],
      variants: [
        {
          id: "VAR-003-WHITE",
          title: "White",
          sku: "TL-MOD-003-WHT",
          inStock: true,
          options: { color: "White" },
        },
      ],
      isActive: true,
      inStock: true,
    },
    {
      storeId: demoStore.id,
      categoryId: beautyCategory?.id,
      externalId: "PROD-004",
      sku: "SK-ORG-004",
      title: "Organic Skincare Set",
      description:
        "Complete organic skincare set with natural ingredients. Includes cleanser, toner, and moisturizer.",
      images: [
        {
          url: "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=800&h=800&fit=crop&q=80",
          alt: "Organic Skincare Set",
          position: 0,
        },
      ],
      variants: [
        {
          id: "VAR-004-FULL",
          title: "Full Set",
          sku: "SK-ORG-004-FULL",
          inStock: true,
          options: { type: "Full Set" },
        },
      ],
      isActive: true,
      inStock: true,
    },
    {
      storeId: demoStore.id,
      categoryId: fitnessCategory?.id,
      externalId: "PROD-005",
      sku: "YM-PRE-005",
      title: "Premium Yoga Mat",
      description:
        "Non-slip premium yoga mat with extra cushioning. Perfect for yoga, pilates, and home workouts.",
      images: [
        {
          url: "https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=800&h=800&fit=crop&q=80",
          alt: "Premium Yoga Mat",
          position: 0,
        },
      ],
      variants: [
        {
          id: "VAR-005-PURPLE",
          title: "Purple",
          sku: "YM-PRE-005-PUR",
          inStock: true,
          options: { color: "Purple" },
        },
        {
          id: "VAR-005-BLUE",
          title: "Blue",
          sku: "YM-PRE-005-BLU",
          inStock: true,
          options: { color: "Blue" },
        },
      ],
      isActive: true,
      inStock: true,
    },
  ];

  // Create products one by one
  const createdProducts = [];
  for (const productData of products) {
    const existing = await prisma.product.findFirst({
      where: {
        storeId: productData.storeId,
        externalId: productData.externalId,
      },
    });

    if (existing) {
      const updated = await prisma.product.update({
        where: { id: existing.id },
        data: productData,
      });
      createdProducts.push(updated);
      console.log(`✅ Updated product: ${productData.title}`);
    } else {
      const created = await prisma.product.create({
        data: productData,
      });
      createdProducts.push(created);
      console.log(`✅ Created product: ${productData.title}`);
    }
  }

  console.log("✨ Product seeding completed!");
  return { demoUser, demoStore, products: createdProducts };
}

// Only run if this file is executed directly
if (require.main === module) {
  seedProducts()
    .catch((error) => {
      console.error("❌ Error seeding products:", error);
      process.exit(1);
    })
    .finally(() => {
      prisma.$disconnect();
    });
}
