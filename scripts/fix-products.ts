import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function cleanup() {
  console.log("Checking for invalid products...");

  try {
    // We cannot use prisma.product.deleteMany with where clause on required fields easily
    // if the schema expects String but DB has null.
    // So we use runCommandRaw to execute MongoDB native delete command.

    const result = await prisma.$runCommandRaw({
      delete: "products",
      deletes: [
        {
          q: {
            $or: [{ storeId: null }, { externalId: null }],
          },
          limit: 0, // 0 = delete all matching documents
        },
      ],
    });

    console.log("Cleanup result:", result);
  } catch (error) {
    console.error("Cleanup failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanup();
