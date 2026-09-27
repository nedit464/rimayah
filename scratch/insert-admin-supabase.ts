import * as fs from 'fs'
import * as path from 'path'

// Parse .env.local manually
const envPath = path.join(__dirname, '..', '.env.local')
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8')
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim()
    if (trimmed && !trimmed.startsWith('#')) {
      const parts = trimmed.split('=')
      if (parts.length >= 2) {
        const key = parts[0].trim()
        let val = parts.slice(1).join('=').trim()
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.substring(1, val.length - 1)
        }
        process.env[key] = val
      }
    }
  })
}

console.log('DATABASE_URL:', process.env.DATABASE_URL)

import { Pool } from 'pg'
import bcrypt from 'bcryptjs'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 10000,
})

async function main() {
  // First, list existing admins
  const existing = await pool.query('SELECT id, username FROM "Admin"')
  console.log('Existing admins:', existing.rows.length)
  
  // Delete existing
  await pool.query('DELETE FROM "AdminSession"')
  await pool.query('DELETE FROM "Admin"')
  console.log('Cleared old admins.')
  
  // Hash password
  const passwordHash = await bcrypt.hash('admin123', 12)
  
  // Generate ID using cuid-like pattern
  const { createId } = await import('@paralleldrive/cuid2').catch(() => ({ createId: () => 'c' + Date.now().toString(36) + Math.random().toString(36).slice(2, 9) }))
  const id = typeof createId === 'function' ? createId() : ('c' + Date.now().toString(36) + Math.random().toString(36).slice(2, 9))
  
  // Insert with correct columns (Admin has: id, username, passwordHash, createdAt)
  const result = await pool.query(
    `INSERT INTO "Admin" (id, username, "passwordHash", "createdAt") 
     VALUES ($1, $2, $3, NOW()) 
     RETURNING id, username`,
    [id, 'bendahara', passwordHash]
  )
  
  console.log('\n✅ Admin berhasil dibuat di Supabase!')
  console.log('ID:', result.rows[0].id)
  console.log('Username:', result.rows[0].username)
  console.log('Password: admin123')
  
  // Verify
  const verify = await pool.query('SELECT id, username, "passwordHash" FROM "Admin"')
  console.log('\nVerifikasi - Total admin di DB:', verify.rows.length)
  const match = await bcrypt.compare('admin123', verify.rows[0].passwordHash)
  console.log('Test bcrypt "admin123":', match ? '✅ COCOK' : '❌ TIDAK COCOK')
  
  await pool.end()
}

main().catch(e => {
  console.error('Error:', e.message)
  pool.end().catch(() => {})
})
