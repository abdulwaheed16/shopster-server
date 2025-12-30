import { PrismaClient, VariableType } from "@prisma/client";

const prisma = new PrismaClient();

async function seedTemplates() {
  console.log("🌱 Seeding templates...");

  // Get or create demo user for global templates
  let demoUser = await prisma.user.findUnique({
    where: { email: "demo@shopster.com" },
  });

  if (!demoUser) {
    demoUser = await prisma.user.create({
      data: {
        email: "demo@shopster.com",
        name: "Demo User",
        emailVerified: new Date(),
      },
    });
  }

  // First, ensure we have categories
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { userId_slug: { userId: demoUser.id, slug: "electronics" } },
      update: {},
      create: {
        userId: demoUser.id,
        name: "Electronics",
        slug: "electronics",
        description: "Electronic products and gadgets",
      },
    }),
    prisma.category.upsert({
      where: { userId_slug: { userId: demoUser.id, slug: "fashion" } },
      update: {},
      create: {
        userId: demoUser.id,
        name: "Fashion",
        slug: "fashion",
        description: "Fashion and apparel products",
      },
    }),
    prisma.category.upsert({
      where: { userId_slug: { userId: demoUser.id, slug: "home-garden" } },
      update: {},
      create: {
        userId: demoUser.id,
        name: "Home & Garden",
        slug: "home-garden",
        description: "Home and garden products",
      },
    }),
    prisma.category.upsert({
      where: { userId_slug: { userId: demoUser.id, slug: "beauty" } },
      update: {},
      create: {
        userId: demoUser.id,
        name: "Beauty",
        slug: "beauty",
        description: "Beauty and cosmetics products",
      },
    }),
    prisma.category.upsert({
      where: { userId_slug: { userId: demoUser.id, slug: "sports-fitness" } },
      update: {},
      create: {
        userId: demoUser.id,
        name: "Sports & Fitness",
        slug: "sports-fitness",
        description: "Sports and fitness products",
      },
    }),
  ]);

  const categoryMap = new Map(categories.map((c) => [c.slug, c.id]));

  // Create templates
  const templates = [
    {
      name: "Premium Product Showcase",
      description: "Perfect for high-end electronics and tech products",
      promptTemplate: `Create a stunning, professional product advertisement for {{productName}}.

Key Features to Highlight:
{{features}}

Price: {{price}}
Target Audience: {{audience}}
Visual Style: {{style}}

The ad should be eye-catching, modern, and convey premium quality. Use vibrant colors and clean typography.`,
      variables: [
        {
          name: "productName",
          label: "Product Name",
          type: VariableType.TEXT,
          placeholder: "e.g., Premium Wireless Headphones",
          required: true,
        },
        {
          name: "features",
          label: "Key Features",
          type: VariableType.TEXTAREA,
          placeholder: "List the main features",
          required: true,
        },
        {
          name: "price",
          label: "Price",
          type: VariableType.TEXT,
          placeholder: "e.g., $299",
          required: false,
        },
        {
          name: "audience",
          label: "Target Audience",
          type: VariableType.TEXT,
          placeholder: "e.g., Young professionals, Music lovers",
          required: false,
        },
        {
          name: "style",
          label: "Visual Style",
          type: VariableType.TEXT,
          placeholder: "e.g., Modern, Minimalist, Bold",
          defaultValue: "Modern and sleek",
          required: false,
        },
      ],
      previewImages: [
        "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1200&h=1200&fit=crop&q=80",
      ],
      categoryIds: [categoryMap.get("electronics")!],
      isActive: true,
    },
    {
      name: "Fashion Forward",
      description: "Stylish template for fashion and apparel products",
      promptTemplate: `Design a chic and trendy advertisement for {{productName}}.

Collection: {{collection}}
Season: {{season}}
Style: {{style}}
Price: {{price}}

Create a visually stunning ad that captures the essence of modern fashion. Use elegant typography and sophisticated color palette.`,
      variables: [
        {
          name: "productName",
          label: "Product Name",
          type: VariableType.TEXT,
          placeholder: "e.g., Designer Sunglasses",
          required: true,
        },
        {
          name: "collection",
          label: "Collection",
          type: VariableType.TEXT,
          placeholder: "e.g., Summer Collection 2024",
          required: false,
        },
        {
          name: "season",
          label: "Season",
          type: VariableType.TEXT,
          placeholder: "e.g., Spring/Summer",
          required: false,
        },
        {
          name: "style",
          label: "Style",
          type: VariableType.TEXT,
          placeholder: "e.g., Retro-modern fusion",
          required: false,
        },
        {
          name: "price",
          label: "Price",
          type: VariableType.TEXT,
          placeholder: "e.g., $199",
          required: false,
        },
      ],
      previewImages: [
        "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=1200&h=1200&fit=crop&q=80",
      ],
      categoryIds: [categoryMap.get("fashion")!],
      isActive: true,
    },
    {
      name: "Home & Living",
      description: "Cozy and inviting template for home products",
      promptTemplate: `Create a warm and inviting advertisement for {{productName}}.

Description: {{description}}
Material: {{material}}
Dimensions: {{dimensions}}
Price: {{price}}

Design an ad that makes people feel at home. Use warm colors, natural textures, and comfortable aesthetics.`,
      variables: [
        {
          name: "productName",
          label: "Product Name",
          type: VariableType.TEXT,
          placeholder: "e.g., Modern Table Lamp",
          required: true,
        },
        {
          name: "description",
          label: "Description",
          type: VariableType.TEXTAREA,
          placeholder: "Brief product description",
          required: true,
        },
        {
          name: "material",
          label: "Material",
          type: VariableType.TEXT,
          placeholder: "e.g., Ceramic, Wood, Metal",
          required: false,
        },
        {
          name: "dimensions",
          label: "Dimensions",
          type: VariableType.TEXT,
          placeholder: 'e.g., 12" x 8" x 6"',
          required: false,
        },
        {
          name: "price",
          label: "Price",
          type: VariableType.TEXT,
          placeholder: "e.g., $79.99",
          required: false,
        },
      ],
      previewImages: [
        "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=1200&h=1200&fit=crop&q=80",
      ],
      categoryIds: [categoryMap.get("home-garden")!],
      isActive: true,
    },
    {
      name: "Beauty & Wellness",
      description: "Elegant template for beauty and skincare products",
      promptTemplate: `Design a luxurious advertisement for {{productName}}.

Benefits: {{benefits}}
Key Ingredients: {{ingredients}}
Skin Type: {{skinType}}
Price: {{price}}

Create an elegant and sophisticated ad that emphasizes natural beauty and self-care. Use soft colors and clean design.`,
      variables: [
        {
          name: "productName",
          label: "Product Name",
          type: VariableType.TEXT,
          placeholder: "e.g., Organic Skincare Set",
          required: true,
        },
        {
          name: "benefits",
          label: "Benefits",
          type: VariableType.TEXTAREA,
          placeholder: "List the main benefits",
          required: true,
        },
        {
          name: "ingredients",
          label: "Key Ingredients",
          type: VariableType.TEXT,
          placeholder: "e.g., Vitamin C, Hyaluronic Acid",
          required: false,
        },
        {
          name: "skinType",
          label: "Skin Type",
          type: VariableType.TEXT,
          placeholder: "e.g., All skin types, Sensitive skin",
          required: false,
        },
        {
          name: "price",
          label: "Price",
          type: VariableType.TEXT,
          placeholder: "e.g., $89.99",
          required: false,
        },
      ],
      previewImages: [
        "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=1200&h=1200&fit=crop&q=80",
      ],
      categoryIds: [categoryMap.get("beauty")!],
      isActive: true,
    },
    {
      name: "Fitness & Active",
      description: "Dynamic template for sports and fitness products",
      promptTemplate: `Create an energetic and motivating advertisement for {{productName}}.

Features: {{features}}
Ideal For: {{idealFor}}
Performance: {{performance}}
Price: {{price}}

Design a dynamic ad that inspires action and movement. Use bold colors, strong typography, and energetic visuals.`,
      variables: [
        {
          name: "productName",
          label: "Product Name",
          type: VariableType.TEXT,
          placeholder: "e.g., Yoga Mat Premium",
          required: true,
        },
        {
          name: "features",
          label: "Features",
          type: VariableType.TEXTAREA,
          placeholder: "List the main features",
          required: true,
        },
        {
          name: "idealFor",
          label: "Ideal For",
          type: VariableType.TEXT,
          placeholder: "e.g., Yoga, Pilates, Home workouts",
          required: false,
        },
        {
          name: "performance",
          label: "Performance Benefits",
          type: VariableType.TEXT,
          placeholder: "e.g., Non-slip, Extra cushioning",
          required: false,
        },
        {
          name: "price",
          label: "Price",
          type: VariableType.TEXT,
          placeholder: "e.g., $49.99",
          required: false,
        },
      ],
      previewImages: [
        "https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=1200&h=1200&fit=crop&q=80",
      ],
      categoryIds: [categoryMap.get("sports-fitness")!],
      isActive: true,
    },
  ];

  // Create templates one by one to avoid conflicts
  for (const templateData of templates) {
    try {
      // Create or get variables first
      const variableIds: string[] = [];
      for (const varData of templateData.variables) {
        const variable = await prisma.variable.upsert({
          where: { id: "000000000000000000000000" }, // Dummy ID since we don't have a unique name index
          update: varData,
          create: {
            ...varData,
            userId: demoUser.id,
          },
        }).catch(async () => {
          // If upsert fails (it will since dummy ID won't match), find by name and userId
          let existingVar = await prisma.variable.findFirst({
            where: { name: varData.name, userId: demoUser.id }
          });
          if (existingVar) {
            return await prisma.variable.update({
              where: { id: existingVar.id },
              data: varData
            });
          }
          return await prisma.variable.create({
            data: {
              ...varData,
              userId: demoUser.id,
            }
          });
        });
        variableIds.push(variable.id);
      }

      // Check if template exists
      const existing = await prisma.template.findFirst({
        where: { name: templateData.name, userId: demoUser.id },
      });

      const templatePayload = {
        name: templateData.name,
        description: templateData.description,
        promptTemplate: templateData.promptTemplate,
        variableIds: variableIds,
        previewImages: templateData.previewImages,
        categoryIds: templateData.categoryIds,
        isActive: templateData.isActive,
        userId: demoUser.id,
      };

      if (existing) {
        await prisma.template.update({
          where: { id: existing.id },
          data: templatePayload,
        });
        console.log(`✅ Updated template: ${templateData.name}`);
      } else {
        await prisma.template.create({
          data: templatePayload,
        });
        console.log(`✅ Created template: ${templateData.name}`);
      }
    } catch (error) {
      console.error(
        `❌ Error creating template "${templateData.name}":`,
        error
      );
    }
  }

  console.log("✨ Template seeding completed!");
}

async function main() {
  try {
    await seedTemplates();
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main();
