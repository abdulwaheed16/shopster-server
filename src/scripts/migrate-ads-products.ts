import { prisma } from "../config/database.config";

async function migrateAds() {
  console.log("Starting Ad migration...");

  // We use raw access because the Prisma client might already expect the new structure
  // and fail if we try to read using findMany if it's strictly typed.
  // However, Prisma for MongoDB is usually flexible.

  const ads = await (prisma.ad as any).findRaw({ filter: {} });
  console.log(`Found ${ads.length} ads to migrate.`);

  let migratedCount = 0;

  for (const adAny of ads as any[]) {
    // Check if it already has the new structure
    if (
      adAny.products &&
      Array.isArray(adAny.products) &&
      adAny.products.length > 0
    ) {
      continue;
    }

    const productIds = adAny.productIds || [];
    const legacySource = adAny.productSource || "STORE";

    const newProducts = productIds.map((id: any) => ({
      productId: id.$oid || id.toString(),
      source: legacySource,
    }));

    if (newProducts.length > 0) {
      await prisma.ad.update({
        where: { id: adAny._id.$oid || adAny._id },
        data: {
          products: {
            set: newProducts,
          },
        },
      });
      migratedCount++;
    }
  }

  console.log(`Migration complete. Migrated ${migratedCount} ads.`);
}

migrateAds()
  .catch((e) => {
    console.error("Migration failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
