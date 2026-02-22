import { PrismaClient } from "@prisma/client";
import chalk from "chalk";
import { seedPlans } from "./plans.seed";
import { seedUsers } from "./users.seed";

const prisma = new PrismaClient();

//--------------------------------------------------------------------
// Database Seeding Script
// Populates database with initial data for development/testing
//--------------------------------------------------------------------

async function main() {
  try {
    console.log("🚀 Starting database seeding...\n");

    // Seed in order of dependencies
    console.log(chalk.blue("Seeding plans..."));
    await seedPlans(); // Creates standard subscription tiers
    console.log(chalk.green("Plans seeded successfully!"));

    console.log(chalk.blue("Seeding users..."));
    await seedUsers();
    console.log(chalk.green("Users seeded successfully!"));

    // console.log(chalk.blue("Seeding templates..."));
    // await seedTemplates(); // Creates categories and templates
    // console.log(chalk.green("Templates seeded successfully!"));

    // console.log(chalk.blue("Seeding products..."));
    // await seedProducts(); // Creates user, store, and products
    // console.log(chalk.green("Products seeded successfully!"));

    // console.log(chalk.blue("Seeding ads..."));
    // await seedAds(); // Creates ads (depends on products and templates)
    // console.log(chalk.green("Ads seeded successfully!"));

    console.log(chalk.green("🎉 All seeding completed successfully!"));
  } catch (error) {
    console.error(chalk.red("❌ Error seeding database:", error));
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
