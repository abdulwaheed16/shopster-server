import { AdStatus, MediaType, PrismaClient } from "@prisma/client";

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
      userId: demoUser.id,
    },
    take: 10,
  });

  if (products.length === 0) {
    console.log("⚠️  No products found. Please run seed-products first.");
    return;
  }

  // Get templates
  const templates = await prisma.template.findMany({
    where: { isActive: true },
    take: 10,
  });

  if (templates.length === 0) {
    console.log("⚠️  No templates found. Please run seed-templates first.");
    return;
  }

  // Find specific products and templates for matching
  const burgerProduct =
    products.find((p) => p.title.includes("Burger")) || products[0];
  const foodTemplate =
    templates.find((t) => t.name.includes("Food Showcase")) || templates[0];

  const dressProduct =
    products.find((p) => p.title.includes("Dress")) ||
    products[1] ||
    products[0];
  const fashionTemplate =
    templates.find((t) => t.name.includes("Lookbook")) ||
    templates[1] ||
    templates[0];

  const electronicsProduct =
    products.find((p) => p.title.includes("Headphones")) ||
    products[3] ||
    products[0];
  const electronicsTemplate =
    templates.find((t) => t.name.includes("Tech Specs")) ||
    templates[2] ||
    templates[0];

  // Create ads with realistic data
  const adsData = [
    {
      userId: demoUser.id,
      productIds: [burgerProduct.id],
      templateId: foodTemplate.id,
      title: "Gourmet Burger - Special Offer",
      assembledPrompt:
        "Create an appetizing advertisement for Gourmet Burger Combo. Highlight fresh ingredients and special BOGO offer.",
      variableValues: {
        productName: "Gourmet Burger Combo",
        description: "Freshly grilled Angus beef burger",
        ingredients: "Angus beef, Fresh lettuce, Special sauce",
        price: "$12.99",
        offer: "Buy 1 Get 1 Free",
      },
      mediaType: MediaType.IMAGE,
      imageUrl: burgerProduct.images[0].url,
      status: AdStatus.COMPLETED,
    },
    {
      userId: demoUser.id,
      productIds: [dressProduct.id],
      templateId: fashionTemplate.id,
      title: "Summer Collection 2024",
      assembledPrompt:
        "Design a chic lookbook advertisement for Summer Dress. Capture modern fashion trends.",
      variableValues: {
        productName: "Summer Dress",
        collection: "Summer 2024",
        style: "Flowy and elegant for hot days",
        sizes: "S - XL",
        price: "$49",
      },
      mediaType: MediaType.IMAGE,
      imageUrl: dressProduct.images[0].url,
      status: AdStatus.COMPLETED,
    },
    {
      userId: demoUser.id,
      productIds: [electronicsProduct.id],
      templateId: electronicsTemplate.id,
      title: "Tech Innovation - Wireless Audio",
      assembledPrompt:
        "Create a technical showcase for Wireless Headphones. Emphasize noise cancellation.",
      variableValues: {
        productName: "Wireless Headphones",
        specs: "BT 5.0, Noise Cancellation, 40h battery",
        performance: "Studio quality sound",
        compatibility: "iOS, Android, Windows",
        price: "$199",
      },
      mediaType: MediaType.IMAGE,
      imageUrl: electronicsProduct.images[0].url,
      status: AdStatus.COMPLETED,
    },
    // Video ads using backend asset results
    {
      userId: demoUser.id,
      productIds: [products[5]?.id || products[0].id], // Premium Product Asset 1
      templateId: templates[0].id,
      title: "Premium Product Video Ad - Dynamic Showcase",
      assembledPrompt: `Create a dynamic video advertisement showcasing the premium product.

Camera Movement: PAN_AND_TILT
Motion Intensity: Smooth
Duration: 10 seconds
Style: Modern and elegant

Highlight the product's premium features with smooth camera movements that capture every detail. Use professional lighting and clean composition.`,
      variableValues: {
        productName: "Premium Product",
        cameraMovement: "PAN_AND_TILT",
        motion: "Smooth",
        duration: "10s",
        style: "Modern and elegant",
      },
      mediaType: MediaType.VIDEO,
      videoUrl: "/assets/ads/videos/result.mp4",
      cloudinaryId: "shopster/ads/demo-video-001",
      status: AdStatus.COMPLETED,
      metadata: {
        model: "runway-gen3",
        generatedAt: new Date().toISOString(),
        prompt_tokens: 180,
        quality: "hd",
        videoType: "PAN_AND_TILT",
        duration: "10s",
        fps: "30",
      },
      resultAnalysis: JSON.stringify({
        success: true,
        message: "Video ad generated successfully",
        timestamp: new Date().toISOString(),
        mediaType: "VIDEO",
        videoAnalysis: {
          duration: "10s",
          fps: 30,
          resolution: "1920x1080",
          cameraMovement: "PAN_AND_TILT",
          quality: "Premium HD",
        },
      }),
    },
    {
      userId: demoUser.id,
      productIds: [products[6]?.id || products[1].id], // Premium Product Asset 2
      templateId: templates[1]?.id || templates[0].id,
      title: "Premium Product Video Ad - Push In Effect",
      assembledPrompt: `Create an engaging video advertisement with dramatic push-in camera movement.

Camera Movement: PUSH_IN_PULL_OUT
Motion Intensity: Dynamic
Duration: 10 seconds
Style: Bold and impactful

Use dramatic zoom effects to draw attention to the product's key features. Create a sense of discovery and excitement.`,
      variableValues: {
        productName: "Premium Product",
        cameraMovement: "PUSH_IN_PULL_OUT",
        motion: "Dynamic",
        duration: "10s",
        style: "Bold and impactful",
      },
      mediaType: MediaType.VIDEO,
      videoUrl: "/assets/ads/videos/result01.mp4",
      cloudinaryId: "shopster/ads/demo-video-002",
      status: AdStatus.COMPLETED,
      metadata: {
        model: "runway-gen3",
        generatedAt: new Date().toISOString(),
        prompt_tokens: 190,
        quality: "hd",
        videoType: "PUSH_IN_PULL_OUT",
        duration: "10s",
        fps: "30",
      },
      resultAnalysis: JSON.stringify({
        success: true,
        message: "Video ad generated successfully",
        timestamp: new Date().toISOString(),
        mediaType: "VIDEO",
        videoAnalysis: {
          duration: "10s",
          fps: 30,
          resolution: "1920x1080",
          cameraMovement: "PUSH_IN_PULL_OUT",
          quality: "Premium HD",
        },
      }),
    },
  ];

  // Create ads
  const createdAds = [];
  for (const adData of adsData) {
    const existing = await prisma.ad.findFirst({
      where: {
        userId: adData.userId,
        productIds: { hasSome: adData.productIds },
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
