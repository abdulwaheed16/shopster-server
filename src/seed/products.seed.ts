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
      name: "Demo Store",
    },
  });

  if (!demoStore) {
    demoStore = await prisma.store.create({
      data: {
        userId: demoUser.id,
        name: "Demo Store",
        platform: StorePlatform.SHOPIFY,
        storeUrl: "https://demo-store.myshopify.com",
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
  const foodCategory = await prisma.category.findUnique({
    where: { userId_slug: { userId: demoUser.id, slug: "food" } },
  });

  const clothesCategory = await prisma.category.findUnique({
    where: { userId_slug: { userId: demoUser.id, slug: "clothes" } },
  });

  const ecommerceCategory = await prisma.category.findUnique({
    where: { userId_slug: { userId: demoUser.id, slug: "e-commerce" } },
  });

  const electronicsCategory = await prisma.category.findUnique({
    where: { userId_slug: { userId: demoUser.id, slug: "electronics" } },
  });

  const beautyCategory = await prisma.category.findUnique({
    where: { userId_slug: { userId: demoUser.id, slug: "beauty" } },
  });

  // Create products
  const products = [
    {
      userId: demoUser.id,
      storeId: demoStore.id,
      categoryId: foodCategory?.id,
      externalId: "FOOD-001",
      sku: "FOOD-BGR-001",
      title: "Gourmet Burger Combo",
      description:
        "A delicious gourmet burger with fresh ingredients and a side of fries.",
      images: [
        {
          url: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&h=800&fit=crop&q=80",
          alt: "Gourmet Burger",
          position: 0,
        },
      ],
      variants: [
        {
          id: "VAR-FOOD-001",
          title: "Standard",
          sku: "FOOD-BGR-001-STD",
          inStock: true,
          options: { size: "Regular" },
        },
      ],
      isActive: true,
      inStock: true,
    },
    {
      userId: demoUser.id,
      storeId: demoStore.id,
      categoryId: clothesCategory?.id,
      externalId: "CLOTHES-001",
      sku: "CLT-DRS-001",
      title: "Summer Dress",
      description: "Elegant and comfortable summer dress for any occasion.",
      images: [
        {
          url: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&h=800&fit=crop&q=80",
          alt: "Summer Dress",
          position: 0,
        },
      ],
      variants: [
        {
          id: "VAR-CLOTHES-001",
          title: "Medium / Blue",
          sku: "CLT-DRS-001-M-BLU",
          inStock: true,
          options: { size: "M", color: "Blue" },
        },
      ],
      isActive: true,
      inStock: true,
    },
    {
      userId: demoUser.id,
      storeId: demoStore.id,
      categoryId: ecommerceCategory?.id,
      externalId: "ECOMM-001",
      sku: "ECM-KIT-001",
      title: "Smart Home Starter Kit",
      description: "Everything you need to start your smart home journey.",
      images: [
        {
          url: "https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=800&h=800&fit=crop&q=80",
          alt: "Smart Home Kit",
          position: 0,
        },
      ],
      variants: [
        {
          id: "VAR-ECOMM-001",
          title: "Standard",
          sku: "ECM-KIT-001-STD",
          inStock: true,
          options: { type: "Standard" },
        },
      ],
      isActive: true,
      inStock: true,
    },
    {
      userId: demoUser.id,
      storeId: demoStore.id,
      categoryId: electronicsCategory?.id,
      externalId: "ELEC-001",
      sku: "ELE-WHP-001",
      title: "Wireless Headphones",
      description: "High-quality wireless headphones with noise cancellation.",
      images: [
        {
          url: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&h=800&fit=crop&q=80",
          alt: "Wireless Headphones",
          position: 0,
        },
      ],
      variants: [
        {
          id: "VAR-ELEC-001",
          title: "Black",
          sku: "ELE-WHP-001-BLK",
          inStock: true,
          options: { color: "Black" },
        },
      ],
      isActive: true,
      inStock: true,
    },
    {
      userId: demoUser.id,
      storeId: demoStore.id,
      categoryId: beautyCategory?.id,
      externalId: "BEAUTY-001",
      sku: "BTY-SRM-001",
      title: "Radiance Serum",
      description: "Advanced radiance serum for glowing skin.",
      images: [
        {
          url: "https://images.unsplash.com/photo-1596755389378-c31d21fd1273?w=800&h=800&fit=crop&q=80",
          alt: "Radiance Serum",
          position: 0,
        },
      ],
      variants: [
        {
          id: "VAR-BEAUTY-001",
          title: "30ml",
          sku: "BTY-SRM-001-30",
          inStock: true,
          options: { size: "30ml" },
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
