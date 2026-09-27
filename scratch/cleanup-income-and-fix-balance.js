const fs = require('fs')
const path = require('path')
const { Pool } = require('pg')

// load .env.local
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
  const cutoff = new Date(2025, 11, 1) // Dec 1, 2025
  console.log('Cutoff date:', cutoff.toISOString())

  // Find Kas Utama fund (or use first fund if not found)
  const fundRes = await pool.query(`SELECT id, name, balance FROM "Fund" WHERE name = $1 LIMIT 1`, ['Kas Utama'])
  const fund = fundRes.rows[0]
  if (!fund) {
    console.error('Fund "Kas Utama" not found. Aborting.')
    await pool.end()
    process.exit(1)
  }
  const fundId = fund.id
  console.log(`Target fund: ${fund.name} (${fundId}), current balance: ${fund.balance}`)

  // List IncomeTransaction entries matching pattern
  const listRes = await pool.query(
    `SELECT id, title, amount, date, "memberBillingId" FROM "IncomeTransaction" WHERE "fundId" = $1 AND date >= $2 ORDER BY date`,
    [fundId, cutoff]
  )

  console.log(`Found ${listRes.rows.length} IncomeTransaction(s) for fund since cutoff:`)
  let total = 0
  listRes.rows.forEach(r => {
    total += Number(r.amount)
    console.log(`  [${r.id.slice(0,12)}] ${r.title} - Rp${Number(r.amount).toLocaleString('id-ID')} (${new Date(r.date).toLocaleDateString('id-ID')}) memberBillingId=${r.memberBillingId}`)
  })
  console.log(`Total amount found: Rp${total.toLocaleString('id-ID')}`)

  // Delete only entries that look like monthly kas or are not linked to memberBilling
  const idsToDelete = listRes.rows.filter(r => {
    const title = (r.title || '').toLowerCase()
    return title.includes('iuran kas') || r.memberbillingid == null
  }).map(r => r.id)

  if (idsToDelete.length === 0) {
    console.log('No matching IncomeTransaction rows to delete based on criteria.')
  } else {
    const delRes = await pool.query(`DELETE FROM "IncomeTransaction" WHERE id = ANY($1)`, [idsToDelete])
    console.log(`Deleted ${delRes.rowCount} IncomeTransaction row(s).`)
  }

  // Recalculate fund balance: sum incomes - sum expenses
  const incomeSumRes = await pool.query(`SELECT COALESCE(SUM(amount),0) as total FROM "IncomeTransaction" WHERE "fundId" = $1`, [fundId])
  const expenseSumRes = await pool.query(`SELECT COALESCE(SUM(amount),0) as total FROM "ExpenseTransaction" WHERE "fundId" = $1`, [fundId])

  const totalIncome = Number(incomeSumRes.rows[0].total)
  const totalExpenses = Number(expenseSumRes.rows[0].total)
  const newBalance = totalIncome - totalExpenses

  await pool.query(`UPDATE "Fund" SET balance = $1, "updatedAt" = NOW() WHERE id = $2`, [newBalance, fundId])
  console.log(`Updated Fund balance to ${newBalance} (income ${totalIncome} - expenses ${totalExpenses}).`)

  await pool.end()
  console.log('Cleanup complete. Please verify dashboard and fund balance.')
}

main().catch(async e => {
  console.error('Error:', e.message)
  await pool.end()
  process.exit(1)
})
