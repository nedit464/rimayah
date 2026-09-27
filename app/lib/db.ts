import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
  pool: Pool | undefined
}

// Bypass cache and force recreate pool and prisma client
// to ensure Next.js uses the latest DATABASE_URL from .env.local
const connectionString = process.env.DATABASE_URL || "postgresql://postgres:password@127.0.0.1:5432/saad_furusiyah"

if (globalForPrisma.pool) {
  // Try to end the old pool gracefully
  try {
    globalForPrisma.pool.end().catch(() => {})
  } catch(e) {}
}

const pool = new Pool({
  connectionString,
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 300000,
})

const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

globalForPrisma.pool = pool
globalForPrisma.prisma = prisma

export { prisma }
export { globalForPrisma }
