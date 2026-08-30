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

async function fixDates() {
  console.log("Fixing invalid dates in Deal table...");
  try {
    // expired_at can be NULL
    await prisma.$executeRaw`UPDATE Deal SET expired_at = NULL WHERE expired_at = '0000-00-00 00:00:00'`;
    
    // last_updated can be NULL
    await prisma.$executeRaw`UPDATE Deal SET last_updated = NULL WHERE last_updated = '0000-00-00 00:00:00'`;

    // created_at and updated_at cannot be NULL, set to minimum valid timestamp
    await prisma.$executeRaw`UPDATE Deal SET created_at = '1970-01-01 00:00:01' WHERE created_at = '0000-00-00 00:00:00'`;
    await prisma.$executeRaw`UPDATE Deal SET updated_at = '1970-01-01 00:00:01' WHERE updated_at = '0000-00-00 00:00:00'`;
    
    console.log("Dates fixed successfully!");
  } catch (error) {
    console.error("Error fixing dates:", error);
  } finally {
    await prisma.$disconnect();
  }
}

fixDates();
