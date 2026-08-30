const { PrismaClient } = require("@prisma/client");
const { PrismaMariaDb } = require("@prisma/adapter-mariadb");

const adapterConfig = {
  host: "127.0.0.1",
  user: "root",
  password: "",
  database: "activevoucher",
  port: 3306,
  connectionLimit: 5,
};

const adapter = new PrismaMariaDb(adapterConfig);
const prisma = new PrismaClient({ adapter });

async function fixAllDates() {
  console.log("Fixing invalid dates in all tables...");
  try {
    const tables = ["Deal", "Category", "Collection"];
    
    for (const table of tables) {
        try {
            await prisma.$executeRawUnsafe(`UPDATE \`${table}\` SET created_at = '1970-01-01 00:00:01' WHERE created_at = '0000-00-00 00:00:00'`);
        } catch (e) {}
        try {
            await prisma.$executeRawUnsafe(`UPDATE \`${table}\` SET updated_at = '1970-01-01 00:00:01' WHERE updated_at = '0000-00-00 00:00:00'`);
        } catch (e) {}
        try {
            await prisma.$executeRawUnsafe(`UPDATE \`${table}\` SET createdAt = '1970-01-01 00:00:01' WHERE createdAt = '0000-00-00 00:00:00'`);
        } catch (e) {}
        try {
            await prisma.$executeRawUnsafe(`UPDATE \`${table}\` SET updatedAt = '1970-01-01 00:00:01' WHERE updatedAt = '0000-00-00 00:00:00'`);
        } catch (e) {}
    }
    
    console.log("All dates fixed successfully!");
  } catch (error) {
    console.error("Error fixing dates:", error);
  } finally {
    await prisma.$disconnect();
  }
}

fixAllDates();
