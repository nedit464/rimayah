const fs = require('fs')
const path = require('path')
const { Pool } = require('pg')

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

const pool = new Pool({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 10000 })

async function main() {
  // Try find fund named 'Kas Utama'
  const res = await pool.query(`SELECT id, name, balance FROM "Fund" WHERE name = $1 LIMIT 1`, ['Kas Utama'])
  let fund = res.rows[0]
  if (!fund) {
    // fallback: first fund
    const all = await pool.query(`SELECT id, name, balance FROM "Fund" ORDER BY createdAt LIMIT 1`)
    fund = all.rows[0]
  }
  if (!fund) {
    console.error('No fund found to update')
    await pool.end()
    process.exit(1)
  }

  console.log(`Found fund: ${fund.name} (${fund.id}), current balance: ${fund.balance}`)

  await pool.query(`UPDATE "Fund" SET balance = $1, "updatedAt" = NOW() WHERE id = $2`, [0, fund.id])
  console.log('Balance updated to 0')

  await pool.end()
}

main().catch(async e => { console.error(e); await pool.end(); process.exit(1) })
