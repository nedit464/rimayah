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
  const selPath = path.join(__dirname, 'selected-net-extras.json')
  if (!fs.existsSync(selPath)) {
    console.error('Selection file not found:', selPath)
    process.exit(1)
  }
  const sel = JSON.parse(fs.readFileSync(selPath, 'utf8'))
  const ids = sel.selected.map(s => s.id)
  if (!ids.length) {
    console.log('No ids to delete')
    process.exit(0)
  }

  await pool.query('BEGIN')
  try {
    const q = await pool.query(`SELECT id, "memberBillingId" AS memberbillingid, "fundId" AS fundid, amount FROM "IncomeTransaction" WHERE id = ANY($1)`, [ids])
    const rows = q.rows
    const memberBillingIds = rows.map(r => r.memberbillingid).filter(Boolean)
    const fundIds = [...new Set(rows.map(r => r.fundid))]

    if (memberBillingIds.length) {
      await pool.query(`UPDATE "MemberBilling" SET status = $1, "paidAt" = NULL, "verifiedAt" = NULL WHERE id = ANY($2)`, ['BELUM_BAYAR', memberBillingIds])
    }

    const del = await pool.query(`DELETE FROM "IncomeTransaction" WHERE id = ANY($1) RETURNING id`, [ids])
    console.log('Deleted income transactions:', del.rowCount)

    // Recompute fund balances for affected funds
    for (const fundId of fundIds) {
      const inc = await pool.query(`SELECT COALESCE(SUM(amount),0) as total FROM "IncomeTransaction" WHERE "fundId" = $1 AND (title NOT ILIKE '%jersey%' AND COALESCE(description,'') NOT ILIKE '%jersey%')`, [fundId])
      const exp = await pool.query(`SELECT COALESCE(SUM(amount),0) as total FROM "ExpenseTransaction" WHERE "fundId" = $1`, [fundId])
      const incomeTotal = Number(inc.rows[0].total)
      const expenseTotal = Number(exp.rows[0].total)
      const newBal = incomeTotal - expenseTotal
      await pool.query(`UPDATE "Fund" SET balance = $1 WHERE id = $2`, [newBal, fundId])
      console.log('Updated Fund', fundId, 'new balance:', newBal)
    }

    await pool.query('COMMIT')
    await pool.end()
  } catch (e) {
    await pool.query('ROLLBACK')
    await pool.end()
    console.error('Error during deletion:', e)
    process.exit(1)
  }
}

main().catch(e => { console.error(e); process.exit(1) })
