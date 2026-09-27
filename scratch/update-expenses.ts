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

let idCounter = Date.now()
function genId() { return 'c' + (idCounter++).toString(36) + Math.random().toString(36).slice(2, 7) }

async function main() {
  // Get Kas Utama fund ID
  const fundRes = await pool.query(`SELECT id, name FROM "Fund" WHERE name = 'Kas Utama'`)
  const kasUtamaId = fundRes.rows[0]?.id
  if (!kasUtamaId) throw new Error('Kas Utama fund not found!')
  console.log('Kas Utama ID:', kasUtamaId)

  // 1. Delete all expense transactions
  const deleted = await pool.query('DELETE FROM "ExpenseTransaction" RETURNING id')
  console.log(`✅ Deleted ${deleted.rowCount} expense transactions`)

  // 2. Insert 2 new expenses (both from Kas Utama)
  await pool.query(
    `INSERT INTO "ExpenseTransaction" (id, "fundId", title, amount, category, date, description, "createdAt")
     VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
    [genId(), kasUtamaId, 'Cetak Surat', 42000, 'OPERASIONAL', new Date(2025, 11, 30), 'Cetak surat organisasi']
  )
  await pool.query(
    `INSERT INTO "ExpenseTransaction" (id, "fundId", title, amount, category, date, description, "createdAt")
     VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
    [genId(), kasUtamaId, 'Konsumsi Rapat', 68500, 'KONSUMSI', new Date(2026, 2, 10), 'Konsumsi rapat anggota']
  )
  console.log('✅ Inserted 2 new expense transactions')

  // 3. Recalculate Kas Utama balance:
  //    = sum of income transactions (LUNAS payments + extra cash) - sum of expenses from Kas Utama
  const incomeRes = await pool.query(
    `SELECT COALESCE(SUM(amount), 0) as total FROM "IncomeTransaction" WHERE "fundId" = $1`,
    [kasUtamaId]
  )
  const expenseRes = await pool.query(
    `SELECT COALESCE(SUM(amount), 0) as total FROM "ExpenseTransaction" WHERE "fundId" = $1`,
    [kasUtamaId]
  )
  const income = Number(incomeRes.rows[0].total)
  const expense = Number(expenseRes.rows[0].total)
  const newBalance = income - expense

  await pool.query(
    `UPDATE "Fund" SET balance = $1, "updatedAt" = NOW() WHERE id = $2`,
    [newBalance, kasUtamaId]
  )

  console.log(`✅ Kas Utama balance updated:`)
  console.log(`   Total pemasukan : Rp${income.toLocaleString('id-ID')}`)
  console.log(`   Total pengeluaran: Rp${expense.toLocaleString('id-ID')}`)
  console.log(`   Saldo baru       : Rp${newBalance.toLocaleString('id-ID')}`)

  // 4. Verify
  const verifyExp = await pool.query(`SELECT title, amount, category, date FROM "ExpenseTransaction" ORDER BY date`)
  console.log('\n📋 Pengeluaran sekarang:')
  verifyExp.rows.forEach((r: any) => {
    const date = new Date(r.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
    console.log(`   [${date}] ${r.title} - Rp${Number(r.amount).toLocaleString('id-ID')} (${r.category})`)
  })

  await pool.end()
}

main().catch(async e => {
  console.error('❌ Error:', e.message)
  await pool.end()
})
