import { PrismaClient } from "@prisma/client"
import { PrismaMariaDb } from "@prisma/adapter-mariadb"
import { getDbConfig, isDbConfigured } from "./db-config"

// Using a new global key to force bypass any stale cached instances (v4)
const globalForPrisma = globalThis as unknown as { prisma_v7: PrismaClient | undefined }

function getAdapterConfig() {
  const config = getDbConfig();
  
  if (config) {
    return {
      host: (config.host === "localhost" || config.host === "127.0.0.1") ? "127.0.0.1" : config.host,
      user: config.user,
      password: config.password || "",
      database: config.database,
      port: config.port || 3306,
      connectionLimit: 5, // Reduced from 10 to prevent shared hosting limits
      connectTimeout: 10000, // Increased to 10s for slow DB response
    };
  }

  // If in production and no config, we return a config that will fail fast
  if (process.env.NODE_ENV === "production") {
    return {
      host: "127.0.0.1",
      user: "unconfigured",
      password: "",
      database: "unconfigured",
      port: 3306,
      connectionLimit: 1,
      connectTimeout: 1000,
    };
  }

  // Fallback to ENV for local development
  const dbUrl = process.env.DATABASE_URL || "mysql://root@127.0.0.1:3306/activevoucher"
  let url: URL;
  try {
    url = new URL(dbUrl);
  } catch (e) {
    url = new URL("mysql://root@127.0.0.1:3306/activevoucher");
  }

  const dbHost = process.env.HOST || url.hostname || "127.0.0.1"
  const dbUser = process.env.DB_USER || url.username || "root" // Changed USERNAME to DB_USER to avoid OS conflict
  const dbPass = process.env.PASSWORD || url.password || ""
  const dbName = process.env.DBNAME || url.pathname.replace('/', '') || "activevoucher"
  const dbPort = Number(process.env.PORT_DB || url.port) || 3306

  return {
    host: (dbHost === "localhost" || dbHost === "127.0.0.1") ? "127.0.0.1" : dbHost,
    user: dbUser,
    password: dbPass,
    database: dbName,
    port: dbPort,
    connectionLimit: 10,
    connectTimeout: 5000,
  }
}

// Cache variables for dynamic client reload
let cachedClient: PrismaClient | null = null;
let cachedClientWasConfigured = false;

const createClientInstance = () => {
  if (!isDbConfigured()) {
    // Return a dummy Proxy client to reject all operations immediately without initiating connection pool
    return new Proxy({}, {
      get(target, prop) {
        return new Proxy(() => {}, {
          get(t, p) {
            if (p === 'then') return undefined; // Avoid blocking async checks
            return () => Promise.reject(new Error("Database is not configured."));
          },
          apply() {
            return Promise.reject(new Error("Database is not configured."));
          }
        });
      }
    }) as unknown as PrismaClient;
  }

  try {
    const adapterConfig = getAdapterConfig();
    const adapter = new PrismaMariaDb(adapterConfig);
    
    return new PrismaClient({
      adapter: adapter,
      log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    });
  } catch (e) {
    console.error("CRITICAL: Failed to initialize PrismaClient:", e);
    return new Proxy({}, {
      get(target, prop) {
        return new Proxy(() => {}, {
          get(t, p) {
            if (p === 'then') return undefined;
            return () => Promise.reject(new Error("Database client initialization failed."));
          },
          apply() {
            return Promise.reject(new Error("Database client initialization failed."));
          }
        });
      }
    }) as unknown as PrismaClient;
  }
};

const getClient = (): PrismaClient => {
  const configured = isDbConfigured();
  
  // Dynamic client recreation: if no client exists, or if we were unconfigured but are now configured
  if (!cachedClient || (!cachedClientWasConfigured && configured)) {
    if (cachedClient && cachedClientWasConfigured) {
      cachedClient.$disconnect().catch(() => {});
    }
    cachedClient = createClientInstance();
    cachedClientWasConfigured = configured;
  }
  
  return cachedClient;
};

// Export db as a Proxy that forwards all property accesses to the dynamically resolved client
export const db = new Proxy({}, {
  get(target, prop) {
    const client = getClient();
    const value = Reflect.get(client, prop);
    if (typeof value === 'function') {
      return value.bind(client);
    }
    return value;
  }
}) as unknown as PrismaClient;

// Reset the database client instance manually (useful for setup wizard)
export const resetDbClient = () => {
  cachedClient = null;
  cachedClientWasConfigured = false;
};

