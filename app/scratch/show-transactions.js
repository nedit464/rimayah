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
  const fRes = await pool.query(`SELECT id, name FROM "Fund" WHERE name = $1 LIMIT 1`, ['Kas Utama'])
  const fund = fRes.rows[0] || (await pool.query(`SELECT id, name FROM "Fund" ORDER BY "createdAt" LIMIT 1`)).rows[0]
  if (!fund) {
    console.error('No fund found')
    await pool.end()
    process.exit(1)
  }

  console.log('Fund:', fund)

  const incomesRes = await pool.query(`SELECT id, title, amount, date, description, "memberBillingId" FROM "IncomeTransaction" WHERE "fundId" = $1 AND (title NOT ILIKE '%jersey%' AND COALESCE(description,'') NOT ILIKE '%jersey%') ORDER BY date`, [fund.id])
  const incomes = incomesRes.rows
  const incomesSumRes = await pool.query(`SELECT COALESCE(SUM(amount),0) as total FROM "IncomeTransaction" WHERE "fundId" = $1 AND (title NOT ILIKE '%jersey%' AND COALESCE(description,'') NOT ILIKE '%jersey%')`, [fund.id])
  const incomesTotal = Number(incomesSumRes.rows[0].total)

  const jerseyRes = await pool.query(`SELECT id, title, amount, date, description FROM "IncomeTransaction" WHERE "fundId" = $1 AND (title ILIKE '%jersey%' OR COALESCE(description,'') ILIKE '%jersey%') ORDER BY date`, [fund.id])
  const jersey = jerseyRes.rows
  const jerseySumRes = await pool.query(`SELECT COALESCE(SUM(amount),0) as total FROM "IncomeTransaction" WHERE "fundId" = $1 AND (title ILIKE '%jersey%' OR COALESCE(description,'') ILIKE '%jersey%')`, [fund.id])
  const jerseyTotal = Number(jerseySumRes.rows[0].total)

  const expenseRes = await pool.query(`SELECT id, title, amount, date FROM "ExpenseTransaction" WHERE "fundId" = $1 ORDER BY date`, [fund.id])
  const expenses = expenseRes.rows
  const expenseSumRes = await pool.query(`SELECT COALESCE(SUM(amount),0) as total FROM "ExpenseTransaction" WHERE "fundId" = $1`, [fund.id])
  const expensesTotal = Number(expenseSumRes.rows[0].total)

  console.log('\n=== Income (excluding jersey) rows ===')
  incomes.forEach(r => console.log(`${r.id.slice(0,12)} | ${r.date.toISOString().slice(0,10)} | Rp${Number(r.amount).toLocaleString('id-ID')} | ${r.title}`))
  console.log('Total income (excl jersey): Rp' + incomesTotal.toLocaleString('id-ID'))

  console.log('\n=== Jersey income rows ===')
  jersey.forEach(r => console.log(`${r.id.slice(0,12)} | ${r.date.toISOString().slice(0,10)} | Rp${Number(r.amount).toLocaleString('id-ID')} | ${r.title}`))
  console.log('Total jersey income: Rp' + jerseyTotal.toLocaleString('id-ID'))

  console.log('\n=== Expenses rows ===')
  expenses.forEach(r => console.log(`${r.id.slice(0,12)} | ${r.date.toISOString().slice(0,10)} | Rp${Number(r.amount).toLocaleString('id-ID')} | ${r.title}`))
  console.log('Total expenses: Rp' + expensesTotal.toLocaleString('id-ID'))

  console.log('\n=== Final check ===')
  console.log('Computed balance (income excl jersey - expenses): Rp' + (incomesTotal - expensesTotal).toLocaleString('id-ID'))

  await pool.end()
}

main().catch(async e => { console.error('Error:', e); await pool.end(); process.exit(1) })
