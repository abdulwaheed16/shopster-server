import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function cleanupCategories() {
  console.log("🔍 Scouting for duplicate categories...");

  // 1. Get all categories
  const allCategories = await prisma.category.findMany();

  // 2. Group by name (case-insensitive)
  const groupedByName: Record<string, typeof allCategories> = {};

  for (const cat of allCategories) {
    const nameKey = cat.name.trim().toLowerCase();
    if (!groupedByName[nameKey]) {
      groupedByName[nameKey] = [];
    }
    groupedByName[nameKey].push(cat);
  }

  // 3. Identify duplicates
  const duplicates = Object.entries(groupedByName).filter(
    ([_, cats]) => cats.length > 1,
  );

  if (duplicates.length === 0) {
    console.log("✅ No duplicate categories found.");
    return;
  }

  console.log(`Found ${duplicates.length} duplicate groups.`);

  for (const [name, cats] of duplicates) {
    // Keep the first one as canonical (or the one with the most associations if we wanted to be fancy)
    const [canonical, ...toRemove] = cats;
    console.log(`\n📦 Group: "${cats[0].name}"`);
    console.log(`   Keeping: ${canonical.id}`);

    const duplicateIds = toRemove.map((c) => c.id);
    console.log(`   Consolidating ${duplicateIds.length} duplicates...`);

    // 4. Update Templates
    // Templates have categoryIds: String[]
    const templatesToUpdate = await prisma.template.findMany({
      where: {
        categoryIds: {
          hasSome: duplicateIds,
        },
      },
    });

    for (const template of templatesToUpdate) {
      const updatedCategoryIds = template.categoryIds.map((id) =>
        duplicateIds.includes(id) ? canonical.id : id,
      );

      // Remove duplicates after replacement
      const uniqueCategoryIds = Array.from(new Set(updatedCategoryIds));

      await prisma.template.update({
        where: { id: template.id },
        data: {
          categoryIds: uniqueCategoryIds,
        },
      });
    }
    console.log(`   Updated ${templatesToUpdate.length} templates.`);

    // 5. Update Products
    // Products also have categoryIds: String[]
    const productsToUpdate = await prisma.product.findMany({
      where: {
        categoryIds: {
          hasSome: duplicateIds,
        },
      },
    });

    for (const product of productsToUpdate) {
      const updatedCategoryIds = product.categoryIds.map((id) =>
        duplicateIds.includes(id) ? canonical.id : id,
      );

      const uniqueCategoryIds = Array.from(new Set(updatedCategoryIds));

      await prisma.product.update({
        where: { id: product.id },
        data: {
          categoryIds: uniqueCategoryIds,
        },
      });
    }
    console.log(`   Updated ${productsToUpdate.length} products.`);

    // 6. Delete redundant categories
    await prisma.category.deleteMany({
      where: {
        id: { in: duplicateIds },
      },
    });
    console.log(`   Deleted ${duplicateIds.length} redundant categories.`);
  }

  console.log("\n✨ Category cleanup complete!");
}

cleanupCategories()
  .catch((e) => {
    console.error("❌ Cleanup failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
