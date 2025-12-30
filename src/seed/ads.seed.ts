import { AdStatus, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function seedAds() {
  console.log("🌱 Seeding ads...");

  // Get demo user
  const demoUser = await prisma.user.findUnique({
    where: { email: "demo@shopster.com" },
  });

  if (!demoUser) {
    console.log("⚠️  Demo user not found. Please run seed-products first.");
    return;
  }

  // Get products
  const products = await prisma.product.findMany({
    where: {
      store: {
        userId: demoUser.id,
      },
    },
    take: 5,
  });

  if (products.length === 0) {
    console.log("⚠️  No products found. Please run seed-products first.");
    return;
  }

  // Get templates
  const templates = await prisma.template.findMany({
    where: { isActive: true },
    take: 5,
  });

  if (templates.length === 0) {
    console.log("⚠️  No templates found. Please run seed-templates first.");
    return;
  }

  // Create ads with realistic data
  const adsData = [
    {
      userId: demoUser.id,
      productId: products[0].id, // Premium Wireless Headphones
      templateId: templates[0].id, // Premium Product Showcase
      title: "Premium Wireless Headphones - Limited Offer",
      assembledPrompt: `Create a stunning, professional product advertisement for Premium Wireless Headphones.

Key Features to Highlight:
- Active Noise Cancellation
- 30-hour battery life
- Premium comfort with memory foam ear cups
- Bluetooth 5.0 connectivity
- Foldable design with carrying case

Price: $299
Target Audience: Young professionals, Music lovers, Commuters
Visual Style: Modern and sleek

The ad should be eye-catching, modern, and convey premium quality. Use vibrant colors and clean typography.`,
      variableValues: {
        productName: "Premium Wireless Headphones",
        features:
          "Active Noise Cancellation\n30-hour battery life\nPremium comfort with memory foam ear cups\nBluetooth 5.0 connectivity\nFoldable design with carrying case",
        price: "$299",
        audience: "Young professionals, Music lovers, Commuters",
        style: "Modern and sleek",
      },
      imageUrl:
        "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1200&h=1200&fit=crop&q=80",
      cloudinaryId: "shopster/ads/demo-headphones-001",
      status: AdStatus.COMPLETED,
      metadata: {
        model: "dall-e-3",
        generatedAt: new Date().toISOString(),
        prompt_tokens: 150,
        quality: "hd",
      },
    },
    {
      userId: demoUser.id,
      productId: products[1].id, // Designer Sunglasses
      templateId: templates[1]?.id || templates[0].id, // Fashion Forward
      title: "Designer Sunglasses - Summer Collection",
      assembledPrompt: `Design a chic and trendy advertisement for Designer Sunglasses.

Collection: Summer Collection 2024
Season: Spring/Summer
Style: Retro-modern fusion
Price: $199

Create a visually stunning ad that captures the essence of modern fashion. Use elegant typography and sophisticated color palette.`,
      variableValues: {
        productName: "Designer Sunglasses",
        collection: "Summer Collection 2024",
        season: "Spring/Summer",
        style: "Retro-modern fusion",
        price: "$199",
      },
      imageUrl:
        "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=1200&h=1200&fit=crop&q=80",
      cloudinaryId: "shopster/ads/demo-sunglasses-001",
      status: AdStatus.COMPLETED,
      metadata: {
        model: "dall-e-3",
        generatedAt: new Date().toISOString(),
        prompt_tokens: 120,
        quality: "hd",
      },
    },
    {
      userId: demoUser.id,
      productId: products[2]?.id || products[0].id, // Modern Table Lamp
      templateId: templates[2]?.id || templates[0].id, // Home & Living
      title: "Modern Table Lamp - Illuminate Your Space",
      assembledPrompt: `Create a warm and inviting advertisement for Modern Table Lamp.

Description: Elegant modern table lamp with adjustable brightness. Perfect for reading or ambient lighting. Features touch controls and energy-efficient LED technology.
Material: Ceramic base with fabric shade
Dimensions: 12" x 8" x 6"
Price: $79.99

Design an ad that makes people feel at home. Use warm colors, natural textures, and comfortable aesthetics.`,
      variableValues: {
        productName: "Modern Table Lamp",
        description:
          "Elegant modern table lamp with adjustable brightness. Perfect for reading or ambient lighting. Features touch controls and energy-efficient LED technology.",
        material: "Ceramic base with fabric shade",
        dimensions: '12" x 8" x 6"',
        price: "$79.99",
      },
      imageUrl:
        "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=1200&h=1200&fit=crop&q=80",
      cloudinaryId: "shopster/ads/demo-lamp-001",
      status: AdStatus.COMPLETED,
      metadata: {
        model: "dall-e-3",
        generatedAt: new Date().toISOString(),
        prompt_tokens: 140,
        quality: "hd",
      },
    },
  ];

  // Create ads
  const createdAds = [];
  for (const adData of adsData) {
    const existing = await prisma.ad.findFirst({
      where: {
        userId: adData.userId,
        productId: adData.productId,
        templateId: adData.templateId,
      },
    });

    if (existing) {
      const updated = await prisma.ad.update({
        where: { id: existing.id },
        data: adData,
      });
      createdAds.push(updated);
      console.log(`✅ Updated ad: ${adData.title}`);
    } else {
      const created = await prisma.ad.create({
        data: adData,
      });
      createdAds.push(created);
      console.log(`✅ Created ad: ${adData.title}`);
    }
  }

  console.log("✨ Ad seeding completed!");
  return createdAds;
}

// Only run if this file is executed directly
if (require.main === module) {
  seedAds()
    .catch((error) => {
      console.error("❌ Error seeding ads:", error);
      process.exit(1);
    })
    .finally(() => {
      prisma.$disconnect();
    });
}
