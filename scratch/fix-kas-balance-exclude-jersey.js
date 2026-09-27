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
  // find Kas Utama
  const fRes = await pool.query(`SELECT id, name, balance FROM "Fund" WHERE name = $1 LIMIT 1`, ['Kas Utama'])
  const fund = fRes.rows[0] || (await pool.query(`SELECT id, name, balance FROM "Fund" ORDER BY "createdAt" LIMIT 1`)).rows[0]
  if (!fund) {
    console.error('No fund found')
    await pool.end()
    process.exit(1)
  }

  console.log(`Found fund: ${fund.name} (${fund.id}), current balance: ${fund.balance}`)

  // Sum incomes for this fund excluding jersey-related titles/descriptions
  const incomeRes = await pool.query(
    `SELECT COALESCE(SUM(amount),0) as total FROM "IncomeTransaction" WHERE "fundId" = $1 AND (title NOT ILIKE '%jersey%' AND COALESCE(description,'') NOT ILIKE '%jersey%')`,
    [fund.id]
  )

  const expenseRes = await pool.query(`SELECT COALESCE(SUM(amount),0) as total FROM "ExpenseTransaction" WHERE "fundId" = $1`, [fund.id])

  const income = Number(incomeRes.rows[0].total)
  const expense = Number(expenseRes.rows[0].total)
  const corrected = income - expense

  // Also compute jersey total for info
  const jerseyRes = await pool.query(`SELECT COALESCE(SUM(amount),0) as total, COUNT(*) as cnt FROM "IncomeTransaction" WHERE "fundId" = $1 AND (title ILIKE '%jersey%' OR COALESCE(description,'') ILIKE '%jersey%')`, [fund.id])

  console.log(`Income (excluding jersey): ${income}`)
  console.log(`Expense: ${expense}`)
  console.log(`Jersey income: ${jerseyRes.rows[0].total} (count ${jerseyRes.rows[0].cnt})`)
  console.log(`Corrected balance to set: ${corrected}`)

  // Update fund balance
  await pool.query(`UPDATE "Fund" SET balance = $1, "updatedAt" = NOW() WHERE id = $2`, [corrected, fund.id])
  console.log('Fund.balance updated.')

  await pool.end()
}

main().catch(async e => { console.error('Error:', e); await pool.end(); process.exit(1) })
