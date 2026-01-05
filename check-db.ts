import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const templateCount = await prisma.template.count();
  const productCount = await prisma.product.count();
  const userTemplates = await prisma.template.count({
    where: { userId: { not: null } },
  });
  const globalTemplates = await prisma.template.count({
    where: { userId: null },
  });

  console.log("--- DB Stats ---");
  console.log(`Total Templates: ${templateCount}`);
  console.log(`User Templates: ${userTemplates}`);
  console.log(`Global Templates: ${globalTemplates}`);
  console.log(`Total Products: ${productCount}`);
  console.log("----------------");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
