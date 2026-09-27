const fs = require('fs')
const path = require('path')
const { Pool } = require('pg')

// load .env.local into process.env (same pattern as other scratch scripts)
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
  const cutoffYear = 2025
  const cutoffMonth = 12

  console.log(`Cutoff: ${cutoffMonth}/${cutoffYear} (inclusive)`)

  // 1) Find monthly billings from cutoff (MONTHLY_KAS)
  const billingRes = await pool.query(
    `SELECT id, month, year FROM "Billing" WHERE "type" = $1 AND ("year" > $2 OR ("year" = $2 AND "month" >= $3))`,
    ['MONTHLY_KAS', cutoffYear, cutoffMonth]
  )

  const billingIds = billingRes.rows.map(r => r.id)
  console.log(`Found ${billingIds.length} billing(s) to reset.`)

  if (billingIds.length === 0) {
    await pool.end()
    return
  }

  // 2) Find memberBilling entries for those billings
  const mbRes = await pool.query(`SELECT id FROM "MemberBilling" WHERE "billingId" = ANY($1)`, [billingIds])
  const memberBillingIds = mbRes.rows.map(r => r.id)
  console.log(`Found ${memberBillingIds.length} memberBilling record(s) to update.`)

  if (memberBillingIds.length === 0) {
    await pool.end()
    return
  }

  // 3) Delete income transactions linked to those member billings
  const delIncomeRes = await pool.query(`DELETE FROM "IncomeTransaction" WHERE "memberBillingId" = ANY($1)`, [memberBillingIds])
  console.log(`Deleted ${delIncomeRes.rowCount} IncomeTransaction row(s) linked to those member billings.`)

  // 4) Update member billings: mark as BELUM_BAYAR and clear paid/verified timestamps and notes
  const updRes = await pool.query(
    `UPDATE "MemberBilling" SET status = 'BELUM_BAYAR', "paidAt" = NULL, "verifiedAt" = NULL, notes = NULL, "updatedAt" = NOW() WHERE id = ANY($1)`,
    [memberBillingIds]
  )
  console.log(`Updated ${updRes.rowCount} MemberBilling row(s) to BELUM_BAYAR.`)

  await pool.end()
  console.log('Reset complete. Please verify data in the application or via database queries.')
}

main().catch(async e => {
  console.error('Error:', e.message)
  await pool.end()
  process.exit(1)
})
