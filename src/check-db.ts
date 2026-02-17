import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const categoryCount = await prisma.category.count();
  const templateCount = await prisma.template.count();
  const productCount = await prisma.product.count();
  const userCount = await prisma.user.count();

  console.log("--- Database Status ---");
  console.log(`Users: ${userCount}`);
  console.log(`Categories: ${categoryCount}`);
  console.log(`Templates: ${templateCount}`);
  console.log(`Products: ${productCount}`);
  console.log("-----------------------");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
