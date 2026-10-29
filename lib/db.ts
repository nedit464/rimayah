import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
dotenv.config({ path: '.env' })

import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
  pool: Pool | undefined
}

const connectionString = process.env.DATABASE_URL || "postgresql://postgres:password@127.0.0.1:5432/saad_furusiyah"

const pool = globalForPrisma.pool ?? new Pool({
  connectionString,
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 300000,
})

const adapter = new PrismaPg(pool)
const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter })

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.pool = pool
  globalForPrisma.prisma = prisma
}

let schemaEnsured = false
let schemaPromise: Promise<void> | null = null

export async function ensureDbSchema() {
  if (schemaEnsured) return
  if (schemaPromise) return schemaPromise

  schemaPromise = (async () => {
    try {
      await pool.query(`
        ALTER TABLE "Billing" ADD COLUMN IF NOT EXISTS "validUntil" TIMESTAMP(3);
      `)
      schemaEnsured = true
    } catch (err: any) {
      console.warn('Auto-migration warning in ensureDbSchema:', err?.message)
    } finally {
      schemaPromise = null
    }
  })()

  return schemaPromise
}

// Trigger initial migration immediately on module load
ensureDbSchema().catch(() => {})

export { prisma, pool }
export { globalForPrisma }
