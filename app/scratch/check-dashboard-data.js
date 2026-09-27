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
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

  const startIso = startOfMonth.toISOString()
  const endIso = endOfMonth.toISOString()

  const res = await pool.query(`
    SELECT
      (SELECT COALESCE(SUM(balance),0) FROM "Fund") AS total_balance,
      (SELECT COALESCE(SUM(amount),0) FROM "IncomeTransaction" WHERE date >= $1::timestamptz AND date <= $2::timestamptz) AS income_this_month,
      (SELECT COALESCE(SUM(amount),0) FROM "ExpenseTransaction" WHERE date >= $1::timestamptz AND date <= $2::timestamptz) AS expense_this_month,
      (SELECT COUNT(*) FROM "Member" WHERE status = 'AKTIF') AS active_members
  `, [startIso, endIso])

  const mbRes = await pool.query(`
    SELECT status, COUNT(*) as cnt FROM "MemberBilling" mb
    JOIN "Billing" b ON b.id = mb."billingId"
    WHERE b.type = 'MONTHLY_KAS' AND b.month = $1 AND b.year = $2
    GROUP BY status
  `, [now.getMonth() + 1, now.getFullYear()])

  console.log('DB Dashboard Check:')
  console.log('Total balance:', Number(res.rows[0].total_balance))
  console.log('Income this month:', Number(res.rows[0].income_this_month))
  console.log('Expense this month:', Number(res.rows[0].expense_this_month))
  console.log('Active members:', Number(res.rows[0].active_members))
  console.log('MemberBilling status counts for monthly billings (since Dec 2025):')
  mbRes.rows.forEach(r => console.log(`  ${r.status}: ${r.cnt}`))

  await pool.end()
}

main().catch(async e => { console.error(e); await pool.end(); process.exit(1) })
