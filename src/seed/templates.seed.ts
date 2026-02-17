import { MediaType, PrismaClient, VariableType } from "@prisma/client";

const prisma = new PrismaClient();

export async function seedTemplates() {
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
      where: { userId_slug: { userId: demoUser.id, slug: "food" } },
      update: {},
      create: {
        userId: demoUser.id,
        name: "Food",
        slug: "food",
        description: "Food and beverage products",
        icon: "🍔",
      },
    }),
    prisma.category.upsert({
      where: { userId_slug: { userId: demoUser.id, slug: "fashion" } },
      update: {},
      create: {
        userId: demoUser.id,
        name: "Fashion",
        slug: "fashion",
        description: "Graphic-focused fashion templates",
        icon: "shirt",
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
        icon: "sparkles",
      },
    }),
    prisma.category.upsert({
      where: { userId_slug: { userId: demoUser.id, slug: "electronics" } },
      update: {},
      create: {
        userId: demoUser.id,
        name: "Electronics",
        slug: "electronics",
        description: "Electronic products and gadgets",
        icon: "cpu",
      },
    }),
    prisma.category.upsert({
      where: { userId_slug: { userId: demoUser.id, slug: "home-decor" } },
      update: {},
      create: {
        userId: demoUser.id,
        name: "Home & Decor",
        slug: "home-decor",
        description: "Interior and home improvement templates",
        icon: "home",
      },
    }),
    prisma.category.upsert({
      where: { userId_slug: { userId: demoUser.id, slug: "food" } },
      update: {},
      create: {
        userId: demoUser.id,
        name: "Food",
        slug: "food",
        description: "Food and beverage products",
        icon: "🍔",
      },
    }),
    prisma.category.upsert({
      where: { userId_slug: { userId: demoUser.id, slug: "e-commerce" } },
      update: {},
      create: {
        userId: demoUser.id,
        name: "E-Commerce",
        slug: "e-commerce",
        description: "General e-commerce and online store products",
        icon: "🛒",
      },
    }),
  ]);

  const categoryMap = new Map(categories.map((c) => [c.slug, c.id]));

  // Templates organized by category
  const templates = [
    // ============================================================
    // FOOD CATEGORY TEMPLATES (3 templates)
    // ============================================================
    {
      name: "Delicious Food Showcase",
      description: "Mouth-watering template for food and beverage products",
      mediaType: MediaType.IMAGE,
      promptTemplate: `Create an appetizing advertisement for {{productName}}.

Description: {{description}}
Key Ingredients: {{ingredients}}
Price: {{price}}
Special Offer: {{offer}}

Design a vibrant, mouth-watering ad that makes viewers crave the product. Use warm, inviting colors and professional food photography style.`,
      variables: [
        {
          name: "productName",
          label: "Product Name",
          type: VariableType.TEXT,
          placeholder: "e.g., Gourmet Burger Combo",
          required: true,
        },
        {
          name: "description",
          label: "Description",
          type: VariableType.TEXTAREA,
          placeholder: "Brief description of the food item",
          required: true,
        },
        {
          name: "ingredients",
          label: "Key Ingredients",
          type: VariableType.TEXT,
          placeholder: "e.g., Angus beef, Fresh lettuce, Special sauce",
          required: false,
        },
        {
          name: "price",
          label: "Price",
          type: VariableType.TEXT,
          placeholder: "e.g., $12.99",
          required: false,
        },
        {
          name: "offer",
          label: "Special Offer",
          type: VariableType.TEXT,
          placeholder: "e.g., Buy 1 Get 1 Free",
          required: false,
        },
      ],
      previewImages: [
        "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=1200&h=1200&fit=crop&q=80",
      ],
      referenceAdImage:
        "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=1200&h=1200&fit=crop&q=80",
      categoryIds: [categoryMap.get("food")!],
      isActive: true,
    },
    {
      name: "Recipe Video Ad",
      description: "Quick recipe video showcasing food preparation",
      mediaType: MediaType.VIDEO,
      promptTemplate: `Create a quick recipe video for {{productName}}.

Recipe Steps: {{steps}}
Prep Time: {{prepTime}}
Serving Size: {{servings}}
Call to Action: {{cta}}

Design a fast-paced, engaging recipe video with close-up shots of the cooking process. Use text overlays for ingredients and steps.`,
      variables: [
        {
          name: "productName",
          label: "Dish Name",
          type: VariableType.TEXT,
          placeholder: "e.g., Chocolate Lava Cake",
          required: true,
        },
        {
          name: "steps",
          label: "Recipe Steps",
          type: VariableType.TEXTAREA,
          placeholder: "List the main cooking steps",
          required: true,
        },
        {
          name: "prepTime",
          label: "Prep Time",
          type: VariableType.TEXT,
          placeholder: "e.g., 15 minutes",
          defaultValue: "15 minutes",
          required: false,
        },
        {
          name: "servings",
          label: "Serving Size",
          type: VariableType.TEXT,
          placeholder: "e.g., Serves 4",
          required: false,
        },
        {
          name: "cta",
          label: "Call to Action",
          type: VariableType.TEXT,
          placeholder: "e.g., Order Now, Get Recipe",
          defaultValue: "Order Now",
          required: false,
        },
      ],
      previewImages: [
        "https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=1200&h=1200&fit=crop&q=80",
      ],
      referenceAdImage:
        "https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=1200&h=1200&fit=crop&q=80",
      categoryIds: [categoryMap.get("food")!],
      isActive: true,
    },
    {
      name: "Restaurant Promo",
      description: "Professional template for restaurant promotions",
      mediaType: MediaType.IMAGE,
      promptTemplate: `Design a professional restaurant promotion for {{productName}}.

Cuisine Type: {{cuisine}}
Special Features: {{features}}
Location: {{location}}
Discount: {{discount}}

Create an elegant ad that highlights the dining experience. Use sophisticated typography and appetizing food imagery.`,
      variables: [
        {
          name: "productName",
          label: "Restaurant/Dish Name",
          type: VariableType.TEXT,
          placeholder: "e.g., Italian Pasta Special",
          required: true,
        },
        {
          name: "cuisine",
          label: "Cuisine Type",
          type: VariableType.TEXT,
          placeholder: "e.g., Italian, Asian Fusion",
          required: false,
        },
        {
          name: "features",
          label: "Special Features",
          type: VariableType.TEXTAREA,
          placeholder: "What makes this special?",
          required: true,
        },
        {
          name: "location",
          label: "Location",
          type: VariableType.TEXT,
          placeholder: "e.g., Downtown, Online Delivery",
          required: false,
        },
        {
          name: "discount",
          label: "Discount/Offer",
          type: VariableType.TEXT,
          placeholder: "e.g., 20% off this week",
          required: false,
        },
      ],
      previewImages: [
        "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1200&h=1200&fit=crop&q=80",
      ],
      referenceAdImage:
        "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1200&h=1200&fit=crop&q=80",
      categoryIds: [categoryMap.get("food")!],
      isActive: true,
    },

    // ============================================================
    // CLOTHES CATEGORY TEMPLATES (3 templates)
    // ============================================================
    {
      name: "Fashion Lookbook",
      description: "Stylish template for clothing collections",
      mediaType: MediaType.IMAGE,
      promptTemplate: `Design a chic lookbook advertisement for {{productName}}.

Collection: {{collection}}
Style: {{style}}
Sizes Available: {{sizes}}
Price: {{price}}

Create a visually stunning ad that captures modern fashion trends. Use elegant typography and sophisticated color palette.`,
      variables: [
        {
          name: "productName",
          label: "Product Name",
          type: VariableType.TEXT,
          placeholder: "e.g., Summer Dress Collection",
          required: true,
        },
        {
          name: "collection",
          label: "Collection Name",
          type: VariableType.TEXT,
          placeholder: "e.g., Spring/Summer 2024",
          required: false,
        },
        {
          name: "style",
          label: "Style Description",
          type: VariableType.TEXTAREA,
          placeholder: "Describe the style and aesthetic",
          required: true,
        },
        {
          name: "sizes",
          label: "Available Sizes",
          type: VariableType.TEXT,
          placeholder: "e.g., XS - XXL",
          required: false,
        },
        {
          name: "price",
          label: "Price",
          type: VariableType.TEXT,
          placeholder: "e.g., Starting at $49",
          required: false,
        },
      ],
      previewImages: [
        "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1200&h=1200&fit=crop&q=80",
      ],
      referenceAdImage:
        "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1200&h=1200&fit=crop&q=80",
      categoryIds: [categoryMap.get("fashion")!],
      isActive: true,
    },
    {
      name: "Outfit Styling Video",
      description: "Dynamic video showing outfit combinations",
      mediaType: MediaType.VIDEO,
      promptTemplate: `Create a styling video for {{productName}}.

Outfit Ideas: {{outfits}}
Occasion: {{occasion}}
Styling Tips: {{tips}}
Duration: {{duration}}

Show multiple ways to style the clothing item. Use quick transitions and upbeat music to keep viewers engaged.`,
      variables: [
        {
          name: "productName",
          label: "Clothing Item",
          type: VariableType.TEXT,
          placeholder: "e.g., Versatile Blazer",
          required: true,
        },
        {
          name: "outfits",
          label: "Outfit Combinations",
          type: VariableType.TEXTAREA,
          placeholder: "Describe different styling options",
          required: true,
        },
        {
          name: "occasion",
          label: "Occasion",
          type: VariableType.TEXT,
          placeholder: "e.g., Office, Casual, Evening",
          required: false,
        },
        {
          name: "tips",
          label: "Styling Tips",
          type: VariableType.TEXT,
          placeholder: "Quick styling advice",
          required: false,
        },
        {
          name: "duration",
          label: "Duration",
          type: VariableType.TEXT,
          placeholder: "e.g., 20 seconds",
          defaultValue: "20 seconds",
          required: false,
        },
      ],
      previewImages: [
        "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1200&h=1200&fit=crop&q=80",
      ],
      referenceAdImage:
        "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1200&h=1200&fit=crop&q=80",
      categoryIds: [categoryMap.get("fashion")!],
      isActive: true,
    },
    {
      name: "Seasonal Sale Banner",
      description: "Eye-catching template for clothing sales",
      mediaType: MediaType.IMAGE,
      promptTemplate: `Create a bold sale advertisement for {{productName}}.

Discount: {{discount}}
Sale Period: {{period}}
Featured Items: {{items}}
Urgency Message: {{urgency}}

Design an attention-grabbing sale banner with bold typography and vibrant colors. Create urgency and excitement.`,
      variables: [
        {
          name: "productName",
          label: "Sale Name",
          type: VariableType.TEXT,
          placeholder: "e.g., Winter Clearance Sale",
          required: true,
        },
        {
          name: "discount",
          label: "Discount Amount",
          type: VariableType.TEXT,
          placeholder: "e.g., Up to 70% OFF",
          required: true,
        },
        {
          name: "period",
          label: "Sale Period",
          type: VariableType.TEXT,
          placeholder: "e.g., This Weekend Only",
          required: false,
        },
        {
          name: "items",
          label: "Featured Items",
          type: VariableType.TEXTAREA,
          placeholder: "List featured sale items",
          required: false,
        },
        {
          name: "urgency",
          label: "Urgency Message",
          type: VariableType.TEXT,
          placeholder: "e.g., Limited Stock, Hurry!",
          defaultValue: "Limited Time Only",
          required: false,
        },
      ],
      previewImages: [
        "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&h=1200&fit=crop&q=80",
      ],
      referenceAdImage:
        "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&h=1200&fit=crop&q=80",
      categoryIds: [categoryMap.get("fashion")!],
      isActive: true,
    },

    // ============================================================
    // E-COMMERCE CATEGORY TEMPLATES (3 templates)
    // ============================================================
    {
      name: "Product Spotlight",
      description: "Clean template for showcasing any e-commerce product",
      mediaType: MediaType.IMAGE,
      promptTemplate: `Create a professional product advertisement for {{productName}}.

Key Features: {{features}}
Benefits: {{benefits}}
Price: {{price}}
Special Offer: {{offer}}

Design a clean, modern ad that highlights the product's value. Use professional photography style and clear call-to-action.`,
      variables: [
        {
          name: "productName",
          label: "Product Name",
          type: VariableType.TEXT,
          placeholder: "e.g., Smart Home Device",
          required: true,
        },
        {
          name: "features",
          label: "Key Features",
          type: VariableType.TEXTAREA,
          placeholder: "List main features",
          required: true,
        },
        {
          name: "benefits",
          label: "Benefits",
          type: VariableType.TEXTAREA,
          placeholder: "Why customers should buy this",
          required: true,
        },
        {
          name: "price",
          label: "Price",
          type: VariableType.TEXT,
          placeholder: "e.g., $99.99",
          required: false,
        },
        {
          name: "offer",
          label: "Special Offer",
          type: VariableType.TEXT,
          placeholder: "e.g., Free Shipping, 10% OFF",
          required: false,
        },
      ],
      previewImages: [
        "https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=1200&h=1200&fit=crop&q=80",
      ],
      referenceAdImage:
        "https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=1200&h=1200&fit=crop&q=80",
      categoryIds: [categoryMap.get("e-commerce")!],
      isActive: true,
    },
    {
      name: "Unboxing Experience",
      description: "Video template showing product unboxing",
      mediaType: MediaType.VIDEO,
      promptTemplate: `Create an exciting unboxing video for {{productName}}.

What's Included: {{contents}}
First Impressions: {{impressions}}
Key Highlights: {{highlights}}
Duration: {{duration}}

Show the unboxing experience with close-up shots. Build anticipation and showcase packaging quality and product details.`,
      variables: [
        {
          name: "productName",
          label: "Product Name",
          type: VariableType.TEXT,
          placeholder: "e.g., Premium Gift Set",
          required: true,
        },
        {
          name: "contents",
          label: "Package Contents",
          type: VariableType.TEXTAREA,
          placeholder: "What's inside the box?",
          required: true,
        },
        {
          name: "impressions",
          label: "First Impressions",
          type: VariableType.TEXT,
          placeholder: "Initial reaction and quality notes",
          required: false,
        },
        {
          name: "highlights",
          label: "Key Highlights",
          type: VariableType.TEXT,
          placeholder: "Most impressive features",
          required: false,
        },
        {
          name: "duration",
          label: "Duration",
          type: VariableType.TEXT,
          placeholder: "e.g., 30 seconds",
          defaultValue: "30 seconds",
          required: false,
        },
      ],
      previewImages: [
        "https://images.unsplash.com/photo-1523474253046-8cd2748b5fd2?w=1200&h=1200&fit=crop&q=80",
      ],
      referenceAdImage:
        "https://images.unsplash.com/photo-1523474253046-8cd2748b5fd2?w=1200&h=1200&fit=crop&q=80",
      categoryIds: [categoryMap.get("e-commerce")!],
      isActive: true,
    },
    {
      name: "Flash Sale Countdown",
      description: "Urgent template for limited-time offers",
      mediaType: MediaType.IMAGE,
      promptTemplate: `Design an urgent flash sale advertisement for {{productName}}.

Discount: {{discount}}
Time Remaining: {{countdown}}
Limited Quantity: {{quantity}}
Call to Action: {{cta}}

Create a high-energy ad with bold colors and countdown timer. Emphasize urgency and scarcity to drive immediate action.`,
      variables: [
        {
          name: "productName",
          label: "Product Name",
          type: VariableType.TEXT,
          placeholder: "e.g., Best Seller Bundle",
          required: true,
        },
        {
          name: "discount",
          label: "Discount",
          type: VariableType.TEXT,
          placeholder: "e.g., 50% OFF",
          required: true,
        },
        {
          name: "countdown",
          label: "Time Remaining",
          type: VariableType.TEXT,
          placeholder: "e.g., 24 Hours Left",
          required: true,
        },
        {
          name: "quantity",
          label: "Limited Quantity",
          type: VariableType.TEXT,
          placeholder: "e.g., Only 50 left in stock",
          required: false,
        },
        {
          name: "cta",
          label: "Call to Action",
          type: VariableType.TEXT,
          placeholder: "e.g., Shop Now, Claim Deal",
          defaultValue: "Shop Now",
          required: false,
        },
      ],
      previewImages: [
        "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1200&h=1200&fit=crop&q=80",
      ],
      referenceAdImage:
        "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1200&h=1200&fit=crop&q=80",
      categoryIds: [categoryMap.get("e-commerce")!],
      isActive: true,
    },

    // ============================================================
    // ELECTRONICS CATEGORY TEMPLATES (3 templates)
    // ============================================================
    {
      name: "Tech Specs Showcase",
      description: "Highlight technical specifications and features",
      mediaType: MediaType.IMAGE,
      promptTemplate: `Create a technical showcase advertisement for {{productName}}.

Key Specs: {{specs}}
Performance: {{performance}}
Compatibility: {{compatibility}}
Price: {{price}}

Design a sleek, modern ad that emphasizes technical excellence. Use clean layouts and highlight key specifications.`,
      variables: [
        {
          name: "productName",
          label: "Product Name",
          type: VariableType.TEXT,
          placeholder: "e.g., Gaming Laptop Pro",
          required: true,
        },
        {
          name: "specs",
          label: "Technical Specifications",
          type: VariableType.TEXTAREA,
          placeholder: "List key technical specs",
          required: true,
        },
        {
          name: "performance",
          label: "Performance Highlights",
          type: VariableType.TEXT,
          placeholder: "e.g., 10x faster processing",
          required: false,
        },
        {
          name: "compatibility",
          label: "Compatibility",
          type: VariableType.TEXT,
          placeholder: "e.g., Works with all devices",
          required: false,
        },
        {
          name: "price",
          label: "Price",
          type: VariableType.TEXT,
          placeholder: "e.g., $1,299",
          required: false,
        },
      ],
      previewImages: [
        "https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=1200&h=1200&fit=crop&q=80",
      ],
      referenceAdImage:
        "https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=1200&h=1200&fit=crop&q=80",
      categoryIds: [categoryMap.get("electronics")!],
      isActive: true,
    },
    {
      name: "Product Demo Video",
      description: "Show electronics in action with demonstrations",
      mediaType: MediaType.VIDEO,
      promptTemplate: `Create a product demonstration video for {{productName}}.

Features to Demo: {{features}}
Use Cases: {{useCases}}
Benefits: {{benefits}}
Duration: {{duration}}

Demonstrate the product's functionality with clear visuals. Use close-ups and annotations to highlight features.`,
      variables: [
        {
          name: "productName",
          label: "Product Name",
          type: VariableType.TEXT,
          placeholder: "e.g., Wireless Earbuds",
          required: true,
        },
        {
          name: "features",
          label: "Features to Demonstrate",
          type: VariableType.TEXTAREA,
          placeholder: "List features to show",
          required: true,
        },
        {
          name: "useCases",
          label: "Use Cases",
          type: VariableType.TEXT,
          placeholder: "e.g., Work, Gym, Travel",
          required: false,
        },
        {
          name: "benefits",
          label: "Key Benefits",
          type: VariableType.TEXT,
          placeholder: "Why this product stands out",
          required: false,
        },
        {
          name: "duration",
          label: "Duration",
          type: VariableType.TEXT,
          placeholder: "e.g., 30 seconds",
          defaultValue: "30 seconds",
          required: false,
        },
      ],
      previewImages: [
        "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=1200&h=1200&fit=crop&q=80",
      ],
      referenceAdImage:
        "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=1200&h=1200&fit=crop&q=80",
      categoryIds: [categoryMap.get("electronics")!],
      isActive: true,
    },
    {
      name: "Innovation Highlight",
      description: "Emphasize cutting-edge technology and innovation",
      mediaType: MediaType.IMAGE,
      promptTemplate: `Design an innovative tech advertisement for {{productName}}.

Innovation: {{innovation}}
Technology: {{technology}}
Target Users: {{users}}
Availability: {{availability}}

Create a futuristic ad that showcases breakthrough technology. Use modern design elements and tech-inspired visuals.`,
      variables: [
        {
          name: "productName",
          label: "Product Name",
          type: VariableType.TEXT,
          placeholder: "e.g., AI Smart Camera",
          required: true,
        },
        {
          name: "innovation",
          label: "Key Innovation",
          type: VariableType.TEXTAREA,
          placeholder: "What makes this innovative?",
          required: true,
        },
        {
          name: "technology",
          label: "Technology Used",
          type: VariableType.TEXT,
          placeholder: "e.g., AI-powered, 5G enabled",
          required: false,
        },
        {
          name: "users",
          label: "Target Users",
          type: VariableType.TEXT,
          placeholder: "e.g., Professionals, Creators",
          required: false,
        },
        {
          name: "availability",
          label: "Availability",
          type: VariableType.TEXT,
          placeholder: "e.g., Pre-order now, In stock",
          required: false,
        },
      ],
      previewImages: [
        "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1200&h=1200&fit=crop&q=80",
      ],
      referenceAdImage:
        "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1200&h=1200&fit=crop&q=80",
      categoryIds: [categoryMap.get("electronics")!],
      isActive: true,
    },

    // ============================================================
    // BEAUTY CATEGORY TEMPLATES (3 templates)
    // ============================================================
    {
      name: "Glow Up Transformation",
      description: "Before/after beauty transformation showcase",
      mediaType: MediaType.IMAGE,
      promptTemplate: `Create a stunning transformation advertisement for {{productName}}.

Results: {{results}}
Key Ingredients: {{ingredients}}
Skin Type: {{skinType}}
Usage: {{usage}}

Design an elegant before/after ad that showcases visible results. Use soft, natural lighting and clean aesthetics.`,
      variables: [
        {
          name: "productName",
          label: "Product Name",
          type: VariableType.TEXT,
          placeholder: "e.g., Radiance Serum",
          required: true,
        },
        {
          name: "results",
          label: "Expected Results",
          type: VariableType.TEXTAREA,
          placeholder: "What transformation to expect",
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
          placeholder: "e.g., All skin types",
          required: false,
        },
        {
          name: "usage",
          label: "How to Use",
          type: VariableType.TEXT,
          placeholder: "e.g., Apply twice daily",
          required: false,
        },
      ],
      previewImages: [
        "https://images.unsplash.com/photo-1596755389378-c31d21fd1273?w=1200&h=1200&fit=crop&q=80",
      ],
      referenceAdImage:
        "https://images.unsplash.com/photo-1596755389378-c31d21fd1273?w=1200&h=1200&fit=crop&q=80",
      categoryIds: [categoryMap.get("beauty")!],
      isActive: true,
    },
    {
      name: "Beauty Tutorial Video",
      description: "Quick tutorial showing product application",
      mediaType: MediaType.VIDEO,
      promptTemplate: `Create a beauty tutorial video for {{productName}}.

Tutorial Steps: {{steps}}
Tips & Tricks: {{tips}}
Final Look: {{finalLook}}
Duration: {{duration}}

Show step-by-step application with close-up shots. Use soft lighting and demonstrate techniques clearly.`,
      variables: [
        {
          name: "productName",
          label: "Product Name",
          type: VariableType.TEXT,
          placeholder: "e.g., Contour Palette",
          required: true,
        },
        {
          name: "steps",
          label: "Tutorial Steps",
          type: VariableType.TEXTAREA,
          placeholder: "Step-by-step application guide",
          required: true,
        },
        {
          name: "tips",
          label: "Tips & Tricks",
          type: VariableType.TEXT,
          placeholder: "Pro tips for best results",
          required: false,
        },
        {
          name: "finalLook",
          label: "Final Look Description",
          type: VariableType.TEXT,
          placeholder: "e.g., Natural glow, Bold glam",
          required: false,
        },
        {
          name: "duration",
          label: "Duration",
          type: VariableType.TEXT,
          placeholder: "e.g., 30 seconds",
          defaultValue: "30 seconds",
          required: false,
        },
      ],
      previewImages: [
        "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=1200&h=1200&fit=crop&q=80",
      ],
      referenceAdImage:
        "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=1200&h=1200&fit=crop&q=80",
      categoryIds: [categoryMap.get("beauty")!],
      isActive: true,
    },
    {
      name: "Luxury Beauty Collection",
      description: "Premium template for high-end beauty products",
      mediaType: MediaType.IMAGE,
      promptTemplate: `Design a luxurious advertisement for {{productName}}.

Collection: {{collection}}
Benefits: {{benefits}}
Exclusive Features: {{features}}
Price: {{price}}

Create an elegant, sophisticated ad that exudes luxury. Use premium aesthetics, gold accents, and refined typography.`,
      variables: [
        {
          name: "productName",
          label: "Product Name",
          type: VariableType.TEXT,
          placeholder: "e.g., Premium Skincare Set",
          required: true,
        },
        {
          name: "collection",
          label: "Collection Name",
          type: VariableType.TEXT,
          placeholder: "e.g., Luxury Gold Series",
          required: false,
        },
        {
          name: "benefits",
          label: "Key Benefits",
          type: VariableType.TEXTAREA,
          placeholder: "List main benefits",
          required: true,
        },
        {
          name: "features",
          label: "Exclusive Features",
          type: VariableType.TEXT,
          placeholder: "What makes this premium?",
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
        "https://images.unsplash.com/photo-1571875257727-256c39da42af?w=1200&h=1200&fit=crop&q=80",
      ],
      referenceAdImage:
        "https://images.unsplash.com/photo-1571875257727-256c39da42af?w=1200&h=1200&fit=crop&q=80",
      categoryIds: [categoryMap.get("beauty")!],
      isActive: true,
    },
  ];

  // Create templates one by one to avoid conflicts
  for (const templateData of templates) {
    try {
      // Create or get variables first
      const variableIds: string[] = [];
      for (const varData of templateData.variables) {
        const variable = await prisma.variable
          .upsert({
            where: { id: "000000000000000000000000" }, // Dummy ID since we don't have a unique name index
            update: varData,
            create: {
              ...varData,
              userId: demoUser.id,
            },
          })
          .catch(async () => {
            // If upsert fails (it will since dummy ID won't match), find by name and userId
            let existingVar = await prisma.variable.findFirst({
              where: { name: varData.name, userId: demoUser.id },
            });
            if (existingVar) {
              return await prisma.variable.update({
                where: { id: existingVar.id },
                data: varData,
              });
            }
            return await prisma.variable.create({
              data: {
                ...varData,
                userId: demoUser.id,
              },
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
        referenceAdImage: templateData.referenceAdImage,
        categoryIds: templateData.categoryIds,
        mediaType: templateData.mediaType,
        isActive: templateData.isActive,
        userId: null, // Global templates
      };

      if (existing) {
        await prisma.template.update({
          where: { id: existing.id },
          data: templatePayload,
        });
        console.log(
          `✅ Updated template: ${templateData.name} (${templateData.mediaType})`,
        );
      } else {
        await prisma.template.create({
          data: templatePayload,
        });
        console.log(
          `✅ Created template: ${templateData.name} (${templateData.mediaType})`,
        );
      }
    } catch (error) {
      console.error(
        `❌ Error creating template "${templateData.name}":`,
        error,
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
