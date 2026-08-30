const { PrismaClient } = require("@prisma/client")
const { PrismaMariaDb } = require("@prisma/adapter-mariadb")
const dotenv = require("dotenv")

// Load env vars
dotenv.config()

async function main() {
  console.log("Testing connection with adapter and config object...")
  
  try {
    const dbUrl = process.env.DATABASE_URL
    if (!dbUrl) throw new Error("DATABASE_URL is missing in .env")
    
    const url = new URL(dbUrl)
    
    const adapterConfig = {
      host: (url.hostname === "localhost") ? "127.0.0.1" : (url.hostname || "127.0.0.1"),
      user: url.username || "root",
      password: url.password || "",
      database: url.pathname.replace('/', '') || "activevoucher",
      port: Number(url.port) || 3306,
      connectionLimit: 5,
    }

    const adapter = new PrismaMariaDb(adapterConfig)
    const prisma = new PrismaClient({ adapter })

    console.log("Executing query...")
    
    // Test Prisma
    const adminCount = await prisma.admin.count()
    console.log(`Prisma connection successful! Found ${adminCount} admins.`)

    await prisma.$disconnect()
    console.log("All tests passed!")
  } catch (e) {
    console.error("Connection failed with error:")
    console.error(e)
    process.exit(1)
  }
}

main()
