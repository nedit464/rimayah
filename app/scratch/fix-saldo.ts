import * as fs from 'fs'
import * as path from 'path'

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

import { Pool } from 'pg'
const pool = new Pool({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 10000 })

async function main() {
  // 1. Show current expenses
  const current = await pool.query(`SELECT id, title, amount, date FROM "ExpenseTransaction" ORDER BY date`)
  console.log('Pengeluaran saat ini:')
  current.rows.forEach((r: any) => {
    console.log(`  [${r.id.slice(0,12)}] ${r.title} - Rp${Number(r.amount).toLocaleString('id-ID')} (${new Date(r.date).toLocaleDateString('id-ID')})`)
  })

  // 2. Find duplicate MMT - keep the one with description about latihan, delete others
  const mmtRows = current.rows.filter((r: any) => r.title.toLowerCase().includes('mmt'))
  console.log(`\nMMT entries found: ${mmtRows.length}`)
  
  if (mmtRows.length > 1) {
    // Delete all but the last one (most recent entry by user)
    for (let i = 0; i < mmtRows.length - 1; i++) {
      await pool.query(`DELETE FROM "ExpenseTransaction" WHERE id = $1`, [mmtRows[i].id])
      console.log(`  Deleted duplicate MMT: ${mmtRows[i].id.slice(0,12)}`)
    }
  }

  // 3. Set Kas Utama balance to exactly match user's calculation
  // User's income: Rp246.000, expenses: Rp110.500, saldo: Rp135.500
  const kasRes = await pool.query(`SELECT id FROM "Fund" WHERE name = 'Kas Utama'`)
  const kasId = kasRes.rows[0]?.id
  
  // Recalculate from actual expense transactions
  const expenseSum = await pool.query(`SELECT COALESCE(SUM(amount), 0) as total FROM "ExpenseTransaction" WHERE "fundId" = $1`, [kasId])
  const totalExpenses = Number(expenseSum.rows[0].total)
  
  // User says income = 246000, so set balance = 246000 - totalExpenses
  const correctIncome = 246000
  const correctBalance = correctIncome - totalExpenses
  
  await pool.query(`UPDATE "Fund" SET balance = $1, "updatedAt" = NOW() WHERE id = $2`, [correctBalance, kasId])

  // 4. Also fix income transactions total (delete seeded ones and replace with correct totals)
  // Keep the extra cash (14000), remove old LUNAS income transactions and add corrected monthly ones
  const extraCashRow = await pool.query(`SELECT id FROM "IncomeTransaction" WHERE title LIKE '%Tambahan%' AND "fundId" = $1`, [kasId])
  
  // Delete all LUNAS income transactions (keep only the extra cash and any manually added ones)
  await pool.query(`
    DELETE FROM "IncomeTransaction" 
    WHERE "fundId" = $1 
    AND "memberBillingId" IS NOT NULL
  `, [kasId])
  
  // Insert correct monthly collections as aggregate income entries
  let idCounter = Date.now()
  function genId() { return 'c' + (idCounter++).toString(36) + Math.random().toString(36).slice(2, 7) }
  
  const monthlyCollections = [
    { month: 12, year: 2025, count: 9, label: 'Desember 2025' },
    { month: 1,  year: 2026, count: 8, label: 'Januari 2026' },
    { month: 2,  year: 2026, count: 4, label: 'Februari 2026' },
    { month: 3,  year: 2026, count: 2, label: 'Maret 2026' },
    { month: 4,  year: 2026, count: 2, label: 'April 2026' },
    { month: 5,  year: 2026, count: 4, label: 'Mei 2026' },
  ]
  
  for (const c of monthlyCollections) {
    const amount = c.count * 8000
    const date = new Date(c.year, c.month - 1, 10)
    await pool.query(
      `INSERT INTO "IncomeTransaction" (id, "fundId", title, amount, date, description, "createdAt") VALUES ($1,$2,$3,$4,$5,$6,NOW())`,
      [genId(), kasId, `Iuran Kas ${c.label}`, amount, date, `${c.count} anggota × Rp8.000`]
    )
  }
  
  // Make sure extra cash still exists
  if (extraCashRow.rows.length === 0) {
    await pool.query(
      `INSERT INTO "IncomeTransaction" (id, "fundId", title, amount, date, description, "createdAt") VALUES ($1,$2,$3,$4,$5,$6,NOW())`,
      [genId(), kasId, 'Uang Kas Tambahan (Sebelum Des 2025)', 14000, new Date(2025, 10, 30), 'Kas tambahan yang dikumpulkan sebelum masa pendataan dimulai.']
    )
  }

  // 5. Final verification
  const finalExpenses = await pool.query(`SELECT title, amount FROM "ExpenseTransaction" ORDER BY date`)
  const finalFund = await pool.query(`SELECT name, balance FROM "Fund" WHERE id = $1`, [kasId])
  const finalIncome = await pool.query(`SELECT COALESCE(SUM(amount),0) as total FROM "IncomeTransaction" WHERE "fundId" = $1`, [kasId])

  console.log(`\n✅ Selesai!`)
  console.log(`Pengeluaran tersisa:`)
  finalExpenses.rows.forEach((r: any) => console.log(`  ${r.title}: Rp${Number(r.amount).toLocaleString('id-ID')}`))
  console.log(`Total pemasukan (dari income transactions): Rp${Number(finalIncome.rows[0].total).toLocaleString('id-ID')}`)
  console.log(`Total pengeluaran: Rp${totalExpenses.toLocaleString('id-ID')}`)
  console.log(`Saldo Kas Utama: Rp${Number(finalFund.rows[0].balance).toLocaleString('id-ID')}`)
  
  await pool.end()
}

main().catch(async e => {
  console.error('Error:', e.message)
  await pool.end()
})
